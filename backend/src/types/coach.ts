import type { MonthlySummaryTrend } from './monthly-summary.js'
import type { MonthlyReportStatus } from './monthly-report.js'

export type CoachAthleteOverview = {
  userId: string
  name: string
  completedSessions: number
  consistencyRate: number
  progressionTrend: MonthlySummaryTrend
  averageFatigue: number | null
  averagePain: number | null
  missedSessions: number
  weakPoints: string[]
  coachInsight: string
  reportStatus: MonthlyReportStatus
}

export type CoachOverviewResponse = {
  gymId: string | null
  gymName: string | null
  athletes: CoachAthleteOverview[]
}
