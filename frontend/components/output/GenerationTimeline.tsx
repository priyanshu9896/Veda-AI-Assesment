'use client'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIMELINE_STAGES } from '@/constants'
import type { GenerationStage } from '@/types'

interface GenerationTimelineProps {
  stage: GenerationStage
  message?: string
}

const stageOrder: GenerationStage[] = [
  'queued',
  'generating',
  'structuring',
  'validating',
  'completed',
]

function getStageIndex(stage: GenerationStage) {
  return stageOrder.indexOf(stage)
}

export function GenerationTimeline({ stage, message }: GenerationTimelineProps) {
  const currentIdx = getStageIndex(stage)
  const isFailed = stage === 'failed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-16 px-6 flex flex-col items-center gap-8"
    >
      {/* Spinning animation */}
      {!isFailed && stage !== 'completed' && (
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div className="absolute inset-0 rounded-full border-4 border-ink border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-brand rounded-full animate-timeline-pulse" />
          </div>
        </div>
      )}

      {/* Heading */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-ink">
          {isFailed ? 'Generation Failed' : 'Generating your question paper...'}
        </h2>
        {message && (
          <p className="text-sm text-ink-muted mt-1">{message}</p>
        )}
      </div>

      {/* Step list */}
      <div className="w-full space-y-3">
        {TIMELINE_STAGES.map((s, idx) => {
          const isDone = !isFailed && currentIdx > idx
          const isActive = !isFailed && currentIdx === idx
          const isPending = isFailed || currentIdx < idx

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3"
            >
              {/* Status icon */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300',
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-ink text-white'
                    : 'bg-gray-200 text-ink-subtle'
                )}
              >
                {isDone ? (
                  <Check size={13} strokeWidth={3} />
                ) : isActive ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isDone ? 'text-green-600' : isActive ? 'text-ink' : 'text-ink-subtle'
                )}
              >
                {s.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Progress bar */}
      {!isFailed && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            className="bg-ink h-1.5 rounded-full"
            animate={{ width: `${TIMELINE_STAGES[currentIdx]?.progress ?? 0}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      )}
    </motion.div>
  )
}
