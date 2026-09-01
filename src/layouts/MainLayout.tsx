import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export default function MainLayout() {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/config', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-gray-800/60 bg-gray-950/50 backdrop-blur-xl">
        <div className="h-16 flex items-center px-6 border-b border-gray-800/60">
          <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            Capture
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  isActive 
                    ? 'bg-purple-500/10 text-purple-400 font-medium'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-purple-400" : "text-gray-500 group-hover:text-gray-300")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800/60">
          <Link 
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-400" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
