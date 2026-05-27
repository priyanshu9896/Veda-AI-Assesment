import type {
  ApiResponse,
  Assignment,
  CreateAssignmentPayload,
  GeneratedPaper,
  GenerationState,
} from '@/types'
import { API_BASE_URL } from '@/constants'

// ── Base fetch ────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

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

export function getPdfUrl(paperId: string): string {
  return `${API_BASE_URL}/papers/${paperId}/pdf`
}

// ── File Upload ───────────────────────────────────────────────
export async function uploadMaterial(
  file: File,
): Promise<ApiResponse<{ fileId: string; filename: string }>> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Upload failed')
  return json
}
