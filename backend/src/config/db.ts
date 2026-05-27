import mongoose from 'mongoose'

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/vedaai'
  try {
    await mongoose.connect(uri)
    console.log('[DB] MongoDB connected')
  } catch (err) {
    console.error('[DB] Connection failed:', err)
    // Do not exit — allow app to run with degraded mode
  }
}
