interface QuestionTypeConfig {
  type: string
  count: number
  marksPerQuestion: number
}

interface PromptOptions {
  title: string
  schoolName: string
  subject: string
  className: string
  estimatedDuration: number
  questionTypes: QuestionTypeConfig[]
  instructions?: string
  uploadedContent?: string
}

export function buildGenerationPrompt(opts: PromptOptions): string {
  const totalQuestions = opts.questionTypes.reduce((s, q) => s + q.count, 0)
  const totalMarks = opts.questionTypes.reduce(
    (s, q) => s + q.count * q.marksPerQuestion,
    0
  )

  const qTypeList = opts.questionTypes
    .map(
      (q) =>
        `  - ${q.type}: ${q.count} questions × ${q.marksPerQuestion} mark${q.marksPerQuestion > 1 ? 's' : ''} each`
    )
    .join('\n')

  const sections = opts.questionTypes
    .map((q, idx) => ({
      id: `section_${idx + 1}`,
      title: `Section ${String.fromCharCode(65 + idx)}`,
      type: q.type,
      count: q.count,
      marks: q.marksPerQuestion,
    }))

  const sectionSchemaExample = sections
    .map(
      (s) => `{
      "id": "${s.id}",
      "title": "${s.title}",
      "instruction": "Attempt all questions. Each question carries ${s.marks} mark${s.marks > 1 ? 's' : ''}.",
      "questions": [
        ${Array.from({ length: Math.min(s.count, 2) }, (_, i) => `{
          "id": "${s.id}_q${i + 1}",
          "text": "<question text here>",
          "difficulty": "easy|medium|hard",
          "marks": ${s.marks},
          "answerKey": "<concise answer here>"
        }`).join(',\n        ')}
        ... (${s.count} questions total)
      ]
    }`
    )
    .join(',\n    ')

  return `You are an expert educational assessment creator. 
Create a complete, high-quality exam question paper and answer key for the following assignment.

ASSIGNMENT DETAILS:
- Title: ${opts.title}
- School: ${opts.schoolName}
- Subject: ${opts.subject}
- Class: ${opts.className}
- Duration: ${opts.estimatedDuration} minutes
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

QUESTION SECTIONS REQUIRED:
${qTypeList}

${opts.instructions ? `SPECIAL INSTRUCTIONS:\n${opts.instructions}\n` : ''}
${opts.uploadedContent ? `REFERENCE MATERIAL:\n${opts.uploadedContent}\n` : ''}

STRICT REQUIREMENTS:
1. Each question must be academically appropriate for ${opts.className} students
2. Mix difficulty levels: approximately 30% easy, 50% medium, 20% hard
3. Questions must be clear, unambiguous, and relevant to ${opts.subject}
4. Answer keys must be concise but complete
5. Include proper sectional instructions

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "metadata": {
    "subject": "${opts.subject}",
    "className": "${opts.className}",
    "schoolName": "${opts.schoolName}",
    "totalQuestions": ${totalQuestions},
    "totalMarks": ${totalMarks},
    "estimatedDuration": ${opts.estimatedDuration},
    "difficultyDistribution": { "easy": <n>, "medium": <n>, "hard": <n> }
  },
  "studentInfo": {
    "nameEnabled": true,
    "rollEnabled": true,
    "sectionEnabled": true
  },
  "sections": [
    ${sectionSchemaExample}
  ],
  "aiMessage": "Certainly! Here is a customized Question Paper for your ${opts.subject} ${opts.className} class:",
  "summary": { "generatedBy": "gemini", "version": "v1" }
}`
}
