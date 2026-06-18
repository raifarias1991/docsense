import { apiClient } from './client'
import type { QueryRequest, QueryResponse } from '@/lib/types'

export async function sendQueryApi(request: QueryRequest): Promise<QueryResponse> {
  const response = await apiClient.post<QueryResponse>('/api/v1/query/', request)
  return response.data
}
