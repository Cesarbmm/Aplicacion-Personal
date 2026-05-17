import type { WorkoutUnit } from './routine.js'

export type ParsedTrainingLog = {
  exerciseName?: string
  sets?: number
  reps?: number
  weight?: number
  unit?: WorkoutUnit
}

export type TrainingLogParseStatus = 'complete' | 'needs_follow_up'

export type TrainingLogParseResult = {
  status: TrainingLogParseStatus
  parsed: ParsedTrainingLog
  followUpQuestion: string | null
}
