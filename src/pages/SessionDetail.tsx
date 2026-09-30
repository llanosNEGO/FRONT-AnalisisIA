import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Radio } from 'lucide-react'
import { useLiveContext } from '../context/LiveContext'
import { formatDateTime, formatDuration, PLATFORM_LABEL, SEVERITY_CLASS } from '../lib/format'
import { apiGetSession, apiGetSessionEvents } from '../lib/services/sessions'
import type { Capture, ExamSessionDetail } from '../lib/types'

const PAGE_SIZE = 25

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  const { subscribeCaptures, status, advanceCursor } = useLiveContext()

  const [session, setSession] = useState<ExamSessionDetail | null>(null)
  const [events, setEvents] = useState<Capture[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Ids ya pintados: evita que una reconexión del SSE duplique un evento.
  const seenIds = useRef(new Set<number>())

  const load = useCallback(async (targetPage: number) => {
    if (!Number.isFinite(sessionId)) return
    setIsLoading(true)
    try {
      const [detail, eventPage] = await Promise.all([
        apiGetSession(sessionId),
        apiGetSessionEvents(sessionId, targetPage),
      ])
      setSession(detail)
      setEvents(eventPage.results)
      setCount(eventPage.count)
      seenIds.current = new Set(eventPage.results.map((event) => event.id))
      advanceCursor('capture', Math.max(0, ...eventPage.results.map((event) => event.id)))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la sesión')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, advanceCursor])

  useEffect(() => {
    void load(page)
  }, [load, page])

  // La sesión abierta se actualiza en vivo: si llega una captura de este
  // estudiante se recalculan los contadores sin esperar a recargar la página.
  useEffect(() => {
    if (session?.status !== 'active') {
      setIsLive(false)
      return
    }
    setIsLive(true)
    return subscribeCaptures((capture) => {
      if (capture.session !== sessionId || seenIds.current.has(capture.id)) return
      seenIds.current.add(capture.id)
      setEvents((current) => [capture, ...current])
      setCount((current) => current + 1)
      setSession((current) =>
        current
          ? {
              ...current,
              captures_count: current.captures_count + 1,
              last_seen_at: capture.timestamp,
            }
          : current,
      )
    })
  }, [session?.id, session?.status, sessionId, subscribeCaptures])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  if (!Number.isFinite(sessionId)) {
    return <p className="alert alert-error">Identificador de sesión no válido.</p>
  }

  if (isLoading && !session) return <p className="muted">Cargando sesión…</p>
  if (error && !session) return <p className="alert alert-error">{error}</p>
  if (!session) return null

  return (
    <div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <div>
            <Link className="btn-ghost" to="/sessions">
              <ArrowLeft size={14} /> Volver a sesiones
            </Link>
            <h2>Sesión #{session.id} · {session.student_name}</h2>
            <p className="muted">
              {session.exam_name} · dispositivo <code className="mono">{session.device_id}</code>
              {session.access_code && <> · código <code className="mono">{session.access_code}</code></>}
            </p>
          </div>
          <div className="session-state">
            <span className={`badge ${session.status === 'active' ? 'badge-normal' : 'badge-muted'}`}>
              {session.status === 'active' ? 'Activa' : 'Cerrada'}
            </span>
            {isLive && status === 'live' && (
              <span className="live-pill live-live">
                <Radio size={13} className="pulse" /> En vivo
              </span>
            )}
          </div>
        </header>

        {error && <p className="alert alert-error">{error}</p>}

        <div className="stat-grid">
          <div className="stat-card">
            <span>Inicio</span>
            <strong>{formatDateTime(session.started_at)}</strong>
          </div>
          <div className="stat-card">
            <span>{session.status === 'active' ? 'Última actividad' : 'Cierre'}</span>
            <strong>{formatDateTime(session.status === 'active' ? session.last_seen_at : session.ended_at)}</strong>
          </div>
          <div className="stat-card">
            <span>Duración</span>
            <strong>{formatDuration(session.duration_seconds)}</strong>
          </div>
          <div className="stat-card">
            <span>Capturas</span>
            <strong>{session.captures_count}</strong>
          </div>
          <div className="stat-card">
            <span>Incidentes</span>
            <strong>{session.incidents.length}</strong>
          </div>
          <div className="stat-card">
            <span>Plataformas</span>
            <strong>{session.platforms.length || '—'}</strong>
          </div>
        </div>

        <div className="chips">
          {session.platforms.map((platform) => (
            <span key={platform.name} className="chip">
              {PLATFORM_LABEL[platform.name]} · {platform.count}
            </span>
          ))}
        </div>

        {session.incidents.length > 0 && (
          <div className="incident-strip">
            <h3>Incidentes de esta sesión</h3>
            {session.incidents.map((incident) => (
              <div key={incident.id} className="incident-strip-item">
                <span className={`badge ${SEVERITY_CLASS[incident.severity]}`}>{incident.severity_label}</span>
                <strong>{incident.title}</strong>
                <span className="muted">{incident.evidence_count} evidencia(s)</span>
                <span className="muted">{formatDateTime(incident.first_seen_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Eventos de la sesión</h2>
            <p className="muted">{count} interacción(es) registrada(s), en orden cronológico</p>
          </div>
        </header>

        <div className="event-list">
          {events.map((event) => (
            <article key={event.id} className="event-card">
              <header>
                <span className="chip">{PLATFORM_LABEL[event.platform]}</span>
                <time className="muted">{formatDateTime(event.timestamp)}</time>
              </header>
              <div className="event-exchange">
                <div className="bubble prompt">
                  <span className="bubble-label">Prompt del estudiante</span>
                  <p>{event.prompt || <em className="muted">(vacío)</em>}</p>
                </div>
                <div className="bubble response">
                  <span className="bubble-label">Respuesta de la IA</span>
                  <p>{event.response || <em className="muted">(vacío)</em>}</p>
                </div>
              </div>
            </article>
          ))}
          {events.length === 0 && !isLoading && (
            <p className="empty">Esta sesión no tiene interacciones registradas.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span className="muted">Página {page} de {totalPages}</span>
            <button type="button" className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
