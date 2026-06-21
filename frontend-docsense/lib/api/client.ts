import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const STORAGE_KEYS = {
  REFRESH_TOKEN: 'docsense:refresh_token',
} as const

// ─── Axios instance ───────────────────────────────────────────────────────────
// Usa URL relativa para que o proxy do Next.js (next.config.mjs) encaminhe ao backend.
// Isso evita CORS em produção (Netlify, Vercel etc.).

export const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// ─── Request interceptor: inject access token ─────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor: handle 401 + token refresh ────────────────────────

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeToRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeToRefresh((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')

        // Usa URL relativa — vai pelo proxy do Next.js
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        })

        const newAccessToken: string = data.access_token
        const newRefreshToken: string = data.refresh_token

        setAccessToken(newAccessToken)
        setRefreshToken(newRefreshToken)

        notifyRefreshSubscribers(newAccessToken)
        isRefreshing = false

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }

        return apiClient(originalRequest)
      } catch {
        isRefreshing = false
        refreshSubscribers = []
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

// ─── Token management ─────────────────────────────────────────────────────────
// Access token: somente em memória (não vai para localStorage)
// Refresh token: localStorage

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export function setRefreshToken(token: string | null): void {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  } else {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }
}

export function clearTokens(): void {
  _accessToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }
}
