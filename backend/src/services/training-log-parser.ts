import type { ExerciseCatalogEntry } from '../types/routine.js'
import type {
  ParsedTrainingLogItem,
  TrainingLogParseResult,
  TrainingLogSessionFeedback,
} from '../types/training-log.js'

const aliasesByCanonicalName = new Map<string, string[]>([
  ['Press de banca', ['press de banca', 'press banca', 'pecho banca', 'banca']],
  ['Sentadilla con barra', ['sentadilla con barra', 'sentadilla barra', 'sentadilla', 'squat']],
  ['Peso muerto', ['peso muerto', 'deadlift']],
  ['Press militar', ['press militar', 'militar', 'hombro barra']],
  ['Remo con barra', ['remo con barra', 'remo barra', 'remo']],
  ['Jalon al pecho', ['jalon al pecho', 'lat pulldown', 'jalon']],
  ['Curl de biceps', ['curl de biceps', 'curl biceps', 'biceps', 'curl']],
  ['Extension de triceps', ['extension de triceps', 'extension triceps', 'triceps cable', 'triceps']],
  ['Prensa de piernas', ['prensa de piernas', 'prensa piernas', 'leg press', 'prensa']],
  ['Plancha abdominal', ['plancha abdominal', 'plancha', 'plank']],
  ['Flexiones', ['flexiones de pecho', 'flexiones', 'push ups', 'pushups']],
])

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseNumber(value: string) {
  return Number(value.replace(',', '.'))
}

function aliasesForExercise(exercise: ExerciseCatalogEntry) {
  const normalizedName = normalizeText(exercise.name)
  const configured =
    aliasesByCanonicalName.get(exercise.name) ??
    Array.from(aliasesByCanonicalName.entries()).find(
      ([canonical]) => normalizeText(canonical) === normalizedName,
    )?.[1] ??
    []

  return [exercise.name, ...configured]
    .map(normalizeText)
    .filter((alias, index, aliases) => alias && aliases.indexOf(alias) === index)
    .sort((left, right) => right.length - left.length)
}

function findExerciseMentions(text: string, catalog: ExerciseCatalogEntry[]) {
  const normalized = normalizeText(text)
  const mentions = catalog
    .map((exercise) => {
      const indexes = aliasesForExercise(exercise)
        .map((alias) => ({ alias, index: normalized.indexOf(alias) }))
        .filter((item) => item.index >= 0)
        .sort((left, right) => left.index - right.index || right.alias.length - left.alias.length)

      return indexes[0] ? { exercise, index: indexes[0].index } : null
    })
    .filter((mention): mention is { exercise: ExerciseCatalogEntry; index: number } => Boolean(mention))
    .sort((left, right) => left.index - right.index)

  return mentions.filter(
    (mention, index) =>
      mentions.findIndex((candidate) => candidate.exercise.exerciseId === mention.exercise.exerciseId) === index,
  )
}

function parseFeedback(text: string): TrainingLogSessionFeedback {
  const normalized = normalizeText(text)
  const fatigue = normalized.match(/fatiga(?:\s*(?:de|:))?\s*(10|[0-9])\b/)
  const pain = normalized.match(/dolor(?:\s*(?:de|:))?\s*(10|[0-9])\b/)
  const notes = text.match(
    /(?:nota|notas|observacion|observaciones)\s*(?::|-)?\s*([^.;]+)/i,
  )

  return {
    fatigueLevel: fatigue?.[1] ? Number(fatigue[1]) : null,
    painLevel: pain?.[1] ? Number(pain[1]) : null,
    athleteNotes:
      notes?.[1]?.trim() || 'Registro post-entrenamiento interpretado desde texto.',
  }
}

function parseExerciseSegment(segment: string, exercise: ExerciseCatalogEntry): ParsedTrainingLogItem {
  const normalized = normalizeText(segment)
  const item: ParsedTrainingLogItem = {
    exerciseName: exercise.name,
    trackingType: exercise.trackingType,
  }

  const compactMatch = normalized.match(/(\d+)\s*x\s*(\d+)/)
  const seriesMatch = normalized.match(
    /(\d+)\s*(?:series|serie|sets|set)\s*(?:de|x)?\s*(\d+)?\s*(?:reps?|repeticiones|segundos?|secs?)?/,
  )

  if (compactMatch?.[1] && compactMatch[2]) {
    item.sets = Number(compactMatch[1])
    if (exercise.trackingType === 'time' || /\b(?:segundos?|secs?)\b/.test(normalized)) {
      item.actualSeconds = Number(compactMatch[2])
    } else {
      item.reps = Number(compactMatch[2])
    }
  } else if (seriesMatch?.[1]) {
    item.sets = Number(seriesMatch[1])
    if (seriesMatch[2]) {
      if (exercise.trackingType === 'time' || /\b(?:segundos?|secs?)\b/.test(normalized)) {
        item.actualSeconds = Number(seriesMatch[2])
      } else {
        item.reps = Number(seriesMatch[2])
      }
    }
  }

  const secondsMatch = normalized.match(/(\d+)\s*(?:segundos?|secs?)\b/)
  if (secondsMatch?.[1] && exercise.trackingType === 'time') {
    item.actualSeconds = Number(secondsMatch[1])
  }

  const weightMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilos?|kilogramos?|lb|lbs|libras?)\b/,
  )
  if (weightMatch?.[1] && weightMatch[2]) {
    item.weight = parseNumber(weightMatch[1])
    item.unit = weightMatch[2].startsWith('lb') || weightMatch[2].startsWith('libra') ? 'lb' : 'kg'
  } else if (/\b(?:sin peso|peso corporal)\b/.test(normalized)) {
    item.weight = 0
    item.unit = 'kg'
  }

  return item
}

function parseWithRegex(text: string, catalog: ExerciseCatalogEntry[]) {
  const normalized = normalizeText(text)
  const mentions = findExerciseMentions(text, catalog)

  return mentions.map((mention, index) => {
    const nextIndex = mentions[index + 1]?.index ?? normalized.length
    const segment = normalized.slice(mention.index, nextIndex)
    return parseExerciseSegment(segment, mention.exercise)
  })
}

function normalizeOllamaItems(items: ParsedTrainingLogItem[], catalog: ExerciseCatalogEntry[]) {
  return items.map((item) => {
    if (!item.exerciseName) {
      return item
    }

    const normalizedName = normalizeText(item.exerciseName)
    const exercise = catalog.find((candidate) =>
      aliasesForExercise(candidate).some(
        (alias) => normalizedName.includes(alias) || alias.includes(normalizedName),
      ),
    )

    return {
      ...item,
      exerciseName: exercise?.name ?? item.exerciseName,
      trackingType: exercise?.trackingType ?? item.trackingType,
    }
  })
}

async function parseWithOptionalOllama(
  text: string,
  catalog: ExerciseCatalogEntry[],
): Promise<{ items: ParsedTrainingLogItem[]; sessionFeedback: TrainingLogSessionFeedback } | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL
  const model = process.env.OLLAMA_MODEL

  if (!baseUrl || !model) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OLLAMA_TIMEOUT_MS ?? 8000),
  )

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        prompt: [
          'Convierte el texto de entrenamiento en JSON estricto y no inventes datos.',
          'Salida: {"items":[{"exerciseName":"","sets":0,"reps":0,"weight":0,"unit":"kg","actualSeconds":null,"trackingType":"weight_reps"}],"sessionFeedback":{"fatigueLevel":null,"painLevel":null,"athleteNotes":"Registro post-entrenamiento interpretado desde texto."}}',
          `Catalogo permitido: ${catalog.map((exercise) => `${exercise.name} (${exercise.trackingType})`).join(', ')}.`,
          'Ejemplo: "banca 4x8 80kg, plancha 3 series de 45 segundos. Fatiga 7 dolor 2"',
          'Ejemplo salida: {"items":[{"exerciseName":"Press de banca","sets":4,"reps":8,"weight":80,"unit":"kg","trackingType":"weight_reps"},{"exerciseName":"Plancha abdominal","sets":3,"actualSeconds":45,"unit":"kg","trackingType":"time"}],"sessionFeedback":{"fatigueLevel":7,"painLevel":2,"athleteNotes":"Registro post-entrenamiento interpretado desde texto."}}',
          `Texto: ${text}`,
        ].join('\n'),
      }),
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as { response?: string }
    if (!payload.response) {
      return null
    }

    const parsed = JSON.parse(payload.response) as {
      items?: ParsedTrainingLogItem[]
      sessionFeedback?: TrainingLogSessionFeedback
    }

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null
    }

    return {
      items: normalizeOllamaItems(parsed.items, catalog),
      sessionFeedback: parsed.sessionFeedback ?? parseFeedback(text),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function buildFollowUpQuestions(items: ParsedTrainingLogItem[]) {
  if (items.length === 0) {
    return ['Que ejercicios realizaste?']
  }

  return items.flatMap((item) => {
    const exerciseName = item.exerciseName ?? 'el ejercicio'
    const questions: string[] = []

    if (!item.sets) {
      questions.push(`Cuantas series hiciste en ${exerciseName}?`)
    }

    if (item.trackingType === 'time') {
      if (!item.actualSeconds) {
        questions.push(`Cuantos segundos realizaste por serie en ${exerciseName}?`)
      }
    } else if (!item.reps) {
      questions.push(`Cuantas repeticiones hiciste por serie en ${exerciseName}?`)
    }

    return questions
  })
}

export async function parseTrainingLog(
  text: string,
  catalog: ExerciseCatalogEntry[],
): Promise<TrainingLogParseResult> {
  const ollama = await parseWithOptionalOllama(text, catalog)
  const items = ollama?.items ?? parseWithRegex(text, catalog)
  const sessionFeedback = ollama?.sessionFeedback ?? parseFeedback(text)
  const followUpQuestions = buildFollowUpQuestions(items)

  return {
    status: followUpQuestions.length > 0 ? 'needs_follow_up' : 'complete',
    sessionFeedback,
    items,
    followUpQuestions,
    parsed: items[0] ?? {},
    followUpQuestion: followUpQuestions[0] ?? null,
  }
}
