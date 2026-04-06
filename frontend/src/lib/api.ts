import type {
  BodyCheckin,
  BodyPayload,
  BootstrapPayload,
  CoachCheckin,
  CoachPayload,
  DashboardPayload,
  ExerciseSummary,
  ExportResult,
  ExercisesPayload,
  FitnessProfile,
  HistoryPayload,
  OnboardingCompletePayload,
  OnboardingGeneratePayload,
  OnboardingStatePayload,
  PlanPayload,
  SessionDetail,
  SettingsPayload,
  TrainingBlock,
  TrainingDraftPayload,
  TrainingGoal,
  TrainingTemplatesPayload,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8765'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  if (!response.ok) {
    let message = 'No se pudo completar la solicitud.'
    try {
      const payload = (await response.json()) as { detail?: string }
      message = payload.detail || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export const api = {
  bootstrap: () => request<BootstrapPayload>('/bootstrap'),
  onboardingState: () => request<OnboardingStatePayload>('/onboarding/state'),
  saveOnboardingProfile: (payload: FitnessProfile) => request<{ saved: boolean; profile: FitnessProfile; state: OnboardingStatePayload }>('/onboarding/profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  saveOnboardingFocuses: (payload: { selectedFocuses: string[]; customFocuses?: { name: string; description: string }[] }) =>
    request<{ saved: boolean; selectedFocuses: string[]; state: OnboardingStatePayload }>('/onboarding/focuses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  generateOnboardingTemplates: (payload: OnboardingGeneratePayload) => request<{
    saved: boolean
    templates: NonNullable<TrainingDraftPayload['template']>[]
    state: OnboardingStatePayload
  }>('/onboarding/templates/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  completeOnboarding: (payload: OnboardingCompletePayload) => request<{
    saved: boolean
    result: { completedAt: string; selectedFocuses: string[]; templateCount: number }
    bootstrap: BootstrapPayload
    state: OnboardingStatePayload
  }>('/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  dashboard: () => request<DashboardPayload>('/dashboard'),
  trainingTemplates: () => request<TrainingTemplatesPayload>('/training/templates'),
  trainingDraft: (focus?: string) => request<TrainingDraftPayload>(`/training/session-draft${focus ? `?focus=${encodeURIComponent(focus)}` : ''}`),
  saveSession: (payload: TrainingDraftPayload['sessionDraft'] & { id?: number | null }) => request<{ saved: boolean; session: SessionDetail | null }>('/training/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  saveTemplate: (payload: TrainingDraftPayload['template']) => request<{ saved: boolean }>('/training/template/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  exercises: (params: Record<string, string>) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
    return request<ExercisesPayload>(`/exercises${query.size ? `?${query}` : ''}`)
  },
  exercise: (id: number) => request<ExerciseSummary>(`/exercises/${id}`),
  createExercise: (payload: ExerciseSummary) => request<{ saved: boolean; exercise: ExerciseSummary }>('/exercises', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateExercise: (id: number, payload: ExerciseSummary) => request<{ saved: boolean; exercise: ExerciseSummary }>(`/exercises/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  history: (params: Record<string, string>) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
    return request<HistoryPayload>(`/history${query.size ? `?${query}` : ''}`)
  },
  historyDetail: (id: number) => request<SessionDetail>(`/history/${id}`),
  deleteHistorySession: (id: number) => request<{ deleted: boolean; sessionId: number }>(`/history/${id}`, {
    method: 'DELETE',
  }),
  plan: () => request<PlanPayload>('/plan'),
  savePlanGoal: (payload: TrainingGoal) => request<{ saved: boolean; goalId: number; goal: TrainingGoal | null }>('/plan/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  savePlanBlock: (payload: TrainingBlock) => request<{ saved: boolean; blockId: number; block: TrainingBlock | null }>('/plan/blocks', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  bodyProfile: () => request<FitnessProfile>('/body/profile'),
  saveBodyProfile: (payload: FitnessProfile) => request<{ saved: boolean; profile: FitnessProfile }>('/body/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  bodyCheckins: () => request<BodyPayload>('/body/checkins'),
  saveBodyCheckin: (payload: BodyCheckin) => request<{ saved: boolean; checkin: BodyCheckin | null }>('/body/checkins', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  coachContext: () => request<CoachPayload>('/coach/context'),
  saveCoachCheckin: (payload: CoachCheckin) => request<{ saved: boolean; checkin: CoachCheckin | null }>('/coach/checkins', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  coachRespond: (message: string) => request<{ saved: boolean; message: CoachPayload['messages'][number]; context: CoachPayload }>('/coach/respond', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  settings: () => request<SettingsPayload>('/settings'),
  saveSettings: (payload: SettingsPayload) => request<{ saved: boolean; settings: SettingsPayload }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  exportJson: () => request<ExportResult>('/settings/export/json', {
    method: 'POST',
  }),
  exportCsv: () => request<ExportResult>('/settings/export/csv', {
    method: 'POST',
  }),
}
