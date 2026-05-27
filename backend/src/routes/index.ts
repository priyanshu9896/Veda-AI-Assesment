import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
  listAssignments,
  createAssignment,
  getAssignment,
  deleteAssignment,
  getJobStatus,
  regenerateSection,
  regenerateQuestion,
  getPaperPdf,
} from '../controllers/assignments'
import { uploadFile } from '../controllers/upload'
import authRoutes from './auth'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// ── Multer config ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const allowedExts = ['.pdf', '.txt', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Unsupported file type'))
    }
  },
})

// Auth
router.use('/auth', authRoutes)

// Assignments
router.get('/assignments', authMiddleware, listAssignments)
router.post('/assignments', authMiddleware, createAssignment)
router.get('/assignments/:id', authMiddleware, getAssignment)
router.delete('/assignments/:id', authMiddleware, deleteAssignment)

// Jobs
router.get('/jobs/:jobId', authMiddleware, getJobStatus)

// Papers
router.post('/papers/:id/regenerate', authMiddleware, regenerateSection)
router.post('/papers/:id/regenerate-question', authMiddleware, regenerateQuestion)
router.get('/papers/:id/pdf', authMiddleware, getPaperPdf)

// Upload
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' })
      }
      return res.status(400).json({ success: false, message: err.message })
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' })
    }
    next()
  })
}, uploadFile)

export default router

