export type SigmaGoal = 'hypertrophy' | 'strength' | 'weight_loss'
export type SigmaExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type SigmaUnit = 'kg' | 'lb'
export type SigmaRoutineCreationMode = 'coach' | 'manual'
export type SigmaRoutineSource = 'none' | 'backend' | 'fallback'
export type SigmaExerciseTrackingType = 'weight_reps' | 'bodyweight_reps' | 'time'
export type SigmaAdaptiveRecommendationType = 'progress' | 'maintain' | 'deload' | 'simplify'
export type SigmaAdaptiveRiskLevel = 'low' | 'medium' | 'high'
export type SigmaAdaptiveVolumeChange = 'increase' | 'maintain' | 'reduce'
export type SigmaTrainingLogParseStatus = 'complete' | 'needs_follow_up'
export type SigmaMonthlyTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data'
export type SigmaUserRole = 'athlete' | 'coach'
export type SigmaMonthlyReportStatus = 'draft' | 'reviewed' | 'delivered'

export type SigmaGym = {
  gymId: string
  name: string
  slug: string
  createdAt: string
}

export type SigmaWorkoutSet = {
  id: string
  reps: number
  weight: number
  completed: boolean
}

export type SigmaWorkoutExercise = {
  id: string
  name: string
  focus: string
  note: string
  restSeconds: number
  substitute: string
  targetRpe: number
  sets: SigmaWorkoutSet[]
}

export type SigmaWorkoutState = {
  title: string
  block: string
  focus: string
  readiness: number
  sessionLengthMinutes: number
  activeExerciseId: string
  lastSessionRpe: number | null
  notes: string
  exercises: SigmaWorkoutExercise[]
}

export type SigmaExerciseCatalogEntry = {
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
  trackingType: SigmaExerciseTrackingType
  coachingCue: string
  difficulty: SigmaExperienceLevel
  goalFocus: SigmaGoal | 'general'
}

export type SigmaRoutineExercise = {
  routineExerciseId: string
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
  trackingType: SigmaExerciseTrackingType
  coachingCue: string
  exerciseOrder: number
  sets: number
  reps: string
  restSeconds: number
}

export type SigmaRoutineDay = {
  routineDayId: string
  dayNumber: number
  title: string
  exercises: SigmaRoutineExercise[]
}

export type SigmaRoutine = {
  routineId: string
  userId: string
  name: string
  goal: SigmaGoal
  daysPerWeek: number
  creationMode: SigmaRoutineCreationMode
  isActive: boolean
  createdAt: string
  days: SigmaRoutineDay[]
}

export type SigmaRoutineState = {
  currentRoutine: SigmaRoutine | null
  proposedRoutine: SigmaRoutine | null
  exerciseCatalog: SigmaExerciseCatalogEntry[]
  isLoading: boolean
  isCatalogLoading: boolean
  isSavingManual: boolean
  error: string | null
  source: SigmaRoutineSource
  proposalSource: SigmaRoutineSource
  lastGeneratedAt: string | null
  hasUserChosenRoutineFlow: boolean
  proposalPendingAcceptance: boolean
  pendingRoutineId: string | null
  selectedCreationFlow: SigmaRoutineCreationMode | null
}

export type SigmaWorkoutSessionSet = {
  setId: string
  routineExerciseId: string
  exerciseId: string
  exerciseName: string
  setNumber: number
  targetReps: number
  actualReps: number | null
  actualSeconds: number | null
  completed: boolean
  weight: number | null
  unit: SigmaUnit
  completedAt: string | null
}

export type SigmaWorkoutSessionExercise = {
  routineExerciseId: string
  exerciseId: string
  name: string
  muscleGroup: string
  equipment: string
  trackingType: SigmaExerciseTrackingType
  coachingCue: string
  exerciseOrder: number
  sets: number
  reps: string
  restSeconds: number
  sessionSets: SigmaWorkoutSessionSet[]
}

export type SigmaWorkoutSession = {
  sessionId: string
  userId: string
  routineId: string
  routineDayId: string
  dayNumber: number
  title: string
  status: 'active' | 'completed'
  startedAt: string
  finishedAt: string | null
  exercises: SigmaWorkoutSessionExercise[]
}

export type SigmaWorkoutSessionSummary = {
  sessionId: string
  status: 'completed'
  completedSets: number
  totalVolume: number
  totalReps: number
  totalSeconds: number
  fatigueLevel: number | null
  painLevel: number | null
  athleteNotes: string | null
}

export type SigmaTrainingState = {
  activeSession: SigmaWorkoutSession | null
  isStarting: boolean
  isUpdatingSet: boolean
  isFinishing: boolean
  error: string | null
  source: 'none' | 'backend' | 'local'
  lastCompletedSummary: SigmaWorkoutSessionSummary | null
}

export type SigmaAdaptiveRecommendation = {
  type: SigmaAdaptiveRecommendationType
  summary: string
  reasoning: string
  suggestedLoadChangePercent: number
  suggestedVolumeChange: SigmaAdaptiveVolumeChange
  riskLevel: SigmaAdaptiveRiskLevel
}

export type SigmaAdaptiveSummary = {
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
  recommendation: SigmaAdaptiveRecommendation
}

export type SigmaAdaptiveState = {
  summary: SigmaAdaptiveSummary | null
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  source: 'none' | 'backend' | 'local'
  lastUpdatedAt: string | null
}

export type SigmaParsedTrainingLog = {
  exerciseName?: string
  sets?: number
  reps?: number
  weight?: number
  unit?: SigmaUnit
  actualSeconds?: number
  trackingType?: SigmaExerciseTrackingType
}

export type SigmaTrainingLogFeedback = {
  fatigueLevel: number | null
  painLevel: number | null
  athleteNotes: string | null
}

export type SigmaTrainingLogParseResult = {
  status: SigmaTrainingLogParseStatus
  sessionFeedback: SigmaTrainingLogFeedback
  items: SigmaParsedTrainingLog[]
  followUpQuestions: string[]
  parsed: SigmaParsedTrainingLog
  followUpQuestion: string | null
}

export type SigmaAssistedLogState = {
  result: SigmaTrainingLogParseResult | null
  isParsing: boolean
  isSaving: boolean
  error: string | null
  source: 'none' | 'backend' | 'local'
  lastSavedSummary: SigmaWorkoutSessionSummary | null
}

export type SigmaMonthlySummary = {
  userId: string
  month: string
  totalVolume: number
  completedSessions: number
  consistencyRate: number
  averageRpe: number | null
  averagePain: number | null
  progressionTrend: SigmaMonthlyTrend
  summary: string
  deliveredReport: SigmaDeliveredMonthlyReport | null
}

export type SigmaDeliveredMonthlyReport = {
  reportId: string
  coachName: string
  generatedSummary: string
  strengths: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  deliveredAt: string
}

export type SigmaMonthlySummaryState = {
  summary: SigmaMonthlySummary | null
  isLoading: boolean
  error: string | null
  source: 'none' | 'backend' | 'local'
}

export type SigmaCoachAthleteOverview = {
  userId: string
  name: string
  completedSessions: number
  consistencyRate: number
  progressionTrend: SigmaMonthlyTrend
  averageFatigue: number | null
  averagePain: number | null
  missedSessions: number
  weakPoints: string[]
  coachInsight: string
  reportStatus: SigmaMonthlyReportStatus
}

export type SigmaCoachOverviewResponse = {
  gymId: string | null
  gymName: string | null
  athletes: SigmaCoachAthleteOverview[]
}

export type SigmaCoachState = {
  overview: SigmaCoachOverviewResponse | null
  selectedReport: SigmaCoachMonthlyReport | null
  selectedAthleteId: string | null
  selectedMonth: string
  isLoading: boolean
  isReportLoading: boolean
  isReportSaving: boolean
  error: string | null
  reportError: string | null
  reportSaved: boolean
  source: 'none' | 'backend' | 'local'
}

export type SigmaMonthlySessionSummary = {
  sessionId: string
  date: string
  source: 'live' | 'post_workout' | 'seed'
  completedSets: number
  totalVolume: number
  fatigueLevel: number | null
  painLevel: number | null
  athleteNotes: string | null
}

export type SigmaCoachMonthlyReport = {
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
  metrics: {
    completedSessions: number
    consistencyRate: number
    completionRate: number
    totalVolume: number
    averageFatigue: number | null
    averagePain: number | null
    progressionTrend: SigmaMonthlyTrend
  }
  sessions: SigmaMonthlySessionSummary[]
  generatedSummary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  recommendation: string
  coachNotes: string
  status: SigmaMonthlyReportStatus
  updatedAt: string | null
}

export type SigmaManualRoutineExerciseInput = {
  exerciseId: string
  sets: number
  reps: string
  restSeconds: number
}

export type SigmaManualRoutineDayInput = {
  dayNumber: number
  title: string
  exercises: SigmaManualRoutineExerciseInput[]
}

export type SigmaManualRoutinePayload = {
  name: string
  goal: SigmaGoal
  daysPerWeek: number
  days: SigmaManualRoutineDayInput[]
}

export type SigmaProgressPoint = {
  week: string
  volume: number
  consistency: number
  projectedOneRm: number
  fatigue: number
}

export type SigmaProfile = {
  displayName: string
  email: string
  goal: SigmaGoal
  experienceLevel: SigmaExperienceLevel
  daysPerWeek: number
  preferredUnit: 'metric' | 'imperial'
  coachingStyle: 'Directo' | 'Analitico' | 'Motivador'
  focus: string
  notes: string
  heightCm: number
  weightKg: number
  targetWeightKg: number
  benchEstimateKg: number
  squatEstimateKg: number
  deadliftEstimateKg: number
}

export type SigmaPreferences = {
  adaptiveCoach: boolean
  reminders: boolean
  reminderMinutes: number
  recoveryAlerts: boolean
}

export type SigmaSession = {
  userId: string | null
  role: SigmaUserRole
  gymId: string | null
  gymName: string | null
  isAuthenticated: boolean
  onboardingComplete: boolean
  backendStatus: 'idle' | 'online' | 'offline'
  lastSyncError: string | null
  lastLoginAt: string | null
}

export type SigmaCreateAccountPayload = {
  email: string
  name: string
  role: SigmaUserRole
  gymId?: string
  gymName?: string
}

export type SigmaPostWorkoutSessionPayload = {
  routineId: string | null
  routineDayId: string | null
  rawText: string
  items: Array<{
    exerciseName: string
    sets: number
    reps: number | null
    weight: number | null
    unit: SigmaUnit
    actualSeconds: number | null
  }>
  feedback: SigmaTrainingLogFeedback
}

export type SigmafitStateSnapshot = {
  session: SigmaSession
  profile: SigmaProfile
  routine: SigmaRoutineState
  training: SigmaTrainingState
  assistedLog: SigmaAssistedLogState
  adaptive: SigmaAdaptiveState
  monthlySummary: SigmaMonthlySummaryState
  coach: SigmaCoachState
  workout: SigmaWorkoutState
  progressHistory: SigmaProgressPoint[]
  preferences: SigmaPreferences
}

export type SigmaOnboardingPayload = {
  displayName: string
  email: string
  goal: SigmaGoal
  experienceLevel: SigmaExperienceLevel
  daysPerWeek: number
  currentWeightKg: number
  targetWeightKg: number
  benchEstimateKg: number
  squatEstimateKg: number
  deadliftEstimateKg: number
}
