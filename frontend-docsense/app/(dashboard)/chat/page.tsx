'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Trash2, Settings2, Cpu } from 'lucide-react'
import { useChatStore } from '@/lib/store/chatStore'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { QuerySettingsPanel } from '@/components/chat/QuerySettingsPanel'
import { Button } from '@/components/ui/button'

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearHistory, querySettings, updateQuerySettings } =
    useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(
    (question: string) => {
      sendMessage(question)
    },
    [sendMessage],
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface/30">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-muted-foreground" />
            <h1 className="text-sm font-medium text-foreground">Chat com Documentos</h1>
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2 gap-1.5"
            >
              <Trash2 size={12} />
              Limpar
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <div className="py-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSubmit={handleSend} isLoading={isLoading} />
      </div>

      {/* Settings panel (desktop) */}
      <QuerySettingsPanel
        settings={querySettings}
        onChange={updateQuerySettings}
      />
    </div>
  )
}

function EmptyState() {
  const suggestions = [
    'Qual é o resumo deste documento?',
    'Quais são os pontos principais?',
    'Explique o conceito de...',
    'Quais são as conclusões?',
  ]

  const { sendMessage } = useChatStore()

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Cpu size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground text-balance mb-2">
          Pronto para responder
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed text-balance mb-8">
          Faça perguntas sobre os documentos que você enviou. A IA busca os trechos mais
          relevantes e gera uma resposta contextualizada.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-left text-xs text-muted-foreground border border-border rounded-lg px-3 py-2.5 hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
