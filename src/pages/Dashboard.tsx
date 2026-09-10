import { Activity, AlertTriangle, ArrowUpRight, CalendarDays, Check, ChevronDown, Clock3, MoreHorizontal, Users, UserRound } from 'lucide-react'

const students = [
  ['Alto', 'Estudiante #204', 'Programación II', 'ChatGPT', '10:42:18'],
  ['Medio', 'Estudiante #187', 'Matemáticas', 'Gemini', '10:41:52'],
  ['Alto', 'Estudiante #091', 'Programación II', 'ChatGPT', '10:40:31'],
  ['Normal', 'Estudiante #332', 'Física', '—', '10:39:04'],
  ['Medio', 'Estudiante #276', 'Matemáticas', 'Claude', '10:37:23'],
  ['Alto', 'Estudiante #118', 'Programación II', 'ChatGPT', '10:35:17'],
  ['Normal', 'Estudiante #457', 'Historia', '—', '10:33:02'],
  ['Medio', 'Estudiante #203', 'Física', 'Gemini', '10:31:48'],
]
const recent = [
  ['Alto', '#204', 'ChatGPT', '10:42:18'], ['Medio', '#187', 'Gemini', '10:41:52'],
  ['Alto', '#091', 'ChatGPT', '10:40:31'], ['Normal', '#332', '—', '10:39:04'],
  ['Medio', '#276', 'Claude', '10:37:23'], ['Alto', '#118', 'ChatGPT', '10:35:17'],
  ['Normal', '#457', '—', '10:33:02'], ['Medio', '#203', 'Gemini', '10:31:48'],
]

function RiskBadge({ value }: { value: string }) {
  return <span className={`risk-badge ${value.toLowerCase().replace(' ', '-')}`}><i />{value}</span>
}

function AiMark({ name }: { name: string }) {
  const symbol = name === 'ChatGPT' ? '◉' : name === 'Gemini' ? '✦' : name === 'Claude' ? '✹' : name === 'Copilot' ? '▦' : '•'
  return <span className={`ai-mark ${name.toLowerCase()}`}>{symbol}</span>
}

function TrendChart() {
  return <div className="trend-chart">
    <div className="chart-y"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
    <svg viewBox="0 0 620 190" preserveAspectRatio="none" aria-label="Uso de IA durante el examen">
      <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5362ff" stopOpacity=".48" /><stop offset="1" stopColor="#5362ff" stopOpacity=".04" /></linearGradient></defs>
      <path className="chart-area" d="M0 169 C25 173 22 153 47 161 S74 140 97 145 S122 119 147 127 S166 105 188 123 S216 146 232 123 S245 89 267 83 S284 68 307 85 S329 59 348 77 S370 46 388 35 S407 51 424 67 S439 43 452 71 S469 95 481 83 S500 103 517 90 S540 135 557 140 S585 116 598 139 S612 126 620 143 L620 190 L0 190 Z" />
      <path className="chart-line" d="M0 169 C25 173 22 153 47 161 S74 140 97 145 S122 119 147 127 S166 105 188 123 S216 146 232 123 S245 89 267 83 S284 68 307 85 S329 59 348 77 S370 46 388 35 S407 51 424 67 S439 43 452 71 S469 95 481 83 S500 103 517 90 S540 135 557 140 S585 116 598 139 S612 126 620 143" />
      <circle cx="388" cy="35" r="5" className="chart-point" />
    </svg>
    <div className="chart-x"><span>09:00</span><span>09:30</span><span>10:00</span><span>10:30</span><span>11:00</span><span>11:30</span></div>
  </div>
}

function Stats() {
  return <section className="stat-grid">
    <div className="stat-card"><div className="stat-icon blue"><Users /></div><div><span>Usuarios totales</span><strong>1,284</strong><small>estudiantes conectados</small><em>↑ 12% <i>vs. inicio del examen</i></em></div></div>
    <div className="stat-card"><div className="stat-icon red"><AlertTriangle /></div><div><span>Usando IA ahora</span><strong>187</strong><small>14.5% del total</small><em>↑ 6% <i>vs. hace 10 min</i></em></div></div>
    <div className="stat-card"><div className="stat-icon teal"><Check /></div><div><span>Sin actividad de IA</span><strong>1,097</strong><small>85.5% del total</small><em>↑ 2% <i>vs. hace 10 min</i></em></div></div>
    <div className="stat-card"><div className="stat-icon amber"><AlertTriangle /></div><div><span>Nivel de riesgo</span><strong>14.5%</strong><small>usuarios con actividad</small><em>↑ 6% <i>vs. hace 10 min</i></em></div></div>
  </section>
}

function RecentActivity() {
  return <section className="panel recent-panel"><div className="panel-heading"><h2><Activity className="pink-icon" size={16} />Actividad reciente</h2><a href="#activity">Ver todos <ArrowUpRight size={12} /></a></div><div className="recent-list">{recent.map(([risk, user, ai, time]) => <div className="recent-row" key={user}><RiskBadge value={risk} /><span>Estudiante {user}</span><span className="recent-ai"><AiMark name={ai} />{ai}</span><time>{time}</time></div>)}</div></section>
}

function UsageBreakdown() {
  return <section className="panel ai-panel"><div className="panel-heading"><h2>IA utilizada</h2></div><div className="donut-row"><div className="donut"><div><strong>187</strong><span>usuarios</span></div></div><div className="legend"><div><AiMark name="ChatGPT" /><span>ChatGPT</span><b>62%</b></div><div><AiMark name="Gemini" /><span>Gemini</span><b>21%</b></div><div><AiMark name="Claude" /><span>Claude</span><b>9%</b></div><div><AiMark name="Copilot" /><span>Copilot</span><b>5%</b></div><div><AiMark name="Otros" /><span>Otros</span><b>3%</b></div></div></div></section>
}

function StudentTable() {
  return <section className="panel students-panel"><div className="panel-heading"><h2><Users className="blue-icon" size={16} />Detalle de estudiantes</h2><a href="#students">Ver todos <ArrowUpRight size={12} /></a></div><div className="student-table"><div className="table-head"><span>Estado</span><span>Usuario</span><span>Examen</span><span>IA detectada</span><span>Última actividad</span><span>Riesgo</span></div>{students.map(([risk, user, exam, ai, time]) => <div className="table-row" key={user}><RiskBadge value={risk} /><span>{user}</span><span>{exam}</span><span className="recent-ai"><AiMark name={ai} />{ai}</span><span>{time}</span><RiskBadge value={risk} /></div>)}</div></section>
}

function StudentDetail() {
  const activity = [['ChatGPT', '18 eventos', 'teal'], ['Gemini', '4 eventos', 'purple'], ['Claude', '1 evento', 'orange'], ['Copilot', '0 eventos', 'blue'], ['Otros', '0 eventos', 'gray']]
  return <section className="panel student-detail"><a className="back-link" href="#students">← &nbsp;Volver a estudiantes</a><div className="student-title"><div className="profile-avatar"><UserRound /></div><div><h3>Estudiante #204 <RiskBadge value="Alto riesgo" /></h3><span>Examen: Programación II</span><small>Tiempo en examen: 35 min</small></div></div><div className="activity-box"><h4>Actividad detectada</h4>{activity.map(([name, amount, color]) => <div className="activity-line" key={name}><AiMark name={name} /><span>{name}</span><i className={color}><b /></i><small>{amount}</small></div>)}</div><div className="timeline"><h4><Clock3 size={13} /> Línea de tiempo</h4><div className="timeline-line"><i /><i /><i /><i /><i /><i /></div><div className="timeline-labels"><span>10:12<br />Inicio</span><span>10:27<br /><b>Sosp.</b></span><span>10:31<br />ChatGPT</span><span>10:34<br />ChatGPT</span><span>10:42<br />ChatGPT</span><span>10:47<br />Fin</span></div></div><div className="summary"><h4>Resumen</h4><div><span>◷<small>Tiempo monitoreado</small><b>35 min</b></span><span>⌁<small>Actividad IA detectada</small><b>22 min</b></span><span>◉<small>Herramienta principal</small><b>ChatGPT</b></span><RiskBadge value="Alto riesgo" /></div></div></section>
}

export default function Dashboard() {
  return <div className="dashboard-page">
    <header className="page-header"><div><h1>Dashboard</h1><p>Monitorea el uso de inteligencia artificial durante los exámenes</p></div><div className="header-actions"><div className="exam-select"><CalendarDays size={15} /><span><small>Examen actual</small>Programación II</span><ChevronDown size={13} /></div><div className="date">12 Sep 2025<strong>10:42 a. m.</strong></div><div className="avatar"><UserRound size={16} /></div></div></header>
    <div className="dashboard-layout"><div className="dashboard-left"><Stats /><div className="visual-grid"><section className="panel chart-panel"><div className="panel-heading"><h2>Uso de IA durante el examen</h2><MoreHorizontal size={17} /></div><TrendChart /></section><UsageBreakdown /></div></div><RecentActivity /></div>
    <div className="dashboard-grid lower-grid"><StudentTable /><StudentDetail /></div>
  </div>
}
