import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import ConfigPage from './pages/Config'
import Login from './pages/Login'
import { useAuth } from './context/AuthContext'
import './App.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div className="grid min-h-screen place-items-center text-gray-400">Cargando…</div>
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
            <MainLayout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App