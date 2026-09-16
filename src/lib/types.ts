export type PlatformName = 'ChatGPT' | 'Claude' | 'Gemini' | 'Grok' | 'Copilot' | 'Perplexity'

export type RiskLevel = 'Normal' | 'Medio' | 'Alto'

export interface User {
  id: number
  name: string
  email: string
  picture?: string | null
}

export interface Session {
  token: string
  user: User
}

export interface Capture {
  id: number
  platform: PlatformName
  prompt: string
  response: string
  timestamp: string
  device_id?: string | null
  student_name?: string | null
  exam_name?: string | null
}

export interface StudentPlatform {
  name: PlatformName
  count: number
}

export interface Student {
  id: number
  display_name: string
  device_id?: string | null
  exam?: number | null
  risk: RiskLevel
  captures_count: number
  last_activity?: string | null
  main_platform?: PlatformName | null
  platforms?: StudentPlatform[]
}

export interface Exam {
  id: number
  name: string
  start_time: string
  end_time: string
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
}

export interface Summary {
  stats: SummaryStats
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