import { Router } from 'express'
import {
  listAssignments,
  createAssignment,
  getAssignment,
  deleteAssignment,
  getJobStatus,
  regenerateSection,
  getPaperPdf,
} from '../controllers/assignments'

const router = Router()

// Assignments
router.get('/assignments', listAssignments)
router.post('/assignments', createAssignment)
router.get('/assignments/:id', getAssignment)
router.delete('/assignments/:id', deleteAssignment)

// Jobs
router.get('/jobs/:jobId', getJobStatus)

// Papers
router.post('/papers/:id/regenerate', regenerateSection)
router.get('/papers/:id/pdf', getPaperPdf)

export default router
