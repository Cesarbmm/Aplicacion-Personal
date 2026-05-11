import type { ExerciseCatalogEntry, RoutineDraft, RoutineDraftDay, RoutineDraftExercise, RoutineGenerationProfile } from '../types/routine.js'

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

function getGoalLabel(goal: RoutineGenerationProfile['goal']) {
  switch (goal) {
    case 'strength':
      return 'Fuerza'
    case 'weight_loss':
      return 'Perdida de peso'
    default:
      return 'Hipertrofia'
  }
}

function getSetPrescription(profile: RoutineGenerationProfile) {
  if (profile.goal === 'weight_loss') {
    return profile.experienceLevel === 'advanced' ? 4 : 3
  }

  if (profile.goal === 'strength') {
    if (profile.experienceLevel === 'advanced') return 5
    return 4
  }

  if (profile.experienceLevel === 'beginner') return 3
  if (profile.experienceLevel === 'advanced') return 4
  return 4
}

function getRepPrescription(goal: RoutineGenerationProfile['goal']) {
  switch (goal) {
    case 'strength':
      return '3-6'
    case 'weight_loss':
      return '12-15'
    default:
      return '8-12'
  }
}

function getRestSeconds(profile: RoutineGenerationProfile) {
  switch (profile.goal) {
    case 'strength':
      return profile.experienceLevel === 'advanced' ? 180 : 150
    case 'weight_loss':
      return profile.experienceLevel === 'advanced' ? 45 : 60
    default:
      return 90
  }
}

function buildRoutineSplit(profile: RoutineGenerationProfile): DayTemplate[] {
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

function filterSelectorsForExperience(selectors: ExerciseSelector[], experienceLevel: RoutineGenerationProfile['experienceLevel']) {
  if (experienceLevel === 'beginner') {
    return selectors.slice(0, 4)
  }

  if (experienceLevel === 'intermediate') {
    return selectors.slice(0, 5)
  }

  return selectors
}

function matchesSelector(exercise: ExerciseCatalogEntry, selector: ExerciseSelector) {
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
  exercise: ExerciseCatalogEntry,
  selector: ExerciseSelector,
  profile: RoutineGenerationProfile,
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
  catalog: ExerciseCatalogEntry[],
  selector: ExerciseSelector,
  profile: RoutineGenerationProfile,
  usedExerciseIds: Set<string>,
) {
  const ranked = catalog
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

function buildRoutineDay(
  template: DayTemplate,
  dayNumber: number,
  catalog: ExerciseCatalogEntry[],
  profile: RoutineGenerationProfile,
): RoutineDraftDay {
  const selectors = filterSelectorsForExperience(template.selectors, profile.experienceLevel)
  const usedExerciseIds = new Set<string>()
  const exercises: RoutineDraftExercise[] = []
  const sets = getSetPrescription(profile)
  const reps = getRepPrescription(profile.goal)
  const restSeconds = getRestSeconds(profile)

  selectors.forEach((selector, index) => {
    const selectedExercise = pickExercise(catalog, selector, profile, usedExerciseIds)

    if (!selectedExercise) {
      return
    }

    usedExerciseIds.add(selectedExercise.exerciseId)
    exercises.push({
      exerciseId: selectedExercise.exerciseId,
      name: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      movementPattern: selectedExercise.movementPattern,
      equipment: selectedExercise.equipment,
      exerciseOrder: index + 1,
      sets,
      reps,
      restSeconds,
    })
  })

  return {
    dayNumber,
    title: template.title,
    exercises,
  }
}

export function generateRoutineDraft(
  profile: RoutineGenerationProfile,
  catalog: ExerciseCatalogEntry[],
): RoutineDraft {
  const split = buildRoutineSplit(profile)
  const days = split.map((template, index) =>
    buildRoutineDay(template, index + 1, catalog, profile),
  )

  return {
    userId: profile.userId,
    name: `Rutina semanal - ${getGoalLabel(profile.goal)}`,
    goal: profile.goal,
    daysPerWeek: profile.daysPerWeek,
    days,
  }
}
