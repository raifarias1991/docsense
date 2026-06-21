import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocumentStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: DocumentStatus
  className?: string
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; icon: React.ElementType; className: string; spin?: boolean }
> = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
  processing: {
    label: 'Processando',
    icon: Loader2,
    className: 'bg-warning/10 text-warning border-warning/20',
    spin: true,
  },
  ready: {
    label: 'Pronto',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  failed: {
    label: 'Falhou',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon size={11} className={cn(config.spin && 'animate-spin')} />
      {config.label}
    </span>
  )
}
