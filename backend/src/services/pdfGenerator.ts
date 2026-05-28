import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { IPaper } from '../models'

// Helper to remove unsupported Unicode characters for pdf-lib StandardFonts
function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/…/g, '...')
    .replace(/Ω/g, 'Ohm')
    .replace(/μ/g, 'micro')
    .replace(/°/g, ' degrees')
    // Remove any remaining non-WinAnsi characters to prevent crashes
    .replace(/[^\x00-\xFF]/g, '')
}

export async function generatePdfBuffer(paper: IPaper): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
  
  let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  const margin = 50
  let currentY = height - margin

  const drawText = (text: string, size: number, currentFont: any, color = rgb(0, 0, 0), align: 'left' | 'center' = 'left') => {
    // Simple word wrap
    const words = text.split(' ')
    let line = ''
    for (const word of words) {
      const testLine = line + word + ' '
      const testWidth = currentFont.widthOfTextAtSize(testLine, size)
      if (testWidth > width - 2 * margin && line !== '') {
        const xPos = align === 'center' ? (width - currentFont.widthOfTextAtSize(line.trim(), size)) / 2 : margin
        page.drawText(line.trim(), { x: xPos, y: currentY, size, font: currentFont, color })
        currentY -= size + 4
        line = word + ' '
        if (currentY < margin) {
          page = pdfDoc.addPage([595.28, 841.89])
          currentY = height - margin
        }
      } else {
        line = testLine
      }
    }
    const xPos = align === 'center' ? (width - currentFont.widthOfTextAtSize(line.trim(), size)) / 2 : margin
    page.drawText(line.trim(), { x: xPos, y: currentY, size, font: currentFont, color })
    currentY -= size + 4
    if (currentY < margin) {
      page = pdfDoc.addPage([595.28, 841.89])
      currentY = height - margin
    }
  }

  const { metadata, studentInfo, sections } = paper

  // Header
  drawText(metadata.schoolName, 16, boldFont, rgb(0, 0, 0), 'center')
  currentY -= 10
  drawText(`Subject: ${metadata.subject}    Class: ${metadata.className}`, 12, boldFont, rgb(0, 0, 0), 'center')
  currentY -= 20

  // Meta row
  drawText(`Time Allowed: ${metadata.estimatedDuration} minutes`, 10, font)
  const maxMarksText = `Maximum Marks: ${metadata.totalMarks}`
  const maxMarksWidth = font.widthOfTextAtSize(maxMarksText, 10)
  page.drawText(maxMarksText, { x: width - margin - maxMarksWidth, y: currentY + 14, size: 10, font })
  
  page.drawLine({
    start: { x: margin, y: currentY + 5 },
    end: { x: width - margin, y: currentY + 5 },
    thickness: 1,
    color: rgb(0, 0, 0)
  })
  currentY -= 10

  // General Instructions
  drawText('All questions are compulsory unless stated otherwise.', 10, italicFont)
  currentY -= 10

  // Student Info
  if (studentInfo.nameEnabled) {
    drawText('Name: _________________________________', 10, font)
  }
  if (studentInfo.rollEnabled) {
    drawText('Roll Number: ___________________', 10, font)
  }
  if (studentInfo.sectionEnabled) {
    drawText(`Class: ${metadata.className}    Section: __________`, 10, font)
  }
  currentY -= 15

  // Sections
  let qNum = 1
  for (const section of sections) {
    currentY -= 10
    drawText(section.title, 12, boldFont, rgb(0, 0, 0), 'center')
    if (section.instruction) {
      currentY -= 5
      drawText(section.instruction, 10, italicFont, rgb(0.3, 0.3, 0.3))
    }
    currentY -= 10

    for (const q of section.questions) {
      // Clean out [Regenerated] markers for the final PDF
      const cleanText = q.text.replace(/\[Regenerated\]\s*/g, '').trim()
      const difficultyTag = `[${(q.difficulty || 'medium').toUpperCase()}]`
      
      const parts = cleanText.split(/(?=\n?[A-D]\))/)
      if (parts.length === 5) {
        // It's an MCQ with exactly 4 options! Format it as a 2x2 grid
        const qText = `${qNum}. ${difficultyTag} ${parts[0].trim()} [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`
        drawText(sanitizeText(qText), 10, font)
        currentY -= 5
        
        const optA = sanitizeText(parts[1].trim())
        const optB = sanitizeText(parts[2].trim())
        const optC = sanitizeText(parts[3].trim())
        const optD = sanitizeText(parts[4].trim())
        
        // Row 1
        page.drawText(optA, { x: margin + 20, y: currentY, size: 10, font })
        page.drawText(optB, { x: margin + 250, y: currentY, size: 10, font })
        currentY -= 14
        
        // Row 2
        page.drawText(optC, { x: margin + 20, y: currentY, size: 10, font })
        page.drawText(optD, { x: margin + 250, y: currentY, size: 10, font })
        currentY -= 10
      } else {
        const qText = `${qNum}. ${difficultyTag} ${cleanText} [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`
        drawText(sanitizeText(qText), 10, font)
        currentY -= 10
      }
      qNum++
    }
  }

  currentY -= 20
  drawText('End of Question Paper', 12, boldFont, rgb(0, 0, 0), 'center')

  // Add page numbers
  const pages = pdfDoc.getPages()
  pages.forEach((p, idx) => {
    const pageNumText = `Page ${idx + 1} of ${pages.length}`
    const textWidth = font.widthOfTextAtSize(pageNumText, 10)
    p.drawText(pageNumText, {
      x: (width - textWidth) / 2,
      y: 20,
      size: 10,
      font
    })
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export async function generateAnswerKeyPdfBuffer(paper: IPaper): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()
  const margin = 50
  let currentY = height - margin

  const drawText = (text: string, size: number, currentFont: any, color = rgb(0, 0, 0), align: 'left' | 'center' = 'left') => {
    const words = text.split(' ')
    let line = ''
    for (const word of words) {
      const testLine = line + word + ' '
      const testWidth = currentFont.widthOfTextAtSize(testLine, size)
      if (testWidth > width - 2 * margin && line !== '') {
        const xPos = align === 'center' ? (width - currentFont.widthOfTextAtSize(line.trim(), size)) / 2 : margin
        page.drawText(line.trim(), { x: xPos, y: currentY, size, font: currentFont, color })
        currentY -= size + 4
        line = word + ' '
        if (currentY < margin) {
          page = pdfDoc.addPage([595.28, 841.89])
          currentY = height - margin
        }
      } else {
        line = testLine
      }
    }
    const xPos = align === 'center' ? (width - currentFont.widthOfTextAtSize(line.trim(), size)) / 2 : margin
    page.drawText(line.trim(), { x: xPos, y: currentY, size, font: currentFont, color })
    currentY -= size + 4
    if (currentY < margin) {
      page = pdfDoc.addPage([595.28, 841.89])
      currentY = height - margin
    }
  }

  const { metadata, sections } = paper

  // Title
  drawText(`Answer key of Quiz - ${metadata.className} class`, 16, boldFont, rgb(0, 0, 0), 'center')
  currentY -= 10
  drawText(`Subject: ${metadata.subject}`, 12, boldFont, rgb(0, 0, 0), 'center')
  currentY -= 30

  // Answer Key
  const allAnswers: { number: number; text: string }[] = []
  let counter = 1
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.answerKey) {
        // Clean out [Regenerated] markers for the final PDF
        const cleanAnswer = q.answerKey.replace(/\[Regenerated\]\s*/g, '').trim()
        allAnswers.push({ number: counter, text: sanitizeText(cleanAnswer) })
      }
      counter++
    }
  }

  for (const ans of allAnswers) {
    drawText(`${ans.number}. ${ans.text}`, 10, font)
    currentY -= 10
  }

  // Add page numbers
  const answerPages = pdfDoc.getPages()
  answerPages.forEach((p, idx) => {
    const pageNumText = `Page ${idx + 1} of ${answerPages.length}`
    const textWidth = font.widthOfTextAtSize(pageNumText, 10)
    p.drawText(pageNumText, {
      x: (width - textWidth) / 2,
      y: 20,
      size: 10,
      font
    })
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
