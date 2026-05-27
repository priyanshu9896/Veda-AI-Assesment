import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

export function initSocket(server: HTTPServer, clientOrigin: string): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [clientOrigin, 'http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  })

  const generationNs = io.of('/generation')

  generationNs.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id)

    socket.on('join', ({ assignmentId }: { assignmentId: string }) => {
      if (assignmentId) {
        socket.join(assignmentId)
        console.log(`[Socket] ${socket.id} joined room: ${assignmentId}`)
      }
    })

    socket.on('leave', ({ assignmentId }: { assignmentId: string }) => {
      socket.leave(assignmentId)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id)
    })
  })

  return io
}

export function emitToAssignment(
  assignmentId: string,
  event: string,
  payload: unknown
): void {
  if (!io) return
  io.of('/generation').to(assignmentId).emit(event, payload)
}
