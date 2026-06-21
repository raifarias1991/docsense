// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface RegisterResponse {
  id: string
  email: string
  full_name: string
  is_active: boolean
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface Document {
  id: string
  filename: string
  status: DocumentStatus
  chunk_count: number | null
  created_at: string
  error_message?: string | null
}

export interface UploadResponse {
  id: string
  filename: string
  status: DocumentStatus
  chunk_count: number | null
}

// ─── Query / RAG ──────────────────────────────────────────────────────────────

export interface RetrievedChunk {
  text: string
  filename: string
  score: number
  chunk_index: number
}

export interface QueryRequest {
  question: string
  top_k: number
  score_threshold: number
  generate_answer: boolean
}

export interface QueryResponse {
  question: string
  answer: string | null
  chunks: RetrievedChunk[]
  total_found: number
  model: string | null
  prompt_tokens: number | null
  completion_tokens: number | null
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  chunks?: RetrievedChunk[]
  model?: string | null
  prompt_tokens?: number | null
  completion_tokens?: number | null
  timestamp: Date
  isLoading?: boolean
}

// ─── Query Settings ───────────────────────────────────────────────────────────

export interface QuerySettings {
  top_k: number
  score_threshold: number
  generate_answer: boolean
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string | { msg: string; type: string }[]
  status?: number
}
