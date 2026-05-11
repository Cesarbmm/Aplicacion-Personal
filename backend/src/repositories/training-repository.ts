import type {
  ExerciseCatalogEntry,
  Routine,
  RoutineDraft,
  StartWorkoutSessionInput,
  UpdateWorkoutSessionSetInput,
  WorkoutSession,
  WorkoutSessionSummary,
} from '../types/routine.js'

export interface TrainingRepository {
  getExerciseCatalog(): Promise<ExerciseCatalogEntry[]>
  replaceActiveRoutine(userId: string, routine: RoutineDraft): Promise<Routine>
  getCurrentRoutine(userId: string): Promise<Routine | null>
  getRoutineById(routineId: string): Promise<Routine | null>
  createWorkoutSession(input: StartWorkoutSessionInput): Promise<WorkoutSession>
  updateWorkoutSessionSet(
    sessionId: string,
    setId: string,
    input: UpdateWorkoutSessionSetInput,
  ): Promise<WorkoutSession>
  finishWorkoutSession(sessionId: string): Promise<WorkoutSessionSummary>
}

export class OnboardingRequiredError extends Error {
  constructor(userId: string) {
    super(`El usuario ${userId} debe completar onboarding antes de generar una rutina.`)
    this.name = 'OnboardingRequiredError'
  }
}

export class RoutineNotFoundError extends Error {
  constructor(identifier: string) {
    super(`No existe una rutina para ${identifier}.`)
    this.name = 'RoutineNotFoundError'
  }
}

export class RoutineDayNotFoundError extends Error {
  constructor(routineDayId: string) {
    super(`No existe un dia de rutina con id ${routineDayId}.`)
    this.name = 'RoutineDayNotFoundError'
  }
}

export class WorkoutSessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`No existe una sesion de entrenamiento con id ${sessionId}.`)
    this.name = 'WorkoutSessionNotFoundError'
  }
}

export class WorkoutSessionSetNotFoundError extends Error {
  constructor(setId: string) {
    super(`No existe una serie de sesion con id ${setId}.`)
    this.name = 'WorkoutSessionSetNotFoundError'
  }
}
