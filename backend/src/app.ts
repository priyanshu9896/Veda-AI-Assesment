import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { connectDB } from './config/db'
import { initSocket } from './sockets'
import { getGenerationQueue, redisConnection } from './queues/generation'
import { startGenerationWorker } from './workers/generationWorker'
import apiRouter from './routes'
import { seedUsers } from './config/seed'

const app = express()
app.set('trust proxy', 1)
const PORT = parseInt(process.env.PORT ?? '4000')
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:3001'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

// ── Middleware ────────────────────────────────────────────────

// CORS — environment-aware
const corsOrigins = IS_PRODUCTION
  ? [CLIENT_ORIGIN]
  : [CLIENT_ORIGIN, 'http://localhost:3000', 'http://localhost:3001']

app.use(cors({
  origin: corsOrigins,
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(globalLimiter)

// Rate limiting — assignment creation (stricter)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many assignment creation requests. Please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/v1/assignments', (req, _res, next) => {
  if (req.method === 'POST') {
    return createLimiter(req, _res, next)
  }
  next()
})

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const redisStatus = redisConnection
    ? (redisConnection.status === 'ready' ? 'connected' : redisConnection.status)
    : 'not configured'

  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisStatus,
    ts: new Date().toISOString(),
  })
})

// ── API routes ────────────────────────────────────────────────
app.use('/api/v1', apiRouter)

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
})

// ── Graceful shutdown ─────────────────────────────────────────
let server: http.Server

function gracefulShutdown(signal: string) {
  console.log(`[App] ${signal} received — shutting down gracefully`)

  server?.close(() => {
    console.log('[App] HTTP server closed')
  })

  // Close Redis
  if (redisConnection) {
    redisConnection.disconnect()
    console.log('[App] Redis connection closed')
  }

  // Close MongoDB
  mongoose.connection.close().then(() => {
    console.log('[App] MongoDB connection closed')
    process.exit(0)
  }).catch(() => {
    process.exit(1)
  })

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[App] Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// ── Start server ──────────────────────────────────────────────
async function start() {
  // Connect DB
  await connectDB()

  // Seed Users
  await seedUsers()

  // Create HTTP server (needed for Socket.io)
  server = http.createServer(app)

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
    console.log(`[App] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'set ✓' : 'NOT SET'}`)
    console.log(`[App] OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'set ✓' : 'NOT SET'}`)
    const hasAi = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY
    if (!hasAi) console.log(`[App] AI generation will use MOCK MODE`)
  })
}

start().catch(console.error)
