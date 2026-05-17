import { screen } from '@testing-library/react'

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

const adaptiveSummaryResponse = {
  userId: demoUserId,
  routineId: 'routine-demo',
  sessionsAnalyzed: 1,
  completedSets: 12,
  plannedSets: 12,
  completionRate: 1,
  averageFatigue: 5,
  averagePain: 1,
  maxPain: 1,
  totalVolume: 4200,
  totalReps: 120,
  totalSeconds: 0,
  notes: ['Buena respuesta general.'],
  recommendation: {
    type: 'progress',
    summary: 'Puedes progresar de forma moderada.',
    reasoning: 'Buen cumplimiento, fatiga controlada y bajo dolor.',
    suggestedLoadChangePercent: 2.5,
    suggestedVolumeChange: 'maintain',
    riskLevel: 'low',
  },
}

describe('SigmaFit sprint 3 landing and adaptive UI', () => {
  beforeEach(() => {
    useSigmafitStore.setState(createDefaultSigmafitState())
  })

  it('renders the landing hero and final video CTA', async () => {
    await renderRoute('/')

    expect(await screen.findByRole('heading', { level: 1, name: /entrena.*duro/i })).toBeTruthy()
    expect(screen.getAllByText(/solicitar acceso/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('final-video-cta')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: /adquiere ahora sigmafit/i })).toBeTruthy()
  })

  it('shows adaptive reading in progress when a recommendation exists', async () => {
    useSigmafitStore.setState({
      ...createDefaultSigmafitState(),
      session: {
        ...createDefaultSigmafitState().session,
        userId: demoUserId,
        isAuthenticated: true,
        onboardingComplete: true,
      },
    })

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(adaptiveSummaryResponse))
      .mockResolvedValueOnce(
        jsonResponse({
          userId: demoUserId,
          month: '2026-05',
          totalVolume: 4200,
          completedSessions: 1,
          consistencyRate: 0.25,
          averageRpe: 5,
          progressionTrend: 'stable',
          summary: 'Mantuviste una base estable de entrenamiento durante el mes.',
        }),
      )

    await renderRoute('/progress')

    expect(await screen.findByText(/lectura adaptativa/i)).toBeTruthy()
    expect(screen.getAllByText(/resumen mensual/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/recomendacion: progresar/i)).toBeTruthy()
    expect(screen.getByText(/buen cumplimiento, fatiga controlada y bajo dolor/i)).toBeTruthy()
  })
})
