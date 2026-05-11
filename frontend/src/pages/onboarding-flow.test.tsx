import { createMemoryHistory } from '@tanstack/history'
import { RouterProvider } from '@tanstack/react-router'
import { act } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { createAppRouter } from '@/router'
import { useSigmafitStore } from '@/store/sigmafit-store'

const demoUserId = '11111111-1111-4111-8111-111111111111'

async function renderRoute(pathname: string) {
  const history = createMemoryHistory({
    initialEntries: [pathname],
  })
  const router = createAppRouter({ history })

  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })

  return router
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('SigmaFit onboarding flow', () => {
  beforeEach(() => {
    useSigmafitStore.setState(createDefaultSigmafitState())
  })

  it('shows validations when required onboarding fields are missing', async () => {
    await renderRoute('/register')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(await screen.findByText(/selecciona un objetivo antes de continuar/i)).toBeTruthy()
  })

  it('completes onboarding with valid data and opens the dashboard', async () => {
    useSigmafitStore.setState({
      session: {
        ...createDefaultSigmafitState().session,
        userId: demoUserId,
        isAuthenticated: true,
      },
      profile: {
        ...createDefaultSigmafitState().profile,
        email: 'demo@sigmafit.app',
      },
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        userId: demoUserId,
        email: 'demo@sigmafit.app',
        name: 'Demo Athlete',
        onboardingCompleted: true,
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        daysPerWeek: 4,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    )

    const router = await renderRoute('/register')
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /hipertrofia/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    await user.click(screen.getByRole('button', { name: /intermedio/i }))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    await user.click(screen.getByRole('button', { name: /^4 dias por semana$/i }))
    await user.click(screen.getByRole('button', { name: /guardar y abrir dashboard/i }))

    await waitFor(() => {
      expect(useSigmafitStore.getState().session.onboardingComplete).toBe(true)
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  it('redirects authenticated users without onboarding back to register', async () => {
    useSigmafitStore.setState({
      session: {
        ...createDefaultSigmafitState().session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: false,
      },
    })

    const redirectRouter = await renderRoute('/dashboard')

    await waitFor(() => {
      expect(redirectRouter.state.location.pathname).toBe('/register')
    })
  })

  it('allows the dashboard when onboarding was already completed', async () => {
    cleanup()
    useSigmafitStore.setState({
      session: {
        ...createDefaultSigmafitState().session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: true,
      },
    })

    const allowedRouter = await renderRoute('/dashboard')

    await waitFor(() => {
      expect(allowedRouter.state.location.pathname).toBe('/dashboard')
      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })
})
