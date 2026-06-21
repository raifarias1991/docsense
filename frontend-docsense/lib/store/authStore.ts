import { create } from 'zustand'
import { loginApi, registerApi, getMeApi, refreshTokenApi } from '@/lib/api/auth'
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
} from '@/lib/api/client'
import type { User, LoginRequest, RegisterRequest } from '@/lib/types'
import { parseApiError } from '@/lib/utils'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  initializeAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ─── Actions ─────────────────────────────────────────────────────────────────
  login: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const tokens = await loginApi(data)
      setAccessToken(tokens.access_token)
      setRefreshToken(tokens.refresh_token)

      const user = await getMeApi()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await registerApi(data)
      set({ isLoading: false })
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false })
      throw error
    }
  },

  logout: () => {
    clearTokens()
    set({ user: null, isAuthenticated: false, error: null })
  },

  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const user = await getMeApi()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  initializeAuth: async () => {
    // Ao inicializar, o access token está somente em memória e foi perdido.
    // Precisamos trocar o refresh token por novos tokens explicitamente
    // antes de chamar /me, em vez de depender do interceptor implicitamente.
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      // 1. Troca o refresh token por novos tokens
      const tokens = await refreshTokenApi(refreshToken)
      setAccessToken(tokens.access_token)
      setRefreshToken(tokens.refresh_token)

      // 2. Agora busca os dados do usuário com o novo access token
      const user = await getMeApi()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      // Refresh expirado ou inválido — limpa sessão
      clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
