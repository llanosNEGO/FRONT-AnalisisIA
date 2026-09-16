import api from '../api'
import type { Summary } from '../types'

export async function apiGetSummary(): Promise<Summary> {
  const { data } = await api.get<Summary>('/summary/')
  return data
}