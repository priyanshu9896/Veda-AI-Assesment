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
  // Extract topic from title (e.g. "Quiz on Photosynthesis" -> "Photosynthesis")
  const extractedTopic = opts.title.replace(/^(Quiz on|Test on|Revision on|Assignment on|Class Test on|Chapter \d+\s*[:-]?\s*)\s*/i, '').trim()
  const activeTopic = extractedTopic || opts.subject

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

### 1. ASSIGNMENT CONTEXT
- Title: ${opts.title}
- Target Class: ${opts.className}
- Subject: ${opts.subject}
- School: ${opts.schoolName}
- Duration: ${opts.estimatedDuration} minutes
- Total Questions: ${totalQuestions}
- Total Marks: ${totalMarks}

### 2. TOPIC CONTEXT
CRITICAL: The central topic of this assignment is "${activeTopic}".
Every single question MUST relate directly to "${activeTopic}". DO NOT generate generic ${opts.subject} questions (e.g. no random planets, gravity, or biology questions if they are outside this specific topic). If no other context is provided below, generate the paper entirely based on this topic for Class ${opts.className}.

### 3. UPLOADED MATERIAL CONTEXT
${opts.uploadedContent ? `The user has provided the following extracted file content. You MUST use this content meaningfully to influence question selection, topic focus, difficulty, and examples:\n\n${opts.uploadedContent}` : 'No file was uploaded.'}

### 4. ADDITIONAL INSTRUCTIONS
${opts.instructions ? `The teacher has provided these additional instructions. You MUST follow them strictly:\n\n${opts.instructions}` : 'No additional instructions provided.'}

### 5. QUESTION TYPE AND MARKS RULES
You must strictly generate the EXACT number of questions and sections requested below. Do NOT over-generate or under-generate.
${qTypeList}

MCQ Formatting Rule: If the question type is a Multiple Choice Question (MCQ), you MUST include exactly 4 options formatted clearly (e.g., A), B), C), D)) DIRECTLY INSIDE the question text. There must be exactly one correct answer.

### 6. OUTPUT FORMAT RULES
1. Mix difficulty levels: ~30% easy, ~50% medium, ~20% hard.
2. Answer keys must be concise but complete.
3. Include proper sectional instructions.
4. Evaluate your own Topic Adherence (0-100) before finalizing. 100 means no drift occurred.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "metadata": {
    "subject": "${opts.subject}",
    "className": "${opts.className}",
    "schoolName": "${opts.schoolName}",
    "totalQuestions": ${totalQuestions},
    "totalMarks": ${totalMarks},
    "estimatedDuration": ${opts.estimatedDuration},
    "difficultyDistribution": { "easy": <n>, "medium": <n>, "hard": <n> },
    "topicAdherenceScore": <Evaluate your own output from 0 to 100>
  },
  "studentInfo": {
    "nameEnabled": true,
    "rollEnabled": true,
    "sectionEnabled": true
  },
  "sections": [
    ${sectionSchemaExample}
  ],
  "aiMessage": "Certainly! Here is a customized Question Paper for your ${opts.subject} ${opts.className} class focused on ${activeTopic}:",
  "summary": { "generatedBy": "gemini", "version": "v1" }
}`
}
