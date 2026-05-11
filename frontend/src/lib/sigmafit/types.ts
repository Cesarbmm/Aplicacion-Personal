export type SigmaGoal = 'hypertrophy' | 'strength' | 'weight_loss'
export type SigmaExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type SigmaUnit = 'kg' | 'lb'
export type SigmaRoutineCreationMode = 'coach' | 'manual'
export type SigmaRoutineSource = 'none' | 'backend' | 'fallback'
export type SigmaExerciseTrackingType = 'weight_reps' | 'bodyweight_reps' | 'time'

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
  isAuthenticated: boolean
  onboardingComplete: boolean
  backendStatus: 'idle' | 'online' | 'offline'
  lastSyncError: string | null
  lastLoginAt: string | null
}

export type SigmafitStateSnapshot = {
  session: SigmaSession
  profile: SigmaProfile
  routine: SigmaRoutineState
  training: SigmaTrainingState
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
