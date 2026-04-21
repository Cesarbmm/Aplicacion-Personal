import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultSigmafitState, onboardingToStatePatch } from '@/lib/sigmafit/mock-data'
import type {
  SigmaOnboardingPayload,
  SigmaPreferences,
  SigmaProfile,
  SigmaWorkoutSet,
  SigmafitStateSnapshot,
} from '@/lib/sigmafit/types'

type SigmafitActions = {
  login: (payload: { email: string; displayName?: string }) => void
  logout: () => void
  completeOnboarding: (payload: SigmaOnboardingPayload) => void
  updateWorkoutSet: (exerciseId: string, setId: string, patch: Partial<SigmaWorkoutSet>) => void
  setActiveExercise: (exerciseId: string) => void
  submitWorkoutRpe: (rpe: number) => void
  updateProfile: (patch: Partial<SigmaProfile>) => void
  updatePreferences: (patch: Partial<SigmaPreferences>) => void
  resetDemo: () => void
}

export type SigmafitStore = SigmafitStateSnapshot & SigmafitActions

function buildInitialState(): SigmafitStateSnapshot {
  return createDefaultSigmafitState()
}

export const useSigmafitStore = create<SigmafitStore>()(
  persist(
    (set) => ({
      ...buildInitialState(),
      login: ({ email, displayName }) =>
        set((state) => ({
          session: {
            ...state.session,
            isAuthenticated: true,
            lastLoginAt: new Date().toISOString(),
          },
          profile: {
            ...state.profile,
            email,
            displayName: displayName || state.profile.displayName || email.split('@')[0] || 'Atleta',
          },
        })),
      logout: () =>
        set((state) => ({
          session: {
            isAuthenticated: false,
            onboardingComplete: state.session.onboardingComplete,
            lastLoginAt: null,
          },
        })),
      completeOnboarding: (payload) =>
        set((state) => {
          const patch = onboardingToStatePatch(payload)
          return {
            ...state,
            session: patch.session,
            profile: {
              ...state.profile,
              ...patch.profile,
            },
          }
        }),
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
      resetDemo: () =>
        set(() => ({
          ...buildInitialState(),
        })),
    }),
    {
      name: 'sigmafit-state',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
