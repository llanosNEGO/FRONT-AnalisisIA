import api from '../api'
import type { Student } from '../types'

export async function apiGetStudents(exam_id?: number | string): Promise<Student[]> {
  const { data } = await api.get<Student[]>('/students/', {
    params: exam_id ? { exam_id } : undefined,
  })
  return data
}