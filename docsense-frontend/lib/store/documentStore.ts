import { create } from 'zustand'
import { getDocumentsApi, uploadDocumentApi } from '@/lib/api/documents'
import type { Document } from '@/lib/types'
import { parseApiError } from '@/lib/utils'

interface DocumentState {
  documents: Document[]
  isLoading: boolean
  isUploading: boolean
  uploadProgress: number
  error: string | null
  pollingIntervalId: ReturnType<typeof setInterval> | null
}

interface DocumentActions {
  fetchDocuments: () => Promise<void>
  uploadDocument: (file: File) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  clearError: () => void
}

function hasActiveDocuments(documents: Document[]): boolean {
  return documents.some((d) => d.status === 'pending' || d.status === 'processing')
}

export const useDocumentStore = create<DocumentState & DocumentActions>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  documents: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  pollingIntervalId: null,

  // ─── Actions ─────────────────────────────────────────────────────────────────
  fetchDocuments: async () => {
    set({ isLoading: true, error: null })
    try {
      const documents = await getDocumentsApi()
      // Sort by created_at desc
      const sorted = [...documents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      set({ documents: sorted, isLoading: false })

      // Auto-start or stop polling based on document status
      if (hasActiveDocuments(sorted)) {
        get().startPolling()
      } else {
        get().stopPolling()
      }
    } catch (error) {
      set({ error: parseApiError(error), isLoading: false })
    }
  },

  uploadDocument: async (file) => {
    set({ isUploading: true, uploadProgress: 0, error: null })
    try {
      await uploadDocumentApi(file, (percent) => {
        set({ uploadProgress: percent })
      })
      set({ isUploading: false, uploadProgress: 0 })
      // Refresh list after upload
      await get().fetchDocuments()
    } catch (error) {
      set({ error: parseApiError(error), isUploading: false, uploadProgress: 0 })
      throw error
    }
  },

  startPolling: () => {
    const { pollingIntervalId } = get()
    if (pollingIntervalId) return // Already polling

    const intervalId = setInterval(async () => {
      try {
        const documents = await getDocumentsApi()
        const sorted = [...documents].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        set({ documents: sorted })

        if (!hasActiveDocuments(sorted)) {
          get().stopPolling()
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 2000)

    set({ pollingIntervalId: intervalId })
  },

  stopPolling: () => {
    const { pollingIntervalId } = get()
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId)
      set({ pollingIntervalId: null })
    }
  },

  clearError: () => set({ error: null }),
}))
