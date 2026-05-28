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
import { cn } from '@/lib/utils'

export default function AssignmentsPage() {
  const { assignments, isLoading, setAssignments, setLoading, setError } =
    useAssignmentStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true)
        const res = await getAssignments()
        setAssignments(res.data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [setAssignments, setLoading, setError])

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const isEmpty = !isLoading && assignments.length === 0
  const hasList = !isLoading && !isEmpty

  return (
    <AppShell breadcrumb="Assignment">
      <div
        className={cn(
          'max-w-full',
          hasList
            ? 'p-5 lg:p-7 lg:flex lg:flex-col lg:h-[calc(100vh-8.25rem)] lg:min-h-0 lg:overflow-hidden'
            : 'p-5 lg:p-7'
        )}
      >
        {/* Desktop page header */}
        {hasList && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex items-center gap-3 shrink-0 mb-5"
          >
            <div className="figma-green-dot">
              <div className="figma-green-dot-inner" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-bold text-ink leading-tight tracking-tight">
                Assignments
              </h1>
              <p className="text-[14px] text-[#858585] mt-0.5">
                Manage and create assignments for your classes.
              </p>
            </div>
          </motion.div>
        )}

        {/* Mobile page header */}
        {hasList && (
          <div className="flex lg:hidden items-center relative mb-4 shrink-0">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-ink z-10"
              onClick={() => window.history.back()}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h1 className="text-[17px] font-bold text-ink">Assignments</h1>
            </div>
          </div>
        )}

        {/* Filter + search */}
        {hasList && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="hidden lg:flex items-center shrink-0 bg-white rounded-full h-[64px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] px-6 mb-5"
            >
              <button
                type="button"
                className="flex items-center gap-2.5 h-full text-[15px] font-semibold text-ink hover:opacity-80 transition-opacity"
              >
                <Filter size={18} strokeWidth={2.5} />
                <span>Filter By</span>
              </button>
              <div className="flex-1" />
              <div className="relative h-[46px] w-[320px] flex items-center border border-[#e5e5e5] rounded-full bg-white ml-4">
                <Search
                  size={16}
                  strokeWidth={2.5}
                  className="absolute left-4 text-[#858585] pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search Assignment"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full pl-10 pr-4 text-[14px] bg-transparent focus:outline-none placeholder:text-[#858585] text-ink font-medium rounded-full"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex lg:hidden items-center gap-3 shrink-0 mb-5"
            >
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-[52px] px-5 rounded-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] text-[15px] font-semibold text-ink shrink-0"
              >
                <Filter size={18} strokeWidth={2.5} />
                <span>Filter</span>
              </button>
              <div className="relative flex-1 h-[52px] flex items-center rounded-full bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-[#e5e5e5] px-4">
                <Search
                  size={16}
                  strokeWidth={2.5}
                  className="text-[#858585] shrink-0 mr-2"
                />
                <input
                  type="text"
                  placeholder="Search Name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full text-[14px] bg-transparent focus:outline-none placeholder:text-[#858585] text-ink font-medium"
                />
              </div>
            </motion.div>
          </>
        )}

        {/* Content states */}
        {isLoading ? (
          <AssignmentListSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-muted text-sm">
            No assignments match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <>
            {/* Desktop: scrollable grid with bottom fade overlay in right column only */}
            <div className="hidden lg:flex lg:flex-1 lg:min-h-0 lg:relative lg:flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 pb-[120px]">
                  {filtered.map((assignment, index) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      index={index}
                    />
                  ))}
                </div>
              </div>

              {/* Fade + CTA overlay — bottom of right pane only, not viewport */}
              <div className="absolute bottom-0 left-0 right-0 z-10 h-[112px] pointer-events-none">
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#f5f5f5] from-[40%] via-[#f5f5f5]/80 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-auto">
                  <Link
                    href="/assignments/new"
                    className="inline-flex items-center justify-center gap-2.5 bg-[#1c1c1e] text-white rounded-full px-8 h-[52px] text-[15px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black active:scale-[0.98] transition-all duration-150"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Create Assignment
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile: stacked list + FAB */}
            <div className="lg:hidden space-y-5 pb-4">
              {filtered.map((assignment, index) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  index={index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile FAB */}
      {hasList && (
        <div className="lg:hidden fixed bottom-24 right-5 z-40">
          <button
            type="button"
            className="h-[56px] w-[56px] rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#ff6136] hover:bg-gray-50 active:scale-95 transition-all"
            onClick={() => {
              window.location.href = '/assignments/new'
            }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </AppShell>
  )
}
