import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, Filter, Loader2, XCircle } from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { useLiveContext } from '../context/LiveContext'
import { formatDateTime, PLATFORM_LABEL, SEVERITY_CLASS } from '../lib/format'
import { apiGetIncidents, apiUpdateIncident, type IncidentFilters } from '../lib/services/incidents'
import type { Incident, IncidentSeverity, IncidentStatus } from '../lib/types'

const STATUS_CLASS: Record<IncidentStatus, string> = {
  open: 'badge-high',
  acknowledged: 'badge-medium',
  resolved: 'badge-normal',
  dismissed: 'badge-muted',
}

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'acknowledged', label: 'Revisando' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'dismissed', label: 'Descartado' },
]

const SEVERITIES: IncidentSeverity[] = ['high', 'medium', 'low']

export default function Incidents() {
  const { exams } = useExamContext()
  const { subscribeIncidents, status: liveStatus, advanceCursor } = useLiveContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<IncidentStatus>>(new Set(['open']))
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('')
  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState<number | ''>('')
  const [expanded, setExpanded] = useState<Incident | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const studentFilter = searchParams.get('student_id')

  const load = useCallback(async (targetPage: number) => {
    setIsLoading(true)
    const filters: IncidentFilters = {
      exam_id: examFilter === '' ? undefined : examFilter,
      student_id: studentFilter ?? undefined,
      status: [...selected],
      severity: severity === '' ? undefined : severity,
      search: search.trim() || undefined,
      page: targetPage,
    }
    try {
      const data = await apiGetIncidents(filters)
      setIncidents(data.results)
      setCount(data.count)
      advanceCursor('incident', Math.max(0, ...data.results.map((incident) => incident.id)))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los incidentes')
    } finally {
      setIsLoading(false)
    }
  }, [examFilter, severity, search, selected, studentFilter, advanceCursor])

  useEffect(() => {
    setPage(1)
    void load(1)
  }, [load])

  // Un incidente nuevo encabeza la lista sin recargar: el SSE ya lo trajo.
  useEffect(
    () =>
      subscribeIncidents((incident) => {
        setCount((value) => (value === null ? null : value + 1))
        setIncidents((current) =>
          current.some((item) => item.id === incident.id) ? current : [incident, ...current],
        )
      }),
    [subscribeIncidents],
  )

  const toggleStatus = (value: IncidentStatus) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next.size ? next : current
    })
  }

  const review = async (incident: Incident, nextStatus: IncidentStatus) => {
    setBusyId(incident.id)
    try {
      const updated = await apiUpdateIncident(incident.id, {
        status: nextStatus,
        resolution_note:
          nextStatus === 'resolved' || nextStatus === 'dismissed'
            ? `Marcado como ${nextStatus} desde el panel de incidentes`
            : '',
      })
      setIncidents((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setExpanded((current) => (current?.id === updated.id ? updated : current))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar el incidente')
    } finally {
      setBusyId(null)
    }
  }

  const totalPages = count === null ? 1 : Math.max(1, Math.ceil(count / 20))

  return (
    <div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Incidentes detectados</h2>
            <p className="muted">
              Se generan automáticamente al superar el umbral de riesgo o al usar varias
              plataformas. Revísalos y márcalos para que la evidencia siga acumulando.
            </p>
          </div>
          <span className={`live-pill live-${liveStatus}`}>
            <span className="live-dot" /> {liveStatus === 'live' ? 'Escuchando en vivo' : 'Sin tiempo real'}
          </span>
        </header>

        <div className="filters">
          <input
            type="search"
            placeholder="Buscar por estudiante o título"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={examFilter} onChange={(e) => setExamFilter(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todos los exámenes</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>{exam.name}</option>
            ))}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity | '')}>
            <option value="">Cualquier severidad</option>
            {SEVERITIES.map((value) => (
              <option key={value} value={value}>{value === 'high' ? 'Alta' : value === 'medium' ? 'Media' : 'Baja'}</option>
            ))}
          </select>
        </div>

        <div className="filter-chips">
          <span className="muted"><Filter size={13} /> Estado:</span>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip chip-toggle ${selected.has(option.value) ? 'chip-active' : ''}`}
              onClick={() => toggleStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
          {studentFilter && (
            <button
              type="button"
              className="chip chip-toggle chip-active"
              onClick={() => setSearchParams({})}
            >
              Estudiante #{studentFilter} <XCircle size={12} />
            </button>
          )}
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        <div className="incident-list">
          {incidents.map((incident) => (
            <article key={incident.id} className="incident-card">
              <header>
                <span className={`badge ${SEVERITY_CLASS[incident.severity]}`}>{incident.severity_label}</span>
                <span className={`badge ${STATUS_CLASS[incident.status]}`}>{incident.status_label}</span>
                <span className="chip">{incident.category_label}</span>
                <time className="muted">{formatDateTime(incident.last_seen_at)}</time>
              </header>
              <h3>{incident.title}</h3>
              <p className="incident-student">
                <strong>{incident.student_name}</strong>
                {incident.exam_name && <span className="muted"> · {incident.exam_name}</span>}
                {incident.session && (
                  <span className="muted"> · sesión #{incident.session}</span>
                )}
              </p>
              <div className="chips">
                {incident.platforms.map((platform) => (
                  <span key={platform} className="chip">{PLATFORM_LABEL[platform]}</span>
                ))}
                <span className="chip chip-score">Puntuación {incident.score}</span>
                <span className="chip">{incident.evidence_count} evidencia(s)</span>
              </div>

              {expanded?.id === incident.id && (
                <div className="incident-detail">
                  <p>{incident.detail}</p>
                  <dl>
                    <div><dt>Primera vez</dt><dd>{formatDateTime(incident.first_seen_at)}</dd></div>
                    <div><dt>Última vez</dt><dd>{formatDateTime(incident.last_seen_at)}</dd></div>
                    <div><dt>Revisado por</dt><dd>{incident.reviewed_by || '—'}</dd></div>
                    {incident.resolution_note && (
                      <div><dt>Nota de cierre</dt><dd>{incident.resolution_note}</dd></div>
                    )}
                  </dl>
                </div>
              )}

              <footer className="row-actions">
                <button
                  type="button" className="btn-ghost"
                  onClick={() => setExpanded(expanded?.id === incident.id ? null : incident)}
                >
                  <Eye size={14} /> {expanded?.id === incident.id ? 'Ocultar' : 'Evidencia'}
                </button>
                {incident.status === 'open' && (
                  <button
                    type="button" className="btn-ghost"
                    disabled={busyId === incident.id}
                    onClick={() => void review(incident, 'acknowledged')}
                  >
                    <Loader2 size={14} className={busyId === incident.id ? 'spin' : undefined} /> Marcar revisando
                  </button>
                )}
                {(incident.status === 'open' || incident.status === 'acknowledged') && (
                  <>
                    <button
                      type="button" className="btn-ghost"
                      disabled={busyId === incident.id}
                      onClick={() => void review(incident, 'resolved')}
                    >
                      <CheckCircle2 size={14} /> Resolver
                    </button>
                    <button
                      type="button" className="btn-ghost danger"
                      disabled={busyId === incident.id}
                      onClick={() => void review(incident, 'dismissed')}
                    >
                      <XCircle size={14} /> Descartar
                    </button>
                  </>
                )}
              </footer>
            </article>
          ))}

          {incidents.length === 0 && !isLoading && (
            <p className="empty">No hay incidentes con estos filtros.</p>
          )}
          {isLoading && (
            <p className="empty"><Loader2 size={16} className="spin" /> Cargando incidentes…</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span className="muted">Página {page} de {totalPages} · {count} incidentes</span>
            <button type="button" className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
