import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ApiError } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail já está cadastrado.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UPLOAD_TOO_LARGE: 'Arquivo muito grande. Limite máximo: 10MB.',
  UPLOAD_INVALID_TYPE: 'Tipo de arquivo inválido. Aceito: PDF e TXT.',
  GENERIC_ERROR: 'Algo deu errado. Tente novamente.',
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
} as const

export function parseApiError(error: unknown): string {
  if (!error || typeof error !== 'object') return ERROR_MESSAGES.GENERIC_ERROR
  const err = error as { response?: { data?: ApiError; status?: number } }
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  }
  if (err.response?.status === 401) return ERROR_MESSAGES.INVALID_CREDENTIALS
  if (err.response?.status === 422) return ERROR_MESSAGES.INVALID_CREDENTIALS
  return ERROR_MESSAGES.GENERIC_ERROR
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatRelativeDate(date: Date): string {
  try {
    if (!date || isNaN(date.getTime())) return '—'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'agora mesmo'
    if (diffMin < 60) return `há ${diffMin} min`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `há ${diffHours}h`
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function truncateFilename(filename: string, maxLength = 30): string {
  if (filename.length <= maxLength) return filename
  const ext = getFileExtension(filename)
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'))
  const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4)
  return `${truncated}...${ext}`
}

export function getScoreColor(score: number): string {
  if (score >= 0.7) return 'text-success'
  if (score >= 0.4) return 'text-warning'
  return 'text-muted-foreground'
}

export function getScoreBgColor(score: number): string {
  if (score >= 0.7) return 'bg-success/10 text-success border-success/20'
  if (score >= 0.4) return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-muted/50 text-muted-foreground border-border'
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}
