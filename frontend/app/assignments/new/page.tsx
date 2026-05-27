'use client'
import { useState, forwardRef, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { UploadArea } from '@/components/forms/UploadArea'
import { QuestionTypeBuilder } from '@/components/forms/QuestionTypeBuilder'
import { createAssignment, uploadMaterial } from '@/services/api'
import { useGenerationStore, useAssignmentStore } from '@/store'
import type { QuestionTypeConfig } from '@/types'

// ── Zod Schemas ───────────────────────────────────────────────
const step1Schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(120),
  schoolName: z.string().min(2, 'School name required'),
  subject: z.string().min(1, 'Subject required'),
  className: z.string().min(1, 'Class name required'),
  estimatedDuration: z
    .number({ invalid_type_error: 'Duration is required' })
    .min(10, 'At least 10 minutes')
    .max(300),
})

const step2Schema = z.object({
  dueDate: z.string().min(1, 'Due date required'),
  questionTypes: z
    .array(
      z.object({
        type: z.string().min(1),
        count: z.number().min(1),
        marksPerQuestion: z.number().min(1),
      })
    )
    .min(1, 'Add at least one question type'),
  instructions: z.string().max(1000).optional(),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>

// ── Field helper ──────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[14px] font-medium text-[#1c1c1e]">{label}</label>
      {children}
      {error && <p className="text-[13px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ error, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        className={`w-full px-4 py-2.5 md:py-3.5 text-[14px] md:text-[15px] font-medium border border-surface-border md:border-[#e4e4e7] rounded-xl md:rounded-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 transition-shadow ${
          error ? 'border-red-500 md:ring-2 md:ring-red-500' : ''
        } ${props.className || ''}`}
      />
    )
  }
)
Input.displayName = 'Input'

function StepIndicator({ p1, p2 }: { p1: number; p2: number }) {
  return (
    <div className="flex items-center gap-3 md:gap-5 w-full">
      <div className="flex-1 h-1 md:h-1.5 rounded-full bg-[#e4e4e7] overflow-hidden relative">
        <motion.div 
          className="absolute left-0 top-0 bottom-0 bg-[#1c1c1e]" 
          initial={{ width: 0 }}
          animate={{ width: `${p1}%` }} 
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex-1 h-1 md:h-1.5 rounded-full bg-[#e4e4e7] overflow-hidden relative">
        <motion.div 
          className="absolute left-0 top-0 bottom-0 bg-[#1c1c1e]" 
          initial={{ width: 0 }}
          animate={{ width: `${p2}%` }} 
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function NewAssignmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const { setQueued } = useGenerationStore()
  const { addAssignment } = useAssignmentStore()

  // Step 1 form
  const {
    register: r1,
    handleSubmit: hs1,
    control: c1,
    formState: { errors: e1 },
  } = useForm<Step1Values>({ resolver: zodResolver(step1Schema) })

  // Step 2 form
  const {
    register: r2,
    handleSubmit: hs2,
    control: c2,
    setValue: setV2,
    formState: { errors: e2 },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      questionTypes: [
        { type: 'Multiple Choice Questions', count: 4, marksPerQuestion: 1 },
        { type: 'Short Questions', count: 3, marksPerQuestion: 2 },
        { type: 'Diagram/Graph-Based Questions', count: 5, marksPerQuestion: 5 },
        { type: 'Numerical Problems', count: 5, marksPerQuestion: 5 },
      ],
    },
  })

  // Calculate progress
  const s1 = useWatch({ control: c1 })
  const s2 = useWatch({ control: c2 })

  let p1 = 0
  if (s1.title && s1.title.length >= 2) p1 += 20
  if (s1.schoolName && s1.schoolName.length >= 2) p1 += 20
  if (s1.subject && s1.subject.length >= 1) p1 += 20
  if (s1.className && s1.className.length >= 1) p1 += 20
  if (s1.estimatedDuration && s1.estimatedDuration >= 10 && s1.estimatedDuration <= 300) p1 += 20

  let p2 = 0
  if (step === 2) {
    p1 = 100
    let validQ = false
    if (s2.questionTypes && s2.questionTypes.length > 0) {
      validQ = s2.questionTypes.every((q) => q.count >= 1 && q.marksPerQuestion >= 1)
    }
    if (validQ) p2 += 50
    if (s2.dueDate && s2.dueDate.trim().length >= 8) p2 += 50
  }

  const onStep1Submit = (data: Step1Values) => {
    setStep1Data(data)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onStep2Submit = async (data: Step2Values) => {
    if (!step1Data) return
    setSubmitting(true)

    try {
      let uploadedMaterial: { filename: string; type: string; fileId?: string } | undefined

      if (file) {
        try {
          const uploadRes = await uploadMaterial(file)
          if (uploadRes.success && uploadRes.data) {
            uploadedMaterial = {
              filename: uploadRes.data.filename,
              type: file.type,
              fileId: uploadRes.data.fileId,
            }
          }
        } catch {
          // Upload failed — continue without material
          uploadedMaterial = { filename: file.name, type: file.type }
        }
      }

      const res = await createAssignment({
        ...step1Data,
        dueDate: data.dueDate,
        questionTypes: data.questionTypes,
        instructions: data.instructions,
        uploadedMaterial,
      })

      if (res.success && res.data) {
        const { assignmentId, jobId } = res.data

        // Seed zustand with queued state
        setQueued(assignmentId, jobId)

        // Add optimistic assignment to list
        addAssignment({
          id: assignmentId,
          title: step1Data.title,
          schoolName: step1Data.schoolName,
          subject: step1Data.subject,
          className: step1Data.className,
          dueDate: data.dueDate,
          status: 'queued',
          questionCount: data.questionTypes.reduce((s, q) => s + q.count, 0),
          totalMarks: data.questionTypes.reduce((s, q) => s + q.count * q.marksPerQuestion, 0),
          createdAt: new Date().toISOString(),
          jobId,
        })

        router.push(`/assignments/${assignmentId}`)
      }
    } catch (err) {
      console.error(err)
      // Show inline error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell 
      breadcrumb="Create Assignment" 
      subtitle="Set up a new assignment for your students"
      headerIcon={<div className="h-3 w-3 rounded-full bg-[#82d682]" />}
      showBack
    >
      <div className="max-w-[800px] mx-auto px-2 md:px-4 py-6 md:py-8 space-y-6 md:space-y-8 w-full">
        {/* Step indicator */}
        <div className="w-full max-w-[800px] mx-auto pb-4 md:pb-6 px-2 md:px-0">
          <StepIndicator p1={p1} p2={p2} />
        </div>

        {/* Form card */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-8 space-y-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#e4e4e7] md:border-none"
            >
              <div>
                <h2 className="text-[20px] font-semibold text-[#1c1c1e]">Assignment Details</h2>
                <p className="text-[13px] text-[#A1A1AA] mt-1 mb-5 md:mb-6">Basic information about your assignment</p>
              </div>

              <Field label="Assignment Title" error={e1.title?.message}>
                <Input
                  {...r1('title')}
                  placeholder="e.g. Quiz on Electricity"
                  error={!!e1.title}
                />
              </Field>

              <Field label="School Name" error={e1.schoolName?.message}>
                <Input
                  {...r1('schoolName')}
                  placeholder="e.g. Delhi Public School, Bokaro"
                  error={!!e1.schoolName}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Subject" error={e1.subject?.message}>
                  <Input
                    {...r1('subject')}
                    placeholder="e.g. Science"
                    error={!!e1.subject}
                  />
                </Field>
                <Field label="Class / Grade" error={e1.className?.message}>
                  <Input
                    {...r1('className')}
                    placeholder="e.g. Class 8"
                    error={!!e1.className}
                  />
                </Field>
              </div>

              <Field label="Duration (minutes)" error={e1.estimatedDuration?.message}>
                <Input
                  {...r1('estimatedDuration', { valueAsNumber: true })}
                  type="number"
                  placeholder="e.g. 45"
                  min={10}
                  max={300}
                  error={!!e1.estimatedDuration}
                />
              </Field>

              <div className="flex justify-end pt-2">
                <Button
                  size="lg"
                  className="rounded-full h-[48px] px-8 w-full md:w-auto"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={hs1(onStep1Submit)}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={hs2(onStep2Submit)}
              className="space-y-5"
            >
              <div className="rounded-[24px] md:rounded-[32px] bg-white p-5 md:p-8 space-y-5 md:space-y-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#e4e4e7] md:border-none">
                <div>
                  <h2 className="text-[20px] font-semibold text-[#1c1c1e]">Assignment Details</h2>
                  <p className="text-[13px] text-[#A1A1AA] mt-1">Basic information about your assignment</p>
                </div>

                {/* Upload */}
                <div>
                  <UploadArea
                    file={file}
                    onFileSelect={setFile}
                    onClear={() => setFile(null)}
                  />
                </div>

                {/* Due Date */}
                <div>
                  <Field label="Due Date" error={e2.dueDate?.message}>
                    <div className="relative group flex items-center">
                      <Input
                        {...r2('dueDate')}
                        placeholder="DD-MM-YYYY"
                        error={!!e2.dueDate}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '')
                          if (val.length > 8) val = val.slice(0, 8)
                          let formatted = val
                          if (val.length > 4) {
                            formatted = `${val.slice(0, 2)}-${val.slice(2, 4)}-${val.slice(4)}`
                          } else if (val.length > 2) {
                            formatted = `${val.slice(0, 2)}-${val.slice(2)}`
                          }
                          setV2('dueDate', formatted, { shouldValidate: true })
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker()}
                        className="absolute right-0 inset-y-0 px-4 flex items-center justify-center cursor-pointer"
                        aria-label="Open Calendar"
                      >
                        <Calendar
                          size={18}
                          className="text-[#1c1c1e]"
                        />
                      </button>
                      <input
                        type="date"
                        ref={dateInputRef}
                        className="absolute bottom-0 right-4 w-0 h-0 opacity-0 pointer-events-none"
                        onChange={(e) => {
                          const val = e.target.value // YYYY-MM-DD
                          if (val) {
                            const [y, m, d] = val.split('-')
                            setV2('dueDate', `${d}-${m}-${y}`, { shouldValidate: true, shouldDirty: true })
                          }
                        }}
                      />
                    </div>
                  </Field>
                </div>

                {/* Question Types */}
                <div>
                  <Controller
                    control={c2}
                    name="questionTypes"
                    render={({ field }) => (
                      <QuestionTypeBuilder
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {e2.questionTypes && (
                    <p className="text-xs text-red-500 mt-1">{e2.questionTypes.message?.toString()}</p>
                  )}
                </div>

                {/* Additional instructions */}
                <div>
                  <Field
                    label="Additional Information (For better output)"
                    error={e2.instructions?.message}
                  >
                    <div className="relative">
                      <textarea
                        {...r2('instructions')}
                        rows={3}
                        placeholder="e.g. Generate a question paper for 3 hour exam duration with focus on Chapter 1–3..."
                        className="w-full px-4 py-3 md:py-3.5 text-[14px] font-medium border border-[#e4e4e7] md:border-dashed rounded-xl md:rounded-[16px] bg-[#fcfcfc] focus:outline-none focus:ring-2 focus:ring-ink/10 transition-shadow resize-none placeholder:font-normal placeholder:text-[#A1A1AA]"
                      />
                      <div className="absolute bottom-3 right-3 flex items-center justify-center text-[#A1A1AA] hover:text-[#1c1c1e] cursor-pointer transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      </div>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-4 pb-8 px-2 md:px-0 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-full h-[48px] px-8 bg-white border border-black/5 shadow-sm text-[#1c1c1e] flex-1 md:flex-none"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Previous
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full h-[48px] px-8 flex-1 md:flex-none"
                  loading={submitting}
                  rightIcon={!submitting ? <ArrowRight size={16} /> : undefined}
                >
                  {submitting ? 'Generating...' : 'Next'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
