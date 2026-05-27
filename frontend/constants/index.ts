// ── App Constants ─────────────────────────────────────────────
export const APP_NAME = 'VedaAI'
export const SCHOOL_NAME = 'Delhi Public School'
export const SCHOOL_LOCATION = 'Bokaro Steel City'
export const USER_NAME = 'John Doe'

// ── API ───────────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000'

// ── Upload ────────────────────────────────────────────────────
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ── Generation Timeline stages ───────────────────────────────
export const TIMELINE_STAGES = [
  { key: 'queued',      label: 'Queued',      progress: 0  },
  { key: 'generating', label: 'Generating',  progress: 20 },
  { key: 'structuring',label: 'Structuring', progress: 60 },
  { key: 'validating', label: 'Validating',  progress: 80 },
  { key: 'completed',  label: 'Completed',   progress: 100},
] as const

// ── Difficulty display ────────────────────────────────────────
export const DIFFICULTY_DISPLAY: Record<string, { label: string; className: string }> = {
  easy:   { label: 'Easy',       className: 'bg-green-100 text-green-700' },
  medium: { label: 'Moderate',   className: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Challenging',className: 'bg-red-100 text-red-700' },
}

// ── Nav items ─────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: 'Home',              href: '/',               icon: 'Home'           },
  { label: 'My Groups',         href: '/groups',         icon: 'Users'          },
  { label: 'Assignments',       href: '/assignments',    icon: 'ClipboardList'  },
  { label: "AI Teacher's Toolkit", href: '/toolkit',    icon: 'BookOpen'       },
  { label: 'My Library',        href: '/library',        icon: 'Clock'          },
] as const
