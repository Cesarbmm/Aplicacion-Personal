import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { useSigmafitStore } from '@/store/sigmafit-store'
import { renderRoute } from '@/test/render-route'

const demoUserId = '11111111-1111-4111-8111-111111111111'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('SigmaFit sprint 4 platform experience', () => {
  beforeEach(() => {
    useSigmafitStore.setState(createDefaultSigmafitState())
    vi.restoreAllMocks()
  })

  it('final CTA sends new users to register', async () => {
    const router = await renderRoute('/')
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('link', { name: /solicitar acceso/i }).at(-1)!)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/register')
    })
  })

  it('renders the coach dashboard with athlete overview', async () => {
    const baseState = createDefaultSigmafitState()
    useSigmafitStore.setState({
      ...baseState,
      session: {
        ...baseState.session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: true,
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        athletes: [
          {
            userId: demoUserId,
            name: 'Atleta Demo',
            consistencyRate: 0.72,
            progressionTrend: 'stable',
            averageFatigue: 7,
            averagePain: 2,
            missedSessions: 2,
            weakPoints: ['fatiga alta'],
            coachInsight: 'Conviene revisar volumen semanal y recuperacion.',
          },
        ],
      }),
    )

    await renderRoute('/coach')

    expect(await screen.findByText(/panel de seguimiento para entrenadores/i)).toBeTruthy()
    expect(screen.getByText(/Atleta Demo/i)).toBeTruthy()
    expect(screen.getByText(/fatiga alta/i)).toBeTruthy()
  })
})
