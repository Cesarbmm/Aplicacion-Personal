import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createLocalWorkoutSession, generateLocalRoutine } from '@/lib/sigmafit/local-coach'
import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { useSigmafitStore } from '@/store/sigmafit-store'
import { renderRoute } from '@/test/render-route'

const demoUserId = '11111111-1111-4111-8111-111111111111'

describe('SigmaFit workout tracker', () => {
  beforeEach(() => {
    const baseState = createDefaultSigmafitState()
    const routine = generateLocalRoutine(baseState.profile, demoUserId)

    useSigmafitStore.setState({
      ...baseState,
      session: {
        ...baseState.session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: true,
        backendStatus: 'offline',
      },
      routine: {
        currentRoutine: routine,
        proposedRoutine: null,
        exerciseCatalog: [],
        isLoading: false,
        isCatalogLoading: false,
        isSavingManual: false,
        error: null,
        source: 'fallback',
        proposalSource: 'none',
        lastGeneratedAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
        hasUserChosenRoutineFlow: true,
        proposalPendingAcceptance: false,
        pendingRoutineId: null,
        selectedCreationFlow: 'coach',
      },
      profile: {
        ...baseState.profile,
        email: 'demo@sigmafit.app',
      },
    })
  })

  it('renders the generated routine day preview with exercises and prescriptions', async () => {
    await renderRoute('/workout')

    expect(await screen.findByText(/preview del dia/i)).toBeTruthy()
    expect(screen.getAllByText(/dia 1 - tren superior a/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/sets/i).length).toBeGreaterThan(0)
  })

  it('stores real reps, lifted weight and starts the rest timer when a set is completed', async () => {
    const baseState = createDefaultSigmafitState()
    const routine = generateLocalRoutine(baseState.profile, demoUserId)
    const activeSession = createLocalWorkoutSession(routine, routine.days[0].routineDayId, 'kg')

    useSigmafitStore.setState({
      ...useSigmafitStore.getState(),
      routine: {
        currentRoutine: routine,
        proposedRoutine: null,
        exerciseCatalog: [],
        isLoading: false,
        isCatalogLoading: false,
        isSavingManual: false,
        error: null,
        source: 'fallback',
        proposalSource: 'none',
        lastGeneratedAt: new Date('2026-01-05T00:00:00.000Z').toISOString(),
        hasUserChosenRoutineFlow: true,
        proposalPendingAcceptance: false,
        pendingRoutineId: null,
        selectedCreationFlow: 'coach',
      },
      training: {
        activeSession,
        isStarting: false,
        isUpdatingSet: false,
        isFinishing: false,
        error: null,
        source: 'local',
        lastCompletedSummary: null,
      },
    })

    await renderRoute('/workout')
    const user = userEvent.setup()

    const weightInput = (await screen.findAllByLabelText(/peso set 1/i))[0]
    const repsInput = (await screen.findAllByLabelText(/reps set 1/i))[0]
    await user.clear(repsInput)
    await user.type(repsInput, '11')
    await user.clear(weightInput)
    await user.type(weightInput, '50')
    await user.click(screen.getAllByRole('button', { name: /completar serie/i })[0])

    await waitFor(() => {
      expect(useSigmafitStore.getState().training.activeSession?.exercises[0].sessionSets[0].completed).toBe(true)
      expect(useSigmafitStore.getState().training.activeSession?.exercises[0].sessionSets[0].actualReps).toBe(11)
      expect(useSigmafitStore.getState().training.activeSession?.exercises[0].sessionSets[0].weight).toBe(50)
      expect(screen.getByText('1:30')).toBeTruthy()
    })
  })
})
