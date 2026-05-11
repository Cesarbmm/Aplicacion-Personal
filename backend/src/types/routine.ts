import type { OnboardingGoal } from './profile.js'

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseGoalFocus = OnboardingGoal | 'general'
export type WorkoutUnit = 'kg' | 'lb'
export type WorkoutSessionStatus = 'active' | 'completed'

export type ExerciseCatalogEntry = {
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
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
}

export type StartWorkoutSessionInput = {
  userId: string
  routineId: string
  routineDayId: string
  unit: WorkoutUnit
}

export type UpdateWorkoutSessionSetInput = {
  completed: boolean
  weight: number
  unit: WorkoutUnit
}
