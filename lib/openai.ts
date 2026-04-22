import OpenAI from 'openai'

// Lazily create the OpenAI client so it doesn't throw at module load when the key is missing
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'placeholder',
    })
  }
  return _openai
}

export { getOpenAI as openai }
