import fs from 'fs'
import path from 'path'

/**
 * Extracts text content from uploaded files.
 * Supports: PDF, TXT, DOC, DOCX
 * Returns extracted text or empty string on failure.
 */
export async function extractTextFromFile(
  filePath: string,
  mimeType: string,
  originalName: string
): Promise<string> {
  try {
    const ext = path.extname(originalName).toLowerCase()

    // ── TXT ────────────────────────────────────────────────
    if (ext === '.txt' || mimeType === 'text/plain') {
      const content = fs.readFileSync(filePath, 'utf-8')
      return content.trim().slice(0, 15000) // Cap at 15k chars for prompt safety
    }

    // ── PDF ────────────────────────────────────────────────
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      try {
        const pdfParse = ((await import('pdf-parse')) as any).default || (await import('pdf-parse'))
        const dataBuffer = fs.readFileSync(filePath)
        const data = await pdfParse(dataBuffer)
        return (data.text || '').trim().slice(0, 15000)
      } catch (err) {
        console.error('[FileParser] PDF parse failed:', err)
        return ''
      }
    }

    // ── DOCX ───────────────────────────────────────────────
    if (
      ext === '.docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      try {
        const mammoth = await import('mammoth')
        const dataBuffer = fs.readFileSync(filePath)
        const result = await mammoth.extractRawText({ buffer: dataBuffer })
        return (result.value || '').trim().slice(0, 15000)
      } catch (err) {
        console.error('[FileParser] DOCX parse failed:', err)
        return ''
      }
    }

    // ── DOC (legacy .doc) ──────────────────────────────────
    if (
      ext === '.doc' ||
      mimeType === 'application/msword'
    ) {
      // mammoth can sometimes handle .doc files
      try {
        const mammoth = await import('mammoth')
        const dataBuffer = fs.readFileSync(filePath)
        const result = await mammoth.extractRawText({ buffer: dataBuffer })
        return (result.value || '').trim().slice(0, 15000)
      } catch (err) {
        console.error('[FileParser] DOC parse failed (legacy format):', err)
        return ''
      }
    }

    console.warn(`[FileParser] Unsupported file type: ${ext} (${mimeType})`)
    return ''
  } catch (err) {
    console.error('[FileParser] Extraction failed:', err)
    return ''
  }
}
