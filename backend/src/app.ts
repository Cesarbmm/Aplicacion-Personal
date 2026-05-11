import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { ZodError, z } from 'zod'

import { generateRoutineDraft } from './services/routine-generator.js'
import { onboardingExperienceLevels, onboardingGoals } from './types/profile.js'
import { type WorkoutUnit } from './types/routine.js'
import { UserNotFoundError, type UserProfileRepository } from './repositories/user-profile-repository.js'
import {
  ExerciseNotFoundError,
  OnboardingRequiredError,
  RoutineDayNotFoundError,
  RoutineNotFoundError,
  WorkoutSessionNotFoundError,
  WorkoutSessionSetNotFoundError,
  type TrainingRepository,
} from './repositories/training-repository.js'

const userParamsSchema = z.object({
  id: z.string().uuid(),
})

const routineParamsSchema = z.object({
  routineId: z.string().uuid(),
})

const workoutSessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
})

const workoutSessionSetParamsSchema = z.object({
  sessionId: z.string().uuid(),
  setId: z.string().uuid(),
})

const onboardingSchema = z.object({
  goal: z.enum(onboardingGoals),
  experienceLevel: z.enum(onboardingExperienceLevels),
  daysPerWeek: z.number().int().min(2).max(6),
})

const workoutUnitSchema = z.enum(['kg', 'lb'])

const startWorkoutSessionSchema = z.object({
  routineId: z.string().uuid(),
  routineDayId: z.string().uuid(),
  unit: workoutUnitSchema.default('kg'),
})

const updateWorkoutSetSchema = z.object({
  completed: z.boolean(),
  weight: z.number().min(0).nullable().default(null),
  unit: workoutUnitSchema,
  actualReps: z.number().int().min(0).nullable().optional(),
  actualSeconds: z.number().int().min(0).nullable().optional(),
})

const finishWorkoutSessionSchema = z.object({
  fatigueLevel: z.number().int().min(1).max(10).nullable().optional(),
  painLevel: z.number().int().min(0).max(10).nullable().optional(),
  athleteNotes: z.string().trim().max(1000).nullable().optional(),
})

const manualRoutineExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1),
  reps: z.string().trim().min(1),
  restSeconds: z.number().int().positive(),
})

const manualRoutineDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(6),
  title: z.string().trim().min(1),
  exercises: z.array(manualRoutineExerciseSchema).min(1),
})

const manualRoutineSchema = z
  .object({
    name: z.string().trim().min(1),
    goal: z.enum(onboardingGoals),
    daysPerWeek: z.number().int().min(2).max(6),
    days: z.array(manualRoutineDaySchema).min(1),
  })
  .superRefine((value, context) => {
    if (value.days.length !== value.daysPerWeek) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['days'],
        message: 'La rutina manual debe definir un dia por cada jornada disponible.',
      })
    }

    const uniqueDayNumbers = new Set(value.days.map((day) => day.dayNumber))
    if (uniqueDayNumbers.size !== value.days.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['days'],
        message: 'No se permiten dias duplicados en la rutina manual.',
      })
    }
  })

function parseOrigins(origins: string) {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function createApp({
  userProfileRepository,
  trainingRepository,
  frontendOrigin,
}: {
  userProfileRepository: UserProfileRepository
  trainingRepository: TrainingRepository
  frontendOrigin: string
}) {
  const app = express()

  app.use(
    cors({
      origin: parseOrigins(frontendOrigin),
    }),
  )
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'sigmafit-backend',
    })
  })

  app.get('/api/exercises', async (_request, response, next) => {
    try {
      const exerciseCatalog = await trainingRepository.getExerciseCatalog()
      response.json(exerciseCatalog)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users/:id/profile', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        response.status(404).json({
          error: 'USER_NOT_FOUND',
          message: `No existe un usuario con id ${id}.`,
        })
        return
      }

      response.json(profile)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/routines/generate', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      if (!profile.onboardingCompleted || !profile.goal || !profile.experienceLevel || !profile.daysPerWeek) {
        throw new OnboardingRequiredError(id)
      }

      const exerciseCatalog = await trainingRepository.getExerciseCatalog()
      const routineDraft = generateRoutineDraft(
        {
          userId: profile.userId,
          goal: profile.goal,
          experienceLevel: profile.experienceLevel,
          daysPerWeek: profile.daysPerWeek,
          onboardingCompleted: profile.onboardingCompleted,
        },
        exerciseCatalog,
      )
      const routine = await trainingRepository.replaceActiveRoutine(id, routineDraft)

      response.status(201).json(routine)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/routines/manual', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      if (!profile.onboardingCompleted) {
        throw new OnboardingRequiredError(id)
      }

      const payload = manualRoutineSchema.parse(request.body)
      const exerciseCatalog = await trainingRepository.getExerciseCatalog()
      const exerciseById = new Map(
        exerciseCatalog.map((exercise) => [exercise.exerciseId, exercise] as const),
      )

      const routineDraft = {
        userId: id,
        name: payload.name,
        goal: payload.goal,
        daysPerWeek: payload.daysPerWeek,
        creationMode: 'manual' as const,
        days: payload.days
          .slice()
          .sort((left, right) => left.dayNumber - right.dayNumber)
          .map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            exercises: day.exercises.map((exercise, index) => {
              const catalogExercise = exerciseById.get(exercise.exerciseId)

              if (!catalogExercise) {
                throw new ExerciseNotFoundError(exercise.exerciseId)
              }

              return {
                exerciseId: catalogExercise.exerciseId,
                name: catalogExercise.name,
                muscleGroup: catalogExercise.muscleGroup,
                movementPattern: catalogExercise.movementPattern,
                equipment: catalogExercise.equipment,
                trackingType: catalogExercise.trackingType,
                coachingCue: catalogExercise.coachingCue,
                exerciseOrder: index + 1,
                sets: exercise.sets,
                reps: exercise.reps,
                restSeconds: exercise.restSeconds,
              }
            }),
          })),
      }

      const routine = await trainingRepository.replaceActiveRoutine(id, routineDraft)
      response.status(201).json(routine)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users/:id/routines/current', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      if (!profile.onboardingCompleted) {
        throw new OnboardingRequiredError(id)
      }

      const routine = await trainingRepository.getCurrentRoutine(id)

      if (!routine) {
        throw new RoutineNotFoundError(`usuario ${id}`)
      }

      response.json(routine)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/routines/:routineId', async (request, response, next) => {
    try {
      const { routineId } = routineParamsSchema.parse(request.params)
      const routine = await trainingRepository.getRoutineById(routineId)

      if (!routine) {
        throw new RoutineNotFoundError(routineId)
      }

      response.json(routine)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/workout-sessions', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      if (!profile.onboardingCompleted) {
        throw new OnboardingRequiredError(id)
      }

      const payload = startWorkoutSessionSchema.parse(request.body)
      const workoutSession = await trainingRepository.createWorkoutSession({
        userId: id,
        routineId: payload.routineId,
        routineDayId: payload.routineDayId,
        unit: payload.unit as WorkoutUnit,
      })

      response.status(201).json(workoutSession)
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/workout-sessions/:sessionId/sets/:setId', async (request, response, next) => {
    try {
      const { sessionId, setId } = workoutSessionSetParamsSchema.parse(request.params)
      const payload = updateWorkoutSetSchema.parse(request.body)
      const workoutSession = await trainingRepository.updateWorkoutSessionSet(sessionId, setId, payload)

      response.json(workoutSession)
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/workout-sessions/:sessionId/finish', async (request, response, next) => {
    try {
      const { sessionId } = workoutSessionParamsSchema.parse(request.params)
      const payload = finishWorkoutSessionSchema.parse(request.body ?? {})
      const summary = await trainingRepository.finishWorkoutSession(sessionId, payload)

      response.json(summary)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/onboarding', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const payload = onboardingSchema.parse(request.body)
      const profile = await userProfileRepository.saveOnboarding(id, payload)

      response.json(profile)
    } catch (error) {
      next(error)
    }
  })

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    void _next

    if (error instanceof ZodError) {
      response.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Los datos enviados no cumplen el contrato esperado.',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      })
      return
    }

    if (error instanceof UserNotFoundError) {
      response.status(404).json({
        error: 'USER_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof OnboardingRequiredError) {
      response.status(409).json({
        error: 'ONBOARDING_REQUIRED',
        message: error.message,
      })
      return
    }

    if (error instanceof RoutineNotFoundError) {
      response.status(404).json({
        error: 'ROUTINE_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof RoutineDayNotFoundError) {
      response.status(404).json({
        error: 'ROUTINE_DAY_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof WorkoutSessionNotFoundError) {
      response.status(404).json({
        error: 'WORKOUT_SESSION_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof WorkoutSessionSetNotFoundError) {
      response.status(404).json({
        error: 'WORKOUT_SESSION_SET_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof ExerciseNotFoundError) {
      response.status(400).json({
        error: 'EXERCISE_NOT_FOUND',
        message: error.message,
      })
      return
    }

    console.error(error)

    response.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'SigmaFit no pudo completar la solicitud.',
    })
  })

  return app
}
