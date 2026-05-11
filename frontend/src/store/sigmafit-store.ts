import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SIGMAFIT_DEMO_USER_ID, sigmaExerciseCatalogFallback } from '@/lib/sigmafit/catalog'
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
  SigmaManualRoutinePayload,
  SigmaOnboardingPayload,
  SigmaPreferences,
  SigmaProfile,
  SigmaRoutine,
  SigmaRoutineCreationMode,
  SigmaRoutineSource,
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

type SigmafitActions = {
  login: (payload: { email: string; displayName?: string; userId?: string }) => Promise<LoginResult>
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
  resetDemo: () => void
}

export type SigmafitStore = SigmafitStateSnapshot & SigmafitActions

const SIGMAFIT_STORE_VERSION = 3

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
    profile: {
      ...defaults.profile,
      ...persisted.profile,
    },
    routine: defaults.routine,
    training: defaults.training,
    workout: defaults.workout,
  }
}

function getResetSlices() {
  const defaults = buildInitialState()
  return {
    routine: defaults.routine,
    training: defaults.training,
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
      ? 'Perfil inicial sincronizado desde el backend de SigmaFit.'
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

export const useSigmafitStore = create<SigmafitStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      login: async ({ email, displayName, userId = SIGMAFIT_DEMO_USER_ID }) => {
        set((state) => ({
          session: {
            ...state.session,
            userId,
            isAuthenticated: true,
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
          const remoteProfile = await sigmafitApi.getUserProfile(userId)

          set((state) => ({
            session: {
              ...state.session,
              userId,
              onboardingComplete: remoteProfile.onboardingCompleted,
              backendStatus: 'online',
              lastSyncError: null,
            },
            profile: applyRemoteProfile(state.profile, remoteProfile),
            ...(remoteProfile.onboardingCompleted
              ? {}
              : {
                  ...getResetSlices(),
                  ...clearRoutineState(state),
                }),
          }))

          return {
            onboardingComplete: remoteProfile.onboardingCompleted,
            backendStatus: 'online',
            warning: null,
          }
        } catch (error) {
          if (isApiUnavailable(error)) {
            const warning = 'Backend no disponible. SigmaFit seguira usando persistencia local.'

            set((state) => ({
              session: {
                ...state.session,
                userId,
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

      logout: () =>
        set((state) => ({
          session: {
            ...state.session,
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
              'No se pudo sincronizar con el backend. El perfil quedo guardado localmente.'

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
              'No se pudo consultar la rutina en backend. SigmaFit usara el ultimo estado local disponible.'

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
              'No se pudo cargar el catalogo desde backend. SigmaFit usara el catalogo local de respaldo.'

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
              'No se pudo generar la propuesta en backend. SigmaFit activo una propuesta local controlada.'

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
              'No se pudo guardar la rutina manual en backend. SigmaFit la activo localmente como respaldo.'

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
              'Backend temporalmente no disponible. La sesion activa seguira con persistencia local.'

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
              'No se pudo registrar la serie en backend. El cambio queda persistido localmente.'

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
              'No se pudo cerrar la sesion en backend. SigmaFit guardo el resumen localmente.'

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
