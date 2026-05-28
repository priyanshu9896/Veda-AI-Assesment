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

  return (
    <AppShell
      breadcrumb="Assignment"
    >
      {/* Page content */}
      <div className="p-5 lg:p-7 space-y-5 max-w-full">
        {/* Desktop Page header — only shown when there are assignments */}
        {!isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex items-center gap-3"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4caf50]/15 shrink-0">
              <div className="h-3 w-3 rounded-full bg-[#4caf50]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[22px] font-bold text-ink leading-tight">Assignments</h1>
              <p className="text-[14px] text-[#858585] mt-0.5">
                Manage and create assignments for your classes.
              </p>
            </div>
          </motion.div>
        )}

        {/* Mobile Page header */}
        <div className="flex lg:hidden items-center relative mb-4">
          <button 
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-ink z-10"
            onClick={() => window.history.back()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-ink">Assignments</h1>
          </div>
        </div>

        {/* Filter + Search — only when there are assignments */}
        {!isEmpty && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="flex items-center bg-white rounded-full h-[64px] shadow-[0_2px_16px_rgba(0,0,0,0.03)] px-6"
          >
            {/* Filter Button */}
            <button className="flex items-center gap-2.5 h-full text-[15px] font-semibold text-ink hover:opacity-80 transition-opacity">
              <Filter size={18} strokeWidth={2.5} />
              <span>Filter By</span>
            </button>
            
            {/* Spacer */}
            <div className="flex-1" />

            {/* Search Input */}
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
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
              {filtered.map((assignment, index) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  index={index}
                />
              ))}
            </div>

            {/* Desktop Centered Button - Anchored in content flow */}
            <div className="hidden lg:flex justify-center w-full mt-10 mb-6">
              <Link
                href="/assignments/new"
                className="flex items-center justify-center gap-2.5 bg-[#1c1c1e] text-white rounded-[24px] px-8 h-[52px] text-[15px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black active:scale-[0.98] transition-all duration-150"
              >
                <Plus size={18} strokeWidth={2.5} />
                Create Assignment
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Buttons */}
      {!isLoading && (
        <>
          {/* Mobile FAB - always visible */}
          <div className="lg:hidden fixed bottom-24 right-5 z-40">
            <button
              className="h-[56px] w-[56px] rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] flex items-center justify-center text-[#ff6136] hover:bg-gray-50 active:scale-95 transition-all"
              onClick={() => window.location.href = '/assignments/new'}
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
    </AppShell>
  )
}
