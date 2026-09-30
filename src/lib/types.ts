export type PlatformName = 'ChatGPT' | 'Claude' | 'Gemini' | 'Grok' | 'Copilot' | 'Perplexity'

export type RiskLevel = 'Normal' | 'Medio' | 'Alto'

export type IncidentSeverity = 'low' | 'medium' | 'high'

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'

export type IncidentCategory = 'suspected_ai' | 'intensive_ai' | 'cross_platform'

export type AccessCodeStatus = 'active' | 'expired' | 'exhausted' | 'revoked'

export type SessionStatus = 'active' | 'closed'

export interface User {
  id: number
  name: string
  email: string
  picture?: string | null
  is_teacher?: boolean
}

export interface AuthSession {
  token: string
  user: User
}

export interface Capture {
  id: number
  session?: number | null
  student?: number | null
  student_name?: string | null
  exam?: number | null
  exam_name?: string | null
  platform: PlatformName
  prompt: string
  response: string
  timestamp: string
  device_id?: string | null
}

export interface StudentPlatform {
  name: PlatformName
  count: number
}

export interface Student {
  id: number
  external_id?: string | null
  display_name: string
  device_id?: string | null
  exam?: number | null
  risk: RiskLevel
  score: number
  captures_count: number
  last_activity?: string | null
  main_platform?: PlatformName | null
  platforms?: StudentPlatform[]
  open_incidents: number
  sessions_count: number
  last_session?: string | null
}

export interface Exam {
  id: number
  name: string
  start_time: string
  end_time: string
  is_running?: boolean
}

export interface ExamInput {
  name: string
  start_time: string
  end_time: string
}

export interface AccessCode {
  id: number
  code: string
  exam: number
  exam_name: string
  duration_minutes: number
  max_uses: number
  uses: number
  status: AccessCodeStatus
  is_redeemable: boolean
  expires_at: string
  created_at: string
}

export interface AccessCodeBatchInput {
  exam: number
  count: number
  duration_minutes: number
  max_uses: number
}

export interface ExamSession {
  id: number
  exam: number
  exam_name: string
  student: number
  student_name: string
  device_id: string
  access_code?: string | null
  status: SessionStatus
  started_at: string
  last_seen_at: string
  ended_at?: string | null
  duration_seconds: number
  captures_count: number
  platforms: StudentPlatform[]
}

export interface ExamSessionDetail extends ExamSession {
  incidents: Incident[]
}

export interface Incident {
  id: number
  student: number
  student_name: string
  exam?: number | null
  exam_name?: string | null
  session?: number | null
  category: IncidentCategory
  category_label: string
  severity: IncidentSeverity
  severity_label: string
  status: IncidentStatus
  status_label: string
  title: string
  detail: string
  score: number
  evidence_count: number
  platforms: PlatformName[]
  first_seen_at: string
  last_seen_at: string
  created_at: string
  updated_at: string
  resolved_at?: string | null
  resolution_note: string
  reviewed_by: string
}

export interface IncidentStats {
  total: number
  open: number
  acknowledged: number
  resolved: number
  dismissed: number
  high_severity: number
}

export interface StudentIncidentReport {
  student: Pick<Student, 'id' | 'display_name' | 'device_id' | 'exam'>
  totals: {
    incidents: number
    open: number
    acknowledged: number
    resolved: number
    dismissed: number
    sessions: number
    captures: number
  }
  incidents: Paginated<Incident>
}

export interface PlatformStat {
  name: PlatformName
  count: number
  percentage: number
}

export interface TrendPoint {
  label: string
  count: number
}

export interface SummaryStats {
  total_students: number
  using_ai: number
  no_ai_activity: number
  risk_pct: number
  active_sessions: number
  total_sessions: number
}

export interface Summary {
  exam: { id: number; name: string } | null
  stats: SummaryStats
  incidents: IncidentStats
  platforms: PlatformStat[]
  trend: TrendPoint[]
  recent: Capture[]
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
