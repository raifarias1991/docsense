import type { Metadata } from 'next'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Documentos — DocSense',
  description: 'Gerencie seus documentos na plataforma DocSense.',
}

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground text-balance">
          Gerenciar Documentos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload de PDFs e TXTs para indexação. Os documentos ficam disponíveis para consulta assim que o processamento for concluído.
        </p>
      </div>

      {/* Upload area */}
      <section aria-label="Upload de documentos">
        <DocumentUpload />
      </section>

      <Separator />

      {/* Document list */}
      <section aria-label="Lista de documentos">
        <h2 className="text-sm font-medium text-foreground mb-4">Seus documentos</h2>
        <DocumentList />
      </section>
    </div>
  )
}
