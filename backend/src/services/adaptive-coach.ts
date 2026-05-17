import type {
  AdaptiveRecommendation,
  AdaptiveRecommendationDraft,
  AdaptiveSummary,
  AdaptiveTrainingSignals,
} from '../types/adaptive.js'

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function createAdaptiveRecommendationDraft(
  signals: AdaptiveTrainingSignals,
): AdaptiveRecommendationDraft {
  const averageFatigue = signals.averageFatigue ?? 0
  const averagePain = signals.averagePain ?? 0
  const maxPain = signals.maxPain ?? 0

  if (maxPain >= 7 || averagePain >= 7) {
    return {
      userId: signals.userId,
      routineId: signals.routineId,
      type: 'deload',
      summary: 'Se recomienda descarga y control tecnico.',
      reasoning:
        'Se detecto molestia alta. Conviene reducir carga o volumen, revisar tecnica y consultar a un profesional si persiste.',
      suggestedLoadChangePercent: -10,
      suggestedVolumeChange: 'reduce',
      riskLevel: 'high',
    }
  }

  if (averageFatigue >= 8) {
    return {
      userId: signals.userId,
      routineId: signals.routineId,
      type: 'deload',
      summary: 'Se recomienda una descarga parcial.',
      reasoning:
        'La fatiga reportada fue alta. Reducir series o carga estimada entre 5% y 10% ayuda a recuperar sin abandonar el bloque.',
      suggestedLoadChangePercent: -7.5,
      suggestedVolumeChange: 'reduce',
      riskLevel: 'medium',
    }
  }

  if (signals.sessionsAnalyzed === 0) {
    return {
      userId: signals.userId,
      routineId: signals.routineId,
      type: 'maintain',
      summary: 'Aun no hay sesiones suficientes para ajustar.',
      reasoning:
        'SigmaFit necesita entrenamientos finalizados con series, fatiga y dolor para estimar un ajuste confiable.',
      suggestedLoadChangePercent: 0,
      suggestedVolumeChange: 'maintain',
      riskLevel: 'low',
    }
  }

  if (signals.completionRate < 0.6) {
    return {
      userId: signals.userId,
      routineId: signals.routineId,
      type: 'simplify',
      summary: 'Conviene simplificar antes de progresar.',
      reasoning:
        'El cumplimiento de series fue bajo. Antes de subir carga, conviene consolidar adherencia y reducir friccion del plan.',
      suggestedLoadChangePercent: 0,
      suggestedVolumeChange: 'reduce',
      riskLevel: 'medium',
    }
  }

  if (signals.completionRate >= 0.85 && averageFatigue <= 6 && averagePain <= 3) {
    return {
      userId: signals.userId,
      routineId: signals.routineId,
      type: 'progress',
      summary: 'Puedes progresar de forma moderada.',
      reasoning:
        'Buen cumplimiento, fatiga controlada y bajo dolor. El ajuste recomendado es pequeno para proteger tecnica y consistencia.',
      suggestedLoadChangePercent: 2.5,
      suggestedVolumeChange: 'maintain',
      riskLevel: 'low',
    }
  }

  return {
    userId: signals.userId,
    routineId: signals.routineId,
    type: 'maintain',
    summary: 'Mantener la carga esta semana.',
    reasoning:
      'La respuesta fue estable, pero no hay margen claro para subir carga. Mantener permite acumular datos sin aumentar riesgo.',
    suggestedLoadChangePercent: 0,
    suggestedVolumeChange: 'maintain',
    riskLevel: averageFatigue >= 7 || averagePain >= 4 ? 'medium' : 'low',
  }
}

export function createAdaptiveSummary(signals: AdaptiveTrainingSignals): AdaptiveSummary {
  const recommendation = createAdaptiveRecommendationDraft(signals)
  return {
    ...signals,
    completionRate: round(signals.completionRate),
    averageFatigue: signals.averageFatigue === null ? null : round(signals.averageFatigue, 1),
    averagePain: signals.averagePain === null ? null : round(signals.averagePain, 1),
    totalVolume: round(signals.totalVolume),
    recommendation: {
      type: recommendation.type,
      summary: recommendation.summary,
      reasoning: recommendation.reasoning,
      suggestedLoadChangePercent: recommendation.suggestedLoadChangePercent,
      suggestedVolumeChange: recommendation.suggestedVolumeChange,
      riskLevel: recommendation.riskLevel,
    },
  }
}

export function recommendationToSummary(
  signals: AdaptiveTrainingSignals,
  recommendation: AdaptiveRecommendation,
): AdaptiveSummary {
  return {
    ...signals,
    completionRate: round(signals.completionRate),
    averageFatigue: signals.averageFatigue === null ? null : round(signals.averageFatigue, 1),
    averagePain: signals.averagePain === null ? null : round(signals.averagePain, 1),
    totalVolume: round(signals.totalVolume),
    recommendation: {
      type: recommendation.type,
      summary: recommendation.summary,
      reasoning: recommendation.reasoning,
      suggestedLoadChangePercent: recommendation.suggestedLoadChangePercent,
      suggestedVolumeChange: recommendation.suggestedVolumeChange,
      riskLevel: recommendation.riskLevel,
    },
  }
}
