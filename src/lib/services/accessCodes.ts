import api from '../api'
import type { AccessCode, AccessCodeBatchInput, Paginated } from '../types'

export interface AccessCodeFilters {
  exam_id?: number | string | null
  status?: string
  page?: number
}

export async function apiGetAccessCodes(
  filters: AccessCodeFilters = {},
): Promise<Paginated<AccessCode>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  const { data } = await api.get<Paginated<AccessCode>>('/access-codes/', { params })
  return data
}

export async function apiCreateAccessCodes(input: AccessCodeBatchInput): Promise<AccessCode[]> {
  const { data } = await api.post<AccessCode[]>('/access-codes/', input)
  return data
}

export async function apiRevokeAccessCode(id: number): Promise<AccessCode> {
  const { data } = await api.post<AccessCode>(`/access-codes/${id}/revoke/`)
  return data
}
