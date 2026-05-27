import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Assignment, Paper } from '../models'
import { CreateAssignmentSchema } from '../validators'
import { getGenerationQueue } from '../queues/generation'
import { getExtractedText } from './upload'

// ── Standard response helper ──────────────────────────────────
function ok<T>(res: Response, data: T, message = 'Success', meta?: object) {
  return res.json({ success: true, message, data, ...(meta ? { meta } : {}) })
}

function fail(res: Response, message: string, statusCode = 400, code = 'BAD_REQUEST') {
  return res.status(statusCode).json({
    success: false,
    message,
    error: { code, recoverable: statusCode < 500 },
  })
}

// ── GET /assignments ──────────────────────────────────────────
export async function listAssignments(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string ?? '1')
    const limit = parseInt(req.query.limit as string ?? '20')
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined

    const filter: Record<string, unknown> = { userId: (req as any).user?.id }
    if (status) filter.status = status
    if (search) filter.title = { $regex: search, $options: 'i' }

    const total = await Assignment.countDocuments(filter)
    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const formatted = assignments.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      schoolName: a.schoolName,
      subject: a.subject,
      className: a.className,
      dueDate: a.dueDate,
      status: a.status,
      questionCount: a.questionTypes.reduce((s: number, q: any) => s + q.count, 0),
      totalMarks: a.questionTypes.reduce((s: number, q: any) => s + q.count * q.marksPerQuestion, 0),
      createdAt: a.createdAt?.toISOString(),
      paperId: a.paperId,
      jobId: a.jobId,
    }))

    return ok(res, formatted, 'Assignments retrieved', {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return fail(res, 'Failed to retrieve assignments', 500, 'SERVER_ERROR')
  }
}

// ── POST /assignments ─────────────────────────────────────────
export async function createAssignment(req: Request, res: Response) {
  try {
    const parsed = CreateAssignmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return fail(res, parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const data = parsed.data

    // Duplicate submission protection (idempotency by content/time)
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentDuplicate = await Assignment.findOne({
      title: data.title,
      subject: data.subject,
      className: data.className,
      userId: (req as any).user?.id,
      createdAt: { $gte: oneMinuteAgo }
    })

    if (recentDuplicate) {
      return fail(res, 'An identical assignment was just created. Please wait a moment.', 429)
    }

    const assignment = new Assignment({
      ...data,
      userId: (req as any).user?.id,
      status: 'queued',
    })
    await assignment.save()

    const assignmentId = assignment._id.toString()
    const jobId = uuidv4()

    // Queue generation job
    const queue = getGenerationQueue()
    if (queue) {
      await queue.add('generate', { assignmentId }, {
        jobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
      })
      await Assignment.findByIdAndUpdate(assignmentId, { jobId })
    } else {
      // No queue — run inline (for dev without Redis)
      console.warn('[Controller] Queue unavailable — running generation inline')
      setImmediate(() => runInlineGeneration(assignmentId).catch(console.error))
      await Assignment.findByIdAndUpdate(assignmentId, { jobId })
    }

    return ok(res, { assignmentId, jobId, status: 'queued' }, 'Assignment created')
  } catch (err) {
    console.error('[Controller] createAssignment error:', err)
    return fail(res, 'Failed to create assignment', 500, 'SERVER_ERROR')
  }
}

// ── GET /assignments/:id ──────────────────────────────────────
export async function getAssignment(req: Request, res: Response) {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: (req as any).user?.id }).lean()
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')

    let paper = null
    if (assignment.paperId) {
      paper = await Paper.findById(assignment.paperId).lean()
      if (paper) {
        // Add assignmentId to metadata
        ;(paper as any).metadata = {
          ...(paper as any).metadata,
          assignmentId: assignment._id.toString(),
          generatedAt: (paper as any).generatedAt?.toISOString(),
          generationTimeMs: (paper as any).generationTimeMs,
        }
      }
    }

    return ok(res, {
      assignment: {
        id: assignment._id.toString(),
        ...assignment,
      },
      paper,
      status: assignment.status,
    })
  } catch (err: any) {
    // Distinguish between invalid ObjectId and real errors
    if (err?.name === 'CastError') {
      return fail(res, 'Assignment not found', 404, 'NOT_FOUND')
    }
    console.error('[Controller] getAssignment error:', err)
    return fail(res, 'Failed to retrieve assignment', 500, 'SERVER_ERROR')
  }
}

// ── DELETE /assignments/:id ───────────────────────────────────
export async function deleteAssignment(req: Request, res: Response) {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: (req as any).user?.id })
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')
    if (assignment.paperId) {
      await Paper.findByIdAndDelete(assignment.paperId)
    }
    return ok(res, null, 'Assignment deleted')
  } catch (err) {
    return fail(res, 'Failed to delete assignment', 500, 'SERVER_ERROR')
  }
}

// ── GET /jobs/:jobId ──────────────────────────────────────────
export async function getJobStatus(req: Request, res: Response) {
  try {
    const assignment = await Assignment.findOne({ jobId: req.params.jobId, userId: (req as any).user?.id }).lean()
    if (!assignment) return fail(res, 'Job not found', 404, 'NOT_FOUND')

    const stageToProgress: Record<string, number> = {
      queued: 0,
      generating: 20,
      structuring: 60,
      validating: 80,
      completed: 100,
      failed: 0,
    }

    return ok(res, {
      assignmentId: assignment._id.toString(),
      jobId: req.params.jobId,
      stage: assignment.status,
      progress: stageToProgress[assignment.status] ?? 0,
    })
  } catch {
    return fail(res, 'Job not found', 404, 'NOT_FOUND')
  }
}

// ── POST /papers/:id/regenerate ───────────────────────────────
export async function regenerateSection(req: Request, res: Response) {
  try {
    const { sectionId, instruction } = req.body
    const paper = await Paper.findOne({ assignmentId: req.params.id })
    if (!paper) return fail(res, 'Paper not found', 404, 'NOT_FOUND')

    const sectionIdx = paper.sections.findIndex((s) => s.id === sectionId)
    if (sectionIdx === -1) return fail(res, 'Section not found', 404, 'NOT_FOUND')

    const assignment = await Assignment.findOne({ _id: paper.assignmentId, userId: (req as any).user?.id })
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')

    const section = paper.sections[sectionIdx]
    const hasApiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY

    if (hasApiKey) {
      // Real AI-powered section regeneration
      const { getGroqClient, getOpenRouterClient } = await import('../config/ai')
      const oldQuestionsText = section.questions.map((q, i) => `${i + 1}. "${q.text}"`).join('\n')

      const prompt = `You are an expert teacher. Regenerate ALL questions for a section of a ${assignment.className} grade ${assignment.subject} paper.
Section Title: ${section.title}
Section Instruction: ${section.instruction}
Number of questions needed: ${section.questions.length}
Marks per question: ${section.questions[0]?.marks ?? 1}
Difficulty distribution: mix of easy, medium, hard

The OLD questions were (do NOT generate semantically similar or reworded versions of these):
${oldQuestionsText}

${instruction ? `Teacher's instruction: "${instruction}"` : ''}
${assignment.instructions ? `General paper instructions: ${assignment.instructions}` : ''}

Return ONLY a valid JSON array of question objects matching this exact schema (no markdown, no explanation):
[
  {
    "text": "question text",
    "difficulty": "easy|medium|hard",
    "marks": ${section.questions[0]?.marks ?? 1},
    "answerKey": "answer text"
  }
]
Generate exactly ${section.questions.length} questions.`

      let text = ''
      try {
        const groqClient = getGroqClient()
        const result = await groqClient.chat.completions.create({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
        })
        text = result.choices[0]?.message?.content || ''
      } catch {
        const openRouterClient = getOpenRouterClient()
        const result = await openRouterClient.chat.completions.create({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
        })
        text = result.choices[0]?.message?.content || ''
      }

      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          const parsed = JSON.parse(match[0])
          if (Array.isArray(parsed) && parsed.length > 0) {
            paper.sections[sectionIdx].questions = parsed.map((q: any) => ({
              id: uuidv4(),
              text: q.text || 'Question text unavailable',
              difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
              marks: q.marks || section.questions[0]?.marks || 1,
              answerKey: q.answerKey || '',
            }))
            await paper.save()
            return ok(res, { section: paper.sections[sectionIdx], regenerated: true }, 'Section regenerated')
          }
        } catch {
          // Fall through to mock
        }
      }
    }

    // Fallback: mock regeneration
    const regenQuestions = section.questions.map((q) => ({
      ...((q as any).toObject ? (q as any).toObject() : q),
      text: `[Regenerated] ${q.text}`,
      id: uuidv4(),
      answerKey: q.answerKey ? `[Regenerated] ${q.answerKey}` : undefined,
    }))
    paper.sections[sectionIdx].questions = regenQuestions
    await paper.save()

    return ok(res, { section: paper.sections[sectionIdx], regenerated: true }, 'Section regenerated')
  } catch (err) {
    console.error('[Controller] regenerateSection error:', err)
    return fail(res, 'Regeneration failed', 500, 'SERVER_ERROR')
  }
}

// ── POST /papers/:id/regenerate-question ───────────────────────────────
export async function regenerateQuestion(req: Request, res: Response) {
  try {
    const { sectionId, questionId, instruction } = req.body
    const paper = await Paper.findOne({ assignmentId: req.params.id })
    if (!paper) return fail(res, 'Paper not found', 404, 'NOT_FOUND')

    const sectionIdx = paper.sections.findIndex((s) => s.id === sectionId)
    if (sectionIdx === -1) return fail(res, 'Section not found', 404, 'NOT_FOUND')

    const questionIdx = paper.sections[sectionIdx].questions.findIndex((q) => q.id === questionId)
    if (questionIdx === -1) return fail(res, 'Question not found', 404, 'NOT_FOUND')

    const assignment = await Assignment.findOne({ _id: paper.assignmentId, userId: (req as any).user?.id })
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')

    const oldQuestion = paper.sections[sectionIdx].questions[questionIdx]

    let generatedQuestion = {
      text: `[Regenerated] ${oldQuestion.text}`,
      difficulty: oldQuestion.difficulty,
      marks: oldQuestion.marks,
      answerKey: oldQuestion.answerKey ? `[Regenerated] ${oldQuestion.answerKey}` : undefined,
    }

    const hasApiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY
    if (hasApiKey) {
      const { getGroqClient, getOpenRouterClient } = await import('../config/ai')
      
      const prompt = `You are an expert teacher. I need you to regenerate a specific question for a ${assignment.className} grade ${assignment.subject} paper.
Topic / Instructions: ${assignment.instructions || 'General'}
The old question was: "${oldQuestion.text}"
The old answer was: "${oldQuestion.answerKey}"
Marks: ${oldQuestion.marks}
Difficulty: ${oldQuestion.difficulty}
User's specific instruction for the new question: "${instruction || 'Make it entirely different but keep the same difficulty and topic.'}"

CRITICAL RULES:
1. You MUST generate a MEANINGFULLY DIFFERENT question. Do NOT reword or duplicate the old question.
2. The answer MUST also be different and correct for the new question.
3. Keep the exact same difficulty and marks.

Return ONLY a valid JSON object with the following schema, and absolutely NO markdown formatting or extra text:
{
  "text": "The entirely new question text",
  "difficulty": "easy|medium|hard",
  "marks": ${oldQuestion.marks},
  "answerKey": "The correct answer or grading rubric for this NEW question"
}`
      
      let attempts = 0
      const maxAttempts = 3
      let generatedParsed = null
      const oldNormalized = oldQuestion.text.toLowerCase().replace(/[^a-z0-9]/g, '')

      while (attempts < maxAttempts) {
        attempts++
        let text = ''
        try {
          const groqClient = getGroqClient()
          const result = await groqClient.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7 + (attempts * 0.1),
          })
          text = result?.choices?.[0]?.message?.content || ''
        } catch (err) {
          const openRouterClient = getOpenRouterClient()
          const result = await openRouterClient.chat.completions.create({
            model: 'meta-llama/llama-3-70b-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7 + (attempts * 0.1),
          })
          text = result?.choices?.[0]?.message?.content || ''
        }

        const match = text.match(/\{[\s\S]*\}/)
        if (match) {
          try {
            const parsed = JSON.parse(match[0])
            if (parsed && parsed.text) {
              const newNormalized = parsed.text.toLowerCase().replace(/[^a-z0-9]/g, '')
              if (newNormalized === oldNormalized) {
                console.warn(`[Regeneration] Duplicate detected on attempt ${attempts}. Retrying...`)
                continue
              }
              generatedParsed = parsed
              break
            }
          } catch (e) {
            // ignore parse error, retry
          }
        }
      }

      if (generatedParsed) {
        generatedQuestion = {
          ...generatedQuestion,
          text: generatedParsed.text || generatedQuestion.text,
          difficulty: generatedParsed.difficulty || generatedQuestion.difficulty,
          answerKey: generatedParsed.answerKey || generatedQuestion.answerKey,
        }
      }
    }

    paper.sections[sectionIdx].questions[questionIdx] = {
      ...((oldQuestion as any).toObject ? (oldQuestion as any).toObject() : oldQuestion),
      ...generatedQuestion,
      id: uuidv4(), // Give it a new ID so UI re-renders cleanly
    }

    await paper.save()

    return ok(res, { question: paper.sections[sectionIdx].questions[questionIdx], regenerated: true }, 'Question regenerated')
  } catch (err) {
    return fail(res, 'Regeneration failed', 500, 'SERVER_ERROR')
  }
}

// ── GET /papers/:id/pdf ───────────────────────────────────────
export async function getPaperPdf(req: Request, res: Response) {
  try {
    const paper = await Paper.findOne({ assignmentId: req.params.id })
    if (!paper) return fail(res, 'Paper not found', 404, 'NOT_FOUND')
    const assignment = await Assignment.findOne({ _id: paper.assignmentId, userId: (req as any).user?.id })
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')

    const type = req.query.type as string // 'paper' or 'answers'

    const { generatePdfBuffer, generateAnswerKeyPdfBuffer } = await import('../services/pdfGenerator')
    const pdfBuffer = type === 'answers' ? await generateAnswerKeyPdfBuffer(paper) : await generatePdfBuffer(paper)

    const title = assignment?.title || 'paper'
    const className = assignment?.className || ''

    // Build dynamic filename from assignment metadata
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    const classSuffix = className ? `-${className.toLowerCase().replace(/\s+/g, '-')}` : ''
    const filename = type === 'answers'
      ? `${slug}${classSuffix}-answer-key.pdf`
      : `${slug}${classSuffix}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (err) {
    console.error('[PDF] Generation failed:', err)
    return fail(res, 'Failed to generate PDF', 500, 'SERVER_ERROR')
  }
}

// ── Inline generation fallback (no Redis) ────────────────────
async function runInlineGeneration(assignmentId: string): Promise<void> {
  const { emitToAssignment } = await import('../sockets')
  const { PaperOutputSchema } = await import('../validators')

  try {
    emitToAssignment(assignmentId, 'generation:queued', { assignmentId, status: 'queued' })

    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) return

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' })
    await new Promise(r => setTimeout(r, 800))
    emitToAssignment(assignmentId, 'generation:started', { progress: 20 })

    const totalQ = assignment.questionTypes.reduce((s, q) => s + q.count, 0)
    const totalM = assignment.questionTypes.reduce((s, q) => s + q.count * q.marksPerQuestion, 0)

    // Read uploaded material content if available
    let uploadedContent = ''
    if (assignment.uploadedMaterial?.fileId) {
      uploadedContent = getExtractedText(assignment.uploadedMaterial.fileId)
    }

    let rawPaper: unknown
    const hasApiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY

    if (hasApiKey) {
      const { buildGenerationPrompt } = await import('../prompts/generation')
      const { getGroqClient, getOpenRouterClient } = await import('../config/ai')
      const prompt = buildGenerationPrompt({
        title: assignment.title,
        schoolName: assignment.schoolName,
        subject: assignment.subject,
        className: assignment.className,
        estimatedDuration: assignment.estimatedDuration,
        questionTypes: assignment.questionTypes,
        instructions: assignment.instructions,
        uploadedContent: uploadedContent || undefined,
      })
      
      let text = ''
      let provider = 'groq'

      try {
        const groqClient = getGroqClient()
        const result = await groqClient.chat.completions.create({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
        text = result.choices[0]?.message?.content || ''
      } catch (err) {
        console.warn('[Inline] Groq failed, falling back to OpenRouter')
        provider = 'openrouter'
        const openRouterClient = getOpenRouterClient()
        const result = await openRouterClient.chat.completions.create({
          model: 'meta-llama/llama-3-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        })
        text = result.choices[0]?.message?.content || ''
      }
      
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON in AI response')
      rawPaper = JSON.parse(match[0])
      
      if (rawPaper && typeof rawPaper === 'object' && 'summary' in rawPaper) {
        (rawPaper as any).summary.generatedBy = provider
      }
    } else {
      // Mock
      await new Promise(r => setTimeout(r, 1500))
      const topics = ['photosynthesis', 'Newton laws', 'electrolysis', 'oxidation', 'cell division']
      const questions = Array.from({ length: totalQ }, (_, i) => ({
        id: uuidv4(),
        text: `Describe the concept of ${topics[i % 5]} in detail. Provide examples.`,
        difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
        marks: Math.ceil(totalM / totalQ),
        answerKey: `Answer ${i + 1}: This is the expected answer for this question based on ${assignment.subject} curriculum.`,
      }))
      rawPaper = {
        metadata: {
          subject: assignment.subject,
          className: assignment.className,
          schoolName: assignment.schoolName,
          totalQuestions: totalQ,
          totalMarks: totalM,
          estimatedDuration: assignment.estimatedDuration,
          difficultyDistribution: { easy: Math.floor(totalQ * 0.3), medium: Math.floor(totalQ * 0.5), hard: totalQ - Math.floor(totalQ * 0.3) - Math.floor(totalQ * 0.5) },
        },
        studentInfo: { nameEnabled: true, rollEnabled: true, sectionEnabled: true },
        sections: assignment.questionTypes.map((qt, idx) => ({
          id: `section_${idx + 1}`,
          title: `Section ${String.fromCharCode(65 + idx)}`,
          instruction: `Attempt all questions. Each question carries ${qt.marksPerQuestion} mark${qt.marksPerQuestion > 1 ? 's' : ''}.`,
          questions: Array.from({ length: qt.count }, (_, i) => {
            const verbs = ['Explain', 'Describe', 'Define', 'Analyze', 'Compare']
            return {
              id: uuidv4(),
              text: `[${qt.type}] Question ${i + 1}: ${verbs[i % 5]} the key concept from your ${assignment.subject} syllabus.`,
              difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
              marks: qt.marksPerQuestion,
              answerKey: `Answer for Section ${String.fromCharCode(65 + idx)}, Q${i + 1}: This is the expected model answer based on ${assignment.subject} curriculum standards.`,
            }
          }),
        })),
        aiMessage: `Certainly! Here is a customized Question Paper for your ${assignment.subject} ${assignment.className} class:`,
        summary: { generatedBy: 'mock', version: 'v1' },
      }
    }

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'structuring' })
    emitToAssignment(assignmentId, 'generation:structuring', { progress: 60 })
    await new Promise(r => setTimeout(r, 500))

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'validating' })
    emitToAssignment(assignmentId, 'generation:validating', { progress: 80 })
    const validated = PaperOutputSchema.parse(rawPaper)

    // Validate question counts against assignment config
    for (let i = 0; i < validated.sections.length; i++) {
      const expectedCount = assignment.questionTypes[i]?.count
      if (expectedCount) {
        const actualCount = validated.sections[i].questions.length
        if (actualCount > expectedCount) {
          validated.sections[i].questions = validated.sections[i].questions.slice(0, expectedCount)
        } else if (actualCount < expectedCount) {
          throw new Error(`AI generated fewer questions (${actualCount}) than requested (${expectedCount}) for section ${i + 1}`)
        }
      }
    }

    await new Promise(r => setTimeout(r, 300))

    const paper = new Paper({
      assignmentId,
      generatedAt: new Date(),
      generationTimeMs: 3000,
      ...validated,
      sections: validated.sections.map(s => ({
        ...s,
        questions: s.questions.map(q => ({ ...q, id: q.id || uuidv4() })),
      })),
      userId: assignment.userId,
    })
    await paper.save()

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      paperId: paper._id.toString(),
    })

    emitToAssignment(assignmentId, 'generation:completed', {
      assignmentId,
      paperId: paper._id.toString(),
    })
  } catch (err) {
    console.error('[Inline] Generation failed:', err)
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' })
    emitToAssignment(assignmentId, 'generation:failed', {
      message: err instanceof Error ? err.message : 'Generation failed',
    })
  }
}
