'use client'

import { useState } from 'react'
import { FileText, ChevronDown, ChevronUp, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, getScoreBgColor, truncateFilename } from '@/lib/utils'
import type { RetrievedChunk } from '@/lib/types'

interface SourceChunkProps {
  chunk: RetrievedChunk
  index: number
}

export function SourceChunk({ chunk, index }: SourceChunkProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = chunk.text.length > 200
  const displayText = expanded || !isLong ? chunk.text : `${chunk.text.slice(0, 200)}...`

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="rounded-lg border border-border bg-card p-3 space-y-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={13} className="text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {truncateFilename(chunk.filename, 28)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Hash size={10} />
            {chunk.chunk_index}
          </span>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums',
              getScoreBgColor(chunk.score),
            )}
          >
            {chunk.score.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Chunk text */}
      <p className="text-xs text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap break-words">
        {displayText}
      </p>

      {/* Expand/collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              Ver mais
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}
