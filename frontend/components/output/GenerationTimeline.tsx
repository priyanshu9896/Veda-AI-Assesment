'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationStage } from '@/types'

interface GenerationTimelineProps {
  stage: GenerationStage
  message?: string
}

// Extended timeline states for premium feel
const VISUAL_STAGES = [
  { key: 'queued', label: 'Queued' },
  { key: 'analyzing', label: 'Analyzing Requirements' },
  { key: 'generating', label: 'Generating Questions' },
  { key: 'structuring', label: 'Structuring Assessment' },
  { key: 'validating', label: 'Validating Output' },
  { key: 'completed', label: 'Preparing Final Paper' },
]

export function GenerationTimeline({ stage, message }: GenerationTimelineProps) {
  const [visualIndex, setVisualIndex] = useState(0)
  const isFailed = stage === 'failed'

  // Map backend stages to our expanded visual stages
  useEffect(() => {
    if (isFailed) return

    let targetIndex = 0
    if (stage === 'queued') targetIndex = 0
    else if (stage === 'generating') targetIndex = 2 // We'll simulate 'analyzing'
    else if (stage === 'structuring') targetIndex = 3
    else if (stage === 'validating') targetIndex = 4
    else if (stage === 'completed') targetIndex = 5

    // If jumping to generating, simulate 'analyzing' first
    if (targetIndex === 2 && visualIndex < 1) {
      setVisualIndex(1)
      const timer = setTimeout(() => setVisualIndex(2), 2000)
      return () => clearTimeout(timer)
    } else {
      setVisualIndex(targetIndex)
    }
  }, [stage, isFailed])

  const progress = Math.min(100, Math.max(0, (visualIndex / (VISUAL_STAGES.length - 1)) * 100))

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.05)] rounded-[32px] p-8 md:p-10 relative overflow-hidden"
      >
        {/* Subtle background shimmer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(255,97,54,0.03)_0%,rgba(255,255,255,0)_50%)] animate-spin-slow" />
        </div>

        {/* AI Core Animation */}
        <div className="relative flex justify-center mb-10">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {isFailed ? (
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
            ) : stage === 'completed' ? (
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                <Check size={32} strokeWidth={3} />
              </div>
            ) : (
              <>
                <motion.div 
                  className="absolute inset-0 rounded-full border border-[#ff6136]/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                  className="absolute inset-2 rounded-full border border-[#ff6136]/40"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff6136] to-[#ff8c6b] shadow-[0_0_20px_rgba(255,97,54,0.4)] flex items-center justify-center relative z-10">
                  <Sparkles className="text-white w-5 h-5 animate-pulse" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10 relative z-10">
          <h2 className="text-[20px] font-bold text-ink tracking-tight">
            {isFailed ? 'Generation Interrupted' : 'AI is composing your paper'}
          </h2>
          <p className="text-[14px] text-[#858585] mt-2 font-medium">
            {isFailed ? (message || 'Something went wrong. Please try again.') : 'This usually takes about a minute.'}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative pl-2 md:pl-4 z-10 space-y-6">
          {/* Vertical progress line background */}
          <div className="absolute left-[15px] md:left-[23px] top-2 bottom-2 w-[2px] bg-[#f4f4f5] rounded-full" />
          
          {/* Active progress line */}
          {!isFailed && (
            <motion.div 
              className="absolute left-[15px] md:left-[23px] top-2 w-[2px] bg-gradient-to-b from-[#ff6136] to-[#ff8c6b] rounded-full origin-top"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: progress / 100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}

          {VISUAL_STAGES.map((s, idx) => {
            const isDone = !isFailed && visualIndex > idx
            const isActive = !isFailed && visualIndex === idx
            const isPending = isFailed || visualIndex < idx

            return (
              <div key={s.key} className="relative flex items-center gap-4 md:gap-5">
                {/* Node */}
                <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm shrink-0 transition-all duration-500">
                  {isDone ? (
                    <div className="w-full h-full rounded-full bg-[#1c1c1e] text-white flex items-center justify-center scale-100 transition-transform">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : isActive ? (
                    <div className="w-full h-full rounded-full border-2 border-[#ff6136] flex items-center justify-center p-[3px]">
                      <motion.div 
                        className="w-full h-full bg-[#ff6136] rounded-full"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#e4e4e7]" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[14px] md:text-[15px] font-semibold transition-all duration-500',
                    isDone ? 'text-ink' : isActive ? 'text-[#ff6136] translate-x-1' : 'text-[#A1A1AA]'
                  )}
                >
                  {s.label}
                </span>

                {/* Active Shimmer on Label */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
