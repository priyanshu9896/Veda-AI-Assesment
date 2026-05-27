'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIFFICULTY_DISPLAY } from '@/constants'
import { regenerateSection, getPdfUrl } from '@/services/api'
import type { GeneratedPaper, PaperSection, Question } from '@/types'
import { PieChart } from 'lucide-react'

// ── AI Message Banner ──────────────────────────────────────────
export function AIMessageBanner({
  message,
  paperId,
}: {
  message: string
  paperId: string
}) {
  return (
    <div className="bg-ink text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <p className="flex-1 text-sm leading-relaxed font-medium">{message}</p>
      <a
        href={getPdfUrl(paperId)}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 active:scale-[0.97]"
      >
        <Download size={15} />
        Download as PDF
      </a>
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
}: {
  question: Question
  number: number
}) {
  return (
    <li className="text-sm text-ink leading-relaxed">
      <span className="font-medium">{number}.</span>{' '}
      <DifficultyTag level={question.difficulty} />{' '}
      {question.text}{' '}
      <span className="text-ink-muted">[{question.marks} Mark{question.marks !== 1 ? 's' : ''}]</span>
    </li>
  )
}

// ── Section Block ─────────────────────────────────────────────
function SectionBlock({
  section,
  startNumber,
  paperId,
}: {
  section: PaperSection
  startNumber: number
  paperId: string
}) {
  const [regenerating, setRegenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>(section.questions)

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await regenerateSection(paperId, section.id)
      if (res.success && res.data) {
        const s = res.data.section as PaperSection
        setQuestions(s.questions)
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
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-ink text-center w-full">{section.title}</h3>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          title="Regenerate this section"
          className="ml-2 flex-shrink-0 text-ink-muted hover:text-ink disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Instruction */}
      {section.instruction && (
        <p className="text-sm text-ink-muted italic">{section.instruction}</p>
      )}

      {/* Questions */}
      <ol className="space-y-2.5 list-none">
        {questions.map((q, idx) => (
          <QuestionItem
            key={q.id}
            question={q}
            number={startNumber + idx}
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
            <span className="font-medium">{number}.</span> {text}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── Main Paper View ───────────────────────────────────────────
export function PaperView({
  paper,
  paperId,
}: {
  paper: GeneratedPaper
  paperId: string
}) {
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
      className="space-y-5"
    >
      {/* AI Banner */}
      {paper.aiMessage && (
        <AIMessageBanner message={paper.aiMessage} paperId={paperId} />
      )}

      {/* Question Analytics Block */}
      <div className="bg-white rounded-2xl shadow-card px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-full">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 text-brand-orange p-2 rounded-xl">
            <PieChart size={20} />
          </div>
          <div>
            <h3 className="font-bold text-ink text-sm">Question Analytics</h3>
            <p className="text-xs text-ink-muted">Difficulty Distribution</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xl font-black text-[#22c55e]">{metadata.difficultyDistribution?.easy ?? 0}</p>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Easy</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-[#f59e0b]">{metadata.difficultyDistribution?.medium ?? 0}</p>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Moderate</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-[#ef4444]">{metadata.difficultyDistribution?.hard ?? 0}</p>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Challenging</p>
          </div>
        </div>
      </div>

      {/* Paper body */}
      <div className="bg-white rounded-2xl shadow-card px-8 py-10 space-y-6 max-w-full">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-lg font-extrabold text-ink">{metadata.schoolName}</h1>
          <p className="font-bold text-ink">Subject: {metadata.subject}</p>
          <p className="font-bold text-ink">Class: {metadata.className}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-sm text-ink border-t border-b border-surface-border py-3">
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
