import type { MonthlySummary, MonthlyTrainingSignals, MonthlySummaryTrend } from '../types/monthly-summary.js'
import type { UserProfile } from '../types/profile.js'

function resolveTrend(signals: MonthlyTrainingSignals): MonthlySummaryTrend {
  if (signals.completedSessions < 2) {
    return 'insufficient_data'
  }

  if (signals.completedSets >= signals.plannedSets * 0.85 && signals.totalVolume > 0) {
    return 'improving'
  }

  if (signals.completedSets < signals.plannedSets * 0.6) {
    return 'declining'
  }

  return 'stable'
}

function buildSummaryCopy(trend: MonthlySummaryTrend, consistencyRate: number) {
  if (trend === 'improving') {
    return 'Tu volumen y cumplimiento muestran una tendencia positiva para el mes.'
  }

  if (trend === 'declining') {
    return 'Tu adherencia mensual bajo. Conviene simplificar el bloque antes de subir carga.'
  }

  if (trend === 'insufficient_data') {
    return 'Aun faltan sesiones registradas para construir una lectura mensual confiable.'
  }

  if (consistencyRate >= 0.7) {
    return 'Mantuviste una base estable de entrenamiento durante el mes.'
  }

  return 'La prioridad del mes es consolidar asistencia y registro antes de progresar.'
}

export function createMonthlySummary(profile: UserProfile, signals: MonthlyTrainingSignals): MonthlySummary {
  const expectedSessions = Math.max(1, (profile.daysPerWeek ?? 3) * 4)
  const consistencyRate = Math.min(1, signals.completedSessions / expectedSessions)
  const progressionTrend = resolveTrend(signals)

  return {
    userId: signals.userId,
    month: signals.month,
    totalVolume: signals.totalVolume,
    completedSessions: signals.completedSessions,
    consistencyRate,
    averageRpe: signals.averageRpe,
    progressionTrend,
    summary: buildSummaryCopy(progressionTrend, consistencyRate),
  }
}
