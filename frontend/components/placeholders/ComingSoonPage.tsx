"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface ComingSoonPageProps {
  title?: string
  subtitle: string
  iconText: string
  backRoute?: string
  backText?: string
}

export function ComingSoonPage({
  title = "Coming soon",
  subtitle,
  iconText,
  backRoute = "/assignments",
  backText = "Back to assignments"
}: ComingSoonPageProps) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full max-w-[880px] flex-col items-center justify-center rounded-[32px] bg-white px-6 py-20 text-center shadow-[0_2px_24px_rgba(0,0,0,0.04)]"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-[22px] font-bold text-white shadow-md"
        >
          {iconText}
        </motion.div>

        <motion.h2 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-3 text-[32px] font-bold tracking-tight text-[#1c1c1e]"
        >
          {title}
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 max-w-[380px] text-[16px] font-medium leading-relaxed text-[#858585]"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={backRoute}
            className="inline-flex h-[52px] items-center justify-center rounded-full border-[1.5px] border-[#ff6136] bg-[#1c1c1e] px-8 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(255,97,54,0.15)] transition-all hover:bg-black"
          >
            {backText}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
