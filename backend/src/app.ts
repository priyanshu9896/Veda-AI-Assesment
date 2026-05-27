import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDB } from './config/db'
import { initSocket } from './sockets'
import { getGenerationQueue } from './queues/generation'
import { startGenerationWorker } from './workers/generationWorker'
import apiRouter from './routes'

const app = express()
const PORT = parseInt(process.env.PORT ?? '4000')
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3001'

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ts: new Date().toISOString(),
  })
})

// ── API routes ────────────────────────────────────────────────
app.use('/api/v1', apiRouter)

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
})

// ── Start server ──────────────────────────────────────────────
async function start() {
  // Connect DB
  await connectDB()

  // Create HTTP server (needed for Socket.io)
  const server = http.createServer(app)

  // Init Socket.io
  initSocket(server, CLIENT_ORIGIN)

  // Init BullMQ queue (optional — degrades gracefully)
  const queue = getGenerationQueue()
  if (queue) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
    startGenerationWorker(redisUrl)
  } else {
    console.warn('[App] Running without Redis queue — using inline generation fallback')
  }

  // Listen
  server.listen(PORT, () => {
    console.log(`[App] VedaAI backend running on http://localhost:${PORT}`)
    console.log(`[App] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'set ✓' : 'NOT SET (mock mode)'}`)
  })
}

start().catch(console.error)
