import api from '../api'
import type { AuthSession } from '../types'

export async function apiLoginWithGoogle(credential: string): Promise<AuthSession> {
  const { data } = await api.post<AuthSession>('/auth/google/', { id_token: credential })
  return data
}
