import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DocSense — Plataforma RAG de IA',
  description:
    'Faça perguntas sobre seus documentos com inteligência artificial. Powered by LLaMA3 + pgvector.',
  keywords: ['RAG', 'IA', 'documentos', 'LLM', 'pgvector', 'inteligência artificial'],
  authors: [{ name: 'DocSense' }],
  openGraph: {
    title: 'DocSense — Plataforma RAG de IA',
    description: 'Faça perguntas sobre seus documentos com inteligência artificial.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
