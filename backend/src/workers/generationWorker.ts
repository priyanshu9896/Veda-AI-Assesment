import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { v4 as uuidv4 } from 'uuid'
import { Assignment, Paper } from '../models'
import { getGroqClient, getOpenRouterClient } from '../config/ai'
import { buildGenerationPrompt } from '../prompts/generation'
import { PaperOutputSchema } from '../validators'
import { emitToAssignment } from '../sockets'
import { getExtractedText } from '../controllers/upload'

const MOCK_PAPER_ENABLED = !process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY

// ── Mock paper for dev mode ───────────────────────────────────
function buildMockPaper(data: {
  schoolName: string
  subject: string
  className: string
  estimatedDuration: number
  totalQuestions: number
  totalMarks: number
}) {
  const questions = Array.from({ length: data.totalQuestions }, (_, i) => ({
    id: uuidv4(),
    text: `[Mock] Sample question ${i + 1} for ${data.subject} class ${data.className}.`,
    difficulty: (['easy', 'medium', 'hard'] as const)[i % 3],
    marks: Math.ceil(data.totalMarks / data.totalQuestions),
    answerKey: `This is the answer to question ${i + 1}.`,
  }))

  return {
    metadata: {
      subject: data.subject,
      className: data.className,
      schoolName: data.schoolName,
      totalQuestions: data.totalQuestions,
      totalMarks: data.totalMarks,
      estimatedDuration: data.estimatedDuration,
      difficultyDistribution: { easy: Math.floor(data.totalQuestions * 0.3), medium: Math.floor(data.totalQuestions * 0.5), hard: data.totalQuestions - Math.floor(data.totalQuestions * 0.3) - Math.floor(data.totalQuestions * 0.5) },
    },
    studentInfo: { nameEnabled: true, rollEnabled: true, sectionEnabled: true },
    sections: [
      {
        id: 'section_1',
        title: 'Section A',
        instruction: `Attempt all questions. Each question carries ${Math.ceil(data.totalMarks / data.totalQuestions)} marks.`,
        questions,
      },
    ],
    aiMessage: `Certainly! Here is a customized Question Paper for your ${data.subject} ${data.className} class based on your specifications:`,
    summary: { generatedBy: 'mock', version: 'v1' },
  }
}

// ── Generation worker ─────────────────────────────────────────
export function startGenerationWorker(redisUrl: string): void {
  const conn = new IORedis(redisUrl, { maxRetriesPerRequest: null })

  const worker = new Worker(
    'generation',
    async (job) => {
      const { assignmentId } = job.data
      const startTime = Date.now()

      try {
        // 1. Queued
        emitToAssignment(assignmentId, 'generation:queued', {
          assignmentId,
          status: 'queued',
        })

        const assignment = await Assignment.findById(assignmentId)
        if (!assignment) throw new Error('Assignment not found')

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'generating' })

        // 2. Generating
        await new Promise((r) => setTimeout(r, 600))
        emitToAssignment(assignmentId, 'generation:started', { progress: 20 })

        const totalQ = assignment.questionTypes.reduce((s, q) => s + q.count, 0)
        const totalM = assignment.questionTypes.reduce(
          (s, q) => s + q.count * q.marksPerQuestion,
          0
        )

        let paperData: unknown

        if (MOCK_PAPER_ENABLED) {
          // Mock mode for development without API key
          await new Promise((r) => setTimeout(r, 1500))
          paperData = buildMockPaper({
            schoolName: assignment.schoolName,
            subject: assignment.subject,
            className: assignment.className,
            estimatedDuration: assignment.estimatedDuration,
            totalQuestions: totalQ,
            totalMarks: totalM,
          })
        } else {
          // Read uploaded material content if available
          let uploadedContent = ''
          if (assignment.uploadedMaterial?.fileId) {
            uploadedContent = getExtractedText(assignment.uploadedMaterial.fileId)
          }

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
            console.warn('[Worker] Groq failed, falling back to OpenRouter')
            provider = 'openrouter'
            const openRouterClient = getOpenRouterClient()
            const result = await openRouterClient.chat.completions.create({
              model: 'meta-llama/llama-3-70b-instruct',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
            })
            text = result?.choices?.[0]?.message?.content || ''
          }

          if (!text) {
            throw new Error('AI Provider returned empty response or rate limit exceeded.')
          }

          // Extract JSON
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          if (!jsonMatch) throw new Error('AI returned no JSON')
          paperData = JSON.parse(jsonMatch[0])
          
          if (paperData && typeof paperData === 'object' && 'summary' in paperData) {
            (paperData as any).summary.generatedBy = provider
          }
        }

        // 3. Structuring
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'structuring' })
        emitToAssignment(assignmentId, 'generation:structuring', { progress: 60 })
        await new Promise((r) => setTimeout(r, 400))

        // 4. Validating
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'validating' })
        emitToAssignment(assignmentId, 'generation:validating', { progress: 80 })

        const validated = PaperOutputSchema.parse(paperData)

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

        await new Promise((r) => setTimeout(r, 300))

        // 5. Store paper
        const paper = new Paper({
          assignmentId: assignmentId.toString(),
          userId: assignment.userId,
          generatedAt: new Date(),
          generationTimeMs: Date.now() - startTime,
          metadata: validated.metadata,
          studentInfo: validated.studentInfo,
          sections: validated.sections.map((s) => ({
            ...s,
            id: s.id || uuidv4(),
            questions: s.questions.map((q) => ({
              ...q,
              id: q.id || uuidv4(),
            })),
          })),
          aiMessage: validated.aiMessage,
          summary: validated.summary,
        })

        await paper.save()

        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'completed',
          paperId: paper._id.toString(),
        })

        // 6. Completed
        emitToAssignment(assignmentId, 'generation:completed', {
          assignmentId,
          paperId: paper._id.toString(),
        })
      } catch (err) {
        console.error('[Worker] Generation failed:', err)
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' })
        emitToAssignment(assignmentId, 'generation:failed', {
          message: err instanceof Error ? err.message : 'Generation failed',
        })
        throw err
      }
    },
    {
      connection: conn as any,
      concurrency: 3,
      limiter: { max: 10, duration: 60_000 },
    }
  )

  worker.on('completed', (job) =>
    console.log(`[Worker] Job ${job.id} completed`)
  )
  worker.on('failed', (job, err) =>
    console.error(`[Worker] Job ${job?.id} failed:`, err.message)
  )

  console.log('[Worker] Generation worker started')
}
