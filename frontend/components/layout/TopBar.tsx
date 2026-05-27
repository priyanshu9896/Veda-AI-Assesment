'use client'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, ArrowLeft, LayoutGrid, LogOut } from 'lucide-react'
import { USER_NAME } from '@/constants'
import { useAuthStore } from '@/store'
import { useState, useRef, useEffect } from 'react'

interface TopBarProps {
  breadcrumb?: string
  showBack?: boolean
}

export function TopBar({ breadcrumb = 'Assignment', showBack = false }: TopBarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{user?.role?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-ink hidden sm:block capitalize">{user?.role || 'User'}</span>
            <ChevronDown size={14} className="text-ink-muted hidden sm:block" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-black/5 py-1 z-50">
              <div className="px-4 py-3 border-b border-black/5">
                <p className="text-sm font-bold text-ink capitalize">{user?.role || 'User'} Account</p>
                <p className="text-xs text-[#858585] truncate mt-0.5 font-medium">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-[14px] font-medium text-[#ff6136] hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
              >
                <LogOut size={16} strokeWidth={2.5} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
