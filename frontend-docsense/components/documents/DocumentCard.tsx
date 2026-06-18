import { FileText, FileType2, Layers, Calendar, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn, formatDate, truncateFilename, getFileExtension } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Document } from '@/lib/types'

interface DocumentCardProps {
  document: Document
  index: number
}

function FileIcon({ filename }: { filename: string }) {
  const ext = getFileExtension(filename)
  if (ext === 'pdf') {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex-shrink-0">
        <FileType2 size={20} className="text-red-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
      <FileText size={20} className="text-blue-400" />
    </div>
  )
}

export function DocumentCard({ document, index }: DocumentCardProps) {
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          'group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4',
          'hover:border-border/80 transition-all duration-200',
        )}
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          <FileIcon filename={document.filename} />
          <div className="flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm font-medium text-foreground truncate cursor-default">
                  {truncateFilename(document.filename)}
                </p>
              </TooltipTrigger>
              <TooltipContent>{document.filename}</TooltipContent>
            </Tooltip>
            <StatusBadge status={document.status} className="mt-1.5" />
          </div>

          {/* Delete button (UI only — no endpoint yet) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover documento"
                onClick={() => {
                  // TODO: implement delete when endpoint is available
                }}
              >
                <Trash2 size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remover (em breve)</TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom row: metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {document.chunk_count != null && document.status === 'ready' && (
            <span className="flex items-center gap-1">
              <Layers size={11} />
              {document.chunk_count} {document.chunk_count === 1 ? 'chunk' : 'chunks'}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(document.created_at)}
          </span>
        </div>

        {/* Error message tooltip */}
        {document.status === 'failed' && document.error_message && (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-destructive truncate cursor-help">
                Erro: {document.error_message}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{document.error_message}</TooltipContent>
          </Tooltip>
        )}
      </motion.div>
    </TooltipProvider>
  )
}
