import type {
  SigmaExperience,
  SigmaObjective,
  SigmaOnboardingPayload,
  SigmafitStateSnapshot,
  SigmaProgressPoint,
  SigmaWorkoutExercise,
} from './types'

export const sigmaObjectives: SigmaObjective[] = ['Hipertrofia', 'Fuerza', 'Recomposicion', 'Resistencia']
export const sigmaExperienceLevels: SigmaExperience[] = ['Principiante', 'Intermedio', 'Avanzado']

export const landingFeatures = [
  {
    icon: 'brain',
    title: 'Coach virtual adaptativo',
    description: 'Lee RPE, consistencia y nivel de fatiga para ajustar tu carga sin depender de hojas manuales.',
    accent: 'from-cyan-500/20 to-sky-500/10',
  },
  {
    icon: 'trend',
    title: 'Periodizacion clara',
    description: 'Convierte objetivos semanales en bloques con progresion controlada y recuperacion visible.',
    accent: 'from-sky-500/20 to-blue-500/10',
  },
  {
    icon: 'zap',
    title: 'Tracker en vivo',
    description: 'Marca sets, pesos, tiempos de descanso y RPE desde una vista hecha para el gimnasio.',
    accent: 'from-amber-500/20 to-orange-500/10',
  },
  {
    icon: 'switch',
    title: 'Sustitucion inmediata',
    description: 'Si una maquina falla o una zona molesta, la app propone equivalencias sin sacar el ritmo.',
    accent: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    icon: 'chart',
    title: 'Progreso accionable',
    description: 'Volumen, consistencia y 1RM proyectado en una lectura limpia lista para decidir la siguiente semana.',
    accent: 'from-indigo-500/20 to-cyan-500/10',
  },
  {
    icon: 'shield',
    title: 'Onboarding util',
    description: 'Objetivo, nivel y disponibilidad para generar una base real en menos de tres minutos.',
    accent: 'from-rose-500/20 to-red-500/10',
  },
] as const

export const howItWorksSteps = [
  {
    id: '01',
    title: 'Perfila al atleta',
    description: 'Define objetivo, experiencia y frecuencia semanal para que SigmaFit sepa como empujarte.',
  },
  {
    id: '02',
    title: 'Entrena con contexto',
    description: 'Cada sesion muestra ejercicios, descanso y lecturas de readiness sin salir del flujo.',
  },
  {
    id: '03',
    title: 'Ajusta con RPE',
    description: 'Cierra cada entrenamiento con esfuerzo percibido y deja al coach listo para la siguiente semana.',
  },
] as const

function createWorkoutExercises(): SigmaWorkoutExercise[] {
  return [
    {
      id: 'bench',
      name: 'Press banca',
      focus: 'Pecho / Triceps',
      note: 'Mantener velocidad pareja en las dos primeras series.',
      restSeconds: 120,
      substitute: 'Press inclinado con mancuernas',
      targetRpe: 8,
      sets: [
        { id: 'bench-1', reps: 8, weight: 80, completed: true },
        { id: 'bench-2', reps: 8, weight: 82.5, completed: true },
        { id: 'bench-3', reps: 6, weight: 85, completed: false },
      ],
    },
    {
      id: 'incline',
      name: 'Press inclinado',
      focus: 'Pecho superior',
      note: 'Cerrar escapulas antes de iniciar cada repeticion.',
      restSeconds: 90,
      substitute: 'Press maquina convergente',
      targetRpe: 8,
      sets: [
        { id: 'incline-1', reps: 10, weight: 28, completed: true },
        { id: 'incline-2', reps: 10, weight: 28, completed: false },
        { id: 'incline-3', reps: 9, weight: 30, completed: false },
      ],
    },
    {
      id: 'fly',
      name: 'Aperturas en polea',
      focus: 'Pecho',
      note: 'Buscar estiramiento sin perder control.',
      restSeconds: 75,
      substitute: 'Pec deck',
      targetRpe: 9,
      sets: [
        { id: 'fly-1', reps: 12, weight: 17.5, completed: false },
        { id: 'fly-2', reps: 12, weight: 17.5, completed: false },
        { id: 'fly-3', reps: 12, weight: 17.5, completed: false },
      ],
    },
    {
      id: 'triceps',
      name: 'Triceps en cable',
      focus: 'Triceps',
      note: 'Ultima serie con pausa de un segundo abajo.',
      restSeconds: 60,
      substitute: 'Press cerrado en smith',
      targetRpe: 9,
      sets: [
        { id: 'triceps-1', reps: 12, weight: 35, completed: false },
        { id: 'triceps-2', reps: 12, weight: 35, completed: false },
        { id: 'triceps-3', reps: 10, weight: 37.5, completed: false },
      ],
    },
  ]
}

function createProgressHistory(): SigmaProgressPoint[] {
  return [
    { week: 'W1', volume: 9600, consistency: 76, projectedOneRm: 102, fatigue: 42 },
    { week: 'W2', volume: 10450, consistency: 81, projectedOneRm: 105, fatigue: 46 },
    { week: 'W3', volume: 11100, consistency: 85, projectedOneRm: 107, fatigue: 50 },
    { week: 'W4', volume: 11860, consistency: 89, projectedOneRm: 110, fatigue: 54 },
    { week: 'W5', volume: 12400, consistency: 92, projectedOneRm: 112, fatigue: 58 },
    { week: 'W6', volume: 12920, consistency: 94, projectedOneRm: 114, fatigue: 56 },
  ]
}

export function createDefaultSigmafitState(): SigmafitStateSnapshot {
  return {
    session: {
      isAuthenticated: false,
      onboardingComplete: false,
      lastLoginAt: null,
    },
    profile: {
      displayName: 'Atleta',
      email: '',
      objective: 'Hipertrofia',
      experience: 'Intermedio',
      availability: 4,
      preferredUnit: 'metric',
      coachingStyle: 'Directo',
      focus: 'Push A',
      notes: 'Priorizar consistencia y tecnica bajo fatiga moderada.',
      heightCm: 176,
      weightKg: 78,
    },
    workout: {
      title: 'Push A',
      block: 'Bloque 4 / Hipertrofia controlada',
      focus: 'Pecho, hombro anterior y triceps',
      readiness: 84,
      sessionLengthMinutes: 58,
      activeExerciseId: 'bench',
      lastSessionRpe: 7,
      notes: 'La ultima semana tuvo alta consistencia. Hoy puedes empujar la primera parte y cerrar con tecnica.',
      exercises: createWorkoutExercises(),
    },
    progressHistory: createProgressHistory(),
    preferences: {
      adaptiveCoach: true,
      reminders: true,
      reminderMinutes: 90,
      recoveryAlerts: true,
    },
  }
}

export function onboardingToStatePatch(payload: SigmaOnboardingPayload) {
  return {
    session: {
      isAuthenticated: true,
      onboardingComplete: true,
      lastLoginAt: new Date().toISOString(),
    },
    profile: {
      displayName: payload.displayName,
      email: payload.email,
      objective: payload.objective,
      experience: payload.experience,
      availability: payload.availability,
      preferredUnit: 'metric' as const,
      coachingStyle: 'Directo' as const,
      focus: payload.objective === 'Fuerza' ? 'Upper strength' : 'Push A',
      notes: 'Perfil inicial generado desde onboarding SigmaFit.',
      heightCm: 176,
      weightKg: 78,
    },
  }
}

