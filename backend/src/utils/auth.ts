import jwt from 'jsonwebtoken'
import { IUser } from '../models'

const JWT_SECRET = process.env.JWT_SECRET || 'veda-ai-super-secret-key-fallback'

export function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET)
}
