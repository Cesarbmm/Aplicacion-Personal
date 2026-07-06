import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'

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

describe('SigmaFit product polish', () => {
  beforeEach(() => {
    useSigmafitStore.setState(createDefaultSigmafitState())
    vi.restoreAllMocks()
  })

  it('landing keeps only the main global actions and uses a cover background', async () => {
    await renderRoute('/')

    expect((await screen.findAllByRole('link', { name: /iniciar sesi.n/i })).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /crear cuenta/i }).length).toBeGreaterThan(0)
    expect(screen.queryByText(/ver demo/i)).toBeNull()
    expect(screen.getByTestId('landing-hero-background').style.backgroundSize).toBe('cover, cover, cover, auto, auto')
  })

  it('final CTA sends new users to signup and does not show a secondary demo button', async () => {
    const router = await renderRoute('/')
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('link', { name: /adquiere ahora sigmafit/i })[0])

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/signup')
    })
  })

  it('login athlete goes to onboarding when profile is incomplete', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        userId: demoUserId,
        email: 'atleta@sigmafit.app',
        name: 'Atleta Sigma',
        role: 'athlete',
        gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        gymName: 'Sigma Gym Norte',
        onboardingCompleted: false,
        goal: null,
        experienceLevel: null,
        daysPerWeek: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    )

    const router = await renderRoute('/login')
    const user = userEvent.setup()

    await user.click((await screen.findAllByRole('button', { name: /entrar como atleta/i })).at(-1)!)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/register')
    })
  })

  it('login athlete goes to dashboard when onboarding is complete', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        userId: demoUserId,
        email: 'atleta@sigmafit.app',
        name: 'Atleta Sigma',
        role: 'athlete',
        gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        gymName: 'Sigma Gym Norte',
        onboardingCompleted: true,
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        daysPerWeek: 4,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    )

    const router = await renderRoute('/login')
    const user = userEvent.setup()

    await user.click((await screen.findAllByRole('button', { name: /entrar como atleta/i })).at(-1)!)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('login coach goes directly to coach panel and athletes are redirected away from coach route', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          userId: 'c0000000-0000-4000-8000-000000000001',
          email: 'coach@sigmafit.app',
          name: 'Coach SigmaFit',
          role: 'coach',
          gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          gymName: 'Sigma Gym Norte',
          onboardingCompleted: false,
          goal: null,
          experienceLevel: null,
          daysPerWeek: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          gymName: 'Sigma Gym Norte',
          athletes: [],
        }),
      )

    const coachRouter = await renderRoute('/login')
    const user = userEvent.setup()

    await user.click(screen.getAllByRole('button', { name: /entrar como coach/i })[0])
    await user.click(screen.getAllByRole('button', { name: /^entrar como coach$/i }).at(-1)!)

    await waitFor(() => {
      expect(coachRouter.state.location.pathname).toBe('/coach')
    })
    await screen.findByText(/todav.a no hay atletas/i)

    act(() => {
      useSigmafitStore.setState({
        ...createDefaultSigmafitState(),
        session: {
          ...createDefaultSigmafitState().session,
          userId: demoUserId,
          role: 'athlete',
          isAuthenticated: true,
          onboardingComplete: true,
        },
      })
    })

    const athleteRouter = await renderRoute('/coach')

    await waitFor(() => {
      expect(athleteRouter.state.location.pathname).toBe('/dashboard')
    })
  })

  it('signup requires a gym for athletes and exposes the coach gym field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse([
        {
          gymId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          name: 'Sigma Gym Norte',
          slug: 'sigma-gym-norte',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
    )

    await renderRoute('/signup')
    const user = userEvent.setup()

    const gymSelect = await screen.findByLabelText(/^gimnasio$/i)
    await user.selectOptions(gymSelect, '')
    await user.type(screen.getByPlaceholderText(/nombre completo/i), 'Atleta Nuevo')
    await user.type(screen.getByPlaceholderText(/atleta1@sigmafit.app/i), 'nuevo@sigmafit.app')
    await user.click(screen.getByRole('button', { name: /continuar al perfil deportivo/i }))
    expect(await screen.findByText(/selecciona el gimnasio/i)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /crear cuenta como coach/i }))
    expect(screen.getByLabelText(/nombre del gimnasio/i)).toBeTruthy()
  })
})
