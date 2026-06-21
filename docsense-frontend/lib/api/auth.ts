import { apiClient } from './client'
import type {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  RegisterResponse,
  User,
} from '@/lib/types'

export async function loginApi(data: LoginRequest): Promise<AuthTokens> {
  // FastAPI OAuth2 expects form data for /token, but our endpoint uses JSON
  const response = await apiClient.post<AuthTokens>('/api/v1/auth/login', data)
  return response.data
}

export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data)
  return response.data
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>('/api/v1/auth/refresh', {
    refresh_token: refreshToken,
  })
  return response.data
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>('/api/v1/users/me')
  return response.data
}
