import type { MonthlySummaryTrend } from './monthly-summary.js'

export type CoachAthleteOverview = {
  userId: string
  name: string
  consistencyRate: number
  progressionTrend: MonthlySummaryTrend
  averageFatigue: number | null
  averagePain: number | null
  missedSessions: number
  weakPoints: string[]
  coachInsight: string
}

export type CoachOverviewResponse = {
  gymId: string | null
  gymName: string | null
  athletes: CoachAthleteOverview[]
}
