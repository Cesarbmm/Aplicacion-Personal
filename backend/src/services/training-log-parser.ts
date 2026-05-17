import type { ExerciseCatalogEntry } from '../types/routine.js'
import type { ParsedTrainingLog, TrainingLogParseResult } from '../types/training-log.js'

const aliasByExerciseName = new Map<string, string[]>([
  ['Press de banca', ['banca', 'press banca', 'press de banca', 'pecho banca']],
  ['Sentadilla con barra', ['sentadilla', 'squat', 'sentadilla barra']],
  ['Peso muerto', ['peso muerto', 'deadlift']],
  ['Press militar', ['press militar', 'militar', 'hombro barra']],
  ['Remo con barra', ['remo', 'remo barra', 'remo con barra']],
  ['Jalon al pecho', ['jalon', 'jalon al pecho', 'lat pulldown']],
  ['Jalón al pecho', ['jalon', 'jalon al pecho', 'lat pulldown']],
  ['Curl de biceps', ['curl', 'biceps', 'curl biceps']],
  ['Curl de bíceps', ['curl', 'biceps', 'curl biceps']],
  ['Extension de triceps', ['triceps', 'extension triceps', 'triceps cable']],
  ['Extensión de tríceps', ['triceps', 'extension triceps', 'triceps cable']],
  ['Prensa de piernas', ['prensa', 'prensa piernas', 'leg press']],
  ['Plancha abdominal', ['plancha', 'plank', 'plancha abdominal']],
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

function findExerciseName(text: string, catalog: ExerciseCatalogEntry[]) {
  const normalizedText = normalizeText(text)

  const exact = catalog.find((exercise) => normalizedText.includes(normalizeText(exercise.name)))
  if (exact) {
    return exact.name
  }

  return catalog.find((exercise) => {
    const aliases = aliasByExerciseName.get(exercise.name) ?? []
    return aliases.some((alias) => normalizedText.includes(normalizeText(alias)))
  })?.name
}

function parseWithRegex(text: string, catalog: ExerciseCatalogEntry[]): ParsedTrainingLog {
  const normalizedText = normalizeText(text)
  const parsed: ParsedTrainingLog = {}
  const exerciseName = findExerciseName(text, catalog)

  if (exerciseName) {
    parsed.exerciseName = exerciseName
  }

  const setsMatch =
    normalizedText.match(/(\d+)\s*(?:series|serie|sets|set)\b/) ??
    normalizedText.match(/(?:hice|realice)\s*(\d+)\s*x\s*\d+/)
  if (setsMatch?.[1]) {
    parsed.sets = Number(setsMatch[1])
  }

  const repsMatch =
    normalizedText.match(/(?:series|serie|sets|set)\s*(?:de|x)?\s*(\d+)\b/) ??
    normalizedText.match(/\d+\s*x\s*(\d+)/) ??
    normalizedText.match(/(\d+)\s*(?:reps|repes|repeticiones|rep)\b/)
  if (repsMatch?.[1]) {
    parsed.reps = Number(repsMatch[1])
  }

  const weightMatch = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilos|kilogramos|lb|lbs|libras)\b/)
  if (weightMatch?.[1]) {
    parsed.weight = parseNumber(weightMatch[1])
    parsed.unit = weightMatch[2].startsWith('lb') || weightMatch[2] === 'libras' ? 'lb' : 'kg'
  }

  return parsed
}

async function parseWithOptionalOllama(
  text: string,
  catalog: ExerciseCatalogEntry[],
): Promise<ParsedTrainingLog | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL
  const model = process.env.OLLAMA_MODEL

  if (!baseUrl || !model) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const catalogNames = catalog.map((exercise) => exercise.name).join(', ')
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        prompt: [
          'Extrae un registro de entrenamiento en JSON estricto.',
          'Campos: exerciseName, sets, reps, weight, unit.',
          `Catalogo permitido: ${catalogNames}.`,
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

    const parsed = JSON.parse(payload.response) as ParsedTrainingLog
    return parsed
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeParsedExercise(parsed: ParsedTrainingLog, catalog: ExerciseCatalogEntry[]) {
  if (!parsed.exerciseName) {
    return parsed
  }

  const exerciseName = findExerciseName(parsed.exerciseName, catalog)
  return {
    ...parsed,
    exerciseName: exerciseName ?? parsed.exerciseName,
  }
}

function resolveFollowUp(parsed: ParsedTrainingLog) {
  if (!parsed.exerciseName) {
    return 'Que ejercicio realizaste?'
  }

  if (!parsed.sets || !parsed.reps) {
    return 'Cuantas series y repeticiones realizaste?'
  }

  return null
}

export async function parseTrainingLog(
  text: string,
  catalog: ExerciseCatalogEntry[],
): Promise<TrainingLogParseResult> {
  const ollamaParsed = await parseWithOptionalOllama(text, catalog)
  const parsed = normalizeParsedExercise(ollamaParsed ?? parseWithRegex(text, catalog), catalog)
  const followUpQuestion = resolveFollowUp(parsed)

  return {
    status: followUpQuestion ? 'needs_follow_up' : 'complete',
    parsed,
    followUpQuestion,
  }
}
