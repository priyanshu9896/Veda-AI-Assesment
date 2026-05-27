import OpenAI from 'openai'

const groqApiKey = process.env.GROQ_API_KEY ?? ''
const openRouterApiKey = process.env.OPENROUTER_API_KEY ?? ''

let groqClientInstance: OpenAI | null = null
let openRouterClientInstance: OpenAI | null = null

export function getGroqClient(): OpenAI {
  if (groqClientInstance) return groqClientInstance

  if (!groqApiKey) {
    console.warn('[AI] GROQ_API_KEY not set')
  }

  groqClientInstance = new OpenAI({
    apiKey: groqApiKey || 'mock-key',
    baseURL: 'https://api.groq.com/openai/v1',
  })
  
  return groqClientInstance
}

export function getOpenRouterClient(): OpenAI {
  if (openRouterClientInstance) return openRouterClientInstance

  if (!openRouterApiKey) {
    console.warn('[AI] OPENROUTER_API_KEY not set')
  }

  openRouterClientInstance = new OpenAI({
    apiKey: openRouterApiKey || 'mock-key',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://vedaai.example.com', // Optional, for OpenRouter rankings
      'X-Title': 'VedaAI Assessment', // Optional, for OpenRouter rankings
    }
  })
  
  return openRouterClientInstance
}
