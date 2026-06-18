import { create } from 'zustand'
import { loginApi, registerApi, getMeApi } from '@/lib/api/auth'
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
    // On app boot, check if there's a valid refresh token to restore session
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const user = await getMeApi()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
