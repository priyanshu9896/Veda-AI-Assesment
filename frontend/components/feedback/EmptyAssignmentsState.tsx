"use client"

import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/Button"

function EmptyIllustration() {
  return (
    <div className="relative h-[268px] w-[330px] sm:h-[286px] sm:w-[360px] mx-auto flex shrink-0 items-center justify-center">
      {/* Backdrop Halo */}
      <div className="absolute h-[238px] w-[238px] rounded-full bg-white shadow-soft" />

      {/* Main Paper Document */}
      <div className="absolute left-[112px] top-[66px] flex h-[156px] w-[128px] flex-col gap-3 rounded-[18px] bg-white p-5 shadow-[0_12px_24px_rgba(0,0,0,0.06)] z-0 border border-black/5">
        <div className="h-2.5 w-12 rounded-full bg-[#001d31]" />
        <div className="mt-1 flex flex-col gap-2.5">
          <div className="h-2 w-full rounded-full bg-[#e4e4e7]" />
          <div className="h-2 w-[85%] rounded-full bg-[#e4e4e7]" />
          <div className="h-2 w-[90%] rounded-full bg-[#e4e4e7]" />
        </div>
      </div>

      {/* Curved Lines/Swooshes (Left of the paper) */}
      <svg className="absolute left-[34px] top-[70px] h-[60px] w-[90px] overflow-visible" viewBox="0 0 100 100" fill="none">
        <path d="M 100 20 C 50 10, 30 40, 50 60 C 70 80, 90 40, 70 20 C 50 0, -10 60, -20 80" stroke="#001d31" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      <div className="absolute left-[84px] top-[48px] h-16 w-20 rotate-[35deg] rounded-[50%] border-l-[2.5px] border-l-transparent" />

      {/* Small Notification Card (Right) */}
      <div className="absolute right-[0px] top-[55px] flex h-[46px] w-[82px] items-center gap-2.5 rounded-lg bg-white px-3 shadow-[0_14px_28px_rgba(0,0,0,0.06)] border border-black/5">
        <div className="h-3 w-3 shrink-0 rounded-full bg-[#c8bfdd]" />
        <div className="h-1.5 w-full rounded-full bg-[#e4e4e7]" />
      </div>

      {/* Magnifying Glass (Hollow Purple Circle) over the paper */}
      <div className="absolute left-[140px] top-[90px] z-10 flex h-[104px] w-[104px] items-center justify-center rounded-full border-[8px] border-[#e9e3f4] bg-white/40 shadow-[0_8px_22px_rgba(0,0,0,0.04)] backdrop-blur-md">
        {/* Red Cross inside */}
        <div className="relative flex h-[40px] w-[40px] items-center justify-center">
          <div className="absolute h-[8px] w-[32px] rotate-45 rounded-full bg-[#ff4141]" />
          <div className="absolute h-[8px] w-[32px] -rotate-45 rounded-full bg-[#ff4141]" />
        </div>
      </div>

      {/* Magnifying Glass Handle */}
      <div className="absolute left-[222px] top-[178px] z-0 h-[64px] w-[24px] rotate-[-42deg] rounded-full bg-[#e9e3f4]" />

      {/* Crosshair Star (Bottom Left) */}
      <svg className="absolute bottom-[60px] left-[70px] h-6 w-6 text-[#3c7da8]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
      </svg>

      {/* Miscellaneous Accents */}
      <div className="absolute right-[8px] top-[150px] h-3 w-3 rounded-full bg-[#347ca8]" />
    </div>
  )
}

export function EmptyAssignmentsState() {
  const router = useRouter()
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      className="flex h-full w-full flex-col items-center justify-center p-4 text-center"
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.24, delay: 0.04, ease: "easeOut" }}
      >
        <EmptyIllustration />
      </motion.div>

      <div className="mt-6 flex max-w-[540px] flex-col items-center gap-2">
        <h2 className="text-[24px] font-bold tracking-tight text-[#1c1c1e]">
          No assignments yet
        </h2>
        <p className="text-[15px] leading-relaxed text-[#858585]">
          Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => router.push('/assignments/new')}
        className="mt-8 h-[52px] w-[90%] sm:w-auto sm:px-8 rounded-full shadow-card text-[15px]"
      >
        <Plus className="h-5 w-5 mr-1" strokeWidth={2.5} />
        Create Your First Assignment
      </Button>
    </motion.div>
  )
}
