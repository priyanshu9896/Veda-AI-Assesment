'use client'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  className?: string
}

export function Stepper({ value, min = 1, max = 100, onChange, className }: StepperProps) {
  const decrement = () => { if (value > min) onChange(value - 1) }
  const increment = () => { if (value < max) onChange(value + 1) }

  return (
    <div className={cn('flex items-center rounded-[12px] md:rounded-[14px] overflow-hidden bg-white border border-black/5 shadow-sm', className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-black/5 disabled:opacity-30 transition-colors"
        aria-label="Decrease"
      >
        <Minus size={14} />
      </button>
      <div className="flex-1 w-8 text-center text-[14px] font-bold text-[#1c1c1e] select-none">
        {value}
      </div>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-black/5 disabled:opacity-30 transition-colors"
        aria-label="Increase"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
