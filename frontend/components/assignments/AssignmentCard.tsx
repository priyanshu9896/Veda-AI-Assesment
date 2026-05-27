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
        'bg-white rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#f0f0f0] cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200 group relative flex flex-col justify-between h-[142px]',
        deleting && 'opacity-50 pointer-events-none'
      )}
      onClick={handleView}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-bold text-ink text-[19px] tracking-tight underline decoration-[1.5px] underline-offset-[5px] decoration-ink hover:decoration-ink/70 transition-colors line-clamp-2 flex-1 mr-4 leading-snug">
          {assignment.title}
        </h3>

        {/* ⋮ menu */}
        <div className="relative flex-shrink-0 mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#858585] hover:text-ink transition-colors -mr-1"
            aria-label="More actions"
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-8 z-20 bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-black/[0.04] py-1 w-[130px] animate-fade-in text-[13px] font-medium overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); handleView() }}
                  className="w-full text-left px-3 py-1.5 text-ink hover:bg-[#f4f4f5] transition-colors"
                >
                  View Assignment
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete() }}
                  className="w-full text-left px-3 py-1.5 text-[#ff4141] hover:bg-[#ff4141]/5 transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-[12.5px] mt-auto">
        <span>
          <span className="font-bold text-ink">Assigned on</span>
          <span className="font-bold mx-1"> : </span>
          <span className="font-medium text-[#4c4c4c]">{formatDate(assignment.createdAt)}</span>
        </span>
        {assignment.dueDate && (
          <span>
            <span className="font-bold text-ink">Due</span>
            <span className="font-bold mx-1"> : </span>
            <span className="font-medium text-[#4c4c4c]">{formatDate(assignment.dueDate)}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}
