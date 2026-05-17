export type AdaptiveRecommendationType = 'progress' | 'maintain' | 'deload' | 'simplify'
export type AdaptiveRiskLevel = 'low' | 'medium' | 'high'
export type AdaptiveVolumeChange = 'increase' | 'maintain' | 'reduce'

export type AdaptiveRecommendation = {
  id: string
  userId: string
  routineId: string | null
  type: AdaptiveRecommendationType
  summary: string
  reasoning: string
  suggestedLoadChangePercent: number
  suggestedVolumeChange: AdaptiveVolumeChange
  riskLevel: AdaptiveRiskLevel
  createdAt: string
}

export type AdaptiveRecommendationDraft = Omit<AdaptiveRecommendation, 'id' | 'createdAt'>

export type AdaptiveTrainingSignals = {
  userId: string
  routineId: string | null
  sessionsAnalyzed: number
  completedSets: number
  plannedSets: number
  completionRate: number
  averageFatigue: number | null
  averagePain: number | null
  maxPain: number | null
  totalVolume: number
  totalReps: number
  totalSeconds: number
  notes: string[]
}

export type AdaptiveSummary = AdaptiveTrainingSignals & {
  recommendation: Omit<AdaptiveRecommendation, 'id' | 'userId' | 'routineId' | 'createdAt'>
}
