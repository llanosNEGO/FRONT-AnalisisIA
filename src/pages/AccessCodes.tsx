import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Loader2, Plus, XCircle } from 'lucide-react'
import { useExamContext } from '../context/ExamContext'
import { formatDateTime } from '../lib/format'
import {
  apiCreateAccessCodes,
  apiGetAccessCodes,
  apiRevokeAccessCode,
  type AccessCodeFilters,
} from '../lib/services/accessCodes'
import type { AccessCode, Paginated } from '../lib/types'

const STATUS_CLASS: Record<AccessCode['status'], string> = {
  active: 'badge-normal',
  expired: 'badge-muted',
  exhausted: 'badge-medium',
  revoked: 'badge-high',
}

const STATUS_LABEL: Record<AccessCode['status'], string> = {
  active: 'Activo',
  expired: 'Caducado',
  exhausted: 'Agotado',
  revoked: 'Revocado',
}

const EMPTY_FORM = { count: '1', duration_minutes: '180', max_uses: '35' }

export default function AccessCodes() {
  const { selectedExamId, isLoading: examsLoading } = useExamContext()

  const [codes, setCodes] = useState<AccessCode[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [created, setCreated] = useState<AccessCode[] | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = useCallback(async (targetPage = page) => {
    setIsLoading(true)
    const filters: AccessCodeFilters = {
      exam_id: selectedExamId,
      status: statusFilter,
      page: targetPage,
    }
    try {
      const data: Paginated<AccessCode> = await apiGetAccessCodes(filters)
      setCodes(data.results)
      setCount(data.count)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los códigos')
    } finally {
      setIsLoading(false)
    }
  }, [selectedExamId, statusFilter, page])

  useEffect(() => {
    setPage(1)
    void load(1)
  }, [load])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedExamId === null) {
      setError('Selecciona un examen antes de generar códigos.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const data = await apiCreateAccessCodes({
        exam: selectedExamId,
        count: Number(form.count),
        duration_minutes: Number(form.duration_minutes),
        max_uses: Number(form.max_uses),
      })
      setCreated(data)
      setForm(EMPTY_FORM)
      setPage(1)
      await load(1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron generar los códigos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const revoke = async (id: number) => {
    setError(null)
    setBusyId(id)
    try {
      await apiRevokeAccessCode(id)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo revocar el código')
    } finally {
      setBusyId(null)
    }
  }

  const copy = async (code: AccessCode) => {
    try {
      await navigator.clipboard.writeText(code.code)
      setCopiedId(code.id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      setError('El navegador no permitió copiar. Cópialo manualmente.')
    }
  }

  const totalPages = count === null ? 1 : Math.max(1, Math.ceil(count / 20))

  return (
    <div className="page-stack">
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Generar códigos de clase</h2>
            <p className="muted">
              Un código por curso o grupo: cada estudiante lo canjea con su matrícula. El código
              caduca solo y el servidor registra quién lo usó y en qué dispositivo.
            </p>
          </div>
        </header>

        <form className="code-form" onSubmit={submit}>
          <label>
            <span>Cantidad de códigos (grupos)</span>
            <input
              type="number" min={1} max={100} required
              value={form.count}
              onChange={(e) => setForm({ ...form, count: e.target.value })}
            />
          </label>
          <label>
            <span>Duración del código (minutos)</span>
            <input
              type="number" min={5} max={480} required
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
          </label>
          <label>
            <span>Alumnos máximos (usos)</span>
            <input
              type="number" min={1} max={500} required
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            />
          </label>
          <div className="span-2 form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              {isSubmitting ? 'Generando…' : 'Generar código'}
            </button>
          </div>
        </form>

        {error && <p className="alert alert-error">{error}</p>}

        {created && created.length > 0 && (
          <div className="alert alert-success">
            <strong>{created.length} código(s) de clase generado(s). Compártelos con tu grupo.</strong>
            <ul className="code-result">
              {created.map((code) => (
                <li key={code.id}>
                  <code>{code.code}</code>
                  <button type="button" className="btn-ghost" onClick={() => void copy(code)}>
                    {copiedId === code.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === code.id ? 'Copiado' : 'Copiar'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Códigos emitidos</h2>
            <p className="muted">{count ?? 0} código(s) para el examen seleccionado</p>
          </div>
          <div className="filters">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="exhausted">Agotados</option>
              <option value="expired">Caducados</option>
              <option value="revoked">Revocados</option>
            </select>
          </div>
        </header>

        {examsLoading ? (
          <p className="muted">Cargando exámenes…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Usos</th>
                  <th>Caduca</th>
                  <th>Emisión</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id}>
                    <td><code className="mono">{code.code}</code></td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[code.status]}`}>
                        {STATUS_LABEL[code.status]}
                      </span>
                    </td>
                    <td>{code.uses} / {code.max_uses}</td>
                    <td>{formatDateTime(code.expires_at)}</td>
                    <td>{formatDateTime(code.created_at)}</td>
                    <td className="row-actions">
                      <button type="button" className="btn-ghost" onClick={() => void copy(code)}>
                        {copiedId === code.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      {code.is_redeemable && (
                        <button
                          type="button"
                          className="btn-ghost danger"
                          disabled={busyId === code.id}
                          onClick={() => void revoke(code.id)}
                        >
                          <XCircle size={14} /> Revocar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="empty">No hay códigos para este filtro.</td>
                  </tr>
                )}
                {isLoading && (
                  <tr><td colSpan={6} className="empty">Cargando…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button" className="btn-ghost"
              disabled={page <= 1}
              onClick={() => { const next = page - 1; setPage(next); void load(next) }}
            >Anterior</button>
            <span className="muted">Página {page} de {totalPages}</span>
            <button
              type="button" className="btn-ghost"
              disabled={page >= totalPages}
              onClick={() => { const next = page + 1; setPage(next); void load(next) }}
            >Siguiente</button>
          </div>
        )}
      </section>
    </div>
  )
}