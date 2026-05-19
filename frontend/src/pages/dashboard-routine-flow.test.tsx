import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { useSigmafitStore } from '@/store/sigmafit-store'
import { renderRoute } from '@/test/render-route'

const demoUserId = '11111111-1111-4111-8111-111111111111'

const generatedRoutineResponse = {
  routineId: 'routine-demo-1',
  userId: demoUserId,
  name: 'Rutina semanal - Hipertrofia',
  goal: 'hypertrophy',
  daysPerWeek: 3,
  creationMode: 'coach',
  isActive: true,
  createdAt: '2026-01-05T00:00:00.000Z',
  days: [
    {
      routineDayId: 'routine-day-1',
      dayNumber: 1,
      title: 'Dia 1 - Push',
      exercises: [
        {
          routineExerciseId: 'routine-ex-1',
          exerciseId: 'exercise-bench',
          name: 'Press de banca',
          muscleGroup: 'Pecho',
          movementPattern: 'Empuje horizontal',
          equipment: 'Barra olimpica y banco plano',
          trackingType: 'weight_reps',
          coachingCue: 'Usa banco plano, pies firmes y barra controlada.',
          exerciseOrder: 1,
          sets: 4,
          reps: '8-12',
          restSeconds: 90,
        },
      ],
    },
  ],
}

const adaptiveSummaryResponse = {
  userId: demoUserId,
  routineId: null,
  sessionsAnalyzed: 0,
  completedSets: 0,
  plannedSets: 0,
  completionRate: 0,
  averageFatigue: null,
  averagePain: null,
  maxPain: null,
  totalVolume: 0,
  totalReps: 0,
  totalSeconds: 0,
  notes: [],
  recommendation: {
    type: 'maintain',
    summary: 'Aun no hay sesiones suficientes para ajustar.',
    reasoning: 'Finaliza entrenamientos para generar una lectura adaptativa.',
    suggestedLoadChangePercent: 0,
    suggestedVolumeChange: 'maintain',
    riskLevel: 'low',
  },
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function mockNoRoutineAndAdaptive() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'ROUTINE_NOT_FOUND',
          message: 'No existe una rutina activa.',
        },
        404,
      ),
    )
    .mockResolvedValueOnce(jsonResponse(adaptiveSummaryResponse))
}

describe('SigmaFit dashboard routine flow', () => {
  beforeEach(() => {
    useSigmafitStore.setState({
      ...createDefaultSigmafitState(),
      session: {
        ...createDefaultSigmafitState().session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: true,
      },
      profile: {
        ...createDefaultSigmafitState().profile,
        email: 'demo@sigmafit.app',
      },
    })
  })

  it('shows the create my routine panel when there is no active routine and hides generic mock routines', async () => {
    mockNoRoutineAndAdaptive()

    await renderRoute('/dashboard')

    expect(await screen.findByText(/crear mi rutina/i)).toBeTruthy()
    expect(screen.getByText(/con estos datos sigmafit puede generar una propuesta/i)).toBeTruthy()
    expect(screen.queryByText(/press de banca/i)).toBeNull()
    expect(screen.queryByText(/abrir workout/i)).toBeNull()
    expect(screen.getByText(/estado adaptativo/i)).toBeTruthy()
  })

  it('shows the coach recommendation for beginner and intermediate users', async () => {
    useSigmafitStore.setState({
      ...useSigmafitStore.getState(),
      profile: {
        ...useSigmafitStore.getState().profile,
        experienceLevel: 'beginner',
      },
    })

    mockNoRoutineAndAdaptive()

    await renderRoute('/dashboard')

    expect(
      await screen.findByText(/recomendado: usa el coach virtual para obtener una rutina estructurada y segura/i),
    ).toBeTruthy()
  })

  it('highlights the manual option for advanced users', async () => {
    useSigmafitStore.setState({
      ...useSigmafitStore.getState(),
      profile: {
        ...useSigmafitStore.getState().profile,
        experienceLevel: 'advanced',
      },
    })

    mockNoRoutineAndAdaptive()

    await renderRoute('/dashboard')

    expect(
      await screen.findByText(/puedes crear tu propia rutina o generar una propuesta inicial del coach virtual/i),
    ).toBeTruthy()
    expect(screen.getAllByText(/crear rutina manual/i).length).toBeGreaterThan(0)
  })

  it('generates a coach proposal and only activates it after user confirmation', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: 'ROUTINE_NOT_FOUND',
            message: 'No existe una rutina activa.',
          },
          404,
        ),
      )
      .mockResolvedValueOnce(jsonResponse(adaptiveSummaryResponse))
      .mockResolvedValueOnce(jsonResponse(generatedRoutineResponse, 201))

    await renderRoute('/dashboard')
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('button', { name: /generar con coach virtual/i })[0])

    await waitFor(() => {
      expect(screen.getByText(/propuesta del coach virtual/i)).toBeTruthy()
      expect(screen.getAllByText(/origen: sincronizada/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/press de banca/i)).toBeTruthy()
      expect(screen.queryByText(/abrir workout/i)).toBeNull()
    })

    await user.click(screen.getByRole('button', { name: /usar esta rutina/i }))

    await waitFor(() => {
      expect(screen.getByText(/rutina activa del coach/i)).toBeTruthy()
      expect(screen.getAllByText(/abrir workout/i).length).toBeGreaterThan(0)
    })
  })
})
