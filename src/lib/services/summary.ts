import api from '../api'
import type { Summary } from '../types'

export async function apiGetSummary(examId: number | null): Promise<Summary> {
  const { data } = await api.get<Summary>('/summary/', {
    params: examId ? { exam_id: examId } : undefined,
  })
  return data
}
