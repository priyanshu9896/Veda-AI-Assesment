'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { GenerationTimeline } from '@/components/output/GenerationTimeline'
import { PaperView } from '@/components/output/PaperView'
import { PaperSkeleton } from '@/components/ui/Skeleton'
import { useGenerationStore } from '@/store'
import { useGenerationSocket } from '@/hooks/useGenerationSocket'
import { getAssignment, getJobStatus } from '@/services/api'

export default function AssignmentDetailPage() {
  const params = useParams()
  const assignmentId = params.id as string

  const [isFetching, setIsFetching] = useState(true)

  const { stage, paper, failureMessage, setStage, setCompleted, setFailed, setQueued, reset } =
    useGenerationStore()

  // Reset stale state from previous assignment
  useEffect(() => {
    reset()
  }, [assignmentId, reset])

  // Connect to socket for real-time updates
  useGenerationSocket(assignmentId)

  // On mount: check current assignment status (for page refresh / direct navigation)
  useEffect(() => {
    async function checkStatus() {
      if (!assignmentId) return

      try {
        const res = await getAssignment(assignmentId)
        if (!res.success || !res.data) {
          setIsFetching(false)
          return
        }

        const { assignment, paper: fetchedPaper, status } = res.data

        if (fetchedPaper && status === 'completed') {
          setCompleted(fetchedPaper)
          setIsFetching(false)
          return
        }

        if (status === 'failed') {
          setFailed('Generation failed. Please try again.')
          setIsFetching(false)
          return
        }

        // Still in progress — seed the store
        if (assignment.jobId) {
          setQueued(assignmentId, assignment.jobId)
        }

        setIsFetching(false)

        // Poll job status periodically to prevent socket race conditions
        if (status !== 'completed' && status !== 'failed') {
          const interval = setInterval(async () => {
            try {
              const pollRes = await getAssignment(assignmentId)
              if (pollRes.success && pollRes.data) {
                const pollStatus = pollRes.data.status
                if (pollStatus === 'completed') {
                  if (pollRes.data.paper) {
                    setCompleted(pollRes.data.paper)
                  } else {
                    setStage('completed', 100)
                  }
                  clearInterval(interval)
                } else if (pollStatus === 'failed') {
                  setFailed('Generation failed. Please try again.')
                  clearInterval(interval)
                } else if (pollRes.data.assignment.jobId) {
                  const jobRes = await getJobStatus(pollRes.data.assignment.jobId)
                  if (jobRes.success && jobRes.data) {
                    setStage(jobRes.data.stage, jobRes.data.progress)
                  }
                }
              }
            } catch {
              // ignore
            }
          }, 3000)

          return () => clearInterval(interval)
        }
      } catch {
        // Backend not running
        setIsFetching(false)
      }
    }

    const cleanup = checkStatus()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [assignmentId, setCompleted, setFailed, setQueued, setStage])

  const isGenerating = stage !== 'completed' && stage !== 'failed'

  const showPaper = !isFetching && !isGenerating && stage !== 'failed' && !!paper

  return (
    <AppShell
      breadcrumb={showPaper ? 'Create New' : 'Create Assignment'}
      titleHref={showPaper ? '/assignments/new' : undefined}
      headerIcon={
        showPaper ? (
          <Sparkles className="h-[16px] w-[16px] text-[#858585]" strokeWidth={2.5} />
        ) : (
          <div className="h-3 w-3 rounded-full bg-[#4caf50]" />
        )
      }
      showBack
    >
      <div className="px-4 lg:px-7 py-4 lg:py-6 max-w-full lg:max-w-[960px] mx-auto w-full">
        {isFetching ? (
          <PaperSkeleton />
        ) : isGenerating ? (
          <GenerationTimeline stage={stage} />
        ) : stage === 'failed' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 space-y-4"
          >
            <p className="text-lg font-bold text-ink">Generation failed</p>
            <p className="text-sm text-ink-muted">
              {failureMessage ?? 'Something went wrong. Please try again.'}
            </p>
            <Link
              href="/assignments/new"
              className="inline-flex items-center gap-2 bg-ink text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-ink/90 transition-colors mt-4"
            >
              Try Again
            </Link>
          </motion.div>
        ) : paper ? (
          <PaperView paper={paper} paperId={assignmentId} />
        ) : (
          <PaperSkeleton />
        )}
      </div>
    </AppShell>
  )
}
