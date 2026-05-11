import type { SigmaExperienceLevel, SigmaGoal } from './types'

export const SIGMAFIT_DEMO_USER_ID = '11111111-1111-4111-8111-111111111111'

export const sigmaGoalOptions: Array<{
  value: SigmaGoal
  label: string
  description: string
}> = [
  {
    value: 'hypertrophy',
    label: 'Hipertrofia',
    description: 'Sube volumen y controla la fatiga para ganar masa con criterio.',
  },
  {
    value: 'strength',
    label: 'Fuerza',
    description: 'Prioriza top sets, 1RM proyectado y bloques de intensidad.',
  },
  {
    value: 'weight_loss',
    label: 'Perdida de peso',
    description: 'Combina adherencia, densidad de trabajo y gasto energetico sostenible.',
  },
]

export const sigmaExperienceOptions: Array<{
  value: SigmaExperienceLevel
  label: string
  description: string
}> = [
  {
    value: 'beginner',
    label: 'Principiante',
    description: 'Mayor foco en adherencia, tecnica y control de progreso.',
  },
  {
    value: 'intermediate',
    label: 'Intermedio',
    description: 'Base suficiente para progresion semanal con ajustes por fatiga.',
  },
  {
    value: 'advanced',
    label: 'Avanzado',
    description: 'Lectura fina de volumen, intensidad y recuperacion.',
  },
]

export const sigmaDaysPerWeekOptions = [2, 3, 4, 5, 6] as const

const goalLabels: Record<SigmaGoal, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Fuerza',
  weight_loss: 'Perdida de peso',
}

const experienceLabels: Record<SigmaExperienceLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export function formatSigmaGoal(goal: SigmaGoal) {
  return goalLabels[goal]
}

export function formatSigmaExperienceLevel(experienceLevel: SigmaExperienceLevel) {
  return experienceLabels[experienceLevel]
}
