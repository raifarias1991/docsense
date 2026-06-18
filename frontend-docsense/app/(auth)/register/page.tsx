import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Criar Conta — DocSense',
  description: 'Crie sua conta no DocSense para começar a conversar com seus documentos.',
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="w-full max-w-sm glass-strong rounded-2xl p-8 shadow-2xl shadow-black/40">
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
