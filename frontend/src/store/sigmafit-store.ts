import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  SIGMAFIT_DEMO_COACH_ID,
  SIGMAFIT_DEMO_GYM_ID,
  SIGMAFIT_DEMO_USER_ID,
  sigmaExerciseCatalogFallback,
} from '@/lib/sigmafit/catalog'
import {
  createLocalManualRoutine,
  createLocalWorkoutSession,
  finishLocalWorkoutSession,
  generateLocalRoutine,
  routineToWorkoutPreview,
  sessionToWorkoutState,
  updateLocalWorkoutSessionSet,
} from '@/lib/sigmafit/local-coach'
import { createDefaultSigmafitState, onboardingToStatePatch } from '@/lib/sigmafit/mock-data'
import type {
  SigmaAdaptiveSummary,
  SigmaCoachOverviewResponse,
  SigmaCreateAccountPayload,
  SigmaManualRoutinePayload,
  SigmaMonthlySummary,
  SigmaOnboardingPayload,
  SigmaParsedTrainingLog,
  SigmaPostWorkoutSessionPayload,
  SigmaPreferences,
  SigmaProfile,
  SigmaRoutine,
  SigmaRoutineCreationMode,
  SigmaRoutineSource,
  SigmaTrainingLogParseResult,
  SigmaUserRole,
  SigmaWorkoutSession,
  SigmaWorkoutSessionSet,
  SigmaWorkoutSet,
  SigmafitStateSnapshot,
} from '@/lib/sigmafit/types'
import type {
  FinishWorkoutSessionPayload,
  StartWorkoutSessionPayload,
  UpdateWorkoutSessionSetPayload,
  UserProfileResponse,
} from '@/services/api'
import { ApiRequestError, sigmafitApi } from '@/services/api'

type LoginResult = {
  onboardingComplete: boolean
  backendStatus: 'online' | 'offline'
  warning: string | null
}

type CompleteOnboardingResult = {
  onboardingComplete: boolean
  persistedToBackend: boolean
  warning: string | null
}

type LoadRoutineResult = {
  routineState: 'current' | 'proposal' | 'none'
  source: SigmaRoutineSource
  warning: string | null
}

type LoadExerciseCatalogResult = {
  loaded: boolean
  source: 'backend' | 'fallback'
  warning: string | null
}

type GenerateRoutineProposalResult = {
  proposed: boolean
  source: 'backend' | 'fallback'
  warning: string | null
}

type CreateManualRoutineResult = {
  routineAvailable: boolean
  source: 'backend' | 'fallback'
  warning: string | null
}

type AcceptRoutineProposalResult = {
  accepted: boolean
}

type StartWorkoutSessionResult = {
  started: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type CompleteWorkoutSetResult = {
  updated: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type FinishWorkoutSessionResult = {
  finished: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type AdaptiveSummaryResult = {
  loaded: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type AssistedLogParseResult = {
  parsed: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type MonthlySummaryResult = {
  loaded: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type CoachOverviewResult = {
  loaded: boolean
  source: 'backend' | 'local'
  warning: string | null
}

type CreateAccountResult = {
  created: boolean
  userId: string
  onboardingComplete: boolean
  warning: string | null
}

type SigmafitActions = {
  login: (payload: { email: string; displayName?: string; userId?: string; role?: SigmaUserRole }) => Promise<LoginResult>
  createAccount: (payload: SigmaCreateAccountPayload) => Promise<CreateAccountResult>
  logout: () => void
  completeOnboarding: (payload: SigmaOnboardingPayload) => Promise<CompleteOnboardingResult>
  loadCurrentRoutine: () => Promise<LoadRoutineResult>
  loadExerciseCatalog: (force?: boolean) => Promise<LoadExerciseCatalogResult>
  selectRoutineFlow: (flow: SigmaRoutineCreationMode) => void
  generateRoutineProposal: () => Promise<GenerateRoutineProposalResult>
  acceptRoutineProposal: () => AcceptRoutineProposalResult
  regenerateRoutineProposal: () => Promise<GenerateRoutineProposalResult>
  createManualRoutine: (payload: SigmaManualRoutinePayload) => Promise<CreateManualRoutineResult>
  clearRoutineProposal: () => void
  loadAdaptiveSummary: () => Promise<AdaptiveSummaryResult>
  generateAdaptiveRecommendation: () => Promise<AdaptiveSummaryResult>
  parseTrainingLog: (text: string) => Promise<AssistedLogParseResult>
  clearAssistedLog: () => void
  savePostWorkoutSession: (payload: SigmaPostWorkoutSessionPayload) => Promise<FinishWorkoutSessionResult>
  loadMonthlySummary: (month?: string) => Promise<MonthlySummaryResult>
  loadCoachOverview: () => Promise<CoachOverviewResult>
  startWorkoutSession: (payload: StartWorkoutSessionPayload) => Promise<StartWorkoutSessionResult>
  updateSessionSetDraft: (
    sessionId: string,
    setId: string,
    patch: Partial<Pick<SigmaWorkoutSessionSet, 'weight' | 'unit' | 'completed' | 'actualReps' | 'actualSeconds'>>,
  ) => void
  completeWorkoutSet: (
    sessionId: string,
    setId: string,
    payload: UpdateWorkoutSessionSetPayload,
  ) => Promise<CompleteWorkoutSetResult>
  finishWorkoutSession: (sessionId: string, payload?: FinishWorkoutSessionPayload) => Promise<FinishWorkoutSessionResult>
  updateWorkoutSet: (exerciseId: string, setId: string, patch: Partial<SigmaWorkoutSet>) => void
  setActiveExercise: (exerciseId: string) => void
  submitWorkoutRpe: (rpe: number) => void
  updateProfile: (patch: Partial<SigmaProfile>) => void
  updatePreferences: (patch: Partial<SigmaPreferences>) => void
  clearSyncError: () => void
  clearRoutineError: () => void
  clearTrainingError: () => void
  clearAdaptiveError: () => void
  resetDemo: () => void
}

export type SigmafitStore = SigmafitStateSnapshot & SigmafitActions

const SIGMAFIT_STORE_VERSION = 7

function buildInitialState(): SigmafitStateSnapshot {
  return createDefaultSigmafitState()
}

function migratePersistedState(persistedState: unknown): SigmafitStateSnapshot {
  const defaults = buildInitialState()

  if (!persistedState || typeof persistedState !== 'object') {
    return defaults
  }

  const persisted = persistedState as Partial<SigmafitStateSnapshot>

  return {
    ...defaults,
    ...persisted,
    session: {
      ...defaults.session,
      ...persisted.session,
      role: persisted.session?.role ?? defaults.session.role,
    },
    profile: {
      ...defaults.profile,
      ...persisted.profile,
    },
    routine: defaults.routine,
    training: defaults.training,
    assistedLog: defaults.assistedLog,
    adaptive: defaults.adaptive,
    monthlySummary: defaults.monthlySummary,
    coach: defaults.coach,
    workout: defaults.workout,
  }
}

function getResetSlices() {
  const defaults = buildInitialState()
  return {
    routine: defaults.routine,
    training: defaults.training,
    assistedLog: defaults.assistedLog,
    adaptive: defaults.adaptive,
    monthlySummary: defaults.monthlySummary,
    coach: defaults.coach,
    workout: defaults.workout,
  }
}

function isApiUnavailable(error: unknown) {
  return error instanceof ApiRequestError && error.code === 'API_UNAVAILABLE'
}

function applyRemoteProfile(profile: SigmaProfile, payload: UserProfileResponse): SigmaProfile {
  const goal = payload.goal ?? profile.goal

  return {
    ...profile,
    displayName: payload.name || profile.displayName,
    email: payload.email || profile.email,
    goal,
    experienceLevel: payload.experienceLevel ?? profile.experienceLevel,
    daysPerWeek: payload.daysPerWeek ?? profile.daysPerWeek,
    focus:
      goal === 'strength' ? 'Upper strength' : goal === 'weight_loss' ? 'Full body density' : 'Push A',
    notes: payload.onboardingCompleted
      ? 'Perfil inicial listo para entrenar.'
      : profile.notes,
  }
}

function applyCurrentRoutineToState(
  state: SigmafitStateSnapshot,
  routine: SigmaRoutine,
  source: Exclude<SigmaRoutineSource, 'none'>,
): Pick<SigmafitStateSnapshot, 'routine' | 'workout'> {
  return {
    routine: {
      ...state.routine,
      currentRoutine: routine,
      proposedRoutine: null,
      isLoading: false,
      isSavingManual: false,
      error: null,
      source,
      proposalSource: 'none',
      lastGeneratedAt: new Date().toISOString(),
      hasUserChosenRoutineFlow: true,
      proposalPendingAcceptance: false,
      pendingRoutineId: null,
      selectedCreationFlow: routine.creationMode,
    },
    workout: state.training.activeSession
      ? state.workout
      : routineToWorkoutPreview(routine, state.workout),
  }
}

function applyProposedRoutineToState(
  state: SigmafitStateSnapshot,
  routine: SigmaRoutine,
  source: Exclude<SigmaRoutineSource, 'none'>,
): Pick<SigmafitStateSnapshot, 'routine'> {
  return {
    routine: {
      ...state.routine,
      currentRoutine: null,
      proposedRoutine: routine,
      isLoading: false,
      isSavingManual: false,
      error: null,
      source: 'none',
      proposalSource: source,
      lastGeneratedAt: new Date().toISOString(),
      hasUserChosenRoutineFlow: true,
      proposalPendingAcceptance: true,
      pendingRoutineId: routine.routineId,
      selectedCreationFlow: 'coach',
    },
  }
}

function applyFetchedRoutineToState(
  state: SigmafitStateSnapshot,
  routine: SigmaRoutine,
  source: Exclude<SigmaRoutineSource, 'none'>,
): Partial<SigmafitStateSnapshot> {
  if (state.routine.proposalPendingAcceptance && state.routine.pendingRoutineId === routine.routineId) {
    return applyProposedRoutineToState(state, routine, source)
  }

  return applyCurrentRoutineToState(state, routine, source)
}

function clearRoutineState(
  state: SigmafitStateSnapshot,
  options?: { keepCatalog?: boolean; keepFlowSelection?: boolean },
): Pick<SigmafitStateSnapshot, 'routine'> {
  return {
    routine: {
      ...state.routine,
      currentRoutine: null,
      proposedRoutine: null,
      exerciseCatalog: options?.keepCatalog ? state.routine.exerciseCatalog : [],
      isLoading: false,
      isCatalogLoading: false,
      isSavingManual: false,
      error: null,
      source: 'none',
      proposalSource: 'none',
      lastGeneratedAt: null,
      hasUserChosenRoutineFlow: options?.keepFlowSelection ? state.routine.hasUserChosenRoutineFlow : false,
      proposalPendingAcceptance: false,
      pendingRoutineId: null,
      selectedCreationFlow: options?.keepFlowSelection ? state.routine.selectedCreationFlow : null,
    },
  }
}

function promoteProposedRoutine(state: SigmafitStateSnapshot): Partial<SigmafitStateSnapshot> {
  if (!state.routine.proposedRoutine) {
    return state
  }

  return {
    ...applyCurrentRoutineToState(
      state,
      state.routine.proposedRoutine,
      state.routine.proposalSource === 'none' ? 'fallback' : state.routine.proposalSource,
    ),
  }
}

function applyWorkoutSessionToState(
  state: SigmafitStateSnapshot,
  activeSession: SigmaWorkoutSession,
  source: 'backend' | 'local',
): Pick<SigmafitStateSnapshot, 'training' | 'workout'> {
  return {
    training: {
      ...state.training,
      activeSession,
      isStarting: false,
      isUpdatingSet: false,
      isFinishing: false,
      error: null,
      source,
    },
    workout: sessionToWorkoutState(activeSession, state.workout),
  }
}

function updateSessionSetDraftInSession(
  session: SigmaWorkoutSession,
  setId: string,
  patch: Partial<Pick<SigmaWorkoutSessionSet, 'weight' | 'unit' | 'completed' | 'actualReps' | 'actualSeconds'>>,
) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sessionSets: exercise.sessionSets.map((setItem) =>
        setItem.setId === setId
          ? {
              ...setItem,
              ...patch,
            }
          : setItem,
      ),
    })),
  }
}

function resolveRoutineSourceFromState(state: SigmafitStateSnapshot): SigmaRoutineSource {
  if (state.routine.currentRoutine) {
    return state.routine.source
  }

  if (state.routine.proposedRoutine) {
    return state.routine.proposalSource
  }

  return 'none'
}

function getLocalAdaptiveRecommendation(summary: Omit<SigmaAdaptiveSummary, 'recommendation'>) {
  const averageFatigue = summary.averageFatigue ?? 0
  const averagePain = summary.averagePain ?? 0
  const maxPain = summary.maxPain ?? 0

  if (maxPain >= 7 || averagePain >= 7) {
    return {
      type: 'deload' as const,
      summary: 'Se recomienda descarga y control tecnico.',
      reasoning:
        'Se detecto molestia alta. Conviene reducir carga o volumen, revisar tecnica y consultar a un profesional si persiste.',
      suggestedLoadChangePercent: -10,
      suggestedVolumeChange: 'reduce' as const,
      riskLevel: 'high' as const,
    }
  }

  if (averageFatigue >= 8) {
    return {
      type: 'deload' as const,
      summary: 'Se recomienda una descarga parcial.',
      reasoning:
        'La fatiga reportada fue alta. Reducir series o carga estimada entre 5% y 10% ayuda a recuperar sin abandonar el bloque.',
      suggestedLoadChangePercent: -7.5,
      suggestedVolumeChange: 'reduce' as const,
      riskLevel: 'medium' as const,
    }
  }

  if (summary.sessionsAnalyzed === 0) {
    return {
      type: 'maintain' as const,
      summary: 'Aun no hay sesiones suficientes para ajustar.',
      reasoning: 'Finaliza entrenamientos con reps, peso, fatiga y dolor para generar una lectura mas util.',
      suggestedLoadChangePercent: 0,
      suggestedVolumeChange: 'maintain' as const,
      riskLevel: 'low' as const,
    }
  }

  if (summary.completionRate < 0.6) {
    return {
      type: 'simplify' as const,
      summary: 'Conviene simplificar antes de progresar.',
      reasoning: 'El cumplimiento fue bajo. Antes de subir carga, conviene consolidar adherencia.',
      suggestedLoadChangePercent: 0,
      suggestedVolumeChange: 'reduce' as const,
      riskLevel: 'medium' as const,
    }
  }

  if (summary.completionRate >= 0.85 && averageFatigue <= 6 && averagePain <= 3) {
    return {
      type: 'progress' as const,
      summary: 'Puedes progresar de forma moderada.',
      reasoning: 'Buen cumplimiento, fatiga controlada y bajo dolor.',
      suggestedLoadChangePercent: 2.5,
      suggestedVolumeChange: 'maintain' as const,
      riskLevel: 'low' as const,
    }
  }

  return {
    type: 'maintain' as const,
    summary: 'Mantener la carga esta semana.',
    reasoning: 'La respuesta fue estable, pero no hay margen claro para subir carga.',
    suggestedLoadChangePercent: 0,
    suggestedVolumeChange: 'maintain' as const,
    riskLevel: averageFatigue >= 7 || averagePain >= 4 ? ('medium' as const) : ('low' as const),
  }
}

function createLocalAdaptiveSummary(state: SigmafitStateSnapshot): SigmaAdaptiveSummary {
  const completed = state.training.lastCompletedSummary
  const baseSummary = {
    userId: state.session.userId || SIGMAFIT_DEMO_USER_ID,
    routineId: state.routine.currentRoutine?.routineId ?? null,
    sessionsAnalyzed: completed ? 1 : 0,
    completedSets: completed?.completedSets ?? 0,
    plannedSets: completed?.completedSets ?? 0,
    completionRate: completed && completed.completedSets > 0 ? 1 : 0,
    averageFatigue: completed?.fatigueLevel ?? null,
    averagePain: completed?.painLevel ?? null,
    maxPain: completed?.painLevel ?? null,
    totalVolume: completed?.totalVolume ?? 0,
    totalReps: completed?.totalReps ?? 0,
    totalSeconds: completed?.totalSeconds ?? 0,
    notes: completed?.athleteNotes ? [completed.athleteNotes] : [],
  }

  return {
    ...baseSummary,
    recommendation: getLocalAdaptiveRecommendation(baseSummary),
  }
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function parseLocalTrainingLog(text: string, state: SigmafitStateSnapshot): SigmaTrainingLogParseResult {
  const catalog = state.routine.exerciseCatalog.length > 0 ? state.routine.exerciseCatalog : sigmaExerciseCatalogFallback
  const normalizedText = normalizeText(text)
  const aliasMap = new Map<string, string[]>([
    ['Press de banca', ['banca', 'press banca', 'press de banca']],
    ['Sentadilla con barra', ['sentadilla', 'squat']],
    ['Peso muerto', ['peso muerto', 'deadlift']],
    ['Press militar', ['press militar', 'militar']],
    ['Remo con barra', ['remo', 'remo barra']],
    ['Jalon al pecho', ['jalon', 'jalon al pecho']],
    ['Jalón al pecho', ['jalon', 'jalon al pecho']],
    ['Curl de biceps', ['curl', 'biceps']],
    ['Curl de bíceps', ['curl', 'biceps']],
    ['Extension de triceps', ['triceps', 'extension triceps']],
    ['Extensión de tríceps', ['triceps', 'extension triceps']],
    ['Prensa de piernas', ['prensa', 'leg press']],
    ['Plancha abdominal', ['plancha', 'plank']],
    ['Flexiones', ['flexiones', 'push ups', 'pushups']],
  ])

  const mentions = catalog
    .map((exercise) => {
      const aliases = [exercise.name, ...(aliasMap.get(exercise.name) ?? [])]
        .map(normalizeText)
        .sort((left, right) => right.length - left.length)
      const index = Math.min(
        ...aliases.map((alias) => normalizedText.indexOf(alias)).filter((value) => value >= 0),
      )
      return Number.isFinite(index) ? { exercise, index } : null
    })
    .filter((item): item is { exercise: (typeof catalog)[number]; index: number } => Boolean(item))
    .sort((left, right) => left.index - right.index)

  const items = mentions.map(({ exercise, index }, mentionIndex): SigmaParsedTrainingLog => {
    const nextIndex = mentions[mentionIndex + 1]?.index ?? normalizedText.length
    const segment = normalizedText.slice(index, nextIndex)
    const compact = segment.match(/(\d+)\s*x\s*(\d+)/)
    const series = segment.match(/(\d+)\s*(?:series|serie|sets|set)\s*(?:de|x)?\s*(\d+)?/)
    const weight = segment.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilos?|lb|lbs|libras?)\b/)
    const isTime = exercise.trackingType === 'time' || /\bsegundos?\b/.test(segment)
    const sets = Number(compact?.[1] ?? series?.[1] ?? 0) || undefined
    const amount = Number(compact?.[2] ?? series?.[2] ?? 0) || undefined

    return {
      exerciseName: exercise.name,
      sets,
      reps: isTime ? undefined : amount,
      actualSeconds: isTime ? amount : undefined,
      weight: weight?.[1]
        ? Number(weight[1].replace(',', '.'))
        : /\b(?:sin peso|peso corporal)\b/.test(segment)
          ? 0
          : undefined,
      unit: weight?.[2]?.startsWith('lb') || weight?.[2]?.startsWith('libra') ? 'lb' : 'kg',
      trackingType: exercise.trackingType,
    }
  })

  const followUpQuestions = items.length === 0
    ? ['Que ejercicios realizaste?']
    : items.flatMap((item) => {
        const questions: string[] = []
        if (!item.sets) {
          questions.push(`Cuantas series hiciste en ${item.exerciseName}?`)
        }
        if (item.trackingType === 'time' ? !item.actualSeconds : !item.reps) {
          questions.push(
            item.trackingType === 'time'
              ? `Cuantos segundos hiciste por serie en ${item.exerciseName}?`
              : `Cuantas repeticiones hiciste por serie en ${item.exerciseName}?`,
          )
        }
        return questions
      })
  const fatigue = normalizedText.match(/fatiga(?:\s*(?:de|:))?\s*(10|[0-9])\b/)
  const pain = normalizedText.match(/dolor(?:\s*(?:de|:))?\s*(10|[0-9])\b/)

  return {
    status: followUpQuestions.length > 0 ? 'needs_follow_up' : 'complete',
    sessionFeedback: {
      fatigueLevel: fatigue?.[1] ? Number(fatigue[1]) : null,
      painLevel: pain?.[1] ? Number(pain[1]) : null,
      athleteNotes: 'Registro post-entrenamiento interpretado desde texto.',
    },
    items,
    followUpQuestions,
    parsed: items[0] ?? {},
    followUpQuestion: followUpQuestions[0] ?? null,
  }
}

function createLocalMonthlySummary(state: SigmafitStateSnapshot): SigmaMonthlySummary {
  const latestPoint = state.progressHistory.at(-1)
  const completed = state.training.lastCompletedSummary
  const completedSessions = completed ? 1 : 0
  const consistencyRate = latestPoint ? Math.min(1, latestPoint.consistency / 100) : completedSessions > 0 ? 0.25 : 0

  return {
    userId: state.session.userId || SIGMAFIT_DEMO_USER_ID,
    month: new Date().toISOString().slice(0, 7),
    totalVolume: completed?.totalVolume ?? latestPoint?.volume ?? 0,
    completedSessions,
    consistencyRate,
    averageRpe: completed?.fatigueLevel ?? state.workout.lastSessionRpe,
    progressionTrend: completedSessions > 0 || (latestPoint?.volume ?? 0) > 0 ? 'stable' : 'insufficient_data',
    summary:
      completedSessions > 0
        ? 'Resumen construido con tu ultima sesion completada y tu historial visible.'
        : 'Aun faltan sesiones completadas para construir un resumen mensual real.',
  }
}

function createLocalCoachOverview(state: SigmafitStateSnapshot): SigmaCoachOverviewResponse {
  const adaptiveSummary = state.adaptive.summary ?? createLocalAdaptiveSummary(state)
  const monthlySummary = state.monthlySummary.summary ?? createLocalMonthlySummary(state)
  const weakPoints = [
    monthlySummary.consistencyRate < 0.65 ? 'baja adherencia' : null,
    (adaptiveSummary.averageFatigue ?? 0) >= 8 ? 'fatiga alta' : null,
    (adaptiveSummary.maxPain ?? adaptiveSummary.averagePain ?? 0) >= 7 ? 'molestia alta' : null,
  ].filter((item): item is string => Boolean(item))

  return {
    gymId: state.session.gymId,
    gymName: state.session.gymName,
    athletes: [
      {
        userId: state.session.userId || SIGMAFIT_DEMO_USER_ID,
        name: state.profile.displayName || 'Atleta Sigma',
        consistencyRate: monthlySummary.consistencyRate,
        progressionTrend: monthlySummary.progressionTrend,
        averageFatigue: adaptiveSummary.averageFatigue,
        averagePain: adaptiveSummary.averagePain,
        missedSessions: Math.max(0, state.profile.daysPerWeek * 4 - monthlySummary.completedSessions),
        weakPoints,
        coachInsight:
          weakPoints.length > 0
            ? 'Revisar adherencia, fatiga o molestias antes de aumentar carga.'
            : 'El atleta mantiene senales estables para sostener el bloque actual.',
      },
    ],
  }
}

export const useSigmafitStore = create<SigmafitStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      login: async ({ email, displayName, userId = SIGMAFIT_DEMO_USER_ID, role = 'athlete' }) => {
        const fallbackUserId = role === 'coach' ? SIGMAFIT_DEMO_COACH_ID : userId
        set((state) => ({
          session: {
            ...state.session,
            userId: fallbackUserId,
            role,
            isAuthenticated: true,
            onboardingComplete: role === 'coach' ? true : state.session.onboardingComplete,
            backendStatus: 'idle',
            lastSyncError: null,
            lastLoginAt: new Date().toISOString(),
          },
          profile: {
            ...state.profile,
            email,
            displayName: displayName || state.profile.displayName || email.split('@')[0] || 'Atleta',
          },
        }))

        try {
          const remoteProfile = await sigmafitApi.loginAccount({ email, role })

          set((state) => ({
            session: {
              ...state.session,
              userId: remoteProfile.userId,
              role: remoteProfile.role === 'coach' ? 'coach' : 'athlete',
              gymId: remoteProfile.gymId,
              gymName: remoteProfile.gymName,
              onboardingComplete: remoteProfile.role === 'coach' || remoteProfile.onboardingCompleted,
              backendStatus: 'online',
              lastSyncError: null,
            },
            profile: applyRemoteProfile(state.profile, remoteProfile),
            ...(remoteProfile.role === 'coach' || remoteProfile.onboardingCompleted
              ? {}
              : {
                  ...getResetSlices(),
                  ...clearRoutineState(state),
                }),
          }))

          return {
            onboardingComplete: remoteProfile.role === 'coach' || remoteProfile.onboardingCompleted,
            backendStatus: 'online',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const warning = 'No se pudo sincronizar. SigmaFit conservara tus datos en este dispositivo.'

            set((state) => ({
              session: {
                ...state.session,
                userId: fallbackUserId,
                role,
                gymId: role === 'coach' ? SIGMAFIT_DEMO_GYM_ID : state.session.gymId,
                gymName: role === 'coach' ? 'Sigma Gym Norte' : state.session.gymName,
                onboardingComplete: role === 'coach' ? true : state.session.onboardingComplete,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              onboardingComplete: get().session.onboardingComplete,
              backendStatus: 'offline',
              warning,
            }
          }

          throw error
        }
      },

      createAccount: async (payload) => {
        const fallbackUserId = payload.role === 'coach' ? SIGMAFIT_DEMO_COACH_ID : SIGMAFIT_DEMO_USER_ID

        try {
          const account = await sigmafitApi.createAccount(payload)
          const defaults = getResetSlices()

          set((state) => ({
            session: {
              ...state.session,
              userId: account.userId,
              role: account.role === 'coach' ? 'coach' : 'athlete',
              gymId: account.gymId,
              gymName: account.gymName,
              isAuthenticated: true,
              onboardingComplete: account.role === 'coach' || account.onboardingCompleted,
              backendStatus: 'online',
              lastSyncError: null,
              lastLoginAt: new Date().toISOString(),
            },
            profile: applyRemoteProfile(state.profile, account),
            ...(payload.role === 'athlete' ? defaults : {}),
          }))

          return {
            created: true,
            userId: account.userId,
            onboardingComplete: account.role === 'coach' || account.onboardingCompleted,
            warning: null,
          }
        } catch (error) {
          if (!isApiUnavailable(error)) {
            throw error
          }

          const warning = 'No se pudo sincronizar la cuenta. Se creo un acceso en este dispositivo.'
          set((state) => ({
            session: {
              ...state.session,
              userId: fallbackUserId,
              role: payload.role,
              gymId: payload.gymId ?? SIGMAFIT_DEMO_GYM_ID,
              gymName: payload.gymName ?? 'Sigma Gym Norte',
              isAuthenticated: true,
              onboardingComplete: payload.role === 'coach',
              backendStatus: 'offline',
              lastSyncError: warning,
              lastLoginAt: new Date().toISOString(),
            },
            profile: {
              ...state.profile,
              email: payload.email,
              displayName: payload.name,
            },
            ...(payload.role === 'athlete' ? getResetSlices() : {}),
          }))

          return {
            created: true,
            userId: fallbackUserId,
            onboardingComplete: payload.role === 'coach',
            warning,
          }
        }
      },

      logout: () =>
        set((state) => ({
          session: {
            ...state.session,
            role: 'athlete',
            gymId: null,
            gymName: null,
            isAuthenticated: false,
            backendStatus: 'idle',
            lastSyncError: null,
            onboardingComplete: state.session.onboardingComplete,
            lastLoginAt: null,
          },
        })),

      completeOnboarding: async (payload) => {
        const activeUserId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => {
          const patch = onboardingToStatePatch(payload)
          const defaults = getResetSlices()

          return {
            session: {
              ...state.session,
              ...patch.session,
              userId: activeUserId,
            },
            profile: {
              ...state.profile,
              ...patch.profile,
            },
            routine: {
              ...defaults.routine,
              exerciseCatalog: state.routine.exerciseCatalog,
            },
            training: defaults.training,
            assistedLog: defaults.assistedLog,
            adaptive: defaults.adaptive,
            monthlySummary: defaults.monthlySummary,
            coach: defaults.coach,
            workout: defaults.workout,
          }
        })

        try {
          const savedProfile = await sigmafitApi.submitOnboarding(activeUserId, payload)

          set((state) => ({
            session: {
              ...state.session,
              userId: activeUserId,
              onboardingComplete: savedProfile.onboardingCompleted,
              backendStatus: 'online',
              lastSyncError: null,
            },
            profile: applyRemoteProfile(state.profile, savedProfile),
          }))

          return {
            onboardingComplete: true,
            persistedToBackend: true,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const warning =
              'No se pudo sincronizar. El perfil quedo guardado en este dispositivo.'

            set((state) => ({
              session: {
                ...state.session,
                userId: activeUserId,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              onboardingComplete: true,
              persistedToBackend: false,
              warning,
            }
          }

          throw error
        }
      },

      loadCurrentRoutine: async () => {
        const state = get()

        if (!state.session.userId || !state.session.onboardingComplete) {
          return {
            routineState: state.routine.currentRoutine
              ? 'current'
              : state.routine.proposedRoutine
                ? 'proposal'
                : 'none',
            source: resolveRoutineSourceFromState(state),
            warning: null,
          }
        }

        set((current) => ({
          routine: {
            ...current.routine,
            isLoading: true,
            error: null,
          },
        }))

        try {
          const routine = await sigmafitApi.getCurrentRoutine(state.session.userId)

          set((current) => ({
            ...applyFetchedRoutineToState(current, routine, 'backend'),
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            routineState:
              get().routine.proposedRoutine && get().routine.pendingRoutineId === routine.routineId
                ? 'proposal'
                : 'current',
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (error instanceof ApiRequestError && error.code === 'ROUTINE_NOT_FOUND') {
            set((current) => ({
              ...clearRoutineState(current, { keepCatalog: true }),
            }))

            return {
              routineState: 'none',
              source: 'none',
              warning: null,
            }
          }

          if (isApiUnavailable(error)) {
            const warning =
              'No se pudo sincronizar la rutina. Se usara el ultimo estado guardado.'

            set((current) => ({
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
              routine: {
                ...current.routine,
                isLoading: false,
              },
            }))

            const latestState = get()
            return {
              routineState: latestState.routine.currentRoutine
                ? 'current'
                : latestState.routine.proposedRoutine
                  ? 'proposal'
                  : 'none',
              source: resolveRoutineSourceFromState(latestState),
              warning,
            }
          }

          set((current) => ({
            routine: {
              ...current.routine,
              isLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo cargar la rutina actual.',
            },
          }))

          const latestState = get()
          return {
            routineState: latestState.routine.currentRoutine
              ? 'current'
              : latestState.routine.proposedRoutine
                ? 'proposal'
                : 'none',
            source: resolveRoutineSourceFromState(latestState),
            warning: null,
          }
        }
      },

      loadExerciseCatalog: async (force = false) => {
        const state = get()

        if (!force && state.routine.exerciseCatalog.length > 0) {
          return {
            loaded: true,
            source: state.session.backendStatus === 'offline' ? 'fallback' : 'backend',
            warning: null,
          }
        }

        set((current) => ({
          routine: {
            ...current.routine,
            isCatalogLoading: true,
            error: null,
          },
        }))

        try {
          const catalog = await sigmafitApi.getExercises()

          set((current) => ({
            routine: {
              ...current.routine,
              exerciseCatalog: catalog,
              isCatalogLoading: false,
              error: null,
            },
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            loaded: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const warning =
              'No se pudo actualizar el catalogo. Se usara el catalogo guardado.'

            set((current) => ({
              routine: {
                ...current.routine,
                exerciseCatalog: sigmaExerciseCatalogFallback,
                isCatalogLoading: false,
                error: null,
              },
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              loaded: true,
              source: 'fallback',
              warning,
            }
          }

          set((current) => ({
            routine: {
              ...current.routine,
              isCatalogLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo cargar el catalogo.',
            },
          }))

          return {
            loaded: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      selectRoutineFlow: (flow) =>
        set((state) => ({
          routine: {
            ...state.routine,
            hasUserChosenRoutineFlow: true,
            selectedCreationFlow: flow,
            error: null,
          },
        })),

      generateRoutineProposal: async () => {
        const state = get()
        const userId = state.session.userId || SIGMAFIT_DEMO_USER_ID

        if (!state.session.onboardingComplete) {
          set((current) => ({
            routine: {
              ...current.routine,
              error: 'Completa onboarding antes de generar una rutina.',
            },
          }))

          return {
            proposed: false,
            source: 'fallback',
            warning: null,
          }
        }

        set((current) => ({
          routine: {
            ...current.routine,
            isLoading: true,
            error: null,
            hasUserChosenRoutineFlow: true,
            selectedCreationFlow: 'coach',
          },
        }))

        try {
          const routine = await sigmafitApi.generateRoutineProposal(userId)

          set((current) => ({
            ...applyProposedRoutineToState(current, routine, 'backend'),
            training: {
              ...current.training,
              activeSession: null,
            },
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            proposed: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const fallbackRoutine = generateLocalRoutine(state.profile, userId)
            const warning =
              'No se pudo sincronizar la propuesta. SigmaFit preparo una alternativa en este dispositivo.'

            set((current) => ({
              ...applyProposedRoutineToState(current, fallbackRoutine, 'fallback'),
              training: {
                ...current.training,
                activeSession: null,
              },
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              proposed: true,
              source: 'fallback',
              warning,
            }
          }

          set((current) => ({
            routine: {
              ...current.routine,
              isLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo generar la propuesta.',
            },
          }))

          return {
            proposed: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      acceptRoutineProposal: () => {
        const state = get()

        if (!state.routine.proposedRoutine) {
          return {
            accepted: false,
          }
        }

        set((current) => ({
          ...promoteProposedRoutine(current),
        }))

        return {
          accepted: true,
        }
      },

      regenerateRoutineProposal: async () => get().generateRoutineProposal(),

      createManualRoutine: async (payload) => {
        const state = get()
        const userId = state.session.userId || SIGMAFIT_DEMO_USER_ID

        if (!state.session.onboardingComplete) {
          set((current) => ({
            routine: {
              ...current.routine,
              error: 'Completa onboarding antes de guardar una rutina manual.',
            },
          }))

          return {
            routineAvailable: false,
            source: 'fallback',
            warning: null,
          }
        }

        set((current) => ({
          routine: {
            ...current.routine,
            isSavingManual: true,
            error: null,
            hasUserChosenRoutineFlow: true,
            selectedCreationFlow: 'manual',
          },
        }))

        try {
          const routine = await sigmafitApi.createManualRoutine(userId, payload)

          set((current) => ({
            ...applyCurrentRoutineToState(current, routine, 'backend'),
            training: {
              ...current.training,
              activeSession: null,
              lastCompletedSummary: null,
            },
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            routineAvailable: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const catalog =
              get().routine.exerciseCatalog.length > 0
                ? get().routine.exerciseCatalog
                : sigmaExerciseCatalogFallback
            const fallbackRoutine = createLocalManualRoutine(payload, userId, catalog)
            const warning =
              'No se pudo sincronizar la rutina manual. SigmaFit la dejo activa en este dispositivo.'

            set((current) => ({
              ...applyCurrentRoutineToState(current, fallbackRoutine, 'fallback'),
              training: {
                ...current.training,
                activeSession: null,
                lastCompletedSummary: null,
              },
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              routineAvailable: true,
              source: 'fallback',
              warning,
            }
          }

          set((current) => ({
            routine: {
              ...current.routine,
              isSavingManual: false,
              error: error instanceof Error ? error.message : 'No se pudo guardar la rutina manual.',
            },
          }))

          return {
            routineAvailable: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      clearRoutineProposal: () =>
        set((state) => ({
          routine: {
            ...state.routine,
            proposedRoutine: null,
            proposalSource: 'none',
            proposalPendingAcceptance: false,
            pendingRoutineId: null,
            isLoading: false,
          },
        })),

      loadAdaptiveSummary: async () => {
        const userId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => ({
          adaptive: {
            ...state.adaptive,
            isLoading: true,
            error: null,
          },
        }))

        try {
          const summary = await sigmafitApi.getAdaptiveSummary(userId)

          set((state) => ({
            adaptive: {
              ...state.adaptive,
              summary,
              isLoading: false,
              isGenerating: false,
              error: null,
              source: 'backend',
              lastUpdatedAt: new Date().toISOString(),
            },
            session: {
              ...state.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            loaded: true,
            source: 'backend' as const,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const summary = createLocalAdaptiveSummary(get())
            const warning = 'No se pudo sincronizar la lectura adaptativa. Se usara el resumen disponible.'

            set((state) => ({
              adaptive: {
                ...state.adaptive,
                summary,
                isLoading: false,
                isGenerating: false,
                error: null,
                source: 'local',
                lastUpdatedAt: new Date().toISOString(),
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              loaded: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            adaptive: {
              ...state.adaptive,
              isLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo cargar la lectura adaptativa.',
            },
          }))

          return {
            loaded: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      generateAdaptiveRecommendation: async () => {
        const userId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => ({
          adaptive: {
            ...state.adaptive,
            isGenerating: true,
            error: null,
          },
        }))

        try {
          const summary = await sigmafitApi.generateAdaptiveRecommendation(userId)

          set((state) => ({
            adaptive: {
              ...state.adaptive,
              summary,
              isLoading: false,
              isGenerating: false,
              error: null,
              source: 'backend',
              lastUpdatedAt: new Date().toISOString(),
            },
            session: {
              ...state.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            loaded: true,
            source: 'backend' as const,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const summary = createLocalAdaptiveSummary(get())
            const warning = 'No se pudo sincronizar. SigmaFit genero una recomendacion disponible para esta sesion.'

            set((state) => ({
              adaptive: {
                ...state.adaptive,
                summary,
                isLoading: false,
                isGenerating: false,
                error: null,
                source: 'local',
                lastUpdatedAt: new Date().toISOString(),
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              loaded: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            adaptive: {
              ...state.adaptive,
              isGenerating: false,
              error: error instanceof Error ? error.message : 'No se pudo generar la recomendacion adaptativa.',
            },
          }))

          return {
            loaded: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      parseTrainingLog: async (text) => {
        const userId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => ({
          assistedLog: {
            ...state.assistedLog,
            isParsing: true,
            error: null,
          },
        }))

        if (get().session.backendStatus === 'offline') {
          const result = parseLocalTrainingLog(text, get())

          set((state) => ({
            assistedLog: {
              ...state.assistedLog,
              result,
              isParsing: false,
              error: null,
              source: 'local',
            },
          }))

          return {
            parsed: true,
            source: 'local' as const,
            warning: null,
          }
        }

        try {
          const result = await sigmafitApi.parseTrainingLog({ userId, text })

          set((state) => ({
            assistedLog: {
              ...state.assistedLog,
              result,
              isParsing: false,
              error: null,
              source: 'backend',
            },
            session: {
              ...state.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            parsed: true,
            source: 'backend' as const,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const result = parseLocalTrainingLog(text, get())
            const warning = 'No se pudo sincronizar. El registro asistido seguira interpretando en este dispositivo.'

            set((state) => ({
              assistedLog: {
                ...state.assistedLog,
                result,
                isParsing: false,
                error: null,
                source: 'local',
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              parsed: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            assistedLog: {
              ...state.assistedLog,
              isParsing: false,
              error: error instanceof Error ? error.message : 'No se pudo interpretar el registro.',
            },
          }))

          return {
            parsed: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      clearAssistedLog: () =>
        set((state) => ({
          assistedLog: {
            ...state.assistedLog,
            result: null,
            isParsing: false,
            isSaving: false,
            error: null,
            source: 'none',
          },
        })),

      savePostWorkoutSession: async (payload) => {
        const userId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => ({
          assistedLog: {
            ...state.assistedLog,
            isSaving: true,
            error: null,
          },
        }))

        const createLocalSummary = () => ({
          sessionId: `post-${Date.now()}`,
          status: 'completed' as const,
          completedSets: payload.items.reduce((total, item) => total + item.sets, 0),
          totalVolume: payload.items.reduce(
            (total, item) => total + (item.weight ?? 0) * (item.reps ?? 0) * item.sets,
            0,
          ),
          totalReps: payload.items.reduce(
            (total, item) => total + (item.reps ?? 0) * item.sets,
            0,
          ),
          totalSeconds: payload.items.reduce(
            (total, item) => total + (item.actualSeconds ?? 0) * item.sets,
            0,
          ),
          fatigueLevel: payload.feedback.fatigueLevel,
          painLevel: payload.feedback.painLevel,
          athleteNotes: payload.feedback.athleteNotes,
        })

        try {
          const summary = get().session.backendStatus === 'offline'
            ? createLocalSummary()
            : await sigmafitApi.createPostWorkoutSession(userId, payload)

          set((state) => ({
            training: {
              ...state.training,
              lastCompletedSummary: summary,
              source: state.session.backendStatus === 'offline' ? 'local' : 'backend',
            },
            assistedLog: {
              ...state.assistedLog,
              isSaving: false,
              error: null,
              lastSavedSummary: summary,
            },
          }))

          return {
            finished: true,
            source: get().session.backendStatus === 'offline' ? ('local' as const) : ('backend' as const),
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const summary = createLocalSummary()
            const warning = 'No se pudo sincronizar. La sesion quedo guardada en este dispositivo.'
            set((state) => ({
              training: {
                ...state.training,
                lastCompletedSummary: summary,
                source: 'local',
              },
              assistedLog: {
                ...state.assistedLog,
                isSaving: false,
                error: null,
                lastSavedSummary: summary,
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))
            return {
              finished: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            assistedLog: {
              ...state.assistedLog,
              isSaving: false,
              error: error instanceof Error ? error.message : 'No se pudo guardar la sesion.',
            },
          }))
          return {
            finished: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      loadMonthlySummary: async (month) => {
        const userId = get().session.userId || SIGMAFIT_DEMO_USER_ID

        set((state) => ({
          monthlySummary: {
            ...state.monthlySummary,
            isLoading: true,
            error: null,
          },
        }))

        try {
          const summary = await sigmafitApi.getMonthlySummary(userId, month)

          set((state) => ({
            monthlySummary: {
              summary,
              isLoading: false,
              error: null,
              source: 'backend',
            },
            session: {
              ...state.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            loaded: true,
            source: 'backend' as const,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const summary = createLocalMonthlySummary(get())
            const warning = 'No se pudo sincronizar el resumen mensual. Se usaran los datos visibles.'

            set((state) => ({
              monthlySummary: {
                summary,
                isLoading: false,
                error: null,
                source: 'local',
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              loaded: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            monthlySummary: {
              ...state.monthlySummary,
              isLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo cargar el resumen mensual.',
            },
          }))

          return {
            loaded: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      loadCoachOverview: async () => {
        set((state) => ({
          coach: {
            ...state.coach,
            isLoading: true,
            error: null,
          },
        }))

        try {
          const overview = await sigmafitApi.getCoachOverview(get().session.userId ?? undefined)

          set((state) => ({
            coach: {
              overview,
              isLoading: false,
              error: null,
              source: 'backend',
            },
            session: {
              ...state.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            loaded: true,
            source: 'backend' as const,
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const overview = createLocalCoachOverview(get())
            const warning = 'No se pudo sincronizar el panel coach. Se usaran los datos visibles.'

            set((state) => ({
              coach: {
                overview,
                isLoading: false,
                error: null,
                source: 'local',
              },
              session: {
                ...state.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              loaded: true,
              source: 'local' as const,
              warning,
            }
          }

          set((state) => ({
            coach: {
              ...state.coach,
              isLoading: false,
              error: error instanceof Error ? error.message : 'No se pudo cargar el panel coach.',
            },
          }))

          return {
            loaded: false,
            source: 'backend' as const,
            warning: null,
          }
        }
      },

      startWorkoutSession: async (payload) => {
        const state = get()
        const routine = state.routine.currentRoutine
        const userId = state.session.userId || SIGMAFIT_DEMO_USER_ID

        if (!routine) {
          set((current) => ({
            training: {
              ...current.training,
              error: 'Activa una rutina antes de iniciar una sesion.',
            },
          }))

          return {
            started: false,
            source: 'local',
            warning: null,
          }
        }

        set((current) => ({
          training: {
            ...current.training,
            isStarting: true,
            error: null,
          },
        }))

        try {
          const workoutSession = await sigmafitApi.startWorkoutSession(userId, payload)

          set((current) => ({
            ...applyWorkoutSessionToState(current, workoutSession, 'backend'),
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            started: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const workoutSession = createLocalWorkoutSession(routine, payload.routineDayId, payload.unit)
            const warning =
              'No se pudo sincronizar. La sesion activa seguira guardada en este dispositivo.'

            set((current) => ({
              ...applyWorkoutSessionToState(current, workoutSession, 'local'),
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              started: true,
              source: 'local',
              warning,
            }
          }

          set((current) => ({
            training: {
              ...current.training,
              isStarting: false,
              error: error instanceof Error ? error.message : 'No se pudo iniciar la sesion.',
            },
          }))

          return {
            started: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      updateSessionSetDraft: (sessionId, setId, patch) =>
        set((state) => {
          if (!state.training.activeSession || state.training.activeSession.sessionId !== sessionId) {
            return state
          }

          const nextSession = updateSessionSetDraftInSession(state.training.activeSession, setId, patch)

          return {
            training: {
              ...state.training,
              activeSession: nextSession,
            },
            workout: sessionToWorkoutState(nextSession, state.workout),
          }
        }),

      completeWorkoutSet: async (sessionId, setId, payload) => {
        const state = get()
        const activeSession = state.training.activeSession

        if (!activeSession || activeSession.sessionId !== sessionId) {
          set((current) => ({
            training: {
              ...current.training,
              error: 'No hay una sesion activa para actualizar.',
            },
          }))

          return {
            updated: false,
            source: 'local',
            warning: null,
          }
        }

        set((current) => ({
          training: {
            ...current.training,
            isUpdatingSet: true,
            error: null,
          },
        }))

        if (state.training.source === 'local' || state.session.backendStatus === 'offline') {
          const nextSession = updateLocalWorkoutSessionSet(activeSession, setId, payload)

          set((current) => ({
            ...applyWorkoutSessionToState(current, nextSession, 'local'),
          }))

          return {
            updated: true,
            source: 'local',
            warning: null,
          }
        }

        try {
          const workoutSession = await sigmafitApi.updateWorkoutSessionSet(sessionId, setId, payload)

          set((current) => ({
            ...applyWorkoutSessionToState(current, workoutSession, 'backend'),
            session: {
              ...current.session,
              backendStatus: 'online',
              lastSyncError: null,
            },
          }))

          return {
            updated: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const fallbackSession = updateLocalWorkoutSessionSet(activeSession, setId, payload)
            const warning =
              'No se pudo sincronizar la serie. El cambio quedo guardado en este dispositivo.'

            set((current) => ({
              ...applyWorkoutSessionToState(current, fallbackSession, 'local'),
              session: {
                ...current.session,
                backendStatus: 'offline',
                lastSyncError: warning,
              },
            }))

            return {
              updated: true,
              source: 'local',
              warning,
            }
          }

          set((current) => ({
            training: {
              ...current.training,
              isUpdatingSet: false,
              error: error instanceof Error ? error.message : 'No se pudo actualizar la serie.',
            },
          }))

          return {
            updated: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      finishWorkoutSession: async (sessionId, payload = {}) => {
        const state = get()
        const activeSession = state.training.activeSession

        if (!activeSession || activeSession.sessionId !== sessionId) {
          set((current) => ({
            training: {
              ...current.training,
              error: 'No hay una sesion activa para finalizar.',
            },
          }))

          return {
            finished: false,
            source: 'local',
            warning: null,
          }
        }

        set((current) => ({
          training: {
            ...current.training,
            isFinishing: true,
            error: null,
          },
        }))

        if (state.training.source === 'local' || state.session.backendStatus === 'offline') {
          const localResult = finishLocalWorkoutSession(activeSession, payload)

          set((current) => {
            const lastPointIndex = current.progressHistory.length - 1
            const nextProgressHistory = current.progressHistory.map((point, index) =>
              index === lastPointIndex
                ? {
                    ...point,
                    volume: point.volume + Math.round(localResult.summary.totalVolume),
                    consistency: Math.min(99, point.consistency + 1),
                  }
                : point,
            )

            return {
              ...applyWorkoutSessionToState(current, localResult.session, 'local'),
              training: {
                ...current.training,
                activeSession: null,
                isStarting: false,
                isUpdatingSet: false,
                isFinishing: false,
                error: null,
                source: 'local',
                lastCompletedSummary: localResult.summary,
              },
              progressHistory: nextProgressHistory,
            }
          })

          return {
            finished: true,
            source: 'local',
            warning: null,
          }
        }

        try {
          const summary = await sigmafitApi.finishWorkoutSession(sessionId, payload)

          set((current) => {
            const lastPointIndex = current.progressHistory.length - 1
            const nextProgressHistory = current.progressHistory.map((point, index) =>
              index === lastPointIndex
                ? {
                    ...point,
                    volume: point.volume + Math.round(summary.totalVolume),
                    consistency: Math.min(99, point.consistency + 1),
                  }
                : point,
            )

            return {
              training: {
                ...current.training,
                activeSession: null,
                isStarting: false,
                isUpdatingSet: false,
                isFinishing: false,
                error: null,
                source: 'backend',
                lastCompletedSummary: summary,
              },
              progressHistory: nextProgressHistory,
            }
          })

          return {
            finished: true,
            source: 'backend',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const localResult = finishLocalWorkoutSession(activeSession, payload)
            const warning =
              'No se pudo sincronizar el cierre. SigmaFit guardo el resumen en este dispositivo.'

            set((current) => {
              const lastPointIndex = current.progressHistory.length - 1
              const nextProgressHistory = current.progressHistory.map((point, index) =>
                index === lastPointIndex
                  ? {
                      ...point,
                      volume: point.volume + Math.round(localResult.summary.totalVolume),
                      consistency: Math.min(99, point.consistency + 1),
                    }
                  : point,
              )

              return {
                training: {
                  ...current.training,
                  activeSession: null,
                  isStarting: false,
                  isUpdatingSet: false,
                  isFinishing: false,
                  error: null,
                  source: 'local',
                  lastCompletedSummary: localResult.summary,
                },
                session: {
                  ...current.session,
                  backendStatus: 'offline',
                  lastSyncError: warning,
                },
                progressHistory: nextProgressHistory,
              }
            })

            return {
              finished: true,
              source: 'local',
              warning,
            }
          }

          set((current) => ({
            training: {
              ...current.training,
              isFinishing: false,
              error: error instanceof Error ? error.message : 'No se pudo finalizar la sesion.',
            },
          }))

          return {
            finished: false,
            source: 'backend',
            warning: null,
          }
        }
      },

      updateWorkoutSet: (exerciseId, setId, patch) =>
        set((state) => ({
          workout: {
            ...state.workout,
            exercises: state.workout.exercises.map((exercise) =>
              exercise.id === exerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets.map((setItem) =>
                      setItem.id === setId
                        ? {
                            ...setItem,
                            ...patch,
                          }
                        : setItem,
                    ),
                  }
                : exercise,
            ),
          },
        })),

      setActiveExercise: (exerciseId) =>
        set((state) => ({
          workout: {
            ...state.workout,
            activeExerciseId: exerciseId,
          },
        })),

      submitWorkoutRpe: (rpe) =>
        set((state) => {
          const nextReadiness = Math.max(66, Math.min(95, 96 - rpe * 3))
          const lastPoint = state.progressHistory[state.progressHistory.length - 1]
          const nextHistory = state.progressHistory.map((point, index) =>
            index === state.progressHistory.length - 1
              ? {
                  ...point,
                  fatigue: Math.min(95, Math.round((point.fatigue + rpe * 8) / 2)),
                  consistency: Math.min(99, point.consistency + 1),
                  volume: point.volume + 180,
                  projectedOneRm: point.projectedOneRm + (rpe <= 8 ? 1 : 0),
                }
              : point,
          )

          return {
            workout: {
              ...state.workout,
              readiness: nextReadiness,
              lastSessionRpe: rpe,
              notes:
                rpe >= 9
                  ? 'RPE alto detectado. SigmaFit sugiere bajar ligeramente la fatiga periferica la proxima sesion.'
                  : 'Respuesta estable. Puedes mantener la progresion semanal si el descanso acompana.',
            },
            progressHistory: lastPoint ? nextHistory : state.progressHistory,
          }
        }),

      updateProfile: (patch) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...patch,
          },
        })),

      updatePreferences: (patch) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...patch,
          },
        })),

      clearSyncError: () =>
        set((state) => ({
          session: {
            ...state.session,
            lastSyncError: null,
          },
        })),

      clearRoutineError: () =>
        set((state) => ({
          routine: {
            ...state.routine,
            error: null,
          },
        })),

      clearTrainingError: () =>
        set((state) => ({
          training: {
            ...state.training,
            error: null,
          },
        })),

      clearAdaptiveError: () =>
        set((state) => ({
          adaptive: {
            ...state.adaptive,
            error: null,
          },
        })),

      resetDemo: () =>
        set(() => ({
          ...buildInitialState(),
        })),
    }),
    {
      name: 'sigmafit-state',
      version: SIGMAFIT_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => migratePersistedState(persistedState),
    },
  ),
)
