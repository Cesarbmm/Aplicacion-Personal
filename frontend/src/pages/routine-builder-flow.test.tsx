import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { useSigmafitStore } from '@/store/sigmafit-store'
import { renderRoute } from '@/test/render-route'

const demoUserId = '11111111-1111-4111-8111-111111111111'

const exerciseCatalogResponse = [
  {
    exerciseId: 'exercise-bench',
    name: 'Press de banca',
    muscleGroup: 'Pecho',
    movementPattern: 'Empuje horizontal',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'exercise-row',
    name: 'Remo con barra',
    muscleGroup: 'Espalda',
    movementPattern: 'Tiron horizontal',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'hypertrophy',
  },
]

const manualRoutineResponse = {
  routineId: 'manual-routine-1',
  userId: demoUserId,
  name: 'Rutina personalizada avanzada',
  goal: 'hypertrophy',
  daysPerWeek: 4,
  creationMode: 'manual',
  isActive: true,
  createdAt: '2026-01-07T00:00:00.000Z',
  days: [
    {
      routineDayId: 'manual-day-1',
      dayNumber: 1,
      title: 'Push A',
      exercises: [
        {
          routineExerciseId: 'manual-exercise-1',
          exerciseId: 'exercise-bench',
          name: 'Press de banca',
          muscleGroup: 'Pecho',
          movementPattern: 'Empuje horizontal',
          equipment: 'Barra',
          exerciseOrder: 1,
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
        },
      ],
    },
    {
      routineDayId: 'manual-day-2',
      dayNumber: 2,
      title: 'Pull A',
      exercises: [
        {
          routineExerciseId: 'manual-exercise-2',
          exerciseId: 'exercise-row',
          name: 'Remo con barra',
          muscleGroup: 'Espalda',
          movementPattern: 'Tiron horizontal',
          equipment: 'Barra',
          exerciseOrder: 1,
          sets: 4,
          reps: '8-10',
          restSeconds: 90,
        },
      ],
    },
    {
      routineDayId: 'manual-day-3',
      dayNumber: 3,
      title: 'Legs A',
      exercises: [
        {
          routineExerciseId: 'manual-exercise-3',
          exerciseId: 'exercise-bench',
          name: 'Press de banca',
          muscleGroup: 'Pecho',
          movementPattern: 'Empuje horizontal',
          equipment: 'Barra',
          exerciseOrder: 1,
          sets: 3,
          reps: '10-12',
          restSeconds: 75,
        },
      ],
    },
    {
      routineDayId: 'manual-day-4',
      dayNumber: 4,
      title: 'Upper B',
      exercises: [
        {
          routineExerciseId: 'manual-exercise-4',
          exerciseId: 'exercise-row',
          name: 'Remo con barra',
          muscleGroup: 'Espalda',
          movementPattern: 'Tiron horizontal',
          equipment: 'Barra',
          exerciseOrder: 1,
          sets: 3,
          reps: '10-12',
          restSeconds: 75,
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

describe('SigmaFit routine builder flow', () => {
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
        experienceLevel: 'advanced',
      },
    })
  })

  it('validates that each day has at least one exercise before saving', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse(exerciseCatalogResponse))

    await renderRoute('/routine-builder')
    const user = userEvent.setup()

    await user.click(await screen.findByLabelText(/eliminar ejercicio dia 1 fila 1/i))
    await user.click(screen.getByRole('button', { name: /guardar rutina manual/i }))

    expect(await screen.findByText(/agrega al menos un ejercicio en el dia 1/i)).toBeTruthy()
  })

  it('saves a manual routine and shows it as active on the dashboard', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(exerciseCatalogResponse))
      .mockResolvedValueOnce(jsonResponse(manualRoutineResponse, 201))
      .mockResolvedValueOnce(jsonResponse(manualRoutineResponse))

    await renderRoute('/routine-builder')
    const user = userEvent.setup()

    const routineNameInput = screen.getByLabelText(/nombre de la rutina/i)
    await user.clear(routineNameInput)
    await user.type(routineNameInput, 'Rutina personalizada avanzada')
    await user.click(screen.getByRole('button', { name: /guardar rutina manual/i }))

    await waitFor(() => {
      expect(screen.getByText(/rutina manual activa/i)).toBeTruthy()
      expect(screen.getAllByText(/rutina personalizada avanzada/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/abrir workout/i).length).toBeGreaterThan(0)
    })
  })
})
