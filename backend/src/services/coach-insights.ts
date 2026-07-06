import type { AdaptiveTrainingSignals } from '../types/adaptive.js'
import type { CoachAthleteOverview, CoachOverviewResponse } from '../types/coach.js'
import type { MonthlySummary } from '../types/monthly-summary.js'
import type { MonthlyReportStatus } from '../types/monthly-report.js'
import type { UserProfile } from '../types/profile.js'

function resolveWeakPoints(signals: AdaptiveTrainingSignals, monthlySummary: MonthlySummary) {
  const weakPoints: string[] = []

  if (monthlySummary.consistencyRate < 0.65) {
    weakPoints.push('baja adherencia')
  }

  if ((signals.averageFatigue ?? 0) >= 8) {
    weakPoints.push('fatiga alta')
  }

  if ((signals.maxPain ?? signals.averagePain ?? 0) >= 7) {
    weakPoints.push('molestia alta')
  }

  if (signals.sessionsAnalyzed > 0 && signals.completionRate < 0.6) {
    weakPoints.push('cumplimiento de series bajo')
  }

  return weakPoints
}

function buildCoachInsight(weakPoints: string[], signals: AdaptiveTrainingSignals) {
  if (weakPoints.includes('molestia alta')) {
    return 'Prioridad alta: revisar tecnica, carga y molestias reportadas antes de progresar.'
  }

  if (weakPoints.includes('fatiga alta')) {
    return 'Conviene revisar volumen semanal y recuperacion antes de exigir mas intensidad.'
  }

  if (weakPoints.includes('baja adherencia')) {
    return 'La prioridad es reducir friccion y ajustar frecuencia para mejorar asistencia.'
  }

  if (signals.sessionsAnalyzed === 0) {
    return 'Aun no hay suficientes sesiones registradas; dar seguimiento al primer bloque.'
  }

  return 'El atleta mantiene señales estables; puede sostener el bloque con monitoreo semanal.'
}

export function createCoachOverview(
  profiles: UserProfile[],
  summariesByUser: Map<string, MonthlySummary>,
  signalsByUser: Map<string, AdaptiveTrainingSignals>,
  gym: { gymId: string | null; gymName: string | null } = { gymId: null, gymName: null },
  reportStatusByUser: Map<string, MonthlyReportStatus> = new Map(),
): CoachOverviewResponse {
  return {
    ...gym,
    athletes: profiles.map((profile): CoachAthleteOverview => {
      const monthlySummary = summariesByUser.get(profile.userId)
      const signals = signalsByUser.get(profile.userId)
      const weakPoints = signals && monthlySummary ? resolveWeakPoints(signals, monthlySummary) : []
      const expectedMonthlySessions = Math.max(1, (profile.daysPerWeek ?? 3) * 4)
      const completedSessions = monthlySummary?.completedSessions ?? 0

      return {
        userId: profile.userId,
        name: profile.name,
        completedSessions,
        consistencyRate: monthlySummary?.consistencyRate ?? 0,
        progressionTrend: monthlySummary?.progressionTrend ?? 'insufficient_data',
        averageFatigue: signals?.averageFatigue ?? null,
        averagePain: signals?.averagePain ?? null,
        missedSessions: Math.max(0, expectedMonthlySessions - completedSessions),
        weakPoints,
        coachInsight: signals ? buildCoachInsight(weakPoints, signals) : 'No hay datos suficientes para priorizar seguimiento.',
        reportStatus: reportStatusByUser.get(profile.userId) ?? 'draft',
      }
    }),
  }
}
