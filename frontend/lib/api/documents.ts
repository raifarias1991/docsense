import { apiClient } from './client'
import type { Document, UploadResponse } from '@/lib/types'

export async function getDocumentsApi(): Promise<Document[]> {
  const response = await apiClient.get<Document[]>('/api/v1/documents/')
  return response.data
}

export async function uploadDocumentApi(
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<UploadResponse>('/api/v1/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (event.total && onUploadProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onUploadProgress(percent)
      }
    },
  })
  return response.data
}
