'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-16 min-h-[60vh]"
    >
      {/* Illustration */}
      <div className="relative w-48 h-44 mb-8">
        {/* Circular bg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-36 h-36 bg-gray-200/80 rounded-full" />
        </div>

        {/* Document with X */}
        <svg
          viewBox="0 0 192 176"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
        >
          {/* Background card (small) */}
          <rect x="108" y="32" width="60" height="40" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
          <circle cx="120" cy="44" r="3.5" fill="#d1d5db" />
          <rect x="128" y="42" width="28" height="4" rx="2" fill="#d1d5db" />

          {/* Main document */}
          <rect x="56" y="48" width="80" height="96" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
          <rect x="68" y="62" width="56" height="5" rx="2.5" fill="#111111" />
          <rect x="68" y="74" width="48" height="4" rx="2" fill="#d1d5db" />
          <rect x="68" y="85" width="52" height="4" rx="2" fill="#d1d5db" />
          <rect x="68" y="96" width="44" height="4" rx="2" fill="#d1d5db" />

          {/* Magnifying glass */}
          <circle cx="114" cy="110" r="26" fill="white" fillOpacity="0.7" stroke="#c4b5fd" strokeWidth="2" />
          <circle cx="110" cy="106" r="18" fill="#f3f4f6" stroke="#c4b5fd" strokeWidth="2" />
          {/* X mark inside */}
          <line x1="103" y1="99" x2="117" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="117" y1="99" x2="103" y2="113" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          {/* Handle */}
          <line x1="124" y1="120" x2="136" y2="132" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round" />

          {/* Sparkle */}
          <path d="M58 112 L60 104 L62 112 L70 114 L62 116 L60 124 L58 116 L50 114 Z" fill="#60a5fa" />

          {/* Pen/pencil decoration */}
          <path d="M68 60 C72 50 78 44 84 46" stroke="#111111" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Small dot */}
          <circle cx="138" cy="108" r="4" fill="#60a5fa" />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-xl font-bold text-ink mb-3 text-center">
        No assignments yet
      </h2>
      <p className="text-ink-muted text-sm text-center max-w-xs leading-relaxed mb-8">
        Create your first assignment to start collecting and grading student
        submissions. You can set up rubrics, define marking criteria, and let AI
        assist with grading.
      </p>

      {/* CTA */}
      <Link
        href="/assignments/new"
        className="inline-flex items-center gap-2 bg-ink text-white rounded-full px-7 py-3.5 text-sm font-medium hover:bg-ink/90 active:scale-[0.97] transition-all duration-150 shadow-sm"
      >
        <Plus size={16} />
        Create Your First Assignment
      </Link>
    </motion.div>
  )
}
