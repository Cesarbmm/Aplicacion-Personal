export type MonthlySummaryTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data'

export type MonthlyTrainingSignals = {
  userId: string
  month: string
  completedSessions: number
  completedSets: number
  plannedSets: number
  totalVolume: number
  totalReps: number
  totalSeconds: number
  averageRpe: number | null
}

export type MonthlySummary = {
  userId: string
  month: string
  totalVolume: number
  completedSessions: number
  consistencyRate: number
  averageRpe: number | null
  progressionTrend: MonthlySummaryTrend
  summary: string
}
