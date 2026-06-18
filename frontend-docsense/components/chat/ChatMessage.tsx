import { Cpu, User } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn, formatRelativeDate } from '@/lib/utils'
import { TokenCounter } from './TokenCounter'
import type { ChatMessage as ChatMessageType } from '@/lib/types'

interface ChatMessageProps {
  message: ChatMessageType
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-primary/20 border border-primary/30'
            : 'bg-surface border border-border',
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User size={14} className="text-primary" />
        ) : (
          <Cpu size={14} className="text-muted-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1.5 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-card border border-border text-foreground rounded-tl-sm',
          )}
        >
          {message.isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_code]:font-mono [&_code]:text-accent [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-3 [&_ul]:pl-4 [&_ol]:pl-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Token counter */}
        {!isUser && !message.isLoading && (message.model || message.prompt_tokens) && (
          <TokenCounter
            model={message.model}
            promptTokens={message.prompt_tokens}
            completionTokens={message.completion_tokens}
            className="px-1"
          />
        )}

        {/* Timestamp */}
        <time
          className="text-xs text-muted-foreground/60 px-1"
          dateTime={message.timestamp.toISOString()}
        >
          {formatRelativeDate(message.timestamp)}
        </time>
      </div>
    </motion.div>
  )
}
