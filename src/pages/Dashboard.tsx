import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  MoreHorizontal,
  Radio,
  UserRound,
  Users,
} from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { useLiveContext } from '../context/LiveContext'
import { apiGetSummary } from '../lib/services/summary'
import { apiGetStudents } from '../lib/services/students'
import { formatTime, relativeTime, RISK_CLASS } from '../lib/format'
import type { Capture, RiskLevel, Student, Summary } from '../lib/types'

const PLATFORM_COLORS: Record<string, string> = {
  ChatGPT: '#29c0ae',
  Gemini: '#5149ec',
  Claude: '#ff8a61',
  Grok: '#6d78d8',
  Copilot: '#7378ff',
  Perplexity: '#26b0a9',
  Otros: '#f19a60',
}

/** Cada cuánto se recalculan los agregados mientras llegan eventos en vivo. */
const AGGREGATE_DEBOUNCE_MS = 4_000
const FALLBACK_POLL_MS = 60_000

function RiskBadge({ value }: { value: RiskLevel }) {
  return (
    <span className={`risk-badge ${RISK_CLASS[value]?.split(' ')[0] ?? 'normal'}`}>
      <i />{value}
    </span>
  )
}

function AiMark({ name }: { name: string }) {
  const symbol = name === 'ChatGPT' ? '◉' : name === 'Gemini' ? '✦' : name === 'Claude' ? '✹' : name === 'Copilot' ? '▦' : name === 'Perplexity' ? '∞' : '•'
  return <span className={`ai-mark ${name.toLowerCase()}`}>{symbol}</span>
}

function buildTrendPaths(trend: Summary['trend']) {
  const width = 620
  const height = 148
  const baseline = 180
  const maxY = Math.max(200, ...trend.map((p) => p.count))
  const points = trend.map((p, i) => {
    const x = trend.length > 1 ? (i / (trend.length - 1)) * (width - 10) + 5 : width / 2
    const y = baseline - (p.count / maxY) * height
    return { x, y }
  })
  const line = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ')
  const area = `${line} L${width} ${baseline} L0 ${baseline} Z`
  return { line, area }
}

function TrendChart({ data }: { data: Summary['trend'] }) {
  const { line, area } = useMemo(() => buildTrendPaths(data), [data])
  if (!data.length) return <div className="p-4 text-center text-[10px] text-[#64748b]">Sin datos de uso en los últimos 3 horas</div>
  return <div className="trend-chart">
    <div className="chart-y"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
    <svg viewBox="0 0 620 190" preserveAspectRatio="none" aria-label="Uso de IA durante el examen">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5362ff" stopOpacity=".48" /><stop offset="1" stopColor="#5362ff" stopOpacity=".04" /></linearGradient></defs>
      <path className="chart-area" d={area} />
      <path className="chart-line" d={line} />
    </svg>
    <div className="chart-x">{data.map((p) => <span key={p.label}>{p.label}</span>)}</div>
  </div>
}

function Stats({ summary }: { summary: Summary }) {
  const { stats, incidents } = summary
  return <section className="stat-grid">
    <div className="stat-card"><div className="stat-icon blue"><Users /></div><div><span>Estudiantes</span><strong>{stats.total_students.toLocaleString()}</strong><small>{stats.active_sessions} sesión(es) activa(s)</small></div></div>
    <div className="stat-card"><div className="stat-icon red"><AlertTriangle /></div><div><span>Incidentes abiertos</span><strong>{incidents.open}</strong><small>{incidents.high_severity} de severidad alta</small></div></div>
    <div className="stat-card"><div className="stat-icon teal"><Check /></div><div><span>Sin actividad de IA</span><strong>{stats.no_ai_activity}</strong><small>del total</small></div></div>
    <div className="stat-card"><div className="stat-icon amber"><AlertTriangle /></div><div><span>Nivel de riesgo</span><strong>{stats.risk_pct}%</strong><small>usuarios con actividad</small></div></div>
  </section>
}

function UsageBreakdown({ platforms }: { platforms: Summary['platforms'] }) {
  const total = platforms.reduce((acc, p) => acc + p.count, 0)
  return <section className="panel ai-panel"><div className="panel-heading"><h2>IA utilizada</h2></div>
    {platforms.length === 0 ? (
      <div className="p-4 text-center text-[10px] text-[#64748b]">Sin capturas</div>
    ) : (
      <div className="donut-row"><div className="donut" style={{ background: buildDonut(platforms) }}><div><strong>{total}</strong><span>capturas</span></div></div>
        <div className="legend">
          {platforms.map((p) => (
            <div key={p.name}><AiMark name={p.name} /><span>{p.name}</span><b>{p.percentage}%</b></div>
          ))}
        </div>
      </div>
    )}
  </section>
}

function buildDonut(platforms: Summary['platforms']) {
  let angle = 0
  const total = platforms.reduce((acc, p) => acc + p.count, 0) || 1
  const stops = platforms.map((p) => {
    const from = angle
    const to = angle + (p.count / total) * 100
    angle = to
    return `${PLATFORM_COLORS[p.name] ?? PLATFORM_COLORS.Otros} ${from.toFixed(1)}% ${to.toFixed(1)}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

function RecentActivity({ captures, live }: { captures: Capture[]; live: boolean }) {
  return <section className="panel recent-panel"><div className="panel-heading"><h2><Activity className="pink-icon" size={16} />Actividad reciente</h2>
    {live && <span className="live-tag"><Radio size={12} className="pulse" /> en vivo</span>}
    <Link to="/sessions">Ver sesiones <ArrowUpRight size={12} /></Link></div>
    <div className="recent-list">
      {captures.length === 0 && <div className="py-4 text-center text-[10px] text-[#64748b]">Sin actividad reciente</div>}
      {captures.map((c) => (
        <div className="recent-row" key={c.id}>
          <AiMark name={c.platform} />
          <span>{c.student_name ?? `Dispositivo ${c.device_id?.slice(0, 3) ?? '?'}`}</span>
          <span className="recent-ai">{c.platform}</span>
          <time title={relativeTime(c.timestamp)}>{formatTime(c.timestamp)}</time>
        </div>
      ))}
    </div>
  </section>
}

function StudentTable({ students, onSelect, selected, examName }: { students: Student[], onSelect: (s: Student) => void, selected: Student | null, examName?: string }) {
  return <section className="panel students-panel"><div className="panel-heading"><h2><Users className="blue-icon" size={16} />Detalle de estudiantes</h2>
    <Link to="/students">Ver todos <ArrowUpRight size={12} /></Link></div>
    <div className="student-table"><div className="table-head"><span>Estado</span><span>Usuario</span><span>Examen</span><span>IA detectada</span><span>Última actividad</span><span>Riesgo</span></div>
      {students.length === 0 && <div className="py-4 text-center text-[10px] text-[#64748b]">Sin estudiantes registrados</div>}
      {students.map((s) => (
        <div className={`table-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => onSelect(s)} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s) } }}>
          {s.open_incidents > 0
            ? <span className="risk-badge alto"><i />{s.open_incidents} inc.</span>
            : <RiskBadge value={s.risk} />}
          <span>{s.display_name}</span>
          <span>{examName ?? '—'}</span>
          <span className="recent-ai">
            {(s.platforms?.length ? s.platforms : []).map((p) => (
              <span key={p.name} className="ai-chip" title={`${p.name}: ${p.count}`}><AiMark name={p.name} /></span>
            ))}
            {!s.platforms?.length && '—'}
          </span>
          <span title={relativeTime(s.last_activity)}>{formatTime(s.last_activity)}</span>
          <RiskBadge value={s.risk} />
        </div>
      ))}
    </div>
  </section>
}

function StudentDetail({ student, examName, reportHref }: { student: Student | null, examName?: string, reportHref: string }) {
  if (!student) return <section className="panel student-detail"><div className="p-4 text-center text-[10px] text-[#64748b]">Selecciona un estudiante</div></section>

  const platforms = student.platforms?.length
    ? student.platforms
    : student.main_platform
      ? [{ name: student.main_platform, count: student.captures_count }]
      : []
  const maxCount = Math.max(1, ...platforms.map((p) => p.count))

  return <section className="panel student-detail">
    <div className="student-title"><div className="profile-avatar"><UserRound /></div>
      <div><h3>{student.display_name} <RiskBadge value={student.risk} /></h3>
        <span>Examen: {examName ?? '—'}</span>
        <small>Última actividad: {formatTime(student.last_activity)}</small>
      </div>
    </div>
    <div className="activity-box"><h4>Actividad detectada</h4>
      {platforms.length === 0 ? (
        <div className="p-2 text-[8px] text-[#64748b]">Sin actividad de IA.</div>
      ) : platforms.map((p) => (
        <div className="activity-line" key={p.name}>
          <AiMark name={p.name} /><span>{p.name}</span>
          <i><b style={{ width: `${Math.round((p.count / maxCount) * 100)}%`, background: PLATFORM_COLORS[p.name] ?? '#2fc5b5' }} /></i>
          <small>{p.count} eventos</small>
        </div>
      ))}
    </div>
    <div className="summary"><h4>Resumen</h4>
      <div>
        <span><small>Actividad IA detectada</small><b>{student.captures_count} capturas</b></span>
        <span><small>Sesiones</small><b>{student.sessions_count}</b></span>
        <span><small>Incidentes abiertos</small><b>{student.open_incidents}</b></span>
        <span><small>Herramienta principal</small><b>{student.main_platform ?? '—'}</b></span>
      </div>
    </div>
    <Link className="btn-ghost report-link" to={reportHref}>Ver reporte de incidentes <ArrowUpRight size={13} /></Link>
  </section>
}

export default function Dashboard() {
  const { selectedExam, selectedExamId } = useExamContext()
  const { status: liveStatus, subscribeCaptures, lastCapture, advanceCursor } = useLiveContext()

  const [summary, setSummary] = useState<Summary | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const examName = selectedExam?.name

  const refresh = useCallback(
    async (targetExamId: number | null) => {
      setError(null)
      try {
        const [summaryData, studentsData] = await Promise.all([
          apiGetSummary(targetExamId),
          apiGetStudents(targetExamId ?? undefined),
        ])
        setSummary(summaryData)
        setStudents(studentsData)
        // Lo que ya está pintado no debe repetirse al reconectar el SSE.
        advanceCursor('capture', Math.max(0, ...summaryData.recent.map((capture) => capture.id)))
        setSelected((prev) =>
          prev && studentsData.some((s) => s.id === prev.id) ? prev : studentsData[0] ?? null,
        )
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Error al cargar el dashboard')
      } finally {
        setLoading(false)
      }
    },
    [advanceCursor],
  )

  useEffect(() => {
    setLoading(true)
    void refresh(selectedExamId)
  }, [refresh, selectedExamId])

  // Tiempo real: la actividad se pinta al instante y los agregados se
  // recalculan con un debounce para no golpear la API en cada captura.
  const timer = useRef<number | null>(null)
  const scheduleRefresh = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void refresh(selectedExamId), AGGREGATE_DEBOUNCE_MS)
  }, [refresh, selectedExamId])

  useEffect(() => {
    const unsubscribe = subscribeCaptures((capture) => {
      setSummary((current) =>
        current ? { ...current, recent: [capture, ...current.recent].slice(0, 20) } : current,
      )
      scheduleRefresh()
    })
    return unsubscribe
  }, [subscribeCaptures, scheduleRefresh])

  // Red de seguridad: si el SSE se cae, los datos siguen actualizándose.
  useEffect(() => {
    const interval = window.setInterval(() => void refresh(selectedExamId), FALLBACK_POLL_MS)
    return () => window.clearInterval(interval)
  }, [refresh, selectedExamId])

  return <div className="dashboard-page">
    <header className="page-header">
      <div><h1>Dashboard</h1><p>Monitorea el uso de inteligencia artificial durante los exámenes</p></div>
      <div className="header-actions">
        <div className="exam-select"><span><small>Examen actual</small>{selectedExam?.name ?? '—'}</span><ChevronDown size={13} /></div>
        <div className={`live-pill live-${liveStatus}`}><span className="live-dot" />{liveStatus === 'live' ? 'En vivo' : liveStatus}</div>
        <div className="date">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}<strong>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        <div className="avatar"><UserRound size={16} /></div>
      </div>
    </header>

    {loading && !summary ? (
      <div className="py-16 text-center text-sm text-slate-500">Cargando datos…</div>
    ) : error ? (
      <div className="py-16 text-center text-sm text-red-500">{error}</div>
    ) : !summary ? (
      <div className="py-16 text-center text-sm text-slate-500">Sin datos para mostrar</div>
    ) : (
      <>
        <Stats summary={summary} />
        <div className="dashboard-layout">
          <div className="dashboard-left">
            <div className="visual-grid">
              <section className="panel chart-panel"><div className="panel-heading"><h2>Uso de IA durante el examen</h2><MoreHorizontal size={17} /></div><TrendChart data={summary.trend} /></section>
              <UsageBreakdown platforms={summary.platforms} />
            </div>
          </div>
          <RecentActivity captures={summary.recent.slice(0, 8)} live={liveStatus === 'live'} />
        </div>
        <div className="dashboard-grid lower-grid">
          <StudentTable students={students.slice(0, 8)} onSelect={setSelected} selected={selected} examName={examName} />
          <StudentDetail
            student={selected}
            examName={examName}
            reportHref={selected ? `/students?student=${selected.id}` : '/students'}
          />
        </div>
        {lastCapture && (
          <p className="live-footnote">
            Última captura en vivo: {lastCapture.student_name} · {lastCapture.platform} ·{' '}
            {relativeTime(lastCapture.timestamp)}
          </p>
        )}
      </>
    )}
  </div>
}
