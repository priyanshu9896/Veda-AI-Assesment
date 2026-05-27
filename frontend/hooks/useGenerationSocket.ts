'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useGenerationStore } from '@/store'
import { useRouter } from 'next/navigation'
import { getAssignment } from '@/services/api'
import { SOCKET_URL } from '@/constants'
import type {
  SocketQueuedPayload,
  SocketProgressPayload,
  SocketCompletedPayload,
  SocketFailedPayload,
} from '@/types'

export function useGenerationSocket(assignmentId: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const router = useRouter()
  const { setStage, setCompleted, setFailed } = useGenerationStore()

  useEffect(() => {
    if (!assignmentId) return

    const socket = io(`${SOCKET_URL}/generation`, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    // Join the room for this assignment
    socket.emit('join', { assignmentId })

    socket.on('generation:queued', (_payload: SocketQueuedPayload) => {
      setStage('queued', 0)
    })

    socket.on('generation:started', (_payload: SocketProgressPayload) => {
      setStage('generating', 20)
    })

    socket.on('generation:structuring', (_payload: SocketProgressPayload) => {
      setStage('structuring', 60)
    })

    socket.on('generation:validating', (_payload: SocketProgressPayload) => {
      setStage('validating', 80)
    })

    socket.on('generation:completed', async (payload: SocketCompletedPayload) => {
      // Fetch the full paper then set completed
      try {
        const res = await getAssignment(payload.assignmentId)
        if (res.success && res.data?.paper) {
          setCompleted(res.data.paper)
        }
      } catch {
        // Paper will be fetched via page load if needed
        setStage('completed', 100)
      }
    })

    socket.on('generation:failed', (payload: SocketFailedPayload) => {
      setFailed(payload.message ?? 'Generation failed. Please try again.')
    })

    socket.on('disconnect', () => {
      // Fallback: will poll via useEffect on output page
      console.warn('[Socket] Disconnected — polling fallback active')
    })

    return () => {
      socket.emit('leave', { assignmentId })
      socket.disconnect()
    }
  }, [assignmentId, setStage, setCompleted, setFailed, router])

  return socketRef
}
