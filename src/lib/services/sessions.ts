import api from '../api'
import type { Capture, ExamSession, ExamSessionDetail, Paginated, SessionStatus } from '../types'

export interface SessionFilters {
  exam_id?: number | string | null
  student_id?: number | string
  status?: SessionStatus
  page?: number
}

export async function apiGetSessions(filters: SessionFilters = {}): Promise<Paginated<ExamSession>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  const { data } = await api.get<Paginated<ExamSession>>('/sessions/', { params })
  return data
}

export async function apiGetSession(id: number): Promise<ExamSessionDetail> {
  const { data } = await api.get<ExamSessionDetail>(`/sessions/${id}/`)
  return data
}

export async function apiGetSessionEvents(
  id: number,
  page = 1,
): Promise<Paginated<Capture>> {
  const { data } = await api.get<Paginated<Capture>>(`/sessions/${id}/events/`, {
    params: { page },
  })
  return data
}
