import type { SigmafitStateSnapshot } from '@/lib/sigmafit/types'

function countCompletedSets(state: SigmafitStateSnapshot) {
  return state.workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((setItem) => setItem.completed).length,
    0,
  )
}

function countTotalSets(state: SigmafitStateSnapshot) {
  return state.workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
}

function estimateVolume(state: SigmafitStateSnapshot) {
  return state.workout.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (exerciseTotal, setItem) => exerciseTotal + setItem.weight * setItem.reps,
        0,
      ),
    0,
  )
}

export function getSigmaDashboardView(state: SigmafitStateSnapshot) {
  const totalSets = countTotalSets(state)
  const completedSets = countCompletedSets(state)
  const readinessTone =
    state.workout.readiness >= 85
      ? 'Listo para empujar el bloque principal.'
      : 'Conviene cuidar tecnica y no forzar accesorios.'

  return {
    headline: `Hola, ${state.profile.displayName}. Hoy entrenas ${state.workout.title}.`,
    subheadline:
      'La shell SigmaFit centraliza readiness, progreso y la sesion activa para que no dependas de varias vistas.',
    metrics: [
      {
        title: 'Readiness',
        value: `${state.workout.readiness}%`,
        caption: readinessTone,
      },
      {
        title: 'Volumen plan',
        value: `${estimateVolume(state).toLocaleString('es-EC')} kg`,
        caption: 'Carga estimada del workout actual.',
      },
      {
        title: 'Consistencia',
        value: `${state.progressHistory[state.progressHistory.length - 1]?.consistency ?? 0}%`,
        caption: `${completedSets}/${totalSets} sets completados en la sesion activa.`,
      },
      {
        title: 'RPE previo',
        value: `${state.workout.lastSessionRpe ?? 7}/10`,
        caption: 'Ultimo esfuerzo reportado para el bloque.',
      },
    ],
    insightCards: [
      'La progresion semanal sigue estable. Mantener el top set en 8 repeticiones controladas.',
      'La fatiga subio moderadamente, pero la consistencia se sostiene por encima del 90%.',
      'Si el gym esta lleno, usa la sustitucion sugerida y conserva el patron de empuje.',
    ],
    nextSession: state.workout.exercises,
    progressPreview: state.progressHistory,
  }
}

export function getSigmaWorkoutView(state: SigmafitStateSnapshot) {
  const activeExercise =
    state.workout.exercises.find((exercise) => exercise.id === state.workout.activeExerciseId) ??
    state.workout.exercises[0]

  return {
    title: state.workout.title,
    block: state.workout.block,
    focus: state.workout.focus,
    readiness: state.workout.readiness,
    sessionLengthMinutes: state.workout.sessionLengthMinutes,
    notes: state.workout.notes,
    completedSets: countCompletedSets(state),
    totalSets: countTotalSets(state),
    activeExercise,
    exercises: state.workout.exercises,
  }
}

export function getSigmaProgressView(state: SigmafitStateSnapshot) {
  const latestPoint = state.progressHistory[state.progressHistory.length - 1]
  const previousPoint = state.progressHistory[state.progressHistory.length - 2]
  const volumeDelta = latestPoint && previousPoint ? latestPoint.volume - previousPoint.volume : 0
  const oneRmDelta =
    latestPoint && previousPoint ? latestPoint.projectedOneRm - previousPoint.projectedOneRm : 0

  return {
    heroStats: [
      { label: 'Volumen semanal', value: `${latestPoint?.volume.toLocaleString('es-EC') ?? 0} kg` },
      { label: 'Consistencia', value: `${latestPoint?.consistency ?? 0}%` },
      { label: '1RM proyectado', value: `${latestPoint?.projectedOneRm ?? 0} kg` },
    ],
    trend: state.progressHistory,
    bodyTarget: {
      currentWeightKg: state.profile.weightKg,
      targetWeightKg: state.profile.targetWeightKg,
      remainingKg: Number((state.profile.weightKg - state.profile.targetWeightKg).toFixed(1)),
      caloriesTracked: false,
    },
    metricDefinitions: [
      'Volumen semanal = suma aproximada de peso x reps reales en las series completadas.',
      'Consistencia = adherencia estimada segun sesiones finalizadas y sets completados.',
      '1RM proyectado = estimacion de fuerza basada en el trabajo registrado; no es un maximo real.',
      'Fatiga = lectura subjetiva del cierre de sesion y carga acumulada, escala 0-100.',
    ],
    recommendations: [
      state.profile.goal === 'weight_loss'
        ? `Objetivo corporal: ${state.profile.weightKg} kg actuales hacia ${state.profile.targetWeightKg} kg. Calorias aun no se registran en esta version.`
        : `Peso corporal registrado: ${state.profile.weightKg} kg. Objetivo de referencia: ${state.profile.targetWeightKg} kg.`,
      volumeDelta >= 0
        ? `El volumen semanal subio ${volumeDelta.toLocaleString('es-EC')} kg frente a la semana anterior.`
        : 'El volumen semanal bajo; revisa si fue deload o perdida de adherencia.',
      oneRmDelta >= 0
        ? `La proyeccion de fuerza mejoro ${oneRmDelta} kg en el ultimo corte.`
        : 'La proyeccion de fuerza cayo ligeramente; prioriza recuperacion y tecnica.',
      `La fatiga actual esta en ${latestPoint?.fatigue ?? 0}/100. Ajusta accesorios si se acerca a 70.`,
    ],
  }
}

export function getSigmaProfileView(state: SigmafitStateSnapshot) {
  return {
    profile: state.profile,
    preferences: state.preferences,
    weeklySummary: [
      {
        label: 'Disponibilidad',
        value: `${state.profile.daysPerWeek} dias`,
      },
      {
        label: 'Enfoque',
        value: state.profile.focus,
      },
      {
        label: 'Coach',
        value: state.profile.coachingStyle,
      },
    ],
  }
}
