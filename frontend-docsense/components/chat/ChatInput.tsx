'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ChatInputProps {
  onSubmit: (question: string) => void
  isLoading: boolean
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    adjustHeight()
  }

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSubmit(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isLoading, onSubmit])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-3 p-4 border-t border-border bg-surface/50 backdrop-blur-sm">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta sobre seus documentos..."
          disabled={isLoading}
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground',
            'placeholder:text-muted-foreground transition-colors leading-relaxed',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[44px] max-h-[200px]',
          )}
          aria-label="Campo de pergunta"
        />
        <p className="absolute right-3 bottom-2.5 text-xs text-muted-foreground/50 pointer-events-none select-none hidden sm:block">
          Ctrl+Enter para enviar
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !value.trim()}
        size="icon"
        className="flex-shrink-0 h-11 w-11 rounded-xl shadow-lg shadow-primary/20"
        aria-label="Enviar pergunta"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </div>
  )
}
