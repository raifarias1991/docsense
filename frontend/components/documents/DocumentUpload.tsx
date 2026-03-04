'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, Loader2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatFileSize } from '@/lib/utils'
import { useDocumentStore } from '@/lib/store/documentStore'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'

const ACCEPTED_TYPES = ['application/pdf', 'text/plain']
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function DocumentUpload() {
  const { uploadDocument, isUploading, uploadProgress } = useDocumentStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      return 'Tipo de arquivo inválido. Aceito: PDF e TXT.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Máximo: ${formatFileSize(MAX_FILE_SIZE)}.`
    }
    return null
  }

  const handleFile = (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast({ title: 'Arquivo inválido', description: error, variant: 'destructive' })
      return
    }
    setSelectedFile(file)
    setUploadSuccess(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      await uploadDocument(selectedFile)
      setSelectedFile(null)
      setUploadSuccess(true)
      toast({ title: 'Upload concluído!', description: `${selectedFile.name} foi enviado com sucesso.` })
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !selectedFile && !isUploading && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-surface',
          (selectedFile || isUploading) && 'cursor-default',
        )}
        role="button"
        aria-label="Área de upload de documentos"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={handleInputChange}
          aria-label="Selecionar arquivo"
        />

        <AnimatePresence mode="wait">
          {uploadSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <CheckCircle size={36} className="text-success" />
              <p className="text-sm font-medium text-success">Upload realizado!</p>
            </motion.div>
          ) : selectedFile ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 w-full"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                <File size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              {!isUploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Remover arquivo"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface border border-border">
                <Upload size={22} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">PDF ou TXT — máximo 10MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {isUploading && (
          <div className="w-full space-y-1">
            <Progress value={uploadProgress} className="h-1.5" />
            <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {selectedFile && !isUploading && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Button onClick={handleUpload} className="w-full" size="lg">
            <Upload size={16} />
            Enviar documento
          </Button>
        </motion.div>
      )}

      {isUploading && (
        <Button className="w-full" size="lg" disabled>
          <Loader2 size={16} className="animate-spin" />
          Enviando...
        </Button>
      )}
    </div>
  )
}
