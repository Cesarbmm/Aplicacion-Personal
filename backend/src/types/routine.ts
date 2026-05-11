import type { OnboardingGoal } from './profile.js'

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseGoalFocus = OnboardingGoal | 'general'
export type WorkoutUnit = 'kg' | 'lb'
export type WorkoutSessionStatus = 'active' | 'completed'
export type RoutineCreationMode = 'coach' | 'manual'
export type ExerciseTrackingType = 'weight_reps' | 'bodyweight_reps' | 'time'

export type ExerciseCatalogEntry = {
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
  trackingType: ExerciseTrackingType
  coachingCue: string
  difficulty: ExerciseDifficulty
  goalFocus: ExerciseGoalFocus
}

export type RoutineExercise = {
  routineExerciseId: string
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
  trackingType: ExerciseTrackingType
  coachingCue: string
  exerciseOrder: number
  sets: number
  reps: string
  restSeconds: number
}

export type RoutineDay = {
  routineDayId: string
  dayNumber: number
  title: string
  exercises: RoutineExercise[]
}

export type Routine = {
  routineId: string
  userId: string
  name: string
  goal: OnboardingGoal
  daysPerWeek: number
  creationMode: RoutineCreationMode
  isActive: boolean
  createdAt: string
  days: RoutineDay[]
}

export type RoutineDraftExercise = Omit<RoutineExercise, 'routineExerciseId'>
export type RoutineDraftDay = Omit<RoutineDay, 'routineDayId' | 'exercises'> & {
  exercises: RoutineDraftExercise[]
}
export type RoutineDraft = Omit<Routine, 'routineId' | 'createdAt' | 'isActive' | 'days'> & {
  days: RoutineDraftDay[]
}

export type RoutineGenerationProfile = {
  userId: string
  goal: OnboardingGoal
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  daysPerWeek: number
  onboardingCompleted: boolean
}

export type WorkoutSessionSet = {
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
  unit: WorkoutUnit
  completedAt: string | null
}

export type WorkoutSessionExercise = {
  routineExerciseId: string
  exerciseId: string
  name: string
  muscleGroup: string
  equipment: string
  trackingType: ExerciseTrackingType
  coachingCue: string
  exerciseOrder: number
  sets: number
  reps: string
  restSeconds: number
  sessionSets: WorkoutSessionSet[]
}

export type WorkoutSession = {
  sessionId: string
  userId: string
  routineId: string
  routineDayId: string
  dayNumber: number
  title: string
  status: WorkoutSessionStatus
  startedAt: string
  finishedAt: string | null
  exercises: WorkoutSessionExercise[]
}

export type WorkoutSessionSummary = {
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

export type StartWorkoutSessionInput = {
  userId: string
  routineId: string
  routineDayId: string
  unit: WorkoutUnit
}

export type UpdateWorkoutSessionSetInput = {
  completed: boolean
  weight: number | null
  unit: WorkoutUnit
  actualReps?: number | null
  actualSeconds?: number | null
}

export type FinishWorkoutSessionInput = {
  fatigueLevel?: number | null
  painLevel?: number | null
  athleteNotes?: string | null
}
