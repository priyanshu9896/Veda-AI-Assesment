'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  ClipboardList,
  Clock,
  Sparkles,
  Bell,
  Menu,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/constants'

const tabs = [
  { label: 'Home',       href: '/',            icon: LayoutGrid   },
  { label: 'Assignments',href: '/assignments',  icon: ClipboardList },
  { label: 'Library',    href: '/library',      icon: Clock        },
  { label: 'AI Toolkit', href: '/toolkit',      icon: Sparkles     },
]

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-white border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-lg text-ink">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={18} className="text-ink-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-1">
            <span className="text-white text-xs font-semibold">J</span>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ml-1">
            <Menu size={18} className="text-ink-muted" />
          </button>
        </div>
      </header>

      {/* Mobile FAB */}
      <Link
        href="/assignments/new"
        className="lg:hidden fixed bottom-24 right-5 z-50 w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-banner hover:scale-105 active:scale-95 transition-transform"
        aria-label="Create assignment"
      >
        <Plus size={22} className="text-white" />
      </Link>

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink safe-area-pb">
        <div className="flex items-center justify-around py-2 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[60px]',
                  active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
