import mongoose, { Schema, Document } from 'mongoose'

// ── Assignment ────────────────────────────────────────────────
export interface IAssignment extends Document {
  title: string
  schoolName: string
  subject: string
  className: string
  estimatedDuration: number
  dueDate: string
  questionTypes: {
    type: string
    count: number
    marksPerQuestion: number
  }[]
  instructions?: string
  uploadedMaterial?: {
    filename: string
    type: string
    fileId?: string
  }
  status:
    | 'draft'
    | 'queued'
    | 'generating'
    | 'structuring'
    | 'validating'
    | 'completed'
    | 'failed'
  jobId?: string
  paperId?: string
  createdAt: Date
  updatedAt: Date
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, maxlength: 120 },
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    estimatedDuration: { type: Number, required: true },
    dueDate: { type: String, required: true },
    questionTypes: [
      {
        type: { type: String, required: true },
        count: { type: Number, required: true, min: 1 },
        marksPerQuestion: { type: Number, required: true, min: 1 },
      },
    ],
    instructions: { type: String },
    uploadedMaterial: {
      filename: String,
      type: String,
      fileId: String,
    },
    status: {
      type: String,
      enum: ['draft', 'queued', 'generating', 'structuring', 'validating', 'completed', 'failed'],
      default: 'draft',
    },
    jobId: { type: String },
    paperId: { type: String },
  },
  { timestamps: true }
)

// ── Paper ──────────────────────────────────────────────────────
export interface IPaper extends Document {
  assignmentId: string
  generatedAt: Date
  generationTimeMs: number
  metadata: {
    subject: string
    className: string
    schoolName: string
    totalQuestions: number
    totalMarks: number
    estimatedDuration: number
    difficultyDistribution: { easy: number; medium: number; hard: number }
  }
  studentInfo: {
    nameEnabled: boolean
    rollEnabled: boolean
    sectionEnabled: boolean
  }
  sections: {
    id: string
    title: string
    instruction: string
    questions: {
      id: string
      text: string
      difficulty: string
      marks: number
      answerKey?: string
    }[]
  }[]
  aiMessage?: string
  summary: { generatedBy: string; version: string }
}

const PaperSchema = new Schema<IPaper>(
  {
    assignmentId: { type: String, required: true, index: true },
    generatedAt: { type: Date, default: Date.now },
    generationTimeMs: { type: Number, default: 0 },
    metadata: {
      subject: String,
      className: String,
      schoolName: String,
      totalQuestions: Number,
      totalMarks: Number,
      estimatedDuration: Number,
      difficultyDistribution: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
      },
    },
    studentInfo: {
      nameEnabled: { type: Boolean, default: true },
      rollEnabled: { type: Boolean, default: true },
      sectionEnabled: { type: Boolean, default: true },
    },
    sections: [
      {
        id: String,
        title: String,
        instruction: String,
        questions: [
          {
            id: String,
            text: String,
            difficulty: String,
            marks: Number,
            answerKey: String,
          },
        ],
      },
    ],
    aiMessage: String,
    summary: {
      generatedBy: { type: String, default: 'gemini' },
      version: { type: String, default: 'v1' },
    },
  },
  { timestamps: true }
)

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema)
export const Paper = mongoose.model<IPaper>('Paper', PaperSchema)
