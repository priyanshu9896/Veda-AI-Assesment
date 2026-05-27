import { create } from 'zustand'
import type { Assignment, GenerationStage, GeneratedPaper } from '@/types'

// ── Assignment Store ─────────────────────────────────────────
interface AssignmentState {
  assignments: Assignment[]
  isLoading: boolean
  error: string | null
  setAssignments: (assignments: Assignment[]) => void
  addAssignment: (assignment: Assignment) => void
  removeAssignment: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  isLoading: false,
  error: null,

  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),
  removeAssignment: (id) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))

// ── Generation Store ─────────────────────────────────────────
interface GenerationState {
  assignmentId: string | null
  jobId: string | null
  stage: GenerationStage
  progress: number
  failureMessage: string | null
  paper: GeneratedPaper | null
  setQueued: (assignmentId: string, jobId: string) => void
  setStage: (stage: GenerationStage, progress: number) => void
  setCompleted: (paper: GeneratedPaper) => void
  setFailed: (message: string) => void
  reset: () => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
  assignmentId: null,
  jobId: null,
  stage: 'queued',
  progress: 0,
  failureMessage: null,
  paper: null,

  setQueued: (assignmentId, jobId) =>
    set({ assignmentId, jobId, stage: 'queued', progress: 0, failureMessage: null }),

  setStage: (stage, progress) => set({ stage, progress }),

  setCompleted: (paper) =>
    set({ stage: 'completed', progress: 100, paper }),

  setFailed: (message) =>
    set({ stage: 'failed', failureMessage: message }),

  reset: () =>
    set({
      assignmentId: null,
      jobId: null,
      stage: 'queued',
      progress: 0,
      failureMessage: null,
      paper: null,
    }),
}))

// ── UI Store ─────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  setSidebarOpen: (open: boolean) => void
  openModal: (name: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),
}))
