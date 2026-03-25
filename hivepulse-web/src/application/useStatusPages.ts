import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { apiClient } from '../infrastructure/apiClient'
import type { StatusPage, PublicStatusPageData, CreateStatusPageInput } from '../domain/statusPage'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const useStatusPages = (page = 1, limit = 20) =>
  useQuery<{ data: StatusPage[]; total: number; page: number; limit: number }>({
    queryKey: ['status-pages', page, limit],
    queryFn: () =>
      apiClient.get(`/status-pages?page=${page}&limit=${limit}`).then((r) => r.data),
  })

export const useStatusPage = (id: string) =>
  useQuery<StatusPage>({
    queryKey: ['status-pages', id],
    queryFn: () => apiClient.get(`/status-pages/${id}`).then((r) => r.data),
    enabled: !!id,
  })

export const usePublicStatusPage = (slug: string) =>
  useQuery<PublicStatusPageData>({
    queryKey: ['public-status-page', slug],
    queryFn: () => axios.get(`${BASE_URL}/s/${slug}`).then((r) => r.data),
    enabled: !!slug,
    retry: false,
  })

export const useCreateStatusPage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateStatusPageInput) =>
      apiClient.post('/status-pages', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status-pages'] }),
  })
}

export const useUpdateStatusPage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & CreateStatusPageInput) =>
      apiClient.put(`/status-pages/${id}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status-pages'] }),
  })
}

export const useDeleteStatusPage = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/status-pages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status-pages'] }),
  })
}
