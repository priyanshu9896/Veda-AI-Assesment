import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Assignment, Paper } from '../models'
import { CreateAssignmentSchema } from '../validators'
import { getGenerationQueue } from '../queues/generation'

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

    const filter: Record<string, unknown> = {}
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

    const assignment = new Assignment({
      ...data,
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
    const assignment = await Assignment.findById(req.params.id).lean()
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
  } catch (err) {
    return fail(res, 'Assignment not found', 404, 'NOT_FOUND')
  }
}

// ── DELETE /assignments/:id ───────────────────────────────────
export async function deleteAssignment(req: Request, res: Response) {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id)
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
    const assignment = await Assignment.findOne({ jobId: req.params.jobId }).lean()
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

    const assignment = await Assignment.findById(paper.assignmentId)
    if (!assignment) return fail(res, 'Assignment not found', 404, 'NOT_FOUND')

    // For now, regenerate same section with new random mock questions
    // (Real Gemini regen would use the prompt builder with section-specific instructions)
    const section = paper.sections[sectionIdx]
    const regenQuestions = section.questions.map((q) => ({
      ...((q as any).toObject ? (q as any).toObject() : q),
      text: `[Regenerated] ${q.text}`,
      id: uuidv4(),
    }))

    paper.sections[sectionIdx].questions = regenQuestions
    await paper.save()

    return ok(res, { section: paper.sections[sectionIdx], regenerated: true }, 'Section regenerated')
  } catch (err) {
    return fail(res, 'Regeneration failed', 500, 'SERVER_ERROR')
  }
}

// ── GET /papers/:id/pdf ───────────────────────────────────────
export async function getPaperPdf(req: Request, res: Response) {
  try {
    const paper = await Paper.findById(req.params.id)
    if (!paper) return fail(res, 'Paper not found', 404, 'NOT_FOUND')

    const { generatePdfBuffer } = await import('../services/pdfGenerator')
    const pdfBuffer = await generatePdfBuffer(paper)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="veda_ai_paper_${paper._id}.pdf"`)
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

    let rawPaper: unknown
    const apiKey = process.env.GEMINI_API_KEY

    if (apiKey) {
      const { buildGenerationPrompt } = await import('../prompts/generation')
      const { getGenAI } = await import('../config/gemini')
      const prompt = buildGenerationPrompt({
        title: assignment.title,
        schoolName: assignment.schoolName,
        subject: assignment.subject,
        className: assignment.className,
        estimatedDuration: assignment.estimatedDuration,
        questionTypes: assignment.questionTypes,
        instructions: assignment.instructions,
      })
      const genAI = getGenAI()
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON in AI response')
      rawPaper = JSON.parse(match[0])
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
        summary: { generatedBy: 'gemini', version: 'v1' },
      }
    }

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'structuring' })
    emitToAssignment(assignmentId, 'generation:structuring', { progress: 60 })
    await new Promise(r => setTimeout(r, 500))

    await Assignment.findByIdAndUpdate(assignmentId, { status: 'validating' })
    emitToAssignment(assignmentId, 'generation:validating', { progress: 80 })
    const validated = PaperOutputSchema.parse(rawPaper)
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
