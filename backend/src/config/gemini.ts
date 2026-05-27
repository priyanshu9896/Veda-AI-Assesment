import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY ?? ''

let genAI: GoogleGenerativeAI | null = null

export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!apiKey) {
      console.warn('[Gemini] GEMINI_API_KEY not set — AI generation will use mock data')
    }
    genAI = new GoogleGenerativeAI(apiKey || 'placeholder')
  }
  return genAI
}
