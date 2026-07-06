import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createDefaultSigmafitState } from '@/lib/sigmafit/mock-data'
import { useSigmafitStore } from '@/store/sigmafit-store'
import { renderRoute } from '@/test/render-route'

const coachId = 'c0000000-0000-4000-8000-000000000001'
const athleteId = 'd0000000-0000-4000-8000-000000000001'
const gymId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const month = new Date().toISOString().slice(0, 7)

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const overviewResponse = {
  gymId,
  gymName: 'Sigma Gym Norte',
  athletes: [
    {
      userId: athleteId,
      name: 'Ana Torres',
      completedSessions: 12,
      consistencyRate: 0.75,
      progressionTrend: 'improving',
      averageFatigue: 6,
      averagePain: 2,
      missedSessions: 4,
      weakPoints: [],
      coachInsight: 'Mantiene buena adherencia y progresion controlada.',
      reportStatus: 'draft',
    },
  ],
}

const reportResponse = {
  reportId: null,
  coachUserId: coachId,
  athlete: { userId: athleteId, name: 'Ana Torres' },
  gym: { gymId, name: 'Sigma Gym Norte' },
  month,
  metrics: {
    completedSessions: 12,
    consistencyRate: 0.75,
    completionRate: 0.9,
    totalVolume: 35826,
    averageFatigue: 6,
    averagePain: 2,
    progressionTrend: 'improving',
  },
  sessions: [
    {
      sessionId: 'session-1',
      date: `${month}-03T18:00:00.000Z`,
      source: 'live',
      completedSets: 7,
      totalVolume: 2800,
      fatigueLevel: 6,
      painLevel: 2,
      athleteNotes: 'Buena tecnica.',
    },
  ],
  generatedSummary: 'Ana completo 12 sesiones con una consistencia del 75%.',
  strengths: ['Buena constancia durante el mes.'],
  weaknesses: ['No se detectaron alertas relevantes en el mes.'],
  opportunities: ['Consolidar la progresion con incrementos controlados.'],
  recommendation: 'Continuar con una progresion moderada.',
  coachNotes: '',
  status: 'draft',
  updatedAt: null,
}

describe('SigmaFit final product flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    const base = createDefaultSigmafitState()
    useSigmafitStore.setState({
      ...base,
      session: {
        ...base.session,
        userId: coachId,
        role: 'coach',
        gymId,
        gymName: 'Sigma Gym Norte',
        isAuthenticated: true,
        onboardingComplete: true,
      },
      profile: {
        ...base.profile,
        displayName: 'Coach Sigma',
        email: 'coach@sigmafit.app',
      },
    })
  })

  it('lets the coach open, review and save an athlete monthly report', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(overviewResponse))
      .mockResolvedValueOnce(jsonResponse(reportResponse))
      .mockResolvedValueOnce(
        jsonResponse({
          ...reportResponse,
          reportId: 'report-1',
          coachNotes: 'Mantener tecnica y controlar la fatiga.',
          status: 'reviewed',
          updatedAt: '2026-07-05T12:00:00.000Z',
        }),
      )

    await renderRoute('/coach')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /ver reporte mensual/i }))
    expect(await screen.findByText(/conclusión del sistema/i)).toBeTruthy()
    expect(screen.getByText(/ana completo 12 sesiones/i)).toBeTruthy()

    const notes = screen.getByLabelText(/observación del coach/i)
    await user.type(notes, 'Mantener tecnica y controlar la fatiga.')
    await user.selectOptions(screen.getByLabelText(/^estado$/i), 'reviewed')
    await user.click(screen.getByRole('button', { name: /guardar reporte/i }))

    await waitFor(() => {
      expect(screen.getByText(/reporte guardado/i)).toBeTruthy()
      expect(useSigmafitStore.getState().coach.selectedReport?.status).toBe('reviewed')
    })
  })

  it('shows delivered coach feedback to the athlete without administrative controls', async () => {
    const base = createDefaultSigmafitState()
    useSigmafitStore.setState({
      ...base,
      session: {
        ...base.session,
        userId: athleteId,
        role: 'athlete',
        gymId,
        gymName: 'Sigma Gym Norte',
        isAuthenticated: true,
        onboardingComplete: true,
      },
    })

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        jsonResponse({
          userId: athleteId,
          month,
          totalVolume: 35826,
          completedSessions: 12,
          consistencyRate: 0.75,
          averageRpe: 6,
          averagePain: 2,
          progressionTrend: 'improving',
          summary: 'Tu mes mantuvo una tendencia positiva.',
          deliveredReport: {
            reportId: 'report-1',
            coachName: 'Coach Sigma',
            generatedSummary: 'Ana completo 12 sesiones.',
            strengths: ['Buena constancia.'],
            opportunities: ['Mantener la progresion.'],
            recommendation: 'Continuar con una progresion moderada.',
            coachNotes: 'Buen avance general. Mantener tecnica.',
            deliveredAt: '2026-07-05T12:00:00.000Z',
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          userId: athleteId,
          routineId: null,
          sessionsAnalyzed: 12,
          completedSets: 80,
          plannedSets: 90,
          completionRate: 0.88,
          averageFatigue: 6,
          averagePain: 2,
          maxPain: 3,
          totalVolume: 35826,
          totalReps: 800,
          totalSeconds: 540,
          notes: [],
          recommendation: {
            type: 'progress',
            summary: 'Puedes progresar de forma moderada.',
            reasoning: 'Buen cumplimiento y fatiga controlada.',
            suggestedLoadChangePercent: 2.5,
            suggestedVolumeChange: 'maintain',
            riskLevel: 'low',
          },
        }),
      )

    await renderRoute('/progress')

    expect(await screen.findByText(/revisión de tu coach/i)).toBeTruthy()
    expect(screen.getByText(/buen avance general/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /guardar reporte/i })).toBeNull()
  })
})
