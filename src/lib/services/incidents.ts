import api from '../api'
import type {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  Paginated,
  StudentIncidentReport,
} from '../types'

export interface IncidentFilters {
  exam_id?: number | string | null
  student_id?: number | string
  status?: IncidentStatus[]
  severity?: IncidentSeverity
  category?: IncidentCategory
  search?: string
  page?: number
}

export async function apiGetIncidents(filters: IncidentFilters = {}): Promise<Paginated<Incident>> {
  const { data } = await api.get<Paginated<Incident>>('/incidents/', {
    params: {
      ...filters,
      status: filters.status?.length ? filters.status.join(',') : undefined,
    },
  })
  return data
}

export async function apiUpdateIncident(
  id: number,
  input: { status?: IncidentStatus; resolution_note?: string },
): Promise<Incident> {
  const { data } = await api.patch<Incident>(`/incidents/${id}/`, input)
  return data
}

export async function apiGetStudentIncidents(
  studentId: number,
  page = 1,
): Promise<StudentIncidentReport> {
  const { data } = await api.get<StudentIncidentReport>(`/students/${studentId}/incidents/`, {
    params: { page },
  })
  return data
}
