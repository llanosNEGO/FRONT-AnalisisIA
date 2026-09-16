import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, BarChart3, CalendarDays, FileText, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useAuth } from '../context/AuthContext'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/exams', icon: CalendarDays, label: 'Exámenes' },
    { path: '/students', icon: Users, label: 'Estudiantes' },
    { path: '/activity', icon: Activity, label: 'Actividad' },
    { path: '/reports', icon: FileText, label: 'Reportes' },
    { path: '/config', icon: Settings, label: 'Configuración' },
  ]

  return (
    <div className="monitor-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><BarChart3 size={19} /></div><span>AI Monitor</span></div>
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

        <div className="system-status"><span className="status-dot" /><div><strong>Sistema operativo</strong><span>1,284 dispositivos conectados</span><span>Última actualización: hace 2 s</span></div></div>
        <button
          className="logout-link"
          onClick={() => { signOut(); navigate('/login') }}
        ><LogOut size={16} />Salir</button>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        <div className="main-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
