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
      })

    expect(response.status).toBe(200)
    expect(response.body.exercises[0].sessionSets[0]).toMatchObject({
      setId,
      completed: true,
      weight: 50,
      unit: 'kg',
    })
  })
})
