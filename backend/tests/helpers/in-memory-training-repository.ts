import { randomUUID } from 'node:crypto'

import type {
  ExerciseCatalogEntry,
  Routine,
  RoutineDraft,
  RoutineExercise,
  StartWorkoutSessionInput,
  UpdateWorkoutSessionSetInput,
  WorkoutSession,
  WorkoutSessionSummary,
} from '../../src/types/routine.js'
import {
  RoutineDayNotFoundError,
  RoutineNotFoundError,
  WorkoutSessionNotFoundError,
  WorkoutSessionSetNotFoundError,
  type TrainingRepository,
} from '../../src/repositories/training-repository.js'

function parseRepRangeToTargetReps(repRange: string) {
  if (!repRange.includes('-')) {
    return Number(repRange)
  }

  const [min, max] = repRange.split('-').map((value) => Number(value))
  return Math.round((min + max) / 2)
}

function createExerciseCatalog(): ExerciseCatalogEntry[] {
  return [
    {
      exerciseId: 'exercise-bench',
      name: 'Press de banca',
      muscleGroup: 'Pecho',
      movementPattern: 'Empuje horizontal',
      equipment: 'Barra',
      trackingType: 'weight_reps',
      coachingCue: 'Usa banco plano y barra controlada.',
      difficulty: 'intermediate',
      goalFocus: 'strength',
    },
    {
      exerciseId: 'exercise-squat',
      name: 'Sentadilla con barra',
      muscleGroup: 'Piernas',
      movementPattern: 'Dominante de rodilla',
      equipment: 'Barra',
      trackingType: 'weight_reps',
      coachingCue: 'Controla profundidad y brace.',
      difficulty: 'intermediate',
      goalFocus: 'strength',
    },
    {
      exerciseId: 'exercise-deadlift',
      name: 'Peso muerto',
      muscleGroup: 'Posterior',
      movementPattern: 'Bisagra de cadera',
      equipment: 'Barra',
      trackingType: 'weight_reps',
      coachingCue: 'Barra cerca del cuerpo.',
      difficulty: 'advanced',
      goalFocus: 'strength',
    },
    {
      exerciseId: 'exercise-ohp',
      name: 'Press militar',
      muscleGroup: 'Hombros',
      movementPattern: 'Empuje vertical',
      equipment: 'Barra',
      trackingType: 'weight_reps',
      coachingCue: 'Evita hiperextension lumbar.',
      difficulty: 'intermediate',
      goalFocus: 'strength',
    },
    {
      exerciseId: 'exercise-row',
      name: 'Remo con barra',
      muscleGroup: 'Espalda',
      movementPattern: 'Tiron horizontal',
      equipment: 'Barra',
      trackingType: 'weight_reps',
      coachingCue: 'Torso estable y codos atras.',
      difficulty: 'intermediate',
      goalFocus: 'hypertrophy',
    },
    {
      exerciseId: 'exercise-pulldown',
      name: 'Jalon al pecho',
      muscleGroup: 'Espalda',
      movementPattern: 'Tiron vertical',
      equipment: 'Polea',
      trackingType: 'weight_reps',
      coachingCue: 'Baja hacia clavicula sin balanceo.',
      difficulty: 'beginner',
      goalFocus: 'hypertrophy',
    },
    {
      exerciseId: 'exercise-biceps',
      name: 'Curl de biceps',
      muscleGroup: 'Biceps',
      movementPattern: 'Aislamiento',
      equipment: 'Mancuernas',
      trackingType: 'weight_reps',
      coachingCue: 'Codos quietos y recorrido completo.',
      difficulty: 'beginner',
      goalFocus: 'hypertrophy',
    },
    {
      exerciseId: 'exercise-triceps',
      name: 'Extension de triceps',
      muscleGroup: 'Triceps',
      movementPattern: 'Aislamiento',
      equipment: 'Polea',
      trackingType: 'weight_reps',
      coachingCue: 'Codos fijos en la extension.',
      difficulty: 'beginner',
      goalFocus: 'hypertrophy',
    },
    {
      exerciseId: 'exercise-legpress',
      name: 'Prensa de piernas',
      muscleGroup: 'Piernas',
      movementPattern: 'Dominante de rodilla',
      equipment: 'Maquina',
      trackingType: 'weight_reps',
      coachingCue: 'No bloquees rodillas violentamente.',
      difficulty: 'beginner',
      goalFocus: 'weight_loss',
    },
    {
      exerciseId: 'exercise-plank',
      name: 'Plancha abdominal',
      muscleGroup: 'Core',
      movementPattern: 'Estabilidad',
      equipment: 'Peso corporal',
      trackingType: 'time',
      coachingCue: 'Controla por segundos con pelvis neutra.',
      difficulty: 'beginner',
      goalFocus: 'general',
    },
  ]
}

export function createInMemoryTrainingRepository(seedRoutine?: Routine): TrainingRepository {
  const exerciseCatalog = createExerciseCatalog()
  const routines = new Map<string, Routine>()
  const sessions = new Map<string, WorkoutSession>()

  if (seedRoutine) {
    routines.set(seedRoutine.routineId, structuredClone(seedRoutine))
  }

  return {
    async getExerciseCatalog() {
      return structuredClone(exerciseCatalog)
    },

    async replaceActiveRoutine(userId, routineDraft: RoutineDraft) {
      Array.from(routines.values()).forEach((routine) => {
        if (routine.userId === userId) {
          routine.isActive = false
        }
      })

      const routine: Routine = {
        routineId: randomUUID(),
        userId,
        name: routineDraft.name,
        goal: routineDraft.goal,
        daysPerWeek: routineDraft.daysPerWeek,
        creationMode: routineDraft.creationMode,
        isActive: true,
        createdAt: new Date('2026-01-03T00:00:00.000Z').toISOString(),
        days: routineDraft.days.map((day) => ({
          routineDayId: randomUUID(),
          dayNumber: day.dayNumber,
          title: day.title,
          exercises: day.exercises.map((exercise) => ({
            ...exercise,
            routineExerciseId: randomUUID(),
          })),
        })),
      }

      routines.set(routine.routineId, structuredClone(routine))
      return routine
    },

    async getCurrentRoutine(userId) {
      const current = Array.from(routines.values()).find((routine) => routine.userId === userId && routine.isActive)
      return current ? structuredClone(current) : null
    },

    async getRoutineById(routineId) {
      const routine = routines.get(routineId)
      return routine ? structuredClone(routine) : null
    },

    async createWorkoutSession(input: StartWorkoutSessionInput) {
      const routine = Array.from(routines.values()).find(
        (candidate) => candidate.routineId === input.routineId && candidate.userId === input.userId,
      )

      if (!routine) {
        throw new RoutineNotFoundError(input.routineId)
      }

      const routineDay = routine.days.find((candidate) => candidate.routineDayId === input.routineDayId)

      if (!routineDay) {
        throw new RoutineDayNotFoundError(input.routineDayId)
      }

      const session: WorkoutSession = {
        sessionId: randomUUID(),
        userId: input.userId,
        routineId: input.routineId,
        routineDayId: input.routineDayId,
        dayNumber: routineDay.dayNumber,
        title: routineDay.title,
        status: 'active',
        startedAt: new Date('2026-01-04T10:00:00.000Z').toISOString(),
        finishedAt: null,
        exercises: routineDay.exercises.map((exercise: RoutineExercise) => ({
          routineExerciseId: exercise.routineExerciseId,
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          equipment: exercise.equipment,
          trackingType: exercise.trackingType,
          coachingCue: exercise.coachingCue,
          exerciseOrder: exercise.exerciseOrder,
          sets: exercise.sets,
          reps: exercise.reps,
          restSeconds: exercise.restSeconds,
          sessionSets: Array.from({ length: exercise.sets }, (_, index) => ({
            setId: randomUUID(),
            routineExerciseId: exercise.routineExerciseId,
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.name,
            setNumber: index + 1,
            targetReps: parseRepRangeToTargetReps(exercise.reps),
            actualReps: null,
            actualSeconds: null,
            completed: false,
            weight: null,
            unit: input.unit,
            completedAt: null,
          })),
        })),
      }

      sessions.set(session.sessionId, structuredClone(session))
      return session
    },

    async updateWorkoutSessionSet(sessionId, setId, input: UpdateWorkoutSessionSetInput) {
      const session = sessions.get(sessionId)

      if (!session) {
        throw new WorkoutSessionNotFoundError(sessionId)
      }

      let updated = false

      session.exercises = session.exercises.map((exercise) => ({
        ...exercise,
        sessionSets: exercise.sessionSets.map((setItem) => {
          if (setItem.setId !== setId) {
            return setItem
          }

          updated = true

          return {
            ...setItem,
            completed: input.completed,
            weight: input.weight,
            unit: input.unit,
            actualReps: input.actualReps ?? null,
            actualSeconds: input.actualSeconds ?? null,
            completedAt: input.completed ? new Date('2026-01-04T10:15:00.000Z').toISOString() : null,
          }
        }),
      }))

      if (!updated) {
        throw new WorkoutSessionSetNotFoundError(setId)
      }

      sessions.set(sessionId, structuredClone(session))
      return structuredClone(session)
    },

    async finishWorkoutSession(sessionId, input = {}) {
      const session = sessions.get(sessionId)

      if (!session) {
        throw new WorkoutSessionNotFoundError(sessionId)
      }

      session.status = 'completed'
      session.finishedAt = new Date('2026-01-04T11:05:00.000Z').toISOString()
      sessions.set(sessionId, structuredClone(session))

      const completedSets = session.exercises.reduce(
        (total, exercise) => total + exercise.sessionSets.filter((setItem) => setItem.completed).length,
        0,
      )

      const totalVolume = session.exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sessionSets.reduce((exerciseTotal, setItem) => {
            if (!setItem.completed || setItem.weight === null) {
              return exerciseTotal
            }

            return exerciseTotal + setItem.weight * (setItem.actualReps ?? setItem.targetReps)
          }, 0),
        0,
      )

      const totalReps = session.exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sessionSets.reduce(
            (exerciseTotal, setItem) =>
              setItem.completed ? exerciseTotal + (setItem.actualReps ?? setItem.targetReps) : exerciseTotal,
            0,
          ),
        0,
      )

      const totalSeconds = session.exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sessionSets.reduce(
            (exerciseTotal, setItem) =>
              setItem.completed ? exerciseTotal + (setItem.actualSeconds ?? 0) : exerciseTotal,
            0,
          ),
        0,
      )

      const summary: WorkoutSessionSummary = {
        sessionId,
        status: 'completed',
        completedSets,
        totalVolume,
        totalReps,
        totalSeconds,
        fatigueLevel: input.fatigueLevel ?? null,
        painLevel: input.painLevel ?? null,
        athleteNotes: input.athleteNotes ?? null,
      }

      return summary
    },
  }
}
