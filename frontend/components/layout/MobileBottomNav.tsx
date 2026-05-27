"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Calendar, BookMarked, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: LayoutGrid },
  { label: "Assignments", href: "/assignments", icon: Calendar },
  { label: "Library", href: "/library", icon: BookMarked },
  { label: "AI Toolkit", href: "/toolkit", icon: Sparkles },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 flex h-[72px] w-[calc(100%-24px)] max-w-[373px] -translate-x-1/2 items-center justify-between rounded-[24px] bg-[#171717] px-2 lg:hidden">
      <div className="grid w-full grid-cols-4 gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            (item.href === '/' && pathname === '/') ||
            (item.href !== '/' && pathname.startsWith(item.href)) ||
            (pathname === '/' && item.href === '/assignments') // Fallback if homepage defaults to assignments
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-colors active:bg-white/10"
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-white" : "text-white/35"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[12px] font-medium tracking-tight",
                  isActive ? "text-white" : "text-white/35"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
