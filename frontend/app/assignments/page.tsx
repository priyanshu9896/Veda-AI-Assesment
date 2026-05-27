'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Filter, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/assignments/EmptyState'
import { AssignmentCard } from '@/components/assignments/AssignmentCard'
import { AssignmentListSkeleton } from '@/components/ui/Skeleton'
import { useAssignmentStore } from '@/store'
import { getAssignments } from '@/services/api'
import type { Assignment } from '@/types'

export default function AssignmentsPage() {
  const { assignments, isLoading, error, setAssignments, setLoading, setError } =
    useAssignmentStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getAssignments({ page: 1, limit: 50 })
        if (res.success && res.data) {
          setAssignments(res.data)
        }
      } catch {
        // Backend not running yet — use empty state
        setAssignments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [setAssignments, setLoading, setError])

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const isEmpty = !isLoading && assignments.length === 0

  return (
    <AppShell
      breadcrumb="Assignment"
      assignmentCount={assignments.length > 0 ? assignments.length : undefined}
    >
      {/* Page content */}
      <div className="p-5 lg:p-7 space-y-5 max-w-full">
        {/* Page header — only shown when there are assignments */}
        {!isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-ink">Assignments</h1>
              <p className="text-sm text-ink-muted">
                Manage and create assignments for your classes.
              </p>
            </div>
          </motion.div>
        )}

        {/* Filter + Search — only when there are assignments */}
        {!isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex items-center gap-3"
          >
            <button className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors">
              <Filter size={15} />
              <span>Filter By</span>
            </button>
            <div className="flex-1 relative max-w-xs ml-auto">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <input
                type="text"
                placeholder="Search Assignment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-surface-border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-subtle"
              />
            </div>
          </motion.div>
        )}

        {/* States */}
        {isLoading ? (
          <AssignmentListSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-muted text-sm">
            No assignments match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((assignment, index) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Assignment pill — visible when there are assignments (desktop) */}
      {!isEmpty && !isLoading && (
        <div className="hidden lg:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <Link
            href="/assignments/new"
            className="flex items-center gap-2 bg-ink text-white rounded-full px-6 py-3 text-sm font-medium hover:bg-ink/90 active:scale-[0.97] shadow-banner transition-all duration-150"
          >
            <Plus size={16} />
            Create Assignment
          </Link>
        </div>
      )}
    </AppShell>
  )
}
