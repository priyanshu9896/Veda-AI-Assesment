'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
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

  const { stage, paper, failureMessage, setStage, setCompleted, setFailed, setQueued } =
    useGenerationStore()

  // Connect to socket for real-time updates
  useGenerationSocket(assignmentId)

  // On mount: check current assignment status (for page refresh / direct navigation)
  useEffect(() => {
    async function checkStatus() {
      if (!assignmentId) return

      try {
        const res = await getAssignment(assignmentId)
        if (!res.success || !res.data) return

        const { assignment, paper: fetchedPaper, status } = res.data

        if (fetchedPaper && status === 'completed') {
          setCompleted(fetchedPaper)
          return
        }

        if (status === 'failed') {
          setFailed('Generation failed. Please try again.')
          return
        }

        // Still in progress — seed the store
        if (assignment.jobId) {
          setQueued(assignmentId, assignment.jobId)
        }

        // Optionally poll job status if socket is not connected
        if (assignment.jobId && status !== 'completed') {
          try {
            const jobRes = await getJobStatus(assignment.jobId)
            if (jobRes.success && jobRes.data) {
              const { stage: jobStage, progress } = jobRes.data
              setStage(jobStage, progress)
            }
          } catch {
            // socket will handle it
          }
        }
      } catch {
        // Backend not running — let socket handle
      }
    }

    checkStatus()
  }, [assignmentId, setCompleted, setFailed, setQueued, setStage])

  const isGenerating = stage !== 'completed' && stage !== 'failed'

  return (
    <AppShell breadcrumb="Create Assignment" showBack>
      {/* Top bar right action */}
      <div className="hidden lg:flex items-center justify-end px-7 pt-4">
        <Link
          href="/assignments/new"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          <Plus size={16} />
          Create New
        </Link>
      </div>

      <div className="px-4 lg:px-7 py-4 lg:py-6 max-w-3xl mx-auto">
        {isGenerating ? (
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
