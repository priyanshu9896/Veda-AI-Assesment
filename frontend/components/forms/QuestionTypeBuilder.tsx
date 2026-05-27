'use client'
import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Stepper } from '@/components/ui/Stepper'
import { cn } from '@/lib/utils'
import { QUESTION_TYPES } from '@/types'
import type { QuestionTypeConfig } from '@/types'
import { Button } from '@/components/ui/Button'

interface QuestionTypeBuilderProps {
  value: QuestionTypeConfig[]
  onChange: (value: QuestionTypeConfig[]) => void
}

function QuestionTypeRow({
  item,
  index,
  onRemove,
  onChange,
}: {
  item: QuestionTypeConfig
  index: number
  onRemove: () => void
  onChange: (updated: QuestionTypeConfig) => void
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_32px_110px_110px] gap-3 md:gap-4 items-stretch md:items-center py-3 md:py-1 border border-[#e4e4e7] md:border-none rounded-[16px] md:rounded-none px-3 md:px-0">
      {/* Question type selector + Mobile Remove */}
      <div className="flex items-center gap-2 relative w-full">
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 pl-3 md:pl-4 pr-2 md:pr-4 py-1.5 md:py-2 text-[14px] font-medium rounded-[16px] bg-white border border-black/5 shadow-sm hover:opacity-70 transition-colors"
          >
            <span className="text-left truncate text-[#1c1c1e]">{item.type}</span>
            <ChevronDown size={16} className="text-ink-muted flex-shrink-0" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-surface-border rounded-xl shadow-banner py-1 min-w-full max-h-52 overflow-y-auto">
                {QUESTION_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onChange({ ...item, type })
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-[14px] hover:bg-gray-50 transition-colors',
                      item.type === type ? 'font-bold text-[#1c1c1e]' : 'font-medium text-[#858585]'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Mobile Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="md:hidden w-8 h-8 flex items-center justify-center text-ink-muted shrink-0"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Desktop Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="hidden md:flex w-8 h-8 items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-full shrink-0 transition-colors"
      >
        <X size={16} strokeWidth={2.5} />
      </button>

      {/* Steppers */}
      <div className="flex md:contents items-center justify-around gap-4 bg-[#f4f4f5] md:bg-transparent rounded-[16px] md:rounded-none py-2 px-2 md:p-0">
        <div className="flex flex-col items-center gap-1.5 md:gap-0 w-full md:w-[110px]">
          <span className="block md:hidden text-[12px] font-medium text-[#1c1c1e]">No. of Questions</span>
          <Stepper
            value={item.count}
            min={1}
            max={50}
            onChange={(count) => onChange({ ...item, count })}
            className="w-full max-w-[110px] mx-auto"
          />
        </div>
        <div className="flex flex-col items-center gap-1.5 md:gap-0 w-full md:w-[110px]">
          <span className="block md:hidden text-[12px] font-medium text-[#1c1c1e]">Marks</span>
          <Stepper
            value={item.marksPerQuestion}
            min={1}
            max={20}
            onChange={(marks) => onChange({ ...item, marksPerQuestion: marks })}
            className="w-full max-w-[110px] mx-auto"
          />
        </div>
      </div>
    </div>
  )
}

export function QuestionTypeBuilder({ value, onChange }: QuestionTypeBuilderProps) {
  const totalQuestions = value.reduce((sum, q) => sum + q.count, 0)
  const totalMarks = value.reduce((sum, q) => sum + q.count * q.marksPerQuestion, 0)

  const addRow = () => {
    onChange([
      ...value,
      {
        type: QUESTION_TYPES.find((t) => !value.find((v) => v.type === t)) ?? QUESTION_TYPES[0],
        count: 5,
        marksPerQuestion: 1,
      },
    ])
  }

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, updated: QuestionTypeConfig) => {
    onChange(value.map((item, i) => (i === index ? updated : item)))
  }

  return (
    <div className="space-y-2">
      {/* Header row (Desktop only) */}
      <div className="hidden md:grid grid-cols-[1fr_32px_110px_110px] gap-4 pb-2 items-end">
        <span className="text-[13px] font-bold text-[#1c1c1e] pl-1">
          Question Type
        </span>
        <div /> {/* Spacer for X */}
        <span className="text-[13px] font-bold text-[#1c1c1e] text-center">
          No. of Questions
        </span>
        <span className="text-[13px] font-bold text-[#1c1c1e] text-center">
          Marks
        </span>
      </div>

      {/* Rows */}
      <div className="space-y-4 md:space-y-2">
        {value.map((item, index) => (
          <QuestionTypeRow
            key={index}
            item={item}
            index={index}
            onRemove={() => removeRow(index)}
            onChange={(updated) => updateRow(index, updated)}
          />
        ))}
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-3 text-[14px] font-semibold text-[#1c1c1e] hover:opacity-80 transition-opacity mt-4 md:mt-3"
      >
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1c1c1e] text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </span>
        Add Question Type
      </button>

      {/* Totals */}
      {value.length > 0 && (
        <div className="flex flex-col items-end gap-0.5 pt-2 text-[13px]">
          <span className="text-[#1c1c1e] font-medium">
            Total Questions : <span className="font-bold">{totalQuestions}</span>
          </span>
          <span className="text-[#1c1c1e] font-medium">
            Total Marks : <span className="font-bold">{totalMarks}</span>
          </span>
        </div>
      )}
    </div>
  )
}
