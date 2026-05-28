import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(__dirname, '../.env') })

import { buildGenerationPrompt } from '../src/prompts/generation'
import { getGroqClient, getOpenRouterClient } from '../src/config/ai'
import { PaperOutputSchema } from '../src/validators'

async function runTest(title: string, subject: string, instructions?: string, uploadedContent?: string) {
  console.log(`\n\n=== RUNNING TEST: ${title} ===`)
  const prompt = buildGenerationPrompt({
    title,
    schoolName: 'Test School',
    subject,
    className: '10th',
    estimatedDuration: 30,
    questionTypes: [{ type: 'MCQ', count: 2, marksPerQuestion: 1 }, { type: 'Short Question', count: 1, marksPerQuestion: 3 }],
    instructions,
    uploadedContent
  })

  console.log('--- PROMPT ---')
  console.log(prompt.substring(0, 1000) + '...\n')

  try {
    const client = getGroqClient()
    const result = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
    
    const text = result.choices[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    
    const parsed = JSON.parse(jsonMatch[0])
    console.log(`Score: ${parsed.metadata?.topicAdherenceScore}`)
    console.log('Questions:')
    parsed.sections.forEach((s: any) => {
      s.questions.forEach((q: any) => {
        console.log(` - ${q.text}`)
      })
    })
  } catch (err: any) {
    console.log('Error:', err.message)
    console.log('Trying OpenRouter...')
    try {
      const orClient = getOpenRouterClient()
      const result = await orClient.chat.completions.create({
        model: 'meta-llama/llama-3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
      const text = result.choices[0]?.message?.content || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON')
      const parsed = JSON.parse(jsonMatch[0])
      console.log(`Score: ${parsed.metadata?.topicAdherenceScore}`)
      console.log('Questions:')
      parsed.sections.forEach((s: any) => {
        s.questions.forEach((q: any) => {
          console.log(` - ${q.text}`)
        })
      })
    } catch (e: any) {
      console.log('Failed:', e.message)
    }
  }
}

async function main() {
  // Case 1: Topic and Class only (No file, no instructions)
  await runTest('Quiz on Photosynthesis', 'Science')
  
  // Case 2: With Uploaded File (Simulating file content about specific light reactions)
  await runTest(
    'Test on Photosynthesis', 
    'Science', 
    undefined, 
    'Photosynthesis consists of two main stages: the light-dependent reactions which take place in the thylakoid membrane, and the Calvin cycle which takes place in the stroma.'
  )
  
  // Case 3: With Extra Instructions
  await runTest(
    'Revision on Electricity', 
    'Physics', 
    'Make the MCQs focused exclusively on Ohm\'s law numericals. The short question must ask about resistance in parallel.', 
    undefined
  )
}

main()
