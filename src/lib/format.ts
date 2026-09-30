import type { IncidentSeverity, PlatformName, RiskLevel } from './types'

export const RISK_CLASS: Record<RiskLevel, string> = {
  Normal: 'badge-normal',
  Medio: 'badge-medium',
  Alto: 'badge-high',
}

export const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  low: 'badge-normal',
  medium: 'badge-medium',
  high: 'badge-high',
}

export const PLATFORM_LABEL: Record<PlatformName, string> = {
  ChatGPT: 'ChatGPT',
  Claude: 'Claude',
  Gemini: 'Gemini',
  Grok: 'Grok',
  Copilot: 'Copilot',
  Perplexity: 'Perplexity',
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return '—'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours} h ${minutes} min`
  if (minutes > 0) return `${minutes} min`
  return `${total} s`
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return 'ahora mismo'
  if (seconds < 60) return `hace ${seconds} s`
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return formatDateTime(date)
}

/** Convierte `datetime-local` (sin zona) a ISO UTC para el backend. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString()
}

/** Formato para `datetime-local`: `YYYY-MM-DDTHH:mm` en hora local. */
export function isoToLocalInput(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
