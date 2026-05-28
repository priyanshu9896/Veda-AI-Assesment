"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutGrid,
  Users,
  FileText,
  BookOpen,
  Library,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandMark } from "./BrandMark"
import { Button } from "../ui/Button"
import { useAssignmentStore, useAuthStore } from "@/store"
import { SCHOOL_NAME, SCHOOL_LOCATION } from "@/constants"
import { LogOut } from "lucide-react"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/assignments", icon: FileText },
  { label: "AI Teacher's Toolkit", href: "/toolkit", icon: BookOpen },
  { label: "My Library", href: "/library", icon: Library },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { assignments } = useAssignmentStore()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col rounded-[24px] bg-surface-strong px-6 py-8 shadow-soft lg:flex">
      <div className="mb-10 px-2">
        <BrandMark />
      </div>

      <div className="mb-8 px-2">
        <button 
          onClick={() => router.push('/assignments/new')}
          className="flex items-center justify-center h-[52px] w-full rounded-full bg-[#1c1c1e] border-[1.5px] border-[#ff6136] text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(255,97,54,0.15)] hover:bg-black transition-all"
        >
          <Sparkles className="mr-2 h-[18px] w-[18px]" strokeWidth={2.5} />
          Create Assignment
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/assignments' && pathname.startsWith('/assignments')) ||
            (pathname === '/' && item.href === '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[48px] items-center gap-3 rounded-[16px] px-4 text-[15px] transition-colors relative",
                isActive
                  ? "bg-[#f4f4f5] text-foreground font-semibold"
                  : "text-muted font-medium hover:bg-black/5 hover:text-foreground"
              )}
            >
              <div className="flex flex-1 items-center gap-3">
                <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={2.5} />
                {item.label}
              </div>
              {item.label === 'Assignments' && assignments.length > 0 && (
                <span className="ml-auto flex h-[22px] min-w-[28px] items-center justify-center rounded-full bg-[#ff6136] px-2 text-[12px] font-bold text-white shadow-sm">
                  {assignments.length}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-2">
        <Link
          href="/settings"
          className="flex h-[48px] items-center gap-3 rounded-[16px] px-4 text-[15px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
        >
          <Settings className="h-[20px] w-[20px] shrink-0" strokeWidth={2.5} />
          Settings
        </Link>

        <button onClick={handleLogout} className="group relative flex w-full items-center gap-3 rounded-[20px] bg-[#f4f4f5] p-3.5 transition-colors hover:bg-[#ebebeb]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-black/5 overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/shapes/svg?seed=school&backgroundColor=f4f4f5"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start overflow-hidden text-left flex-1">
            <span className="w-full truncate text-[14px] font-bold leading-tight text-ink">
              {SCHOOL_NAME}
            </span>
            <span className="w-full truncate text-[12.5px] font-medium text-[#858585] mt-0.5">
              {SCHOOL_LOCATION}
            </span>
          </div>
          <div className="absolute right-4 text-[#858585] opacity-0 transition-opacity group-hover:opacity-100">
            <LogOut size={16} strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </aside>
  )
}
