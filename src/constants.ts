import type { Model } from './types'

export const MODELS: Model[] = [
  { id: 'gpt-4o',            label: 'GPT-4o'           },
  { id: 'gpt-4o-mini',       label: 'GPT-4o Mini'      },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet'    },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku'     },
  { id: 'gemini-2.5-flash',  label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro',    label: 'Gemini 2.5 Pro'   },
]

export const SUGGESTIONS: string[] = [
  'How does memory work in this AI agent?',
  'What tools does the agent have access to?',
  'How do I connect this to my own backend?',
  'Explain how real-time streaming works here',
]

/** Default backend URL — user can override in settings panel */
export const DEFAULT_API_URL = 'http://localhost:8000'
