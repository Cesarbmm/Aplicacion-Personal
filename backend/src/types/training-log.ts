import type { ExerciseTrackingType, WorkoutUnit } from './routine.js'

export type ParsedTrainingLogItem = {
  exerciseName?: string
  sets?: number
  reps?: number
  weight?: number
  unit?: WorkoutUnit
  actualSeconds?: number
  trackingType?: ExerciseTrackingType
}

export type TrainingLogSessionFeedback = {
  fatigueLevel: number | null
  painLevel: number | null
  athleteNotes: string | null
}

export type TrainingLogParseStatus = 'complete' | 'needs_follow_up'

export type TrainingLogParseResult = {
  status: TrainingLogParseStatus
  sessionFeedback: TrainingLogSessionFeedback
  items: ParsedTrainingLogItem[]
  followUpQuestions: string[]
  parsed: ParsedTrainingLogItem
  followUpQuestion: string | null
}

export type PostWorkoutSessionItemInput = {
  exerciseName: string
  sets: number
  reps?: number | null
  weight?: number | null
  unit: WorkoutUnit
  actualSeconds?: number | null
}

export type CreatePostWorkoutSessionInput = {
  userId: string
  routineId?: string | null
  routineDayId?: string | null
  rawText: string
  items: PostWorkoutSessionItemInput[]
  feedback: TrainingLogSessionFeedback
}
