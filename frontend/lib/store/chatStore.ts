import { create } from 'zustand'
import { sendQueryApi } from '@/lib/api/query'
import type { ChatMessage, QuerySettings } from '@/lib/types'
import { generateId, parseApiError } from '@/lib/utils'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  querySettings: QuerySettings
}

interface ChatActions {
  sendMessage: (question: string) => Promise<void>
  clearHistory: () => void
  updateQuerySettings: (settings: Partial<QuerySettings>) => void
  clearError: () => void
}

const DEFAULT_QUERY_SETTINGS: QuerySettings = {
  top_k: 5,
  score_threshold: 0.3,
  generate_answer: true,
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  messages: [],
  isLoading: false,
  error: null,
  querySettings: DEFAULT_QUERY_SETTINGS,

  // ─── Actions ─────────────────────────────────────────────────────────────────
  sendMessage: async (question) => {
    const { querySettings } = get()

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    // Add loading assistant message
    const loadingMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    set((state) => ({
      messages: [...state.messages, userMessage, loadingMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await sendQueryApi({
        question,
        top_k: querySettings.top_k,
        score_threshold: querySettings.score_threshold,
        generate_answer: querySettings.generate_answer,
      })

      const assistantMessage: ChatMessage = {
        id: loadingMessage.id,
        role: 'assistant',
        content: response.answer ?? 'Nenhuma resposta gerada. Tente reformular a pergunta.',
        chunks: response.chunks,
        model: response.model,
        prompt_tokens: response.prompt_tokens,
        completion_tokens: response.completion_tokens,
        timestamp: new Date(),
        isLoading: false,
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === loadingMessage.id ? assistantMessage : m,
        ),
        isLoading: false,
      }))
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: loadingMessage.id,
        role: 'assistant',
        content: parseApiError(error),
        timestamp: new Date(),
        isLoading: false,
      }

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === loadingMessage.id ? errorMessage : m,
        ),
        isLoading: false,
        error: parseApiError(error),
      }))
    }
  },

  clearHistory: () => set({ messages: [], error: null }),

  updateQuerySettings: (settings) =>
    set((state) => ({
      querySettings: { ...state.querySettings, ...settings },
    })),

  clearError: () => set({ error: null }),
}))
