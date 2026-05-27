'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!token) {
      router.replace('/login')
    }
  }, [token, router])

  // Don't render until client-side hydration is complete
  if (!mounted) return null
  
  if (!token) return null

  return <>{children}</>
}
