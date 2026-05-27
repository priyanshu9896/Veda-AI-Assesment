"use client"

import { Bell, Menu } from "lucide-react"
import { BrandMark } from "./BrandMark"

export function MobileHeader() {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between rounded-[24px] bg-surface-strong px-3.5 shadow-card lg:hidden">
      <BrandMark compact className="[&>span]:text-[27px]" />
      
      <div className="flex items-center gap-2">
        <button className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5">
          <Bell className="h-6 w-6" strokeWidth={2} />
          <span className="absolute right-2.5 top-2.5 h-[11px] w-[11px] rounded-full border-[2.5px] border-surface-strong bg-[#ff4141]" />
        </button>
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=f0d2c3"
          alt="John Doe"
          className="h-10 w-10 shrink-0 rounded-full bg-white object-cover shadow-sm"
        />
        <button className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5">
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
