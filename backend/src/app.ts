import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { ZodError, z } from 'zod'

import { generateRoutineDraft } from './services/routine-generator.js'
import {
  createAdaptiveRecommendationDraft,
  createAdaptiveSummary,
  recommendationToSummary,
} from './services/adaptive-coach.js'
import { createCoachOverview } from './services/coach-insights.js'
import { createMonthlySummary } from './services/monthly-summary.js'
import { createCoachMonthlyReport } from './services/monthly-report-generator.js'
import { parseTrainingLog } from './services/training-log-parser.js'
import type { MonthlySummary } from './types/monthly-summary.js'
import type { AdaptiveTrainingSignals } from './types/adaptive.js'
import type { MonthlyReportStatus } from './types/monthly-report.js'
import { onboardingExperienceLevels, onboardingGoals } from './types/profile.js'
import { type WorkoutUnit } from './types/routine.js'
import {
  CoachAccessRequiredError,
  GymNotFoundError,
  GymRequiredError,
  UserNotFoundError,
  type UserProfileRepository,
} from './repositories/user-profile-repository.js'
import {
  GymAccessDeniedError,
  type MonthlyReportRepository,
} from './repositories/monthly-report-repository.js'
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

const trainingLogParseSchema = z.object({
  userId: z.string().uuid(),
  text: z.string().trim().min(3).max(4000),
})

const accountSchema = z
  .object({
    email: z.string().email(),
    name: z.string().trim().min(2).max(120),
    role: z.enum(['athlete', 'coach']),
    gymId: z.string().uuid().optional(),
    gymName: z.string().trim().min(2).max(120).optional(),
  })
  .superRefine((value, context) => {
    if (value.role === 'athlete' && !value.gymId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gymId'],
        message: 'Selecciona un gimnasio.',
      })
    }

    if (value.role === 'coach' && !value.gymName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gymName'],
        message: 'Ingresa el nombre del gimnasio.',
      })
    }
  })

const accountLoginSchema = z.object({
  email: z.string().email(),
  role: z.enum(['athlete', 'coach']),
})

const postWorkoutItemSchema = z
  .object({
    exerciseName: z.string().trim().min(1),
    sets: z.number().int().min(1).max(20),
    reps: z.number().int().min(0).nullable().optional(),
    weight: z.number().min(0).nullable().optional(),
    unit: workoutUnitSchema.default('kg'),
    actualSeconds: z.number().int().min(1).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (!value.reps && !value.actualSeconds) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reps'],
        message: 'Cada ejercicio requiere repeticiones o segundos.',
      })
    }
  })

const postWorkoutSessionSchema = z
  .object({
    routineId: z.string().uuid().nullable().optional(),
    routineDayId: z.string().uuid().nullable().optional(),
    rawText: z.string().trim().min(3).max(4000),
    items: z.array(postWorkoutItemSchema).min(1).max(20),
    feedback: z.object({
      fatigueLevel: z.number().int().min(1).max(10).nullable().default(null),
      painLevel: z.number().int().min(0).max(10).nullable().default(null),
      athleteNotes: z.string().trim().max(1000).nullable().default(null),
    }),
  })
  .superRefine((value, context) => {
    if (Boolean(value.routineId) !== Boolean(value.routineDayId)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['routineDayId'],
        message: 'La rutina y el dia deben enviarse juntos o dejarse vacios.',
      })
    }
  })

const coachOverviewQuerySchema = z.object({
  coachUserId: z.string().uuid().optional(),
})

const monthlySummaryQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

const coachMonthlyReportParamsSchema = z.object({
  athleteId: z.string().uuid(),
})

const coachMonthlyReportQuerySchema = z.object({
  coachUserId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
})

const reviewMonthlyReportSchema = z.object({
  coachUserId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  coachNotes: z.string().trim().max(2000).default(''),
  status: z.enum(['draft', 'reviewed', 'delivered']),
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
  monthlyReportRepository,
  frontendOrigin,
}: {
  userProfileRepository: UserProfileRepository
  trainingRepository: TrainingRepository
  monthlyReportRepository: MonthlyReportRepository
  frontendOrigin: string
}) {
  const app = express()

  app.use(
    cors({
      origin: parseOrigins(frontendOrigin),
    }),
  )
  app.use(express.json())

  async function loadCoachMonthlyReport(
    coachUserId: string,
    athleteUserId: string,
    month: string,
  ) {
    const [coach, athlete] = await Promise.all([
      userProfileRepository.getProfile(coachUserId),
      userProfileRepository.getProfile(athleteUserId),
    ])

    if (!coach) {
      throw new UserNotFoundError(coachUserId)
    }
    if (!athlete) {
      throw new UserNotFoundError(athleteUserId)
    }
    if (coach.role !== 'coach' || !coach.gymId) {
      throw new CoachAccessRequiredError(coach.userId)
    }
    if (athlete.role !== 'athlete' || !athlete.gymId || athlete.gymId !== coach.gymId) {
      throw new GymAccessDeniedError()
    }

    const [signals, sessions, storedReport] = await Promise.all([
      trainingRepository.getMonthlyTrainingSignals(athlete.userId, month),
      trainingRepository.getMonthlySessionSummaries(athlete.userId, month),
      monthlyReportRepository.getReport(athlete.userId, month),
    ])
    const summary = createMonthlySummary(athlete, signals)

    return createCoachMonthlyReport({
      coach,
      athlete,
      summary,
      signals,
      sessions,
      storedReport,
    })
  }

  app.get('/api/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'sigmafit-backend',
    })
  })

  app.get('/api/gyms', async (_request, response, next) => {
    try {
      response.json(await userProfileRepository.listGyms())
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/accounts', async (request, response, next) => {
    try {
      const payload = accountSchema.parse(request.body)
      const account = await userProfileRepository.createAccount(payload)
      response.status(201).json(account)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/accounts/login', async (request, response, next) => {
    try {
      const payload = accountLoginSchema.parse(request.body)
      const account = await userProfileRepository.getProfileByEmail(payload.email)

      if (!account) {
        throw new UserNotFoundError(payload.email)
      }

      if (account.role !== payload.role) {
        throw new CoachAccessRequiredError(account.userId)
      }

      response.json(account)
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/exercises', async (_request, response, next) => {
    try {
      const exerciseCatalog = await trainingRepository.getExerciseCatalog()
      response.json(exerciseCatalog)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/training-log/parse', async (request, response, next) => {
    try {
      const payload = trainingLogParseSchema.parse(request.body)
      const profile = await userProfileRepository.getProfile(payload.userId)

      if (!profile) {
        throw new UserNotFoundError(payload.userId)
      }

      const exerciseCatalog = await trainingRepository.getExerciseCatalog()
      const parsed = await parseTrainingLog(payload.text, exerciseCatalog)
      response.json(parsed)
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/post-workout-sessions', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const payload = postWorkoutSessionSchema.parse(request.body)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      if (profile.role !== 'athlete') {
        throw new CoachAccessRequiredError(id)
      }

      const catalog = await trainingRepository.getExerciseCatalog()
      const catalogByName = new Map(
        catalog.map((exercise) => [exercise.name.toLowerCase(), exercise.name] as const),
      )
      const normalizedItems = payload.items.map((item) => {
        const canonicalName = catalogByName.get(item.exerciseName.toLowerCase())
        if (!canonicalName) {
          throw new ExerciseNotFoundError(item.exerciseName)
        }

        return {
          ...item,
          exerciseName: canonicalName,
        }
      })

      const summary = await trainingRepository.createPostWorkoutSession({
        userId: id,
        routineId: payload.routineId ?? null,
        routineDayId: payload.routineDayId ?? null,
        rawText: payload.rawText,
        items: normalizedItems,
        feedback: payload.feedback,
      })

      response.status(201).json(summary)
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

  app.get('/api/users/:id/adaptive-summary', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      const signals = await trainingRepository.getAdaptiveTrainingSignals(id)
      response.json(createAdaptiveSummary(signals))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users/:id/monthly-summary', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const { month } = monthlySummaryQuerySchema.parse(request.query)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      const resolvedMonth = month ?? new Date().toISOString().slice(0, 7)
      const [signals, deliveredReport] = await Promise.all([
        trainingRepository.getMonthlyTrainingSignals(id, resolvedMonth),
        monthlyReportRepository.getDeliveredReport(id, resolvedMonth),
      ])
      const summary = createMonthlySummary(profile, signals)

      response.json({
        ...summary,
        deliveredReport: deliveredReport
          ? {
              reportId: deliveredReport.reportId,
              coachName: deliveredReport.coachName,
              generatedSummary: deliveredReport.generatedSummary,
              strengths: deliveredReport.strengths,
              opportunities: deliveredReport.opportunities,
              recommendation: deliveredReport.recommendation,
              coachNotes: deliveredReport.coachNotes,
              deliveredAt: deliveredReport.updatedAt,
            }
          : null,
      })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/coach/athletes-overview', async (request, response, next) => {
    try {
      const { coachUserId } = coachOverviewQuerySchema.parse(request.query)
      const coachProfile = coachUserId
        ? await userProfileRepository.getProfile(coachUserId)
        : (await userProfileRepository.listProfiles({ role: 'coach' }))[0] ?? null

      if (!coachProfile) {
        throw new UserNotFoundError(coachUserId ?? 'coach')
      }

      if (coachProfile.role !== 'coach' || !coachProfile.gymId) {
        throw new CoachAccessRequiredError(coachProfile.userId)
      }

      const profiles = await userProfileRepository.listProfiles({
        gymId: coachProfile.gymId,
        role: 'athlete',
      })
      const month = new Date().toISOString().slice(0, 7)
      const summariesByUser = new Map<string, MonthlySummary>()
      const signalsByUser = new Map<string, AdaptiveTrainingSignals>()
      const reportStatusByUser = new Map<string, MonthlyReportStatus>()

      await Promise.all(
        profiles.map(async (profile) => {
          const [monthlySignals, adaptiveSignals, report] = await Promise.all([
            trainingRepository.getMonthlyTrainingSignals(profile.userId, month),
            trainingRepository.getAdaptiveTrainingSignals(profile.userId),
            monthlyReportRepository.getReport(profile.userId, month),
          ])

          summariesByUser.set(profile.userId, createMonthlySummary(profile, monthlySignals))
          signalsByUser.set(profile.userId, adaptiveSignals)
          reportStatusByUser.set(profile.userId, report?.status ?? 'draft')
        }),
      )

      response.json(
        createCoachOverview(profiles, summariesByUser, signalsByUser, {
          gymId: coachProfile.gymId,
          gymName: coachProfile.gymName,
        }, reportStatusByUser),
      )
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/coach/athletes/:athleteId/monthly-report', async (request, response, next) => {
    try {
      const { athleteId } = coachMonthlyReportParamsSchema.parse(request.params)
      const { coachUserId, month } = coachMonthlyReportQuerySchema.parse(request.query)
      const report = await loadCoachMonthlyReport(
        coachUserId,
        athleteId,
        month ?? new Date().toISOString().slice(0, 7),
      )
      response.json(report)
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/coach/athletes/:athleteId/monthly-report/review', async (request, response, next) => {
    try {
      const { athleteId } = coachMonthlyReportParamsSchema.parse(request.params)
      const payload = reviewMonthlyReportSchema.parse(request.body)
      const report = await loadCoachMonthlyReport(payload.coachUserId, athleteId, payload.month)
      const storedReport = await monthlyReportRepository.saveReport({
        coachUserId: payload.coachUserId,
        athleteUserId: athleteId,
        gymId: report.gym.gymId,
        month: payload.month,
        generatedSummary: report.generatedSummary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        opportunities: report.opportunities,
        recommendation: report.recommendation,
        coachNotes: payload.coachNotes,
        status: payload.status,
      })

      response.json({
        ...report,
        reportId: storedReport.reportId,
        coachNotes: storedReport.coachNotes,
        status: storedReport.status,
        updatedAt: storedReport.updatedAt,
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/users/:id/adaptive-recommendations', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      const signals = await trainingRepository.getAdaptiveTrainingSignals(id)
      const draft = createAdaptiveRecommendationDraft(signals)
      const recommendation = await trainingRepository.saveAdaptiveRecommendation(draft)

      response.status(201).json(recommendationToSummary(signals, recommendation))
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/users/:id/adaptive-recommendations/latest', async (request, response, next) => {
    try {
      const { id } = userParamsSchema.parse(request.params)
      const profile = await userProfileRepository.getProfile(id)

      if (!profile) {
        throw new UserNotFoundError(id)
      }

      const recommendation = await trainingRepository.getLatestAdaptiveRecommendation(id)

      if (!recommendation) {
        response.status(404).json({
          error: 'ADAPTIVE_RECOMMENDATION_NOT_FOUND',
          message: `No existe una recomendacion adaptativa para el usuario ${id}.`,
        })
        return
      }

      response.json(recommendation)
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

    if (error instanceof GymNotFoundError) {
      response.status(404).json({
        error: 'GYM_NOT_FOUND',
        message: error.message,
      })
      return
    }

    if (error instanceof GymRequiredError) {
      response.status(400).json({
        error: 'GYM_REQUIRED',
        message: error.message,
      })
      return
    }

    if (error instanceof CoachAccessRequiredError) {
      response.status(403).json({
        error: 'ROLE_ACCESS_DENIED',
        message: error.message,
      })
      return
    }

    if (error instanceof GymAccessDeniedError) {
      response.status(403).json({
        error: 'GYM_ACCESS_DENIED',
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
