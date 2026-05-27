// ============================================================
// Shared Types — VedaAI Assessment Creator
// Mirrors the API contract in docs/API_SPEC.md exactly.
// ============================================================

// ── Question Type Config (used in create form) ──────────────
export interface QuestionTypeConfig {
  type: string
  count: number
  marksPerQuestion: number
}

// ── Assignment (list / detail) ───────────────────────────────
export type AssignmentStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'structuring'
  | 'validating'
  | 'completed'
  | 'failed'

export interface Assignment {
  id: string
  title: string
  schoolName: string
  subject: string
  className: string
  dueDate: string       // ISO or DD-MM-YYYY
  status: AssignmentStatus
  questionCount: number
  totalMarks: number
  createdAt: string
  paperId?: string
  jobId?: string
}

// ── Create Assignment Payload ────────────────────────────────
export interface CreateAssignmentPayload {
  title: string
  schoolName: string
  subject: string
  className: string
  estimatedDuration: number          // in minutes
  dueDate: string
  questionTypes: QuestionTypeConfig[]
  instructions?: string
  uploadedMaterial?: {
    filename: string
    type: string
    fileId?: string
  }
}

// ── Generated Paper ──────────────────────────────────────────
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  text: string
  difficulty: DifficultyLevel
  marks: number
  answerKey?: string
}

export interface PaperSection {
  id: string
  title: string
  instruction: string
  questions: Question[]
}

export interface PaperMetadata {
  assignmentId: string
  generatedAt: string
  generationTimeMs: number
  subject: string
  className: string
  schoolName: string
  totalQuestions: number
  totalMarks: number
  estimatedDuration: number
  difficultyDistribution: {
    easy: number
    medium: number
    hard: number
  }
}

export interface StudentInfo {
  nameEnabled: boolean
  rollEnabled: boolean
  sectionEnabled: boolean
}

export interface GeneratedPaper {
  metadata: PaperMetadata
  studentInfo: StudentInfo
  sections: PaperSection[]
  aiMessage?: string
  summary: {
    generatedBy: 'gemini'
    version: 'v1'
  }
}

// ── Generation Job State ─────────────────────────────────────
export type GenerationStage =
  | 'queued'
  | 'generating'
  | 'structuring'
  | 'validating'
  | 'completed'
  | 'failed'

export interface GenerationState {
  assignmentId: string
  jobId: string
  stage: GenerationStage
  progress: number          // 0–100
  message?: string
}

// ── Socket Event Payloads ────────────────────────────────────
export interface SocketQueuedPayload {
  assignmentId: string
  status: 'queued'
}

export interface SocketProgressPayload {
  progress: number
}

export interface SocketCompletedPayload {
  assignmentId: string
  paperId: string
}

export interface SocketFailedPayload {
  message: string
}

// ── API Response Wrapper ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  meta?: Record<string, unknown>
  error?: {
    code: string
    recoverable: boolean
  }
}

// ── UI Enums ─────────────────────────────────────────────────
export const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True/False',
  'Match the Following',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]
