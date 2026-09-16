import api from '../api'
import type { Session } from '../types'

export async function apiLoginWithGoogle(credential: string): Promise<Session> {
  const { data } = await api.post<Session>('/auth/google/', { id_token: credential })
  return data
}