import request from 'supertest'

import { createApp } from '../src/app.js'
import { createInMemoryTrainingRepository } from './helpers/in-memory-training-repository.js'
import { createInMemoryUserProfileRepository } from './helpers/in-memory-user-profile-repository.js'

const demoUserId = '11111111-1111-4111-8111-111111111111'

function createTestApp(onboardingCompleted = true) {
  return createApp({
    userProfileRepository: createInMemoryUserProfileRepository({
      userId: demoUserId,
      onboardingCompleted,
      goal: onboardingCompleted ? 'hypertrophy' : null,
      experienceLevel: onboardingCompleted ? 'intermediate' : null,
      daysPerWeek: onboardingCompleted ? 3 : null,
    }),
    trainingRepository: createInMemoryTrainingRepository(),
    frontendOrigin: 'http://localhost:5180',
  })
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
})
