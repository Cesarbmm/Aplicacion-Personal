export type SigmaObjective = 'Hipertrofia' | 'Fuerza' | 'Recomposicion' | 'Resistencia'
export type SigmaExperience = 'Principiante' | 'Intermedio' | 'Avanzado'

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
  objective: SigmaObjective
  experience: SigmaExperience
  availability: number
  preferredUnit: 'metric' | 'imperial'
  coachingStyle: 'Directo' | 'Analitico' | 'Motivador'
  focus: string
  notes: string
  heightCm: number
  weightKg: number
}

export type SigmaPreferences = {
  adaptiveCoach: boolean
  reminders: boolean
  reminderMinutes: number
  recoveryAlerts: boolean
}

export type SigmaSession = {
  isAuthenticated: boolean
  onboardingComplete: boolean
  lastLoginAt: string | null
}

export type SigmafitStateSnapshot = {
  session: SigmaSession
  profile: SigmaProfile
  workout: SigmaWorkoutState
  progressHistory: SigmaProgressPoint[]
  preferences: SigmaPreferences
}

export type SigmaOnboardingPayload = {
  displayName: string
  email: string
  objective: SigmaObjective
  experience: SigmaExperience
  availability: number
}

