import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGetExams } from '../lib/services/exams'
import type { Exam } from '../lib/types'

const SELECTED_EXAM_KEY = 'analisis_ia_exam'

interface ExamContextValue {
  exams: Exam[]
  selectedExam: Exam | null
  selectedExamId: number | null
  isLoading: boolean
  error: string | null
  selectExam: (examId: number | null) => void
  reload: () => Promise<void>
}

const ExamContext = createContext<ExamContextValue | null>(null)

function readStoredExamId(): number | null {
  const raw = localStorage.getItem(SELECTED_EXAM_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export function ExamProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(readStoredExamId)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      setExams(await apiGetExams())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los exámenes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const selectExam = useCallback((examId: number | null) => {
    setSelectedExamId(examId)
    if (examId === null) localStorage.removeItem(SELECTED_EXAM_KEY)
    else localStorage.setItem(SELECTED_EXAM_KEY, String(examId))
  }, [])

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId) ?? null,
    [exams, selectedExamId],
  )

  // Si el examen seleccionado desaparece (o el docente aún no ha elegido uno),
  // el dashboard trabaja sobre el examen en curso.
  useEffect(() => {
    if (isLoading || exams.length === 0) return
    if (selectedExamId === null || !exams.some((exam) => exam.id === selectedExamId)) {
      const running = exams.find((exam) => exam.is_running) ?? exams[0]
      selectExam(running.id)
    }
  }, [exams, isLoading, selectedExamId, selectExam])

  const value = useMemo<ExamContextValue>(
    () => ({ exams, selectedExam, selectedExamId, isLoading, error, selectExam, reload }),
    [exams, selectedExam, selectedExamId, isLoading, error, selectExam, reload],
  )

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>
}

export function useExamContext(): ExamContextValue {
  const ctx = useContext(ExamContext)
  if (!ctx) throw new Error('useExamContext must be used within ExamProvider')
  return ctx
}
