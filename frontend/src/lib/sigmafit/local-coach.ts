import type {
  SigmaExperienceLevel,
  SigmaGoal,
  SigmaProfile,
  SigmaRoutine,
  SigmaRoutineDay,
  SigmaRoutineExercise,
  SigmaUnit,
  SigmaWorkoutExercise,
  SigmaWorkoutSession,
  SigmaWorkoutSessionSummary,
  SigmaWorkoutState,
} from './types'

type LocalExerciseCatalogEntry = {
  exerciseId: string
  name: string
  muscleGroup: string
  movementPattern: string
  equipment: string
  difficulty: SigmaExperienceLevel
  goalFocus: SigmaGoal | 'general'
}

type ExerciseSelector =
  | 'horizontalPush'
  | 'verticalPush'
  | 'horizontalPull'
  | 'verticalPull'
  | 'squat'
  | 'hinge'
  | 'legsAccessory'
  | 'triceps'
  | 'biceps'
  | 'core'

type DayTemplate = {
  title: string
  selectors: ExerciseSelector[]
}

const difficultyRank = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
} as const

const localExerciseCatalog: LocalExerciseCatalogEntry[] = [
  {
    exerciseId: 'local-press-banca',
    name: 'Press de banca',
    muscleGroup: 'Pecho',
    movementPattern: 'Empuje horizontal',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-sentadilla',
    name: 'Sentadilla con barra',
    muscleGroup: 'Piernas',
    movementPattern: 'Dominante de rodilla',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-peso-muerto',
    name: 'Peso muerto',
    muscleGroup: 'Posterior',
    movementPattern: 'Bisagra de cadera',
    equipment: 'Barra',
    difficulty: 'advanced',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-press-militar',
    name: 'Press militar',
    muscleGroup: 'Hombros',
    movementPattern: 'Empuje vertical',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'strength',
  },
  {
    exerciseId: 'local-remo',
    name: 'Remo con barra',
    muscleGroup: 'Espalda',
    movementPattern: 'Tiron horizontal',
    equipment: 'Barra',
    difficulty: 'intermediate',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-jalon',
    name: 'Jalon al pecho',
    muscleGroup: 'Espalda',
    movementPattern: 'Tiron vertical',
    equipment: 'Polea',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-curl',
    name: 'Curl de biceps',
    muscleGroup: 'Biceps',
    movementPattern: 'Aislamiento',
    equipment: 'Mancuernas',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-triceps',
    name: 'Extension de triceps',
    muscleGroup: 'Triceps',
    movementPattern: 'Aislamiento',
    equipment: 'Polea',
    difficulty: 'beginner',
    goalFocus: 'hypertrophy',
  },
  {
    exerciseId: 'local-prensa',
    name: 'Prensa de piernas',
    muscleGroup: 'Piernas',
    movementPattern: 'Dominante de rodilla',
    equipment: 'Maquina',
    difficulty: 'beginner',
    goalFocus: 'weight_loss',
  },
  {
    exerciseId: 'local-plancha',
    name: 'Plancha abdominal',
    muscleGroup: 'Core',
    movementPattern: 'Estabilidad',
    equipment: 'Peso corporal',
    difficulty: 'beginner',
    goalFocus: 'general',
  },
]

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function getGoalLabel(goal: SigmaGoal) {
  switch (goal) {
    case 'strength':
      return 'Fuerza'
    case 'weight_loss':
      return 'Perdida de peso'
    default:
      return 'Hipertrofia'
  }
}

function getSetPrescription(profile: Pick<SigmaProfile, 'goal' | 'experienceLevel'>) {
  if (profile.goal === 'weight_loss') {
    return profile.experienceLevel === 'advanced' ? 4 : 3
  }

  if (profile.goal === 'strength') {
    return profile.experienceLevel === 'advanced' ? 5 : 4
  }

  if (profile.experienceLevel === 'beginner') return 3
  return 4
}

function getRepPrescription(goal: SigmaGoal) {
  switch (goal) {
    case 'strength':
      return '3-6'
    case 'weight_loss':
      return '12-15'
    default:
      return '8-12'
  }
}

function getRestSeconds(profile: Pick<SigmaProfile, 'goal' | 'experienceLevel'>) {
  switch (profile.goal) {
    case 'strength':
      return profile.experienceLevel === 'advanced' ? 180 : 150
    case 'weight_loss':
      return profile.experienceLevel === 'advanced' ? 45 : 60
    default:
      return 90
  }
}

function buildRoutineSplit(profile: Pick<SigmaProfile, 'goal' | 'experienceLevel' | 'daysPerWeek'>): DayTemplate[] {
  const threeDayUsesPushPullLegs =
    profile.daysPerWeek === 3 &&
    profile.goal !== 'weight_loss' &&
    profile.experienceLevel !== 'beginner'

  if (profile.daysPerWeek === 2) {
    return [
      {
        title: 'Dia 1 - Full body A',
        selectors: ['squat', 'horizontalPush', 'horizontalPull', 'verticalPush', 'core'],
      },
      {
        title: 'Dia 2 - Full body B',
        selectors: ['hinge', 'verticalPull', 'legsAccessory', 'horizontalPush', 'biceps'],
      },
    ]
  }

  if (threeDayUsesPushPullLegs) {
    return [
      {
        title: 'Dia 1 - Push',
        selectors: ['horizontalPush', 'verticalPush', 'triceps', 'horizontalPush', 'core'],
      },
      {
        title: 'Dia 2 - Pull',
        selectors: ['horizontalPull', 'verticalPull', 'biceps', 'hinge', 'core'],
      },
      {
        title: 'Dia 3 - Legs',
        selectors: ['squat', 'legsAccessory', 'hinge', 'core', 'verticalPull'],
      },
    ]
  }

  if (profile.daysPerWeek === 3) {
    return [
      {
        title: 'Dia 1 - Full body A',
        selectors: ['squat', 'horizontalPush', 'horizontalPull', 'core', 'triceps'],
      },
      {
        title: 'Dia 2 - Full body B',
        selectors: ['hinge', 'verticalPush', 'verticalPull', 'core', 'biceps'],
      },
      {
        title: 'Dia 3 - Full body C',
        selectors: ['legsAccessory', 'horizontalPush', 'verticalPull', 'core', 'biceps'],
      },
    ]
  }

  if (profile.daysPerWeek === 4) {
    return [
      {
        title: 'Dia 1 - Tren superior A',
        selectors: ['horizontalPush', 'horizontalPull', 'verticalPush', 'verticalPull', 'triceps'],
      },
      {
        title: 'Dia 2 - Tren inferior A',
        selectors: ['squat', 'hinge', 'legsAccessory', 'core', 'verticalPull'],
      },
      {
        title: 'Dia 3 - Tren superior B',
        selectors: ['verticalPush', 'horizontalPush', 'verticalPull', 'horizontalPull', 'biceps'],
      },
      {
        title: 'Dia 4 - Tren inferior B',
        selectors: ['hinge', 'squat', 'legsAccessory', 'core', 'horizontalPull'],
      },
    ]
  }

  if (profile.daysPerWeek === 5) {
    return [
      {
        title: 'Dia 1 - Push',
        selectors: ['horizontalPush', 'verticalPush', 'triceps', 'horizontalPush', 'core'],
      },
      {
        title: 'Dia 2 - Pull',
        selectors: ['horizontalPull', 'verticalPull', 'biceps', 'hinge', 'core'],
      },
      {
        title: 'Dia 3 - Legs',
        selectors: ['squat', 'legsAccessory', 'hinge', 'core', 'verticalPull'],
      },
      {
        title: 'Dia 4 - Upper',
        selectors: ['horizontalPush', 'horizontalPull', 'verticalPush', 'verticalPull', 'biceps'],
      },
      {
        title: 'Dia 5 - Lower',
        selectors: ['hinge', 'squat', 'legsAccessory', 'core', 'horizontalPull'],
      },
    ]
  }

  return [
    {
      title: 'Dia 1 - Push A',
      selectors: ['horizontalPush', 'verticalPush', 'triceps', 'horizontalPush', 'core'],
    },
    {
      title: 'Dia 2 - Pull A',
      selectors: ['horizontalPull', 'verticalPull', 'biceps', 'hinge', 'core'],
    },
    {
      title: 'Dia 3 - Legs A',
      selectors: ['squat', 'legsAccessory', 'hinge', 'core', 'verticalPull'],
    },
    {
      title: 'Dia 4 - Push B',
      selectors: ['verticalPush', 'horizontalPush', 'triceps', 'horizontalPush', 'core'],
    },
    {
      title: 'Dia 5 - Pull B',
      selectors: ['verticalPull', 'horizontalPull', 'biceps', 'hinge', 'core'],
    },
    {
      title: 'Dia 6 - Legs B',
      selectors: ['hinge', 'squat', 'legsAccessory', 'core', 'horizontalPull'],
    },
  ]
}

function filterSelectorsForExperience(selectors: ExerciseSelector[], experienceLevel: SigmaExperienceLevel) {
  if (experienceLevel === 'beginner') {
    return selectors.slice(0, 4)
  }

  if (experienceLevel === 'intermediate') {
    return selectors.slice(0, 5)
  }

  return selectors
}

function matchesSelector(exercise: LocalExerciseCatalogEntry, selector: ExerciseSelector) {
  switch (selector) {
    case 'horizontalPush':
      return exercise.movementPattern === 'Empuje horizontal'
    case 'verticalPush':
      return exercise.movementPattern === 'Empuje vertical'
    case 'horizontalPull':
      return exercise.movementPattern === 'Tiron horizontal'
    case 'verticalPull':
      return exercise.movementPattern === 'Tiron vertical'
    case 'squat':
      return exercise.movementPattern === 'Dominante de rodilla'
    case 'hinge':
      return exercise.movementPattern === 'Bisagra de cadera'
    case 'legsAccessory':
      return exercise.muscleGroup === 'Piernas'
    case 'triceps':
      return exercise.muscleGroup === 'Triceps'
    case 'biceps':
      return exercise.muscleGroup === 'Biceps'
    case 'core':
      return exercise.muscleGroup === 'Core'
  }
}

function scoreExercise(
  exercise: LocalExerciseCatalogEntry,
  selector: ExerciseSelector,
  profile: Pick<SigmaProfile, 'goal' | 'experienceLevel'>,
) {
  let score = 0

  if (matchesSelector(exercise, selector)) {
    score += 20
  }

  if (exercise.goalFocus === profile.goal) {
    score += 12
  }

  if (exercise.goalFocus === 'general') {
    score += 6
  }

  if (difficultyRank[exercise.difficulty] <= difficultyRank[profile.experienceLevel]) {
    score += 8
  } else {
    score -= 4
  }

  return score
}

function pickExercise(
  selector: ExerciseSelector,
  profile: Pick<SigmaProfile, 'goal' | 'experienceLevel'>,
  usedExerciseIds: Set<string>,
) {
  const ranked = localExerciseCatalog
    .filter((exercise) => matchesSelector(exercise, selector))
    .sort((left, right) => {
      const scoreDiff = scoreExercise(right, selector, profile) - scoreExercise(left, selector, profile)
      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return left.name.localeCompare(right.name)
    })

  const unused = ranked.find((exercise) => !usedExerciseIds.has(exercise.exerciseId))
  return unused ?? ranked[0] ?? null
}

function parseRepRangeToTargetReps(repRange: string) {
  if (!repRange.includes('-')) {
    return Number(repRange)
  }

  const [min, max] = repRange.split('-').map((value) => Number(value))
  return Math.round((min + max) / 2)
}

function mapRoutineDayToWorkoutExercises(day: SigmaRoutineDay): SigmaWorkoutExercise[] {
  return day.exercises.map((exercise) => ({
    id: exercise.routineExerciseId,
    name: exercise.name,
    focus: `${exercise.muscleGroup} / ${exercise.movementPattern}`,
    note: `Descanso recomendado ${exercise.restSeconds}s. Equipo: ${exercise.equipment}.`,
    restSeconds: exercise.restSeconds,
    substitute: 'Usar variante equivalente del mismo patron si el gym esta ocupado.',
    targetRpe: exercise.reps === '3-6' ? 8 : exercise.reps === '12-15' ? 7 : 8,
    sets: Array.from({ length: exercise.sets }, (_, index) => ({
      id: `${exercise.routineExerciseId}-preview-${index + 1}`,
      reps: parseRepRangeToTargetReps(exercise.reps),
      weight: 0,
      completed: false,
    })),
  }))
}

export function generateLocalRoutine(profile: SigmaProfile, userId: string): SigmaRoutine {
  const split = buildRoutineSplit(profile)
  const sets = getSetPrescription(profile)
  const reps = getRepPrescription(profile.goal)
  const restSeconds = getRestSeconds(profile)

  const days: SigmaRoutineDay[] = split.map((template, index) => {
    const selectors = filterSelectorsForExperience(template.selectors, profile.experienceLevel)
    const usedExerciseIds = new Set<string>()
    const exercises: SigmaRoutineExercise[] = selectors
      .map((selector, exerciseIndex) => {
        const exercise = pickExercise(selector, profile, usedExerciseIds)
        if (!exercise) {
          return null
        }

        usedExerciseIds.add(exercise.exerciseId)

        return {
          routineExerciseId: createId(`local-routine-exercise-${index + 1}-${exerciseIndex + 1}`),
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          movementPattern: exercise.movementPattern,
          equipment: exercise.equipment,
          exerciseOrder: exerciseIndex + 1,
          sets,
          reps,
          restSeconds,
        }
      })
      .filter((value): value is SigmaRoutineExercise => value !== null)

    return {
      routineDayId: createId(`local-routine-day-${index + 1}`),
      dayNumber: index + 1,
      title: template.title,
      exercises,
    }
  })

  return {
    routineId: createId('local-routine'),
    userId,
    name: `Rutina semanal - ${getGoalLabel(profile.goal)}`,
    goal: profile.goal,
    daysPerWeek: profile.daysPerWeek,
    isActive: true,
    createdAt: new Date().toISOString(),
    days,
  }
}

export function createLocalWorkoutSession(
  routine: SigmaRoutine,
  routineDayId: string,
  unit: SigmaUnit,
): SigmaWorkoutSession {
  const routineDay = routine.days.find((day) => day.routineDayId === routineDayId) ?? routine.days[0]

  return {
    sessionId: createId('local-session'),
    userId: routine.userId,
    routineId: routine.routineId,
    routineDayId: routineDay.routineDayId,
    dayNumber: routineDay.dayNumber,
    title: routineDay.title,
    status: 'active',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exercises: routineDay.exercises.map((exercise) => ({
      routineExerciseId: exercise.routineExerciseId,
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      exerciseOrder: exercise.exerciseOrder,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
      sessionSets: Array.from({ length: exercise.sets }, (_, index) => ({
        setId: createId(`local-session-set-${exercise.routineExerciseId}-${index + 1}`),
        routineExerciseId: exercise.routineExerciseId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        setNumber: index + 1,
        targetReps: parseRepRangeToTargetReps(exercise.reps),
        completed: false,
        weight: null,
        unit,
        completedAt: null,
      })),
    })),
  }
}

export function updateLocalWorkoutSessionSet(
  session: SigmaWorkoutSession,
  setId: string,
  payload: {
    completed: boolean
    weight: number
    unit: SigmaUnit
  },
) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sessionSets: exercise.sessionSets.map((setItem) =>
        setItem.setId === setId
          ? {
              ...setItem,
              completed: payload.completed,
              weight: payload.weight,
              unit: payload.unit,
              completedAt: payload.completed ? new Date().toISOString() : null,
            }
          : setItem,
      ),
    })),
  }
}

export function finishLocalWorkoutSession(session: SigmaWorkoutSession) {
  const completedSession: SigmaWorkoutSession = {
    ...session,
    status: 'completed',
    finishedAt: new Date().toISOString(),
  }

  const completedSets = completedSession.exercises.reduce(
    (total, exercise) => total + exercise.sessionSets.filter((setItem) => setItem.completed).length,
    0,
  )

  const totalVolume = completedSession.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sessionSets.reduce((exerciseTotal, setItem) => {
        if (!setItem.completed || setItem.weight === null) {
          return exerciseTotal
        }

        return exerciseTotal + setItem.weight * setItem.targetReps
      }, 0),
    0,
  )

  const summary: SigmaWorkoutSessionSummary = {
    sessionId: completedSession.sessionId,
    status: 'completed',
    completedSets,
    totalVolume,
  }

  return {
    session: completedSession,
    summary,
  }
}

export function routineToWorkoutPreview(
  routine: SigmaRoutine | null,
  previousWorkout: SigmaWorkoutState,
): SigmaWorkoutState {
  const previewDay = routine?.days[0]

  if (!previewDay) {
    return previousWorkout
  }

  return {
    ...previousWorkout,
    title: previewDay.title,
    block: routine.name,
    focus: previewDay.exercises.map((exercise) => exercise.muscleGroup).join(', '),
    sessionLengthMinutes: Math.max(40, previewDay.exercises.length * 12),
    activeExerciseId: previewDay.exercises[0]?.routineExerciseId ?? previousWorkout.activeExerciseId,
    notes: 'Rutina semanal generada. Puedes iniciar el dia que te toque desde el tracker.',
    exercises: mapRoutineDayToWorkoutExercises(previewDay),
  }
}

export function sessionToWorkoutState(
  session: SigmaWorkoutSession,
  previousWorkout: SigmaWorkoutState,
): SigmaWorkoutState {
  return {
    ...previousWorkout,
    title: session.title,
    block: `Sesion activa / Dia ${session.dayNumber}`,
    focus: session.exercises.map((exercise) => exercise.muscleGroup).join(', '),
    sessionLengthMinutes: Math.max(35, session.exercises.length * 10),
    activeExerciseId: session.exercises[0]?.routineExerciseId ?? previousWorkout.activeExerciseId,
    notes: 'Sesión activa sincronizada con el tracker en vivo.',
    exercises: session.exercises.map((exercise) => ({
      id: exercise.routineExerciseId,
      name: exercise.name,
      focus: exercise.muscleGroup,
      note: `Descanso ${exercise.restSeconds}s. Reps objetivo ${exercise.reps}.`,
      restSeconds: exercise.restSeconds,
      substitute: 'Usar variante equivalente del mismo patron.',
      targetRpe: exercise.reps === '3-6' ? 8 : exercise.reps === '12-15' ? 7 : 8,
      sets: exercise.sessionSets.map((setItem) => ({
        id: setItem.setId,
        reps: setItem.targetReps,
        weight: setItem.weight ?? 0,
        completed: setItem.completed,
      })),
    })),
  }
}
