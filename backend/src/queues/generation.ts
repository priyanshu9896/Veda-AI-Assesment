import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

// Exported so socket worker can reuse
export let redisConnection: IORedis | null = null

function getRedisConnection(): IORedis | null {
  if (redisConnection) return redisConnection
  try {
    const conn = new IORedis(redisUrl, { maxRetriesPerRequest: null })
    conn.on('connect', () => console.log('[Redis] Connected'))
    conn.on('error', (e) => console.error('[Redis] Error:', e.message))
    redisConnection = conn
    return conn
  } catch (err) {
    console.error('[Redis] Failed to connect:', err)
    return null
  }
}

let generationQueue: Queue | null = null

export function getGenerationQueue(): Queue | null {
  if (generationQueue) return generationQueue
  const conn = getRedisConnection()
  if (!conn) return null

  try {
    generationQueue = new Queue('generation', { connection: conn as any })
    console.log('[Queue] Generation queue initialized')
    return generationQueue
  } catch (err) {
    console.error('[Queue] Failed to initialize:', err)
    return null
  }
}
