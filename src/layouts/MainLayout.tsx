import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '../context/AuthContext'
import { useExamContext } from '../context/ExamContext'
import { useLiveContext } from '../context/LiveContext'
import { formatDateTime } from '../lib/format'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

const LIVE_LABEL: Record<string, string> = {
  idle: 'Conectando',
  connecting: 'Conectando',
  live: 'En vivo',
  reconnecting: 'Reconectando',
  offline: 'Sin conexión',
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { exams, selectedExamId, selectExam } = useExamContext()
  const { status, captureCount, incidentCount } = useLiveContext()

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/exams', icon: CalendarDays, label: 'Exámenes' },
    { path: '/access-codes', icon: KeyRound, label: 'Códigos de acceso' },
    { path: '/sessions', icon: Activity, label: 'Sesiones' },
    { path: '/students', icon: Users, label: 'Estudiantes' },
    { path: '/incidents', icon: ShieldAlert, label: 'Incidentes' },
    { path: '/config', icon: Settings, label: 'Configuración' },
  ]

  return (
    <div className="monitor-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><BarChart3 size={19} /></div><span>AI Monitor</span></div>

        <div className="exam-picker">
          <label htmlFor="exam-select">Examen en curso</label>
          <select
            id="exam-select"
            value={selectedExamId ?? ''}
            onChange={(event) => selectExam(event.target.value ? Number(event.target.value) : null)}
          >
            {exams.length === 0 && <option value="">Sin exámenes</option>}
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}{exam.is_running ? ' (en curso)' : ''}
              </option>
            ))}
          </select>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn('nav-item', isActive && 'active')}
              >
                <Icon size={17} /><span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={cn('system-status', status === 'offline' && 'offline')}>
          <span className="status-dot" />
          <div>
            <strong>{LIVE_LABEL[status] ?? status}</strong>
            <span>{captureCount} capturas en vivo</span>
            <span>{incidentCount} incidentes en vivo</span>
          </div>
        </div>
        <button
          className="logout-link"
          onClick={() => { signOut(); navigate('/login') }}
        ><LogOut size={16} />Salir</button>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        <header className="topbar">
          <div>
            <h1>{navItems.find((item) => location.pathname.startsWith(item.path))?.label ?? 'AI Monitor'}</h1>
            <p className="muted">Supervisión de uso de IA en exámenes</p>
          </div>
          <div className={cn('live-pill', `live-${status}`)}>
            <span className="live-dot" />
            <span>{LIVE_LABEL[status] ?? status}</span>
            <span className="muted">{formatDateTime(new Date())}</span>
          </div>
        </header>
        <div className="main-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
