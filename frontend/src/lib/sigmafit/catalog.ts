import type { SigmaExerciseCatalogEntry, SigmaExperienceLevel, SigmaGoal } from './types'

export const SIGMAFIT_DEMO_USER_ID = '11111111-1111-4111-8111-111111111111'
export const SIGMAFIT_DEMO_COACH_ID = 'c0000000-0000-4000-8000-000000000001'
export const SIGMAFIT_DEMO_GYM_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

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

export const sigmaExerciseCatalogFallback: SigmaExerciseCatalogEntry[] = [
  {
    exerciseId: 'local-press-banca',
    name: 'Press de banca',
    muscleGroup: 'Pecho',
    movementPattern: 'Empuje horizontal',
    equipment: 'Barra olimpica y banco plano',
    trackingType: 'weight_reps',
    coachingCue: 'Usa banco plano, pies firmes, escapulas retraidas y barra controlada al pecho.',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-sentadilla',
    name: 'Sentadilla con barra',
    muscleGroup: 'Piernas',
    movementPattern: 'Dominante de rodilla',
    equipment: 'Barra olimpica y rack',
    trackingType: 'weight_reps',
    coachingCue: 'Ajusta altura del rack, controla profundidad y mantiene brace antes de cada repeticion.',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-peso-muerto',
    name: 'Peso muerto',
    muscleGroup: 'Posterior',
    movementPattern: 'Bisagra de cadera',
    equipment: 'Barra olimpica y discos',
    trackingType: 'weight_reps',
    coachingCue: 'Barra cerca del cuerpo, espalda neutra y subida sin tirones.',
    difficulty: 'advanced',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-press-militar',
    name: 'Press militar',
    muscleGroup: 'Hombros',
    movementPattern: 'Empuje vertical',
    equipment: 'Barra olimpica o mancuernas',
    trackingType: 'weight_reps',
    coachingCue: 'Evita hiperextender la espalda y termina cada repeticion con control arriba.',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-remo',
    name: 'Remo con barra',
    muscleGroup: 'Espalda',
    movementPattern: 'Tiron horizontal',
    equipment: 'Barra olimpica',
    trackingType: 'weight_reps',
    coachingCue: 'Torso estable, codos atras y pausa corta cerca del abdomen.',
    difficulty: 'intermediate',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-jalon',
    name: 'Jalon al pecho',
    muscleGroup: 'Espalda',
    movementPattern: 'Tiron vertical',
    equipment: 'Polea alta con barra o agarre neutro',
    trackingType: 'weight_reps',
    coachingCue: 'Inicia con escapulas, baja hacia clavicula y evita balanceo.',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-curl',
    name: 'Curl de biceps',
    muscleGroup: 'Biceps',
    movementPattern: 'Aislamiento',
    equipment: 'Mancuernas o barra EZ',
    trackingType: 'weight_reps',
    coachingCue: 'Codos quietos y recorrido completo sin usar impulso.',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-triceps',
    name: 'Extension de triceps',
    muscleGroup: 'Triceps',
    movementPattern: 'Aislamiento',
    equipment: 'Polea alta con cuerda o barra',
    trackingType: 'weight_reps',
    coachingCue: 'Mantiene codos fijos y extiende sin mover hombros.',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-prensa',
    name: 'Prensa de piernas',
    muscleGroup: 'Piernas',
    movementPattern: 'Dominante de rodilla',
    equipment: 'Maquina de prensa de piernas',
    trackingType: 'weight_reps',
    coachingCue: 'Ajusta el asiento, controla la bajada y no bloquees rodillas violentamente.',
    difficulty: 'beginner',
    goalFocus: 'weight_loss',
  },
  {
    exerciseId: 'local-plancha',
    name: 'Plancha abdominal',
    muscleGroup: 'Core',
    movementPattern: 'Estabilidad',
    equipment: 'Colchoneta o suelo',
    trackingType: 'time',
    coachingCue: 'Controla por segundos: pelvis neutra, abdomen firme y respiracion constante.',
    difficulty: 'beginner',
    goalFocus: 'general',
  },
  {
    exerciseId: 'local-flexiones',
    name: 'Flexiones',
    muscleGroup: 'Pecho',
    movementPattern: 'Empuje horizontal',
    equipment: 'Peso corporal',
    trackingType: 'bodyweight_reps',
    coachingCue: 'Mantener tronco firme y rango controlado.',
    difficulty: 'beginner',
    goalFocus: 'general',
  },
]

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
