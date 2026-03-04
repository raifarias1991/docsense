'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { getRefreshToken } from '@/lib/api/client'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, isLoading } = useAuthStore()

  useEffect(() => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      initializeAuth()
    }
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
