import { useState } from 'react'
import { CalendarDays, Loader2, Plus } from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { formatDateTime, isoToLocalInput, localInputToIso } from '../lib/format'
import { apiCreateExam } from '../lib/services/exams'

function defaultStart(): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return isoToLocalInput(date)
}

function defaultEnd(): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 3)
  return isoToLocalInput(date)
}

export default function Exams() {
  const { exams, isLoading, reload, selectExam } = useExamContext()
  const [name, setName] = useState('')
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (new Date(end) <= new Date(start)) {
      setError('La hora de fin debe ser posterior a la de inicio.')
      return
    }
    setIsSubmitting(true)
    try {
      const exam = await apiCreateExam({
        name: name.trim(),
        start_time: localInputToIso(start),
        end_time: localInputToIso(end),
      })
      await reload()
      selectExam(exam.id)
      setName('')
      setNotice(`Examen «${exam.name}» creado. Ya puedes generar códigos de acceso.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear el examen')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Nuevo examen</h2>
            <p className="muted">
              Los códigos de acceso, las sesiones y los incidentes cuelgan de un examen.
            </p>
          </div>
        </header>

        <form className="code-form" onSubmit={submit}>
          <label className="span-2">
            <span>Nombre del examen</span>
            <input
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Programación II — parcial 1"
            />
          </label>
          <label>
            <span>Desde</span>
            <input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="datetime-local" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <div className="span-2 form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              {isSubmitting ? 'Creando…' : 'Crear examen'}
            </button>
          </div>
        </form>

        {error && <p className="alert alert-error">{error}</p>}
        {notice && <p className="alert alert-success">{notice}</p>}
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Exámenes</h2>
            <p className="muted">{exams.length} registrado(s)</p>
          </div>
        </header>

        {isLoading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Examen</th>
                  <th>Ventana</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td><strong>{exam.name}</strong></td>
                    <td>
                      {formatDateTime(exam.start_time)} → {formatDateTime(exam.end_time)}
                    </td>
                    <td>
                      <span className={`badge ${exam.is_running ? 'badge-normal' : 'badge-muted'}`}>
                        {exam.is_running ? 'En curso' : 'Fuera de ventana'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn-ghost" onClick={() => selectExam(exam.id)}>
                        <CalendarDays size={14} /> Seleccionar
                      </button>
                    </td>
                  </tr>
                ))}
                {exams.length === 0 && (
                  <tr><td colSpan={4} className="empty">Crea el primer examen para empezar.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
