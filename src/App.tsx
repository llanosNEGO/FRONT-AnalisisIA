import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import ConfigPage from './pages/Config'
import Login from './pages/Login'
import AccessCodes from './pages/AccessCodes'
import Exams from './pages/Exams'
import Incidents from './pages/Incidents'
import SessionDetail from './pages/SessionDetail'
import Sessions from './pages/Sessions'
import Students from './pages/Students'
import { useAuth } from './context/AuthContext'
import { ExamProvider } from './context/ExamContext'
import { LiveProvider } from './context/LiveContext'
import './App.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="grid min-h-screen place-items-center text-slate-500">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  const { user } = useAuth()

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Protected routes wrapped in MainLayout */}
        <Route path="/" element={
          <RequireAuth>
            <ExamProvider>
              <LiveProvider>
                <MainLayout />
              </LiveProvider>
            </ExamProvider>
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="exams" element={<Exams />} />
          <Route path="access-codes" element={<AccessCodes />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="students" element={<Students />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
