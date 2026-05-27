"use client"

import { ArrowLeft, Bell, ChevronDown, LayoutGrid } from "lucide-react"
import { useRouter } from "next/navigation"

interface PageHeaderProps {
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  showBack?: boolean
  assignmentCount?: number
}

export function PageHeader({ 
  title = "Assignment", 
  subtitle,
  icon,
  showBack = true, 
  assignmentCount 
}: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="hidden h-[60px] shrink-0 items-center justify-between rounded-[24px] bg-surface-strong px-6 shadow-card lg:flex">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-black/5"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          {icon ? icon : <LayoutGrid className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-bold text-[#1c1c1e]">{title}</h1>
              {assignmentCount !== undefined && (
                <span className="ml-1 flex h-5 items-center justify-center rounded-full bg-black/5 px-2 text-xs font-semibold text-foreground">
                  {assignmentCount}
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[12px] font-medium text-[#858585]">{subtitle}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5">
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 h-[9px] w-[9px] rounded-full border-2 border-surface-strong bg-[#ff4141]" />
        </button>
        
        <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=f0d2c3" 
            alt="John Doe"
            className="h-8 w-8 shrink-0 rounded-full bg-white object-cover shadow-sm"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-semibold text-foreground">
              John Doe
            </span>
            <ChevronDown className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
          </div>
        </div>
      </div>
    </header>
  )
}
