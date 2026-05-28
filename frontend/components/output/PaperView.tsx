'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTY_DISPLAY } from '@/constants'
import { regenerateSection, getPdfUrl } from '@/services/api'
import type { GeneratedPaper, PaperSection, Question } from '@/types'
import { useGenerationStore, useAuthStore } from '@/store'
import { PieChart } from 'lucide-react'

// Helper to strip [Regenerated] markers from display
function cleanText(text: string): string {
  return text.replace(/\[Regenerated\]\s*/g, '').trim()
}

// ── Formatted Question Text ──────────────────────────────────
function FormattedQuestionText({ text }: { text: string }) {
  const parts = text.split(/(?=\n?[A-D]\))/)
  if (parts.length === 5) {
    return (
      <>
        <span className="whitespace-pre-wrap">{cleanText(parts[0])}</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-3 ml-4 w-full block">
          {parts.slice(1).map((opt, i) => (
            <div key={i} className="flex text-[15px] text-ink/90 whitespace-pre-wrap">
              {cleanText(opt)}
            </div>
          ))}
        </div>
      </>
    )
  }
  return <span className="whitespace-pre-wrap">{cleanText(text)}</span>
}

// ── AI Message Banner ──────────────────────────────────────────
export function AIMessageBanner({
  message,
  paperId,
  metadata,
}: {
  message: string
  paperId: string
  metadata?: { subject: string; className: string }
}) {
  const handleDownload = async () => {
    const token = useAuthStore.getState().token || ''
    
    const subject = (metadata?.subject || 'Paper').replace(/[^a-zA-Z0-9]/g, '_')
    const className = (metadata?.className || 'Class').replace(/[^a-zA-Z0-9]/g, '_')

    const downloadPdf = async (type: string, suffix: string) => {
      try {
        const url = `${getPdfUrl(paperId)}?type=${type}&token=${token}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Download failed')
        const blob = await res.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = blobUrl
        a.download = `${subject}_${className}_${suffix}.pdf`
        document.body.appendChild(a)
        a.click()
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
        document.body.removeChild(a)
      } catch (err) {
        console.error(`Failed to download ${type}:`, err)
      }
    }

    // Download sequentially with a delay so browsers do not block the second file
    await downloadPdf('paper', 'Questions')
    await new Promise(resolve => setTimeout(resolve, 800))
    await downloadPdf('answers', 'Answers')
  }

  return (
    <div className="flex flex-col gap-4 text-white">
      <p className="text-[15px] sm:text-[16px] leading-relaxed font-medium">
        {message}
      </p>

      {/* Desktop — white pill per Figma 04-output-desktop */}
      <button
        onClick={handleDownload}
        className="hidden sm:inline-flex self-start items-center gap-2 bg-white text-[#1c1c1e] hover:bg-gray-100 px-5 h-[40px] rounded-full text-[14px] font-semibold transition-colors active:scale-[0.97]"
      >
        <Download size={16} strokeWidth={2.5} />
        Download as PDF
      </button>

      {/* Mobile — circular download per Figma 04-output-mobile */}
      <button
        onClick={handleDownload}
        className="sm:hidden self-start flex items-center justify-center w-10 h-10 bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors active:scale-[0.97]"
        title="Download as PDF"
      >
        <Download size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}

// ── Difficulty Tag ─────────────────────────────────────────────
function DifficultyTag({ level }: { level: string }) {
  const display = DIFFICULTY_DISPLAY[level] ?? { label: level, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('difficulty-badge', display.className)}>
      {display.label}
    </span>
  )
}

// ── Question Item ─────────────────────────────────────────────
function QuestionItem({
  question,
  number,
  paperId,
  sectionId,
  onUpdate,
}: {
  question: Question
  number: number
  paperId: string
  sectionId: string
  onUpdate: (updatedQuestion: Question) => void
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      const { regenerateQuestion } = await import('@/services/api')
      const res = await regenerateQuestion(paperId, sectionId, question.id, instruction)
      if (res.success && res.data) {
        onUpdate(res.data.question)
        setIsFormOpen(false)
        setInstruction('')
      }
    } catch {
      // silent
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <li className="text-sm text-ink leading-relaxed relative group">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className="font-medium">{number}.</span>{' '}
          <DifficultyTag level={question.difficulty} />{' '}
          <FormattedQuestionText text={question.text} />{' '}
          <span className="text-ink-muted whitespace-nowrap">[{question.marks} Mark{question.marks !== 1 ? 's' : ''}]</span>
        </div>
        
        {/* Always visible regenerate button */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          disabled={isRegenerating}
          title="Regenerate this question"
          className="flex-shrink-0 text-ink-muted hover:text-accent transition-colors mt-0.5"
        >
          <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Inline Form */}
      {isFormOpen && (
        <div className="mt-2 ml-4 p-3 bg-surface-strong border border-surface-border rounded-lg flex flex-col sm:flex-row gap-2 shadow-sm animate-slide-up">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Optional: specify how to change this question (e.g., make it harder)"
            className="flex-1 bg-background border border-surface-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            disabled={isRegenerating}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRegenerate()
              if (e.key === 'Escape') setIsFormOpen(false)
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={() => setIsFormOpen(false)}
              disabled={isRegenerating}
              className="px-3 py-1.5 bg-surface text-ink text-xs font-medium rounded-md border border-surface-border hover:bg-surface-border transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// ── Section Block ─────────────────────────────────────────────
function SectionBlock({
  section,
  startNumber,
  paperId,
  onUpdateSection,
}: {
  section: PaperSection
  startNumber: number
  paperId: string
  onUpdateSection: (updatedSection: PaperSection) => void
}) {
  const [regenerating, setRegenerating] = useState(false)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await regenerateSection(paperId, section.id)
      if (res.success && res.data) {
        onUpdateSection(res.data.section as PaperSection)
      }
    } catch {
      // silent
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="relative flex items-center justify-center pb-2 min-h-[32px] mt-6 mb-2">
        <h3 className="text-xl font-bold text-ink text-center">{section.title}</h3>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          title="Regenerate entire section"
          className="absolute right-0 flex flex-shrink-0 items-center gap-1.5 bg-surface-border hover:bg-ink text-ink hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />
          <span className="hidden sm:inline whitespace-nowrap">Regenerate Section</span>
        </button>
      </div>

      {/* Instruction */}
      {section.instruction && (
        <p className="text-[15px] font-semibold text-ink mb-1">{section.instruction}</p>
      )}

      {/* Questions */}
      <ol className="space-y-3.5 list-none">
        {section.questions.map((q, idx) => (
          <QuestionItem
            key={q.id}
            question={q}
            number={startNumber + idx}
            paperId={paperId}
            sectionId={section.id}
            onUpdate={(updatedQuestion) => {
              const newQuestions = section.questions.map((prevQ) =>
                prevQ.id === q.id ? updatedQuestion : prevQ
              )
              onUpdateSection({ ...section, questions: newQuestions })
            }}
          />
        ))}
      </ol>
    </div>
  )
}

// ── Answer Key ────────────────────────────────────────────────
function AnswerKey({ sections }: { sections: PaperSection[] }) {
  const allAnswers: { number: number; text: string }[] = []
  let counter = 1
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.answerKey) {
        allAnswers.push({ number: counter, text: q.answerKey })
      }
      counter++
    }
  }

  if (allAnswers.length === 0) return null

  return (
    <div className="space-y-3 pt-6 border-t border-surface-border">
      <h3 className="font-bold text-ink">Answer Key:</h3>
      <ol className="space-y-3 list-none">
        {allAnswers.map(({ number, text }) => (
          <li key={number} className="text-sm text-ink leading-relaxed">
            <span className="font-medium">{number}.</span> {cleanText(text)}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Main Paper View ───────────────────────────────────────────
export function PaperView({
  paper: initialPaper,
  paperId,
}: {
  paper: GeneratedPaper
  paperId: string
}) {
  const { paper, setCompleted } = useGenerationStore()

  useEffect(() => {
    if (initialPaper) setCompleted(initialPaper)
  }, [initialPaper, setCompleted])

  if (!paper) return null

  const { metadata, studentInfo, sections } = paper

  // Count start index per section
  let questionCounter = 1
  const sectionStartNumbers: number[] = []
  for (const section of sections) {
    sectionStartNumbers.push(questionCounter)
    questionCounter += section.questions.length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="figma-output-shell space-y-5 lg:space-y-6"
    >
      {/* AI message — inside dark shell (Figma 04-output) */}
      {paper.aiMessage && (
        <AIMessageBanner message={paper.aiMessage} paperId={paperId} metadata={metadata} />
      )}

      {/* Paper body — white card inside shell */}
      <div className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] px-6 py-8 lg:px-10 lg:py-10 space-y-6 max-w-full">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1c1c1e]">{metadata.schoolName}</h1>
          <p className="text-xl sm:text-2xl font-semibold text-[#1c1c1e]">Subject: {metadata.subject}</p>
          <p className="text-xl sm:text-2xl font-semibold text-[#1c1c1e]">Class: {metadata.className}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-[15px] sm:text-base font-medium text-[#1c1c1e] mb-6">
          <span>Time Allowed: {metadata.estimatedDuration} minutes</span>
          <span>Maximum Marks: {metadata.totalMarks}</span>
        </div>

        {/* General instructions */}
        <p className="text-sm font-semibold text-ink">
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student info blanks */}
        {(studentInfo.nameEnabled || studentInfo.rollEnabled || studentInfo.sectionEnabled) && (
          <div className="space-y-1.5 text-sm text-ink">
            {studentInfo.nameEnabled && (
              <p>Name: <span className="inline-block w-40 border-b border-ink">&nbsp;</span></p>
            )}
            {studentInfo.rollEnabled && (
              <p>Roll Number: <span className="inline-block w-32 border-b border-ink">&nbsp;</span></p>
            )}
            {studentInfo.sectionEnabled && (
              <p>Class: {metadata.className} Section: <span className="inline-block w-20 border-b border-ink">&nbsp;</span></p>
            )}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <SectionBlock
              key={section.id}
              section={section}
              startNumber={sectionStartNumbers[idx]}
              paperId={paperId}
              onUpdateSection={(updatedSection) => {
                const newSections = sections.map((s) =>
                  s.id === section.id ? updatedSection : s
                )
                setCompleted({ ...paper, sections: newSections })
              }}
            />
          ))}
        </div>

        {/* End of paper */}
        <p className="font-bold text-ink text-sm pt-2">End of Question Paper</p>

        {/* Answer key */}
        <AnswerKey sections={sections} />
      </div>
    </motion.div>
  )
}
