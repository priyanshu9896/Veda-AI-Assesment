'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MoreVertical, Eye, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/types'
import { deleteAssignment } from '@/services/api'
import { useAssignmentStore } from '@/store'

interface AssignmentCardProps {
  assignment: Assignment
  index?: number
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
}

export function AssignmentCard({ assignment, index = 0 }: AssignmentCardProps) {
  const router = useRouter()
  const { removeAssignment } = useAssignmentStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleView = () => {
    router.push(`/assignments/${assignment.id}`)
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    setMenuOpen(false)
    try {
      await deleteAssignment(assignment.id)
      removeAssignment(assignment.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'card p-5 cursor-pointer hover:shadow-card-hover transition-all duration-200 group relative',
        deleting && 'opacity-50 pointer-events-none'
      )}
      onClick={handleView}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-ink text-sm underline underline-offset-2 decoration-ink/30 hover:decoration-ink transition-colors line-clamp-2 flex-1 mr-2">
          {assignment.title}
        </h3>

        {/* ⋮ menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-ink-muted hover:text-ink transition-colors"
            aria-label="More actions"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-banner border border-surface-border py-1 min-w-[160px] animate-fade-in">
                <button
                  onClick={(e) => { e.stopPropagation(); handleView() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-gray-50 transition-colors"
                >
                  <Eye size={14} className="text-ink-muted" />
                  View Assignment
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>
          <span className="font-semibold text-ink">Assigned on</span>
          {' : '}
          {formatDate(assignment.createdAt)}
        </span>
        {assignment.dueDate && (
          <span>
            <span className="font-semibold text-ink">Due</span>
            {' : '}
            {formatDate(assignment.dueDate)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
