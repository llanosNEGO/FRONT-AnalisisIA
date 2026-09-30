import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FileText, Loader2, ShieldAlert } from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { formatDateTime, PLATFORM_LABEL, RISK_CLASS, SEVERITY_CLASS } from '../lib/format'
import { apiGetStudentIncidents } from '../lib/services/incidents'
import { apiGetStudents } from '../lib/services/students'
import type { Student, StudentIncidentReport } from '../lib/types'

export default function Students() {
  const { selectedExamId, selectedExam } = useExamContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<StudentIncidentReport | null>(null)
  const [isReportLoading, setIsReportLoading] = useState(false)

  const selectedId = searchParams.get('student') ? Number(searchParams.get('student')) : null

  useEffect(() => {
    setIsLoading(true)
    apiGetStudents(selectedExamId ?? undefined)
      .then((data) => {
        setStudents(data)
        setError(null)
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los estudiantes'),
      )
      .finally(() => setIsLoading(false))
  }, [selectedExamId])

  // Sin selección explícita se abre el primer estudiante del examen.
  useEffect(() => {
    if (!isLoading && selectedId === null && students.length > 0) {
      setSearchParams({ student: String(students[0].id) }, { replace: true })
    }
  }, [isLoading, selectedId, students, setSearchParams])

  const loadReport = useCallback(async (studentId: number) => {
    setIsReportLoading(true)
    try {
      setReport(await apiGetStudentIncidents(studentId))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el reporte')
      setReport(null)
    } finally {
      setIsReportLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId === null) {
      setReport(null)
      return
    }
    void loadReport(selectedId)
  }, [selectedId, loadReport])

  return (
    <div className="students-layout">
      <section className="panel students-list">
        <header className="panel-header">
          <div>
            <h2>Estudiantes</h2>
            <p className="muted">{selectedExam?.name ?? 'Examen seleccionado'}</p>
          </div>
        </header>

        {isLoading && <p className="muted">Cargando…</p>}
        {error && <p className="alert alert-error">{error}</p>}

        <ul className="student-items">
          {students.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                className={`student-item ${selectedId === student.id ? 'active' : ''}`}
                onClick={() => setSearchParams({ student: String(student.id) })}
              >
                <span className={`risk-dot ${RISK_CLASS[student.risk]?.split(' ')[0] ?? 'normal'}`} />
                <span className="student-item-name">
                  <strong>{student.display_name}</strong>
                  <small>{student.external_id ?? student.device_id?.slice(0, 12) ?? 'sin identificación'}</small>
                </span>
                <span className="student-item-meta">
                  <b>{student.captures_count}</b>
                  <small>capturas</small>
                </span>
                {student.open_incidents > 0 && (
                  <span className="student-item-alert">
                    <ShieldAlert size={13} /> {student.open_incidents}
                  </span>
                )}
              </button>
            </li>
          ))}
          {students.length === 0 && !isLoading && <li className="empty">Ningún estudiante conectado.</li>}
        </ul>
      </section>

      <section className="panel students-report">
        <header className="panel-header">
          <div>
            <h2>
              <FileText size={16} /> Reporte de incidentes
            </h2>
            {report && <p className="muted">{report.student.display_name}</p>}
          </div>
          {report && (
            <Link className="btn-ghost" to={`/incidents?student_id=${report.student.id}`}>
              Ver en el listado
            </Link>
          )}
        </header>

        {isReportLoading && <p className="muted"><Loader2 size={14} className="spin" /> Cargando reporte…</p>}

        {!isReportLoading && !report && (
          <p className="empty">Selecciona un estudiante para ver su historial de incidentes.</p>
        )}

        {report && (
          <>
            <div className="stat-grid compact">
              <div className="stat-card"><span>Incidentes</span><strong>{report.totals.incidents}</strong></div>
              <div className="stat-card"><span>Abiertos</span><strong>{report.totals.open}</strong></div>
              <div className="stat-card"><span>Resueltos</span><strong>{report.totals.resolved}</strong></div>
              <div className="stat-card"><span>Sesiones</span><strong>{report.totals.sessions}</strong></div>
              <div className="stat-card"><span>Capturas</span><strong>{report.totals.captures}</strong></div>
            </div>

            <div className="incident-list">
              {report.incidents.results.map((incident) => (
                <article key={incident.id} className="incident-card">
                  <header>
                    <span className={`badge ${SEVERITY_CLASS[incident.severity]}`}>{incident.severity_label}</span>
                    <span className="chip">{incident.category_label}</span>
                    <time className="muted">{formatDateTime(incident.last_seen_at)}</time>
                  </header>
                  <h3>{incident.title}</h3>
                  <p className="muted">{incident.detail}</p>
                  <div className="chips">
                    {incident.platforms.map((platform) => (
                      <span key={platform} className="chip">{PLATFORM_LABEL[platform]}</span>
                    ))}
                    <span className="chip chip-score">Puntuación {incident.score}</span>
                  </div>
                  <footer className="row-actions">
                    <span className="muted">Estado: {incident.status_label}</span>
                    {incident.session && (
                      <Link className="btn-ghost" to={`/sessions/${incident.session}`}>
                        Ver sesión #{incident.session}
                      </Link>
                    )}
                  </footer>
                </article>
              ))}
              {report.incidents.results.length === 0 && (
                <p className="empty">Este estudiante no tiene incidentes registrados.</p>
              )}
            </div>

            {report.incidents.count > report.incidents.results.length && (
              <p className="muted">
                Mostrando {report.incidents.results.length} de {report.incidents.count} incidentes.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
