import { z } from 'zod'

// ── Paper schema for AI output validation ─────────────────────
const QuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(5),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().min(1),
  answerKey: z.string().optional(),
})

const SectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  instruction: z.string().default(''),
  questions: z.array(QuestionSchema).min(1),
})

export const PaperOutputSchema = z.object({
  metadata: z.object({
    subject: z.string(),
    className: z.string(),
    schoolName: z.string(),
    totalQuestions: z.number(),
    totalMarks: z.number(),
    estimatedDuration: z.number(),
    difficultyDistribution: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number(),
    }),
  }),
  studentInfo: z.object({
    nameEnabled: z.boolean().default(true),
    rollEnabled: z.boolean().default(true),
    sectionEnabled: z.boolean().default(true),
  }),
  sections: z.array(SectionSchema).min(1),
  aiMessage: z.string().optional(),
  summary: z.object({
    generatedBy: z.string(),
    version: z.string(),
  }),
})

export type ValidatedPaper = z.infer<typeof PaperOutputSchema>

// ── Assignment create schema ──────────────────────────────────
export const CreateAssignmentSchema = z.object({
  title: z.string().min(2).max(120),
  schoolName: z.string().min(2),
  subject: z.string().min(1),
  className: z.string().min(1),
  estimatedDuration: z.number().min(10).max(300),
  dueDate: z.string().min(1),
  questionTypes: z
    .array(
      z.object({
        type: z.string().min(1),
        count: z.number().min(1).max(50),
        marksPerQuestion: z.number().min(1).max(20),
      })
    )
    .min(1),
  instructions: z.string().max(1000).optional(),
  uploadedMaterial: z
    .object({
      filename: z.string(),
      type: z.string(),
      fileId: z.string().optional(),
    })
    .optional(),
})
