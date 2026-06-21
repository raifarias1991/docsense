import { Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TokenCounterProps {
  model?: string | null
  promptTokens?: number | null
  completionTokens?: number | null
  className?: string
}

export function TokenCounter({
  model,
  promptTokens,
  completionTokens,
  className,
}: TokenCounterProps) {
  if (!model && !promptTokens && !completionTokens) return null

  const totalTokens =
    (promptTokens ?? 0) + (completionTokens ?? 0)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
        className,
      )}
    >
      {model && (
        <span className="flex items-center gap-1">
          <Cpu size={11} />
          <span className="font-mono">{model}</span>
        </span>
      )}
      {promptTokens != null && (
        <span>
          <span className="text-cyan/70">prompt:</span>{' '}
          <span className="font-mono">{promptTokens.toLocaleString('pt-BR')}</span>
        </span>
      )}
      {completionTokens != null && (
        <span>
          <span className="text-cyan/70">completion:</span>{' '}
          <span className="font-mono">{completionTokens.toLocaleString('pt-BR')}</span>
        </span>
      )}
      {totalTokens > 0 && (
        <span className="text-muted-foreground/70">
          total: <span className="font-mono">{totalTokens.toLocaleString('pt-BR')}</span>
        </span>
      )}
    </div>
  )
}
