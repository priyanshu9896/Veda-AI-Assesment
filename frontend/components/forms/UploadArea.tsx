'use client'
import { useCallback, useState } from 'react'
import { Upload, X, File, ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MAX_FILE_SIZE_MB, ACCEPTED_FILE_TYPES } from '@/constants'

interface UploadAreaProps {
  onFileSelect: (file: File) => void
  onClear: () => void
  file: File | null
  error?: string
}

export function UploadArea({ onFileSelect, onClear, file, error }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const handleFile = useCallback(
    (f: File) => {
      setInternalError(null)
      const accepted = Object.keys(ACCEPTED_FILE_TYPES)
      if (!accepted.includes(f.type) && !f.name.match(/\.(pdf|txt|png|jpe?g|doc|docx)$/i)) {
        setInternalError('Unsupported file type. Please upload PDF, TXT, DOC, DOCX, or Images.')
        return // ignore
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setInternalError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
        return // ignore size
      }
      onFileSelect(f)
    },
    [onFileSelect]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  if (file) {
    const isImage = file.type.startsWith('image/')
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-surface-border rounded-xl p-4 flex items-center gap-3 bg-gray-50"
      >
        <div className="w-10 h-10 rounded-lg bg-ink/10 flex items-center justify-center flex-shrink-0">
          {isImage ? (
            <ImageIcon size={18} className="text-ink-muted" />
          ) : (
            <File size={18} className="text-ink-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{file.name}</p>
          <p className="text-xs text-ink-muted">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-ink-muted transition-colors"
        >
          <X size={14} />
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border border-dashed rounded-[20px] py-5 md:py-6 px-6 flex flex-col items-center gap-4 transition-colors duration-150 cursor-pointer',
          dragging
            ? 'border-[#1c1c1e] bg-black/5'
            : 'border-[#d4d4d8] hover:border-black/30 hover:bg-black/[0.02]'
        )}
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#f4f4f5] flex items-center justify-center mb-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1c1c1e]">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
          </svg>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-[14px] text-[#1c1c1e]">
            Choose a file or <span className="font-bold">drag & drop it here</span>
          </p>
          <p className="text-[12px] text-[#a1a1aa]">
            PDF, TXT, DOC, DOCX, or Images up to {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
        <label className="mt-2 cursor-pointer">
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,image/*"
            className="sr-only"
            onChange={onInputChange}
          />
          <span className="inline-block px-5 py-2 text-[13px] font-semibold border border-black/[0.08] rounded-full bg-white hover:bg-gray-50 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#1c1c1e]">
            Browse Files
          </span>
        </label>
      </div>
      <p className="text-[13px] text-[#858585] mt-4 text-center">
        Upload images of your preferred document/image
      </p>
      {error && <p className="text-[13px] text-red-500 mt-2 text-center">{error}</p>}
    </div>
  )
}
