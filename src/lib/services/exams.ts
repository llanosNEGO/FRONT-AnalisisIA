import api from '../api'
import type { Exam, ExamInput } from '../types'

export async function apiGetExams(): Promise<Exam[]> {
  const { data } = await api.get<Exam[]>('/exams/')
  return data
}

export async function apiCreateExam(input: ExamInput): Promise<Exam> {
  const { data } = await api.post<Exam>('/exams/', input)
  return data
}
