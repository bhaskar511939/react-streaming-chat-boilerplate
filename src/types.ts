export interface Message {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  isLoading: boolean
  activity?: string   // current thinking / tool status text
}

export interface Model {
  id:    string
  label: string
}

export interface SSEEvent {
  type:    string
  stage:   string
  message: string
  tool?:   string
  [key: string]: unknown
}
