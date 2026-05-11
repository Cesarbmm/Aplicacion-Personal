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
          equipment: 'Barra',
          exerciseOrder: 1,
          sets: 4,
          reps: '8-12',
          restSeconds: 90,
        },
      ],
    },
  ],
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
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

  it('shows the routine generation button when no active routine exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse(
        {
          error: 'ROUTINE_NOT_FOUND',
          message: 'No existe una rutina activa.',
        },
        404,
      ),
    )

    await renderRoute('/dashboard')

    expect((await screen.findAllByRole('button', { name: /generar rutina semanal/i })).length).toBeGreaterThan(0)
  })

  it('generates a routine and renders its days and exercises', async () => {
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
      .mockResolvedValueOnce(jsonResponse(generatedRoutineResponse, 201))

    await renderRoute('/dashboard')
    const user = userEvent.setup()

    await user.click((await screen.findAllByRole('button', { name: /generar rutina semanal/i }))[0])

    await waitFor(() => {
      expect(screen.getAllByText(/dia 1 - push/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/press de banca/i)).toBeTruthy()
    })
  })
})
