import type { MonthlySummaryTrend } from './monthly-summary.js'

export type MonthlyReportStatus = 'draft' | 'reviewed' | 'delivered'

export type MonthlySessionSummary = {
  sessionId: string
  date: string
  source: 'live' | 'post_workout' | 'seed'
  completedSets: number
  totalVolume: number
  fatigueLevel: number | null
  painLevel: number | null
  athleteNotes: string | null
}

export type MonthlyReportMetrics = {
  completedSessions: number
  consistencyRate: number
  completionRate: number
  totalVolume: number
  averageFatigue: number | null
  averagePain: number | null
  progressionTrend: MonthlySummaryTrend
}

export type StoredCoachMonthlyReport = {
  reportId: string
  coachUserId: string
  coachName: string
  athleteUserId: string
  gymId: string
  month: string
  generatedSummary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  status: MonthlyReportStatus
  createdAt: string
  updatedAt: string
}

export type CoachMonthlyReport = {
  reportId: string | null
  coachUserId: string
  athlete: {
    userId: string
    name: string
  }
  gym: {
    gymId: string
    name: string
  }
  month: string
  metrics: MonthlyReportMetrics
  sessions: MonthlySessionSummary[]
  generatedSummary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  status: MonthlyReportStatus
  updatedAt: string | null
}

export type SaveCoachMonthlyReportInput = {
  coachUserId: string
  athleteUserId: string
  gymId: string
  month: string
  generatedSummary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  status: MonthlyReportStatus
}

export type DeliveredMonthlyReport = {
  reportId: string
  coachName: string
  generatedSummary: string
  strengths: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  deliveredAt: string
}
