'use client'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, ArrowLeft, LayoutGrid } from 'lucide-react'
import { USER_NAME } from '@/constants'

interface TopBarProps {
  breadcrumb?: string
  showBack?: boolean
}

export function TopBar({ breadcrumb = 'Assignment', showBack = false }: TopBarProps) {
  const router = useRouter()

  return (
    <header className="h-14 bg-white border-b border-surface-border flex items-center px-5 gap-3 flex-shrink-0">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={() => (showBack ? router.back() : router.push('/assignments'))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-ink-muted hover:text-ink transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <LayoutGrid size={16} className="text-ink-muted" />
        <span className="text-sm text-ink-muted font-medium">{breadcrumb}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-ink-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">J</span>
            </div>
          </div>
          <span className="text-sm font-medium text-ink hidden sm:block">{USER_NAME}</span>
          <ChevronDown size={14} className="text-ink-muted hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
