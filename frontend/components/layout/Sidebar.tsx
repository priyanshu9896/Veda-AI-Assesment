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

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col rounded-[24px] bg-surface-strong px-6 py-8 shadow-soft lg:flex">
      <div className="mb-10 px-2">
        <BrandMark />
      </div>

      <div className="mb-8 px-2">
        <Button 
          variant="accent" 
          onClick={() => router.push('/assignments/new')}
          className="h-[48px] w-full rounded-full text-[15px] font-semibold"
        >
          <Sparkles className="mr-2 h-4 w-4" strokeWidth={2.5} />
          Create Assignment
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/assignments')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-[42px] items-center gap-3 rounded-xl px-4 text-[15px] transition-colors",
                isActive
                  ? "bg-[#f4f4f5] text-foreground font-semibold"
                  : "text-muted font-medium hover:bg-black/5 hover:text-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4 px-2">
        <Link
          href="/settings"
          className="flex h-[42px] items-center gap-3 rounded-xl px-4 text-[15px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
          Settings
        </Link>

        <button className="flex w-full items-center gap-3 rounded-2xl bg-[#f4f4f5] p-3 transition-colors hover:bg-black/5">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f0d2c3"
            alt="Delhi Public School"
            className="h-10 w-10 shrink-0 rounded-full bg-white object-cover shadow-sm"
          />
          <div className="flex flex-col items-start overflow-hidden text-left">
            <span className="w-full truncate text-[14px] font-bold leading-tight text-[#1c1c1e]">
              Delhi Public School
            </span>
            <span className="w-full truncate text-[13px] font-medium text-[#858585]">
              Bokaro Steel City
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}
