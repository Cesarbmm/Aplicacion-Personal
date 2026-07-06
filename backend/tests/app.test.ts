import request from 'supertest'
import { readFileSync } from 'node:fs'

import { createApp } from '../src/app.js'
import { createInMemoryTrainingRepository } from './helpers/in-memory-training-repository.js'
import { createInMemoryUserProfileRepository } from './helpers/in-memory-user-profile-repository.js'

const demoUserId = '11111111-1111-4111-8111-111111111111'
const demoCoachId = 'c0000000-0000-4000-8000-000000000001'
const missingUserId = '22222222-2222-4222-8222-222222222222'

function createTestApp(onboardingCompleted = true) {
  return createApp({
    userProfileRepository: createInMemoryUserProfileRepository([
      {
        userId: demoCoachId,
        email: 'coach@sigmafit.app',
        name: 'Coach Sigma',
        role: 'coach',
        onboardingCompleted: false,
      },
      {
        userId: demoUserId,
        onboardingCompleted,
        goal: onboardingCompleted ? 'hypertrophy' : null,
        experienceLevel: onboardingCompleted ? 'intermediate' : null,
        daysPerWeek: onboardingCompleted ? 3 : null,
      },
    ]),
    trainingRepository: createInMemoryTrainingRepository(),
    frontendOrigin: 'http://localhost:5180',
  })
}

async function createCompletedSession({
  app,
  fatigueLevel,
  painLevel,
  completeAllSets = true,
}: {
  app: ReturnType<typeof createTestApp>
  fatigueLevel: number
  painLevel: number
  completeAllSets?: boolean
}) {
  const routineResponse = await request(app).post(`/api/users/${demoUserId}/routines/generate`)
  const routineDayId = routineResponse.body.days[0].routineDayId as string
  const routineId = routineResponse.body.routineId as string

  const sessionResponse = await request(app).post(`/api/users/${demoUserId}/workout-sessions`).send({
    routineId,
    routineDayId,
    unit: 'kg',
  })

  const setIds = sessionResponse.body.exercises.flatMap(
    (exercise: { sessionSets: Array<{ setId: string }> }) =>
      exercise.sessionSets.map((setItem) => setItem.setId),
  ) as string[]

  const idsToComplete = completeAllSets ? setIds : setIds.slice(0, 1)

  for (const setId of idsToComplete) {
    await request(app).patch(`/api/workout-sessions/${sessionResponse.body.sessionId}/sets/${setId}`).send({
      completed: true,
      weight: 50,
      unit: 'kg',
      actualReps: 10,
    })
  }

  await request(app).patch(`/api/workout-sessions/${sessionResponse.body.sessionId}/finish`).send({
    fatigueLevel,
    painLevel,
    athleteNotes: 'Registro de prueba adaptativa.',
  })

  return {
    routineId,
    sessionId: sessionResponse.body.sessionId as string,
  }
}

describe('SigmaFit backend API', () => {
  it('returns the official exercise catalog on GET /api/exercises', async () => {
    const app = createTestApp()

    const response = await request(app).get('/api/exercises')

    expect(response.status).toBe(200)
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toMatchObject({
      exerciseId: expect.any(String),
      name: expect.any(String),
    })
  })

  it('responds on GET /api/health', async () => {
    const app = createTestApp()

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      service: 'sigmafit-backend',
    })
  })

  it('lists gyms and creates coach and athlete accounts with gym membership', async () => {
    const repository = createInMemoryUserProfileRepository()
    const app = createApp({
      userProfileRepository: repository,
      trainingRepository: createInMemoryTrainingRepository(),
      frontendOrigin: 'http://localhost:5180',
    })

    const gymsResponse = await request(app).get('/api/gyms')
    expect(gymsResponse.status).toBe(200)
    expect(gymsResponse.body.length).toBeGreaterThan(0)

    const coachResponse = await request(app).post('/api/accounts').send({
      email: 'new.coach@sigmafit.app',
      name: 'New Coach',
      role: 'coach',
      gymName: 'Power House',
    })
    expect(coachResponse.status).toBe(201)
    expect(coachResponse.body).toMatchObject({
      role: 'coach',
      gymName: 'Power House',
    })

    const athleteResponse = await request(app).post('/api/accounts').send({
      email: 'new.athlete@sigmafit.app',
      name: 'New Athlete',
      role: 'athlete',
      gymId: gymsResponse.body[0].gymId,
    })
    expect(athleteResponse.status).toBe(201)
    expect(athleteResponse.body).toMatchObject({
      role: 'athlete',
      gymId: gymsResponse.body[0].gymId,
    })
  })

  it('rejects athlete account creation without a gym', async () => {
    const app = createTestApp()
    const response = await request(app).post('/api/accounts').send({
      email: 'without.gym@sigmafit.app',
      name: 'No Gym',
      role: 'athlete',
    })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('VALIDATION_ERROR')
  })

  it('parses a complete assisted training log', async () => {
    const app = createTestApp()

    const response = await request(app).post('/api/training-log/parse').send({
      userId: demoUserId,
      text: 'Hice press de banca, 4 series de 8 con 80kg',
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'complete',
      items: [
        {
          exerciseName: 'Press de banca',
          sets: 4,
          reps: 8,
          weight: 80,
          unit: 'kg',
          trackingType: 'weight_reps',
        },
      ],
      parsed: {
        exerciseName: 'Press de banca',
        sets: 4,
        reps: 8,
        weight: 80,
        unit: 'kg',
      },
      followUpQuestion: null,
      followUpQuestions: [],
    })
  })

  it('asks a follow-up question when assisted training log data is incomplete', async () => {
    const app = createTestApp()

    const response = await request(app).post('/api/training-log/parse').send({
      userId: demoUserId,
      text: 'Hice banca con 80kg',
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('needs_follow_up')
    expect(response.body.parsed).toMatchObject({
      exerciseName: 'Press de banca',
      weight: 80,
      unit: 'kg',
    })
    expect(response.body.followUpQuestions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/cuantas series/i),
        expect.stringMatching(/cuantas repeticiones/i),
      ]),
    )
  })

  it('parses multiple exercises, time work, fatigue and pain', async () => {
    const app = createTestApp()
    const response = await request(app).post('/api/training-log/parse').send({
      userId: demoUserId,
      text: 'Hoy hice banca 4x8 80kg, sentadilla 3x10 100kg y plancha 3 series de 45 segundos. Fatiga 7, dolor 2. Nota: rodilla estable.',
    })

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('complete')
    expect(response.body.items).toHaveLength(3)
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ exerciseName: 'Press de banca', sets: 4, reps: 8, weight: 80 }),
        expect.objectContaining({ exerciseName: 'Sentadilla con barra', sets: 3, reps: 10, weight: 100 }),
        expect.objectContaining({ exerciseName: 'Plancha abdominal', sets: 3, actualSeconds: 45 }),
      ]),
    )
    expect(response.body.sessionFeedback).toMatchObject({
      fatigueLevel: 7,
      painLevel: 2,
      athleteNotes: 'rodilla estable',
    })
  })

  it('stores a completed post-workout session without requiring an active routine', async () => {
    const app = createTestApp()
    const response = await request(app).post(`/api/users/${demoUserId}/post-workout-sessions`).send({
      routineId: null,
      routineDayId: null,
      rawText: 'Banca 4x8 80kg y plancha 3 series de 45 segundos. Fatiga 7 dolor 2.',
      items: [
        {
          exerciseName: 'Press de banca',
          sets: 4,
          reps: 8,
          weight: 80,
          unit: 'kg',
          actualSeconds: null,
        },
        {
          exerciseName: 'Plancha abdominal',
          sets: 3,
          reps: null,
          weight: null,
          unit: 'kg',
          actualSeconds: 45,
        },
      ],
      feedback: {
        fatigueLevel: 7,
        painLevel: 2,
        athleteNotes: 'Buen entrenamiento.',
      },
    })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      status: 'completed',
      completedSets: 7,
      totalReps: 32,
      totalSeconds: 135,
      fatigueLevel: 7,
      painLevel: 2,
    })
  })

  it('returns a controlled error when parsing logs for missing users', async () => {
    const app = createTestApp()

    const response = await request(app).post('/api/training-log/parse').send({
      userId: missingUserId,
      text: 'Hice press de banca, 4 series de 8 con 80kg',
    })

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('USER_NOT_FOUND')
  })

  it('saves onboarding on POST /api/users/:id/onboarding', async () => {
    const app = createApp({
      userProfileRepository: createInMemoryUserProfileRepository({
        userId: demoUserId,
        onboardingCompleted: false,
      }),
      trainingRepository: createInMemoryTrainingRepository(),
      frontendOrigin: 'http://localhost:5180',
    })

    const response = await request(app)
      .post(`/api/users/${demoUserId}/onboarding`)
      .send({
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        daysPerWeek: 4,
      })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      userId: demoUserId,
      onboardingCompleted: true,
      goal: 'hypertrophy',
      experienceLevel: 'intermediate',
      daysPerWeek: 4,
    })
  })

  it('rejects invalid onboarding payloads', async () => {
    const app = createApp({
      userProfileRepository: createInMemoryUserProfileRepository({
        userId: demoUserId,
        onboardingCompleted: false,
      }),
      trainingRepository: createInMemoryTrainingRepository(),
      frontendOrigin: 'http://localhost:5180',
    })

    const response = await request(app)
      .post(`/api/users/${demoUserId}/onboarding`)
      .send({
        goal: 'invalid-goal',
        experienceLevel: 'intermediate',
        daysPerWeek: 1,
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('VALIDATION_ERROR')
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'goal' }),
        expect.objectContaining({ path: 'daysPerWeek' }),
      ]),
    )
  })

  it('returns 404 when the user has no active routine', async () => {
    const app = createTestApp(true)

    const response = await request(app).get(`/api/users/${demoUserId}/routines/current`)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('ROUTINE_NOT_FOUND')
  })

  it('generates a routine when onboarding is completed', async () => {
    const app = createTestApp(true)

    const response = await request(app).post(`/api/users/${demoUserId}/routines/generate`)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      userId: demoUserId,
      goal: 'hypertrophy',
      daysPerWeek: 3,
    })
    expect(response.body.days.length).toBe(3)
    expect(response.body.days[0].exercises.length).toBeGreaterThan(0)
  })

  it('rejects routine generation when onboarding is incomplete', async () => {
    const app = createTestApp(false)

    const response = await request(app).post(`/api/users/${demoUserId}/routines/generate`)

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('ONBOARDING_REQUIRED')
  })

  it('creates a manual routine with valid data', async () => {
    const app = createTestApp(true)
    const catalogResponse = await request(app).get('/api/exercises')
    const exerciseId = catalogResponse.body[0].exerciseId as string

    const response = await request(app)
      .post(`/api/users/${demoUserId}/routines/manual`)
      .send({
        name: 'Rutina personalizada avanzada',
        goal: 'hypertrophy',
        daysPerWeek: 2,
        days: [
          {
            dayNumber: 1,
            title: 'Push A',
            exercises: [
              {
                exerciseId,
                sets: 4,
                reps: '8-10',
                restSeconds: 90,
              },
            ],
          },
          {
            dayNumber: 2,
            title: 'Pull A',
            exercises: [
              {
                exerciseId,
                sets: 3,
                reps: '10-12',
                restSeconds: 75,
              },
            ],
          },
        ],
      })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      userId: demoUserId,
      name: 'Rutina personalizada avanzada',
      creationMode: 'manual',
      daysPerWeek: 2,
    })
    expect(response.body.days[0].exercises.length).toBe(1)
  })

  it('rejects manual routines when onboarding is incomplete', async () => {
    const app = createTestApp(false)

    const response = await request(app)
      .post(`/api/users/${demoUserId}/routines/manual`)
      .send({
        name: 'Rutina manual',
        goal: 'hypertrophy',
        daysPerWeek: 2,
        days: [
          {
            dayNumber: 1,
            title: 'Dia 1',
            exercises: [
              {
                exerciseId: 'exercise-bench',
                sets: 3,
                reps: '8-10',
                restSeconds: 90,
              },
            ],
          },
          {
            dayNumber: 2,
            title: 'Dia 2',
            exercises: [
              {
                exerciseId: 'exercise-row',
                sets: 3,
                reps: '10-12',
                restSeconds: 75,
              },
            ],
          },
        ],
      })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('ONBOARDING_REQUIRED')
  })

  it('rejects manual routines when an exercise does not exist in the catalog', async () => {
    const app = createTestApp(true)

    const response = await request(app)
      .post(`/api/users/${demoUserId}/routines/manual`)
      .send({
        name: 'Rutina manual',
        goal: 'hypertrophy',
        daysPerWeek: 2,
        days: [
          {
            dayNumber: 1,
            title: 'Dia 1',
            exercises: [
              {
                exerciseId: 'exercise-does-not-exist',
                sets: 3,
                reps: '8-10',
                restSeconds: 90,
              },
            ],
          },
          {
            dayNumber: 2,
            title: 'Dia 2',
            exercises: [
              {
                exerciseId: 'exercise-bench',
                sets: 3,
                reps: '10-12',
                restSeconds: 75,
              },
            ],
          },
        ],
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('EXERCISE_NOT_FOUND')
  })

  it('rejects manual routines with duplicated days or invalid data', async () => {
    const app = createTestApp(true)

    const response = await request(app)
      .post(`/api/users/${demoUserId}/routines/manual`)
      .send({
        name: '',
        goal: 'hypertrophy',
        daysPerWeek: 2,
        days: [
          {
            dayNumber: 1,
            title: 'Dia 1',
            exercises: [],
          },
          {
            dayNumber: 1,
            title: '',
            exercises: [
              {
                exerciseId: 'exercise-bench',
                sets: 0,
                reps: '',
                restSeconds: 0,
              },
            ],
          },
        ],
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('VALIDATION_ERROR')
  })

  it('deactivates the previous active routine when a manual one is created', async () => {
    const app = createTestApp(true)
    const generatedRoutineResponse = await request(app).post(`/api/users/${demoUserId}/routines/generate`)
    const previousRoutineId = generatedRoutineResponse.body.routineId as string
    const catalogResponse = await request(app).get('/api/exercises')
    const exerciseId = catalogResponse.body[0].exerciseId as string

    const manualRoutineResponse = await request(app)
      .post(`/api/users/${demoUserId}/routines/manual`)
      .send({
        name: 'Rutina manual',
        goal: 'strength',
        daysPerWeek: 2,
        days: [
          {
            dayNumber: 1,
            title: 'Upper',
            exercises: [
              {
                exerciseId,
                sets: 5,
                reps: '3-5',
                restSeconds: 180,
              },
            ],
          },
          {
            dayNumber: 2,
            title: 'Lower',
            exercises: [
              {
                exerciseId,
                sets: 4,
                reps: '5-6',
                restSeconds: 150,
              },
            ],
          },
        ],
      })

    const previousRoutineResponse = await request(app).get(`/api/routines/${previousRoutineId}`)
    const currentRoutineResponse = await request(app).get(`/api/users/${demoUserId}/routines/current`)

    expect(manualRoutineResponse.status).toBe(201)
    expect(previousRoutineResponse.body.isActive).toBe(false)
    expect(currentRoutineResponse.body.routineId).toBe(manualRoutineResponse.body.routineId)
    expect(currentRoutineResponse.body.creationMode).toBe('manual')
  })

  it('creates a workout session from a routine day', async () => {
    const app = createTestApp(true)

    const routineResponse = await request(app).post(`/api/users/${demoUserId}/routines/generate`)
    const routineDayId = routineResponse.body.days[0].routineDayId as string
    const routineId = routineResponse.body.routineId as string

    const response = await request(app).post(`/api/users/${demoUserId}/workout-sessions`).send({
      routineId,
      routineDayId,
      unit: 'kg',
    })

    expect(response.status).toBe(201)
    expect(response.body.routineId).toBe(routineId)
    expect(response.body.routineDayId).toBe(routineDayId)
    expect(response.body.exercises[0].sessionSets.length).toBeGreaterThan(0)
  })

  it('marks a workout set as completed and stores the lifted weight', async () => {
    const app = createTestApp(true)

    const routineResponse = await request(app).post(`/api/users/${demoUserId}/routines/generate`)
    const routineDayId = routineResponse.body.days[0].routineDayId as string
    const routineId = routineResponse.body.routineId as string

    const sessionResponse = await request(app).post(`/api/users/${demoUserId}/workout-sessions`).send({
      routineId,
      routineDayId,
      unit: 'kg',
    })

    const sessionId = sessionResponse.body.sessionId as string
    const setId = sessionResponse.body.exercises[0].sessionSets[0].setId as string

    const response = await request(app)
      .patch(`/api/workout-sessions/${sessionId}/sets/${setId}`)
      .send({
        completed: true,
        weight: 50,
        unit: 'kg',
        actualReps: 12,
      })

    expect(response.status).toBe(200)
    expect(response.body.exercises[0].sessionSets[0]).toMatchObject({
      setId,
      completed: true,
      weight: 50,
      unit: 'kg',
      actualReps: 12,
    })
  })

  it('finishes a workout session with athlete feedback and real set summary', async () => {
    const app = createTestApp(true)

    const routineResponse = await request(app).post(`/api/users/${demoUserId}/routines/generate`)
    const routineDayId = routineResponse.body.days[0].routineDayId as string
    const routineId = routineResponse.body.routineId as string

    const sessionResponse = await request(app).post(`/api/users/${demoUserId}/workout-sessions`).send({
      routineId,
      routineDayId,
      unit: 'kg',
    })

    const sessionId = sessionResponse.body.sessionId as string
    const setId = sessionResponse.body.exercises[0].sessionSets[0].setId as string

    await request(app).patch(`/api/workout-sessions/${sessionId}/sets/${setId}`).send({
      completed: true,
      weight: 50,
      unit: 'kg',
      actualReps: 10,
    })

    const response = await request(app).patch(`/api/workout-sessions/${sessionId}/finish`).send({
      fatigueLevel: 8,
      painLevel: 2,
      athleteNotes: 'Fatiga alta en el ultimo set.',
    })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      sessionId,
      status: 'completed',
      completedSets: 1,
      totalVolume: 500,
      totalReps: 10,
      fatigueLevel: 8,
      painLevel: 2,
      athleteNotes: 'Fatiga alta en el ultimo set.',
    })
  })

  it('returns an adaptive summary even without completed sessions', async () => {
    const app = createTestApp(true)

    const response = await request(app).get(`/api/users/${demoUserId}/adaptive-summary`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      userId: demoUserId,
      sessionsAnalyzed: 0,
      completionRate: 0,
      recommendation: {
        type: 'maintain',
      },
    })
  })

  it('returns a monthly summary for the athlete', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 6, painLevel: 2 })

    const response = await request(app).get(`/api/users/${demoUserId}/monthly-summary?month=2026-01`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      userId: demoUserId,
      month: '2026-01',
      completedSessions: 1,
      totalVolume: expect.any(Number),
      progressionTrend: expect.any(String),
      summary: expect.any(String),
    })
  })

  it('returns a controlled error for monthly summary of missing users', async () => {
    const app = createTestApp(true)

    const response = await request(app).get(`/api/users/${missingUserId}/monthly-summary`)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('USER_NOT_FOUND')
  })

  it('returns coach athletes overview from existing profiles and training signals', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 8, painLevel: 3 })

    const response = await request(app).get('/api/coach/athletes-overview')

    expect(response.status).toBe(200)
    expect(response.body.athletes).toHaveLength(1)
    expect(response.body.athletes[0]).toMatchObject({
      userId: demoUserId,
      name: 'Demo Athlete',
      consistencyRate: expect.any(Number),
      progressionTrend: expect.any(String),
      weakPoints: expect.any(Array),
      coachInsight: expect.any(String),
    })
  })

  it('limits coach overview to athletes from the coach gym', async () => {
    const repository = createInMemoryUserProfileRepository([
      {
        userId: demoCoachId,
        email: 'coach@sigmafit.app',
        name: 'Sigma Coach',
        role: 'coach',
      },
      {
        userId: demoUserId,
        email: 'atleta1@sigmafit.app',
        name: 'Sigma Athlete',
        role: 'athlete',
        onboardingCompleted: true,
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        daysPerWeek: 3,
      },
    ])
    const titanCoach = await repository.createAccount({
      email: 'titan.coach@sigmafit.app',
      name: 'Titan Coach',
      role: 'coach',
      gymName: 'Titan Fitness',
    })
    const titanGym = (await repository.listGyms()).find((gym) => gym.name === 'Titan Fitness')!
    const titanAthlete = await repository.createAccount({
      email: 'titan1@sigmafit.app',
      name: 'Titan Athlete',
      role: 'athlete',
      gymId: titanGym.gymId,
    })
    const app = createApp({
      userProfileRepository: repository,
      trainingRepository: createInMemoryTrainingRepository(),
      frontendOrigin: 'http://localhost:5180',
    })

    const response = await request(app).get(
      `/api/coach/athletes-overview?coachUserId=${titanCoach.userId}`,
    )

    expect(response.status).toBe(200)
    expect(response.body.gymName).toBe('Titan Fitness')
    expect(response.body.athletes).toHaveLength(1)
    expect(response.body.athletes[0].userId).toBe(titanAthlete.userId)
  })

  it('ships a month demo seed with two gyms, coaches and ten athletes', () => {
    const schemaSeed = readFileSync(
      new URL('../../database/init/007_gyms_and_demo_data.sql', import.meta.url),
      'utf8',
    )
    const monthSeed = readFileSync(
      new URL('../../database/init/008_demo_month_data.sql', import.meta.url),
      'utf8',
    )

    expect(schemaSeed).toContain('Sigma Gym Norte')
    expect(schemaSeed).toContain('Titan Fitness')
    expect(monthSeed.match(/@sigmafit\.app/g)?.length ?? 0).toBeGreaterThanOrEqual(12)
    expect(monthSeed).toContain('perceived_fatigue')
  })

  it('creates and stores an adaptive recommendation', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 4, painLevel: 1 })

    const response = await request(app).post(`/api/users/${demoUserId}/adaptive-recommendations`)
    const latestResponse = await request(app).get(`/api/users/${demoUserId}/adaptive-recommendations/latest`)

    expect(response.status).toBe(201)
    expect(response.body.recommendation.type).toBe('progress')
    expect(latestResponse.status).toBe(200)
    expect(latestResponse.body.type).toBe('progress')
  })

  it('recommends deload when fatigue is high', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 9, painLevel: 2 })

    const response = await request(app).get(`/api/users/${demoUserId}/adaptive-summary`)

    expect(response.status).toBe(200)
    expect(response.body.recommendation.type).toBe('deload')
    expect(response.body.recommendation.suggestedVolumeChange).toBe('reduce')
  })

  it('marks high risk when pain is high', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 6, painLevel: 8 })

    const response = await request(app).get(`/api/users/${demoUserId}/adaptive-summary`)

    expect(response.status).toBe(200)
    expect(response.body.recommendation.riskLevel).toBe('high')
    expect(response.body.recommendation.type).toBe('deload')
  })

  it('recommends simplify when completion is low', async () => {
    const app = createTestApp(true)
    await createCompletedSession({ app, fatigueLevel: 5, painLevel: 1, completeAllSets: false })

    const response = await request(app).get(`/api/users/${demoUserId}/adaptive-summary`)

    expect(response.status).toBe(200)
    expect(response.body.completionRate).toBeLessThan(0.6)
    expect(response.body.recommendation.type).toBe('simplify')
  })

  it('returns a controlled error for adaptive summary of missing users', async () => {
    const app = createTestApp(true)

    const response = await request(app).get(`/api/users/${missingUserId}/adaptive-summary`)

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('USER_NOT_FOUND')
  })
})
