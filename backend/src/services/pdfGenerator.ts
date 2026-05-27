import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { IPaper } from '../models'

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
      const qText = `${qNum}. [${q.difficulty.toUpperCase()}] ${q.text} [${q.marks} Mark${q.marks > 1 ? 's' : ''}]`
      drawText(qText, 10, font)
      currentY -= 10
      qNum++
    }
  }

  currentY -= 20
  drawText('End of Question Paper', 12, boldFont, rgb(0, 0, 0), 'center')

  // Answer Key
  const allAnswers: { number: number; text: string }[] = []
  let counter = 1
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.answerKey) {
        allAnswers.push({ number: counter, text: q.answerKey })
      }
      counter++
    }
  }

  if (allAnswers.length > 0) {
    page = pdfDoc.addPage([595.28, 841.89])
    currentY = height - margin
    drawText('Answer Key', 14, boldFont, rgb(0, 0, 0), 'center')
    currentY -= 20

    for (const ans of allAnswers) {
      drawText(`${ans.number}. ${ans.text}`, 10, font)
      currentY -= 10
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
