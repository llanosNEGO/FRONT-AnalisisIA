import api from '../api'
import type { Exam } from '../types'

export async function apiGetExams(): Promise<Exam[]> {
  const { data } = await api.get<Exam[]>('/exams/')
  return data
}