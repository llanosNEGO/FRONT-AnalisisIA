import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { LiveStream, type LiveStatus } from '../lib/live'
import { getToken } from '../lib/auth'
import type { Capture, Incident } from '../lib/types'
import { useAuth } from './AuthContext'
import { useExamContext } from './ExamContext'

interface LiveContextValue {
  status: LiveStatus
  lastCapture: Capture | null
  lastIncident: Incident | null
  captureCount: number
  incidentCount: number
  subscribeCaptures: (handler: (capture: Capture) => void) => () => void
  subscribeIncidents: (handler: (incident: Incident) => void) => () => void
  advanceCursor: (kind: 'capture' | 'incident', maxId: number) => void
}

const LiveContext = createContext<LiveContextValue | null>(null)

type CaptureHandler = (capture: Capture) => void
type IncidentHandler = (incident: Incident) => void

export function LiveProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { selectedExamId } = useExamContext()
  const [status, setStatus] = useState<LiveStatus>('idle')
  const [lastCapture, setLastCapture] = useState<Capture | null>(null)
  const [lastIncident, setLastIncident] = useState<Incident | null>(null)
  const [captureCount, setCaptureCount] = useState(0)
  const [incidentCount, setIncidentCount] = useState(0)
  const streamRef = useRef<LiveStream | null>(null)

  // Los handlers se guardan en refs para que las páginas puedan suscribirse sin
  // que eso cierre y reabra la conexión SSE en cada render.
  const captureHandlers = useRef(new Set<CaptureHandler>())
  const incidentHandlers = useRef(new Set<IncidentHandler>())

  useEffect(() => {
    if (!user) {
      setStatus('idle')
      streamRef.current = null
      return
    }
    const stream = new LiveStream(
      getToken() ?? '',
      selectedExamId,
      {
        onCapture: (capture) => {
          setLastCapture(capture)
          setCaptureCount((n) => n + 1)
          captureHandlers.current.forEach((handler) => handler(capture))
        },
        onIncident: (incident) => {
          setLastIncident(incident)
          setIncidentCount((n) => n + 1)
          incidentHandlers.current.forEach((handler) => handler(incident))
        },
        onStatus: setStatus,
        onTokenExpired: signOut,
      },
    )
    streamRef.current = stream
    stream.start()
    return () => {
      stream.stop()
      if (streamRef.current === stream) streamRef.current = null
    }
  }, [user, selectedExamId, signOut])

  const advanceCursor = useCallback((kind: 'capture' | 'incident', maxId: number) => {
    streamRef.current?.advance(kind, maxId)
  }, [])

  const value = useMemo<LiveContextValue>(
    () => ({
      status,
      lastCapture,
      lastIncident,
      captureCount,
      incidentCount,
      subscribeCaptures: (handler) => {
        captureHandlers.current.add(handler)
        return () => captureHandlers.current.delete(handler)
      },
      subscribeIncidents: (handler) => {
        incidentHandlers.current.add(handler)
        return () => incidentHandlers.current.delete(handler)
      },
      advanceCursor,
    }),
    [status, lastCapture, lastIncident, captureCount, incidentCount, advanceCursor],
  )

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>
}

export function useLiveContext(): LiveContextValue {
  const ctx = useContext(LiveContext)
  if (!ctx) throw new Error('useLiveContext must be used within LiveProvider')
  return ctx
}

/** Suscripción declarativa a los eventos en vivo de una página. */
export function useLiveCapture(handler: CaptureHandler) {
  const { subscribeCaptures } = useLiveContext()
  useEffect(() => subscribeCaptures(handler), [subscribeCaptures, handler])
}

export function useLiveIncident(handler: IncidentHandler) {
  const { subscribeIncidents } = useLiveContext()
  useEffect(() => subscribeIncidents(handler), [subscribeIncidents, handler])
}
