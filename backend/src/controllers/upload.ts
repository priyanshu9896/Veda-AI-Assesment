import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { extractTextFromFile } from '../services/fileParser'

const UPLOAD_DIR = path.join(__dirname, '../../uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Max size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIMES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx']

export async function uploadFile(req: Request, res: Response) {
  try {
    const file = (req as any).file
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      })
    }

    // Validate file type
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_MIMES.includes(file.mimetype)) {
      // Delete uploaded file
      fs.unlinkSync(file.path)
      return res.status(400).json({
        success: false,
        message: `Unsupported file type. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`,
      })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      fs.unlinkSync(file.path)
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
      })
    }

    // Extract text content
    let extractedText = ''
    try {
      extractedText = await extractTextFromFile(file.path, file.mimetype, file.originalname)
      if (extractedText && extractedText.length > 25000) {
        extractedText = extractedText.substring(0, 25000) + '\n...[Content truncated due to length limits]'
      }
    } catch (err) {
      console.warn('[Upload] Text extraction failed, continuing without content:', err)
    }

    const fileId = uuidv4()

    // Store extracted text alongside the file
    if (extractedText) {
      const textPath = path.join(UPLOAD_DIR, `${fileId}.extracted.txt`)
      fs.writeFileSync(textPath, extractedText, 'utf-8')
    }

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId,
        filename: file.originalname,
        extractedLength: extractedText.length,
      },
    })
  } catch (err) {
    console.error('[Upload] Error:', err)
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
    })
  }
}

/**
 * Reads previously extracted text for a given fileId.
 */
export function getExtractedText(fileId: string): string {
  try {
    const textPath = path.join(UPLOAD_DIR, `${fileId}.extracted.txt`)
    if (fs.existsSync(textPath)) {
      return fs.readFileSync(textPath, 'utf-8')
    }
  } catch {
    // ignore
  }
  return ''
}
