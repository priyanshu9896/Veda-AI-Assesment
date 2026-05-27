import type {
  ApiResponse,
  Assignment,
  CreateAssignmentPayload,
  GeneratedPaper,
  GenerationState,
  Question,
} from '@/types'
import { API_BASE_URL } from '@/constants'
import { useAuthStore } from '@/store'

// ── Base fetch ────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    useAuthStore.getState().logout()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? 'Request failed')
  }
  return json as ApiResponse<T>
}

// ── Assignments ───────────────────────────────────────────────
export async function getAssignments(params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}): Promise<ApiResponse<Assignment[]>> {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString()
  return apiFetch<Assignment[]>(`/assignments${qs ? `?${qs}` : ''}`)
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
): Promise<ApiResponse<{ assignmentId: string; jobId: string; status: string }>> {
  return apiFetch('/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAssignment(
  id: string,
): Promise<ApiResponse<{ assignment: Assignment; paper: GeneratedPaper | null; status: string }>> {
  return apiFetch(`/assignments/${id}`)
}

export async function deleteAssignment(id: string): Promise<ApiResponse<null>> {
  return apiFetch(`/assignments/${id}`, { method: 'DELETE' })
}

// ── Jobs ──────────────────────────────────────────────────────
export async function getJobStatus(
  jobId: string,
): Promise<ApiResponse<GenerationState>> {
  return apiFetch(`/jobs/${jobId}`)
}

// ── Papers ────────────────────────────────────────────────────
export async function regenerateSection(
  paperId: string,
  sectionId: string,
  instruction?: string,
): Promise<ApiResponse<{ section: unknown; regenerated: boolean }>> {
  return apiFetch(`/papers/${paperId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ sectionId, instruction }),
  })
}

export async function regenerateQuestion(
  paperId: string,
  sectionId: string,
  questionId: string,
  instruction?: string,
): Promise<ApiResponse<{ question: Question; regenerated: boolean }>> {
  return apiFetch(`/papers/${paperId}/regenerate-question`, {
    method: 'POST',
    body: JSON.stringify({ sectionId, questionId, instruction }),
  })
}

export function getPdfUrl(paperId: string): string {
  return `${API_BASE_URL}/papers/${paperId}/pdf`
}

// ── File Upload ───────────────────────────────────────────────
export async function uploadMaterial(
  file: File,
): Promise<ApiResponse<{ fileId: string; filename: string }>> {
  const formData = new FormData()
  formData.append('file', file)

  const token = useAuthStore.getState().token
  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Upload failed')
  return json
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}
