import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowUpRight, CalendarDays, Check, ChevronDown, MoreHorizontal, UserRound, Users } from 'lucide-react'
import { apiGetSummary } from '../lib/services/summary'
import { apiGetStudents } from '../lib/services/students'
import { apiGetExams } from '../lib/services/exams'
import type { Capture, Exam, RiskLevel, Student, Summary } from '../lib/types'

const PLATFORM_COLORS: Record<string, string> = {
  ChatGPT: '#29c0ae',
  Gemini: '#5149ec',
  Claude: '#ff8a61',
  Grok: '#6d78d8',
  Copilot: '#7378ff',
  Perplexity: '#26b0a9',
  Otros: '#f19a60',
}

function riskToBadge(value: string): RiskLevel {
  const normalized = value.toLowerCase()
  if (normalized.includes('alto')) return 'Alto'
  if (normalized.includes('medio')) return 'Medio'
  return 'Normal'
}

function RiskBadge({ value }: { value: string }) {
  const cls = value.toLowerCase().includes('alto')
    ? 'alto'
    : value.toLowerCase().includes('medio')
      ? 'medio'
      : 'normal'
  return <span className={`risk-badge ${cls}`}><i />{value}</span>
}

function AiMark({ name }: { name: string }) {
  const symbol = name === 'ChatGPT' ? '◉' : name === 'Gemini' ? '✦' : name === 'Claude' ? '✹' : name === 'Copilot' ? '▦' : name === 'Perplexity' ? '∞' : '•'
  return <span className={`ai-mark ${name.toLowerCase()}`}>{symbol}</span>
}

function formatTime(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
  if (!data.length) return <div className="p-4 text-center text-[10px] text-[#7186b3]">Sin datos de uso en los últimos 3 horas</div>
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
  const { stats } = summary
  return <section className="stat-grid">
    <div className="stat-card"><div className="stat-icon blue"><Users /></div><div><span>Usuarios totales</span><strong>{stats.total_students.toLocaleString()}</strong><small>estudiantes conectados</small></div></div>
    <div className="stat-card"><div className="stat-icon red"><AlertTriangle /></div><div><span>Usando IA ahora</span><strong>{stats.using_ai}</strong><small>últimos 10 min</small></div></div>
    <div className="stat-card"><div className="stat-icon teal"><Check /></div><div><span>Sin actividad de IA</span><strong>{stats.no_ai_activity}</strong><small>del total</small></div></div>
    <div className="stat-card"><div className="stat-icon amber"><AlertTriangle /></div><div><span>Nivel de riesgo</span><strong>{stats.risk_pct}%</strong><small>usuarios con actividad</small></div></div>
  </section>
}

function UsageBreakdown({ platforms }: { platforms: Summary['platforms'] }) {
  const total = platforms.reduce((acc, p) => acc + p.count, 0)
  return <section className="panel ai-panel"><div className="panel-heading"><h2>IA utilizada</h2></div>
    {platforms.length === 0 ? (
      <div className="p-4 text-center text-[10px] text-[#7186b3]">Sin capturas</div>
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

function RecentActivity({ captures }: { captures: Capture[] }) {
  return <section className="panel recent-panel"><div className="panel-heading"><h2><Activity className="pink-icon" size={16} />Actividad reciente</h2><a href="#activity">Ver todos <ArrowUpRight size={12} /></a></div>
    <div className="recent-list">
      {captures.length === 0 && <div className="py-4 text-center text-[10px] text-[#7186b3]">Sin actividad reciente</div>}
      {captures.map((c) => (
        <div className="recent-row" key={c.id}>
          <RiskBadge value={riskToBadge(c.student_name ? 'Medio' : 'Normal')} />
          <span>{c.student_name ?? `Dispositivo ${c.device_id?.slice(0, 3) ?? '?'}`}</span>
          <span className="recent-ai"><AiMark name={c.platform} />{c.platform}</span>
          <time>{formatTime(c.timestamp)}</time>
        </div>
      ))}
    </div>
  </section>
}

function StudentTable({ students, onSelect, selected, examNameOf }: { students: Student[], onSelect: (s: Student) => void, selected: Student | null, examNameOf: (s: Student) => string | undefined }) {
  return <section className="panel students-panel"><div className="panel-heading"><h2><Users className="blue-icon" size={16} />Detalle de estudiantes</h2></div>
    <div className="student-table"><div className="table-head"><span>Estado</span><span>Usuario</span><span>Examen</span><span>IA detectada</span><span>Última actividad</span><span>Riesgo</span></div>
      {students.length === 0 && <div className="py-4 text-center text-[10px] text-[#7186b3]">Sin estudiantes registrados</div>}
      {students.map((s) => (
        <div className={`table-row ${selected?.id === s.id ? 'selected' : ''}`} key={s.id} onClick={() => onSelect(s)} role="button" tabIndex={0}>
          <RiskBadge value={s.risk} />
          <span>{s.display_name}</span>
          <span>{examNameOf(s) ?? '—'}</span>
          <span className="recent-ai">
            {((s.platforms?.length ? s.platforms : s.main_platform ? [{ name: s.main_platform, count: s.captures_count }] : [])).map((p) => (
              <span key={p.name} className="ai-chip" title={`${p.name}: ${p.count}`}><AiMark name={p.name} /></span>
            ))}
            {!s.main_platform && '—'}
          </span>
          <span>{formatTime(s.last_activity)}</span>
          <RiskBadge value={s.risk} />
        </div>
      ))}
    </div>
  </section>
}

function StudentDetail({ student, examName }: { student: Student | null, examName?: string }) {
  if (!student) return <section className="panel student-detail"><div className="p-4 text-center text-[10px] text-[#7186b3]">Selecciona un estudiante</div></section>

  const platforms = student.platforms?.length
    ? student.platforms
    : student.main_platform
      ? [{ name: student.main_platform, count: student.captures_count }]
      : []
  const maxCount = Math.max(1, ...platforms.map((p) => p.count))

  return <section className="panel student-detail"><a className="back-link" href="#students">← &nbsp;Volver a estudiantes</a>
    <div className="student-title"><div className="profile-avatar"><UserRound /></div>
      <div><h3>{student.display_name} <RiskBadge value={student.risk} /></h3>
        <span>Examen: {examName ?? '—'}</span>
        <small>Última actividad: {formatTime(student.last_activity)}</small>
      </div>
    </div>
    <div className="activity-box"><h4>Actividad detectada</h4>
      {platforms.length === 0 ? (
        <div className="p-2 text-[8px] text-[#7186b3]">Sin actividad de IA.</div>
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
        <span><small>Herramienta principal</small><b>{student.main_platform ?? '—'}</b></span>
        <span><small>Dispositivo</small><b>{student.device_id ? student.device_id.slice(0, 8) : '—'}</b></span>
        <RiskBadge value={student.risk} />
      </div>
    </div>
  </section>
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const examMap = useMemo(() => {
    const map = new Map<number, string>()
    exams.forEach((e) => map.set(e.id, e.name))
    return map
  }, [exams])

  const currentExam = exams[0]

  const examNameOf = useCallback((s: Student): string | undefined => {
    return s.exam != null ? examMap.get(s.exam) : currentExam?.name
  }, [examMap, currentExam])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, studentsData, examsData] = await Promise.all([
        apiGetSummary(),
        apiGetStudents(),
        apiGetExams(),
      ])
      setSummary(summaryData)
      setStudents(studentsData)
      setExams(examsData)
      if (studentsData.length > 0) {
        setSelected((prev) => prev && studentsData.some((s) => s.id === prev.id) ? prev : studentsData[0])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  return <div className="dashboard-page">
    <header className="page-header">
      <div><h1>Dashboard</h1><p>Monitorea el uso de inteligencia artificial durante los exámenes</p></div>
      <div className="header-actions">
        <div className="exam-select"><CalendarDays size={15} /><span><small>Examen actual</small>{currentExam?.name ?? '—'}</span><ChevronDown size={13} /></div>
        <div className="date">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}<strong>{new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        <div className="avatar"><UserRound size={16} /></div>
      </div>
    </header>

    {loading && !summary ? (
      <div className="py-16 text-center text-sm text-gray-400">Cargando datos…</div>
    ) : error ? (
      <div className="py-16 text-center text-sm text-red-400">{error}</div>
    ) : !summary ? (
      <div className="py-16 text-center text-sm text-gray-400">Sin datos para mostrar</div>
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
          <RecentActivity captures={summary.recent.slice(0, 8)} />
        </div>
        <div className="dashboard-grid lower-grid">
          <StudentTable students={students.slice(0, 8)} onSelect={setSelected} selected={selected} examNameOf={examNameOf} />
          <StudentDetail student={selected} examName={examNameOf(selected!) ?? currentExam?.name} />
        </div>
      </>
    )}
  </div>
}