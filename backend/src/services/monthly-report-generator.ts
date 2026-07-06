import type { MonthlySummary, MonthlyTrainingSignals } from '../types/monthly-summary.js'
import type {
  CoachMonthlyReport,
  MonthlySessionSummary,
  StoredCoachMonthlyReport,
} from '../types/monthly-report.js'
import type { UserProfile } from '../types/profile.js'

function roundMetric(value: number | null) {
  return value === null ? null : Math.round(value * 10) / 10
}

function buildStrengths(summary: MonthlySummary, signals: MonthlyTrainingSignals) {
  const strengths: string[] = []

  if (summary.consistencyRate >= 0.75) {
    strengths.push('Buena constancia durante el mes.')
  }
  if (signals.plannedSets > 0 && signals.completedSets / signals.plannedSets >= 0.85) {
    strengths.push('Alto cumplimiento de las series planificadas.')
  }
  if (summary.progressionTrend === 'improving') {
    strengths.push('Tendencia de progresion positiva.')
  }

  return strengths.length > 0 ? strengths : ['El atleta mantiene una base de seguimiento activa.']
}

function buildWeaknesses(summary: MonthlySummary, signals: MonthlyTrainingSignals) {
  const weaknesses: string[] = []
  const completionRate = signals.plannedSets > 0 ? signals.completedSets / signals.plannedSets : 0

  if (summary.consistencyRate < 0.6) {
    weaknesses.push('La adherencia mensual esta por debajo del objetivo.')
  }
  if ((signals.averageRpe ?? 0) >= 8) {
    weaknesses.push('La fatiga promedio fue elevada.')
  }
  if ((signals.averagePain ?? 0) >= 7) {
    weaknesses.push('Se reportaron molestias altas que requieren seguimiento.')
  }
  if (signals.plannedSets > 0 && completionRate < 0.6) {
    weaknesses.push('El cumplimiento de series fue bajo.')
  }

  return weaknesses.length > 0 ? weaknesses : ['No se detectaron alertas relevantes en el mes.']
}

function buildOpportunities(summary: MonthlySummary, signals: MonthlyTrainingSignals) {
  if ((signals.averagePain ?? 0) >= 7) {
    return ['Revisar tecnica y carga antes de aumentar la exigencia.']
  }
  if ((signals.averageRpe ?? 0) >= 8) {
    return ['Mejorar la gestion de recuperacion y distribuir mejor el volumen semanal.']
  }
  if (summary.consistencyRate < 0.6) {
    return ['Ajustar horarios o frecuencia para facilitar la asistencia sostenida.']
  }
  if (summary.progressionTrend === 'improving') {
    return ['Consolidar la progresion con incrementos pequenos y controlados.']
  }
  return ['Mantener el bloque y registrar cada sesion para afinar el siguiente ajuste.']
}

function buildRecommendation(summary: MonthlySummary, signals: MonthlyTrainingSignals) {
  if ((signals.averagePain ?? 0) >= 7) {
    return 'Reducir temporalmente la exigencia y revisar tecnica con un profesional si la molestia persiste.'
  }
  if ((signals.averageRpe ?? 0) >= 8) {
    return 'Mantener la carga o reducir volumen hasta normalizar la fatiga.'
  }
  if (summary.consistencyRate < 0.6) {
    return 'Priorizar adherencia y una frecuencia sostenible antes de progresar.'
  }
  if (summary.progressionTrend === 'improving') {
    return 'Continuar con una progresion moderada y monitorear la respuesta semanal.'
  }
  return 'Mantener la estructura actual y revisar nuevamente al cierre del siguiente mes.'
}

function buildGeneratedSummary(
  profile: UserProfile,
  summary: MonthlySummary,
  signals: MonthlyTrainingSignals,
) {
  if (summary.completedSessions === 0) {
    return `${profile.name} aun no registra sesiones completadas en ${summary.month}. Se recomienda iniciar el seguimiento antes de ajustar su plan.`
  }

  const consistency = Math.round(summary.consistencyRate * 100)
  const fatigueText =
    signals.averageRpe === null
      ? 'sin fatiga registrada'
      : signals.averageRpe >= 8
        ? 'con fatiga elevada'
        : signals.averageRpe >= 6
          ? 'con fatiga moderada'
          : 'con fatiga controlada'

  return `${profile.name} completo ${summary.completedSessions} sesiones con una consistencia del ${consistency}%. Registro ${summary.totalVolume.toLocaleString('es-EC')} kg de volumen y cerro el mes ${fatigueText}.`
}

export function createCoachMonthlyReport({
  coach,
  athlete,
  summary,
  signals,
  sessions,
  storedReport,
}: {
  coach: UserProfile
  athlete: UserProfile
  summary: MonthlySummary
  signals: MonthlyTrainingSignals
  sessions: MonthlySessionSummary[]
  storedReport: StoredCoachMonthlyReport | null
}): CoachMonthlyReport {
  const completionRate =
    signals.plannedSets > 0 ? Math.min(1, signals.completedSets / signals.plannedSets) : 0
  const generatedSummary = buildGeneratedSummary(athlete, summary, signals)
  const strengths = buildStrengths(summary, signals)
  const weaknesses = buildWeaknesses(summary, signals)
  const opportunities = buildOpportunities(summary, signals)
  const recommendation = buildRecommendation(summary, signals)

  return {
    reportId: storedReport?.reportId ?? null,
    coachUserId: coach.userId,
    athlete: {
      userId: athlete.userId,
      name: athlete.name,
    },
    gym: {
      gymId: athlete.gymId!,
      name: athlete.gymName!,
    },
    month: summary.month,
    metrics: {
      completedSessions: summary.completedSessions,
      consistencyRate: summary.consistencyRate,
      completionRate,
      totalVolume: summary.totalVolume,
      averageFatigue: roundMetric(signals.averageRpe),
      averagePain: roundMetric(signals.averagePain),
      progressionTrend: summary.progressionTrend,
    },
    sessions: sessions.slice(0, 8),
    generatedSummary: storedReport?.generatedSummary ?? generatedSummary,
    strengths: storedReport?.strengths ?? strengths,
    weaknesses: storedReport?.weaknesses ?? weaknesses,
    opportunities: storedReport?.opportunities ?? opportunities,
    recommendation: storedReport?.recommendation ?? recommendation,
    coachNotes: storedReport?.coachNotes ?? '',
    status: storedReport?.status ?? 'draft',
    updatedAt: storedReport?.updatedAt ?? null,
  }
}
