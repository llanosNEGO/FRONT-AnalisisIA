import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { formatDateTime, formatDuration, formatTime } from '../lib/format'
import { apiGetSessions, type SessionFilters } from '../lib/services/sessions'
import type { ExamSession } from '../lib/types'

export default function Sessions() {
  const { selectedExamId } = useExamContext()
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'active' | 'closed' | ''>('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (targetPage = page) => {
    setIsLoading(true)
    try {
      const filters: SessionFilters = {
        exam_id: selectedExamId,
        status: status === '' ? undefined : status,
        page: targetPage,
      }
      const data = await apiGetSessions(filters)
      const term = search.trim().toLowerCase()
      // El backend no filtra sesiones por nombre: el docente busca por texto
      // corto, así que el filtrado se hace sobre el listado paginado.
      setSessions(
        term
          ? data.results.filter(
              (session) =>
                session.student_name.toLowerCase().includes(term) ||
                session.device_id.toLowerCase().includes(term),
            )
          : data.results,
      )
      setCount(data.count)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar las sesiones')
    } finally {
      setIsLoading(false)
    }
  }, [selectedExamId, status, page, search])

  useEffect(() => {
    void load(page)
  }, [load, page])

  const totalPages = count === null ? 1 : Math.max(1, Math.ceil(count / 20))

  return (
    <div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Sesiones de examen</h2>
            <p className="muted">
              Cada sesión nace al canjear un código de acceso y termina cuando el estudiante
              cierra la extensión o el servidor la caduca por inactividad.
            </p>
          </div>
          <div className="filters">
            <input
              type="search"
              placeholder="Buscar estudiante o dispositivo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1) }}>
              <option value="">Activas y cerradas</option>
              <option value="active">Solo activas</option>
              <option value="closed">Solo cerradas</option>
            </select>
          </div>
        </header>

        {error && <p className="alert alert-error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Última actividad</th>
                <th>Duración</th>
                <th>Capturas</th>
                <th>Plataformas</th>
                <th aria-label="Detalle" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <strong>{session.student_name}</strong>
                    <span className="muted block">{session.device_id.slice(0, 12)}…</span>
                  </td>
                  <td>
                    <span className={`badge ${session.status === 'active' ? 'badge-normal' : 'badge-muted'}`}>
                      {session.status === 'active' ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>
                  <td>{formatDateTime(session.started_at)}</td>
                  <td>
                    {session.status === 'active' ? (
                      <span className="pulse">{formatTime(session.last_seen_at)}</span>
                    ) : (
                      formatDateTime(session.ended_at)
                    )}
                  </td>
                  <td>{formatDuration(session.duration_seconds)}</td>
                  <td>{session.captures_count}</td>
                  <td>
                    <div className="chips">
                      {session.platforms.map((platform) => (
                        <span key={platform.name} className="chip">{platform.name} · {platform.count}</span>
                      ))}
                      {session.platforms.length === 0 && <span className="muted">—</span>}
                    </div>
                  </td>
                  <td>
                    <Link className="btn-ghost" to={`/sessions/${session.id}`}>
                      <ExternalLink size={14} /> Detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && !isLoading && (
                <tr><td colSpan={8} className="empty">Ninguna sesión coincide con el filtro.</td></tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="empty">
                    <Loader2 size={16} className="spin" /> Cargando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span className="muted">Página {page} de {totalPages} · {count} sesiones</span>
            <button type="button" className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
