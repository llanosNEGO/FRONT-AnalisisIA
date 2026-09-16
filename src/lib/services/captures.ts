import api from '../api'
import type { Capture, Paginated } from '../types'

export interface CaptureFilters {
  exam_id?: number | string
  student_id?: number | string
  platform?: string
  page?: number
}

export async function apiGetCaptures(filters: CaptureFilters = {}): Promise<Paginated<Capture>> {
  const { data } = await api.get<Paginated<Capture>>('/captures/list/', { params: filters })
  return data
}