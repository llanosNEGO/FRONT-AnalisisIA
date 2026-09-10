import { useState, useEffect } from 'react'
import { MessageSquare, ShieldCheck, Plus, RefreshCw, Users, BookOpen, Key } from 'lucide-react'

interface Examen {
  id: number
  token_acceso: string
  curso: string
  fecha_inicio: string
  fecha_fin: string
  activo: boolean
  total_sesiones: number
}

interface Captura {
  id: number
  plataforma: string
  prompt_usuario: string
  respuesta_ia: string
  timestamp: string
  es_sospechoso: boolean
}

interface Sesion {
  id: number
  estudiante_codigo: string
  curso: string
  token_examen: string
  estado: string
  ultimo_heartbeat: string
  total_capturas: number
  capturas: Captura[]
}

const BACKEND_URL = 'http://localhost:8000'

export default function Dashboard() {
  const [examenes, setExamenes] = useState<Examen[]>([])
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [curso, setCurso] = useState('')
  const [tokenAcceso, setTokenAcceso] = useState('')
  const [horas, setHoras] = useState('3')
  const [loading, setLoading] = useState(false)
  const [selectedSesion, setSelectedSesion] = useState<Sesion | null>(null)

  const loadData = async () => {
    try {
      const [resExamenes, resSesiones] = await Promise.all([
        fetch(`${BACKEND_URL}/api/examenes/`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/sesiones/`).then(r => r.json()),
      ])
      if (Array.isArray(resExamenes)) setExamenes(resExamenes)
      if (Array.isArray(resSesiones)) setSesiones(resSesiones)
    } catch (e) {
      console.error('Error al cargar datos desde el backend:', e)
    }
  }

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 5000) // Poll cada 5s para monitoreo en vivo
    return () => clearInterval(timer)
  }, [])

  const handleCreateExamen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curso || !tokenAcceso) return

    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/examenes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curso,
          token_acceso: tokenAcceso.toUpperCase(),
          horas_duracion: parseInt(horas) || 3,
        }),
      })

      if (res.ok) {
        setCurso('')
        setTokenAcceso('')
        setShowCreateModal(false)
        await loadData()
      }
    } catch (err) {
      console.error('Error al crear examen:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeCount = sesiones.filter(s => s.estado === 'ACTIVA').length
  const totalCapturas = sesiones.reduce((acc, s) => acc + (s.total_capturas || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Panel de Supervisión de Exámenes
          </h1>
          <p className="text-gray-400 mt-1">Gestión de sesiones y monitoreo de IA en tiempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-gray-300 text-sm font-medium border border-gray-700/60 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear Examen
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Exámenes Creados</p>
            <p className="text-2xl font-bold text-white">{examenes.length}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Sesiones Activas</p>
            <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Capturas Registradas</p>
            <p className="text-2xl font-bold text-white">{totalCapturas}</p>
          </div>
        </div>
      </div>

      {/* Examenes Creados */}
      <div className="rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-400" />
          Exámenes Disponibles
        </h2>
        {examenes.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No hay exámenes creados. Haz clic en "Crear Examen" para generar uno nuevo.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examenes.map((ex) => (
              <div key={ex.id} className="p-4 rounded-xl bg-gray-950/50 border border-gray-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-base">{ex.curso}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ex.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-800 text-gray-400'}`}>
                      {ex.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 font-mono bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-900/50 w-fit">
                    <span>Token:</span>
                    <span className="font-bold text-white">{ex.token_acceso}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-900 pt-2">
                  <span>{ex.total_sesiones} estudiantes en sesión</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sesiones de Estudiantes en Vivo */}
      <div className="rounded-2xl bg-gray-900/40 border border-gray-800/60 backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-gray-800/60 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Monitoreo de Estudiantes en Vivo
          </h2>
          <span className="text-xs text-gray-400">Actualización en tiempo real (cada 5s)</span>
        </div>

        {sesiones.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay estudiantes conectados en este momento.
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {sesiones.map((s) => (
              <div key={s.id} className="p-6 hover:bg-gray-800/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-indigo-300 text-base">{s.estudiante_codigo}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 ${s.estado === 'ACTIVA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      <span className={`w-2 h-2 rounded-full ${s.estado === 'ACTIVA' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {s.estado}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Examen: <strong className="text-gray-200">{s.curso}</strong> ({s.token_examen})</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-gray-400 space-y-0.5">
                    <p>{s.total_capturas} capturas de IA</p>
                    <p className="text-[11px] text-gray-500">Último pulso: {new Date(s.ultimo_heartbeat).toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSesion(s)}
                    className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold border border-gray-700 transition-all"
                  >
                    Ver Capturas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Examen */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Crear Nuevo Examen</h3>

            <form onSubmit={handleCreateExamen} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nombre del Curso / Examen</label>
                <input
                  type="text"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ej. Algoritmos y Estructura de Datos"
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Código de Examen (Token de Acceso)</label>
                <input
                  type="text"
                  value={tokenAcceso}
                  onChange={(e) => setTokenAcceso(e.target.value.toUpperCase())}
                  placeholder="Ej. EXAM-ALG-2026"
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Duración (Horas)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  required
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/40"
                >
                  {loading ? 'Guardando...' : 'Crear Examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Capturas */}
      {selectedSesion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col justify-between shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-white">Capturas de IA - Alumno: {selectedSesion.estudiante_codigo}</h3>
                <p className="text-xs text-gray-400">{selectedSesion.curso} ({selectedSesion.token_examen})</p>
              </div>
              <button
                onClick={() => setSelectedSesion(null)}
                className="text-gray-400 hover:text-white font-bold text-sm bg-gray-800 p-2 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedSesion.capturas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No se han registrado capturas de IA en esta sesión.</p>
              ) : (
                selectedSesion.capturas.map((cap) => (
                  <div key={cap.id} className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2 text-xs">
                    <div className="flex justify-between text-indigo-400 font-semibold">
                      <span className="uppercase">{cap.plataforma}</span>
                      <span className="text-gray-500">{new Date(cap.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Prompt Usuario:</p>
                      <p className="text-gray-200 bg-gray-900 p-2 rounded border border-gray-800/50 mt-1 whitespace-pre-wrap">{cap.prompt_usuario}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Respuesta IA:</p>
                      <p className="text-gray-300 bg-gray-900 p-2 rounded border border-gray-800/50 mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap">{cap.respuesta_ia}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 text-right">
              <button
                onClick={() => setSelectedSesion(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
