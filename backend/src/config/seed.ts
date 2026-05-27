import bcrypt from 'bcryptjs'
import { User } from '../models'

export async function seedUsers() {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10)
      await User.create({
        email: 'admin@vedaai.com',
        passwordHash: adminPassword,
        role: 'admin'
      })
      console.log('[Seed] Admin user created')
    }

    const demoCount = await User.countDocuments({ role: 'demo' })
    if (demoCount === 0) {
      const demoPassword = await bcrypt.hash('demo123', 10)
      await User.create({
        email: 'demo@vedaai.com',
        passwordHash: demoPassword,
        role: 'demo'
      })
      console.log('[Seed] Demo user created')
    }

    // Idempotent data migration: Assign old assignments to Admin
    const adminUser = await User.findOne({ role: 'admin' })
    if (adminUser) {
      const { Assignment } = await import('../models')
      const unassignedCount = await Assignment.countDocuments({
        $or: [{ userId: { $exists: false } }, { userId: null }]
      })
      
      if (unassignedCount > 0) {
        await Assignment.updateMany(
          { $or: [{ userId: { $exists: false } }, { userId: null }] },
          { $set: { userId: adminUser._id } }
        )
        console.log(`[Seed] Migrated ${unassignedCount} old assignments to Admin account.`)
      } else {
        console.log('[Seed] No migration required for old assignments.')
      }
    }

  } catch (error) {
    console.error('[Seed] Error seeding users:', error)
  }
}
