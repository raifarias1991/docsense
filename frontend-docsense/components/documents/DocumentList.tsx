'use client'

import { useEffect } from 'react'
import { Loader2, FileX } from 'lucide-react'
import { useDocumentStore } from '@/lib/store/documentStore'
import { DocumentCard } from './DocumentCard'

export function DocumentList() {
  const { documents, isLoading, fetchDocuments } = useDocumentStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  if (isLoading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border border-border mb-4">
          <FileX size={28} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum documento ainda</p>
        <p className="text-xs text-muted-foreground mt-1">
          Faça upload de um PDF ou TXT para começar
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 group">
      {documents.map((doc, index) => (
        <DocumentCard key={doc.id} document={doc} index={index} />
      ))}
    </div>
  )
}
