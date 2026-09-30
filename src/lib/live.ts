/**
 * Cliente del flujo SSE del backend (`GET /api/stream/`).
 *
 * `EventSource` no admite cabeceras, así que el JWT viaja en la query string
 * (ver `api/views/stream.py`). Dos detalles que importan:
 *
 * 1. El cursor (`since_capture` / `since_incident`) se mantiene en el cliente y
 *    se manda al reconectar, para que un corte de red no repita el histórico.
 * 2. Se ignoran los eventos ya vistos: el servidor entrega como máximo
 *    `MAX_EVENTS_PER_TICK` por vuelta y una reconexión puede solaparse con una
 *    respuesta que aún estaba en vuelo.
 */

import type { Capture, Incident } from './types'

export type LiveStatus = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface LiveCallbacks {
  onCapture: (capture: Capture) => void
  onIncident: (incident: Incident) => void
  onStatus: (status: LiveStatus) => void
  onTokenExpired: () => void
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const MAX_RECONNECT_DELAY = 15_000
const MAX_ATTEMPTS = 6
const OFFLINE_RETRY_DELAY = 30_000
const SEEN_LIMIT = 2_000

interface Cursors {
  capture: number
  incident: number
}

function streamUrl(token: string, examId: number | null, cursors: Cursors): string {
  const params = new URLSearchParams({ token })
  if (examId !== null) params.set('exam_id', String(examId))
  if (cursors.capture) params.set('since_capture', String(cursors.capture))
  if (cursors.incident) params.set('since_incident', String(cursors.incident))
  const path = `${API_BASE.replace(/\/+$/, '')}/stream/?${params.toString()}`
  return new URL(path, window.location.origin).toString()
}

/** Set acotado de ids vistos, para descartar duplicados sin crecer sin límite. */
class SeenIds {
  private ids = new Set<number>()
  private order: number[] = []

  add(id: number): boolean {
    if (this.ids.has(id)) return false
    this.ids.add(id)
    this.order.push(id)
    if (this.order.length > SEEN_LIMIT) {
      const evicted = this.order.shift()
      if (evicted !== undefined) this.ids.delete(evicted)
    }
    return true
  }
}

export class LiveStream {
  private source: EventSource | null = null
  private attempt = 0
  private retryTimer: number | null = null
  private stopped = false
  private cursors: Cursors = { capture: 0, incident: 0 }
  private readonly seenCaptures = new SeenIds()
  private readonly seenIncidents = new SeenIds()
  private readonly token: string
  private readonly examId: number | null
  private readonly callbacks: LiveCallbacks

  constructor(token: string, examId: number | null, callbacks: LiveCallbacks) {
    this.token = token
    this.examId = examId
    this.callbacks = callbacks
  }

  /**
   * Sube el cursor sin esperar a un evento: cuando una vista carga su listado,
   * le dice al flujo «esto ya lo tengo, no me lo vuelvas a mandar». Así una
   * reconexión no repite el histórico que ya está pintado.
   */
  advance(kind: 'capture' | 'incident', maxId: number) {
    this.cursors[kind] = Math.max(this.cursors[kind], maxId)
  }

  start() {
    this.stopped = false
    this.connect()
  }

  stop() {
    this.stopped = true
    if (this.retryTimer !== null) {
      window.clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    this.source?.close()
    this.source = null
  }

  private connect() {
    if (this.stopped) return
    this.callbacks.onStatus(this.attempt === 0 ? 'connecting' : 'reconnecting')

    const source = new EventSource(streamUrl(this.token, this.examId, this.cursors))
    this.source = source

    source.addEventListener('ready', () => {
      this.attempt = 0
      this.callbacks.onStatus('live')
    })

    source.addEventListener('capture', (event) => {
      const capture = parse<Capture>(event)
      if (!capture || !this.seenCaptures.add(capture.id)) return
      this.cursors.capture = Math.max(this.cursors.capture, capture.id)
      this.callbacks.onStatus('live')
      this.callbacks.onCapture(capture)
    })

    source.addEventListener('incident', (event) => {
      const incident = parse<Incident>(event)
      if (!incident || !this.seenIncidents.add(incident.id)) return
      this.cursors.incident = Math.max(this.cursors.incident, incident.id)
      this.callbacks.onStatus('live')
      this.callbacks.onIncident(incident)
    })

    source.onerror = () => {
      source.close()
      if (this.stopped) return
      this.attempt += 1
      if (this.attempt > MAX_ATTEMPTS) {
        // El flujo no abre: antes de culpar al token se verifica contra la API.
        // Así un corte de red (o un 406 temporal del servidor) no expulsa al
        // docente del panel; solo se sale si la API confirma 401.
        this.callbacks.onStatus('offline')
        void this.verifyToken()
        return
      }
      const delay = Math.min(1_000 * 2 ** (this.attempt - 1), MAX_RECONNECT_DELAY)
      this.retryTimer = window.setTimeout(() => this.connect(), delay)
    }
  }

  /** Comprueba si el token sigue vivo y agenda el siguiente intento. */
  private async verifyToken() {
    if (this.stopped) return
    try {
      const response = await fetch(`${API_BASE.replace(/\/+$/, '')}/exams/`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (response.status === 401) {
        this.callbacks.onTokenExpired()
        return
      }
    } catch {
      // Sin red: se reintenta sin desloguear.
    }
    this.scheduleRetry(OFFLINE_RETRY_DELAY)
  }

  private scheduleRetry(delay: number) {
    if (this.stopped) return
    this.retryTimer = window.setTimeout(() => this.connect(), delay)
  }
}

function parse<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T
  } catch {
    console.warn('[live] Evento SSE con payload inválido:', event.data)
    return null
  }
}
