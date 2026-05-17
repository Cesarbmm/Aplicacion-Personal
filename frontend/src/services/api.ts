import type {
  SigmaExerciseCatalogEntry,
  SigmaAdaptiveSummary,
  SigmaCoachOverviewResponse,
  SigmaManualRoutinePayload,
  SigmaMonthlySummary,
  SigmaOnboardingPayload,
  SigmaRoutine,
  SigmaTrainingLogParseResult,
  SigmaUnit,
  SigmaWorkoutSession,
  SigmaWorkoutSessionSummary,
} from '@/lib/sigmafit/types'

const DEFAULT_API_URL = 'http://127.0.0.1:3000/api'
const apiBaseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')

type ApiErrorPayload = {
  error?: string
  message?: string
  details?: unknown
}

export type UserProfileResponse = {
  userId: string
  email: string
  name: string
  onboardingCompleted: boolean
  goal: SigmaOnboardingPayload['goal'] | null
  experienceLevel: SigmaOnboardingPayload['experienceLevel'] | null
  daysPerWeek: SigmaOnboardingPayload['daysPerWeek'] | null
  createdAt: string
  updatedAt: string | null
}

export type StartWorkoutSessionPayload = {
  routineId: string
  routineDayId: string
  unit: SigmaUnit
}

export type UpdateWorkoutSessionSetPayload = {
  completed: boolean
  weight: number | null
  unit: SigmaUnit
  actualReps?: number | null
  actualSeconds?: number | null
}

export type FinishWorkoutSessionPayload = {
  fatigueLevel?: number | null
  painLevel?: number | null
  athleteNotes?: string | null
}

export type ParseTrainingLogPayload = {
  userId: string
  text: string
}

export class ApiRequestError extends Error {
  status: number
  code: string
  details?: unknown

  constructor({
    message,
    status,
    code,
    details,
  }: {
    message: string
    status: number
    code: string
    details?: unknown
  }) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      ...init,
    })
  } catch {
    throw new ApiRequestError({
      message: 'No se pudo conectar con el backend SigmaFit.',
      status: 0,
      code: 'API_UNAVAILABLE',
    })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? ((await response.json()) as ApiErrorPayload | T) : null

  if (!response.ok) {
    const errorPayload = (payload || {}) as ApiErrorPayload
    throw new ApiRequestError({
      message: errorPayload.message || 'La solicitud a SigmaFit fallo.',
      status: response.status,
      code: errorPayload.error || 'API_ERROR',
      details: errorPayload.details,
    })
  }

  return payload as T
}

export const sigmafitApi = {
  getHealth() {
    return request<{ status: string; service: string }>('/health')
  },
  getUserProfile(userId: string) {
    return request<UserProfileResponse>(`/users/${userId}/profile`)
  },
  submitOnboarding(userId: string, payload: SigmaOnboardingPayload) {
    return request<UserProfileResponse>(`/users/${userId}/onboarding`, {
      method: 'POST',
      body: JSON.stringify({
        goal: payload.goal,
        experienceLevel: payload.experienceLevel,
        daysPerWeek: payload.daysPerWeek,
      }),
    })
  },
  getCurrentRoutine(userId: string) {
    return request<SigmaRoutine>(`/users/${userId}/routines/current`)
  },
  generateRoutineProposal(userId: string) {
    return request<SigmaRoutine>(`/users/${userId}/routines/generate`, {
      method: 'POST',
    })
  },
  createManualRoutine(userId: string, payload: SigmaManualRoutinePayload) {
    return request<SigmaRoutine>(`/users/${userId}/routines/manual`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getRoutine(routineId: string) {
    return request<SigmaRoutine>(`/routines/${routineId}`)
  },
  getExercises() {
    return request<SigmaExerciseCatalogEntry[]>('/exercises')
  },
  parseTrainingLog(payload: ParseTrainingLogPayload) {
    return request<SigmaTrainingLogParseResult>('/training-log/parse', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getAdaptiveSummary(userId: string) {
    return request<SigmaAdaptiveSummary>(`/users/${userId}/adaptive-summary`)
  },
  getMonthlySummary(userId: string, month?: string) {
    const search = month ? `?month=${encodeURIComponent(month)}` : ''
    return request<SigmaMonthlySummary>(`/users/${userId}/monthly-summary${search}`)
  },
  getCoachOverview() {
    return request<SigmaCoachOverviewResponse>('/coach/athletes-overview')
  },
  generateAdaptiveRecommendation(userId: string) {
    return request<SigmaAdaptiveSummary>(`/users/${userId}/adaptive-recommendations`, {
      method: 'POST',
    })
  },
  startWorkoutSession(userId: string, payload: StartWorkoutSessionPayload) {
    return request<SigmaWorkoutSession>(`/users/${userId}/workout-sessions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  updateWorkoutSessionSet(sessionId: string, setId: string, payload: UpdateWorkoutSessionSetPayload) {
    return request<SigmaWorkoutSession>(`/workout-sessions/${sessionId}/sets/${setId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  finishWorkoutSession(sessionId: string, payload: FinishWorkoutSessionPayload = {}) {
    return request<SigmaWorkoutSessionSummary>(`/workout-sessions/${sessionId}/finish`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
}
