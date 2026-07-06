import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, CalendarRange, Dumbbell, FileText, Radio, Timer, Trophy } from 'lucide-react'

import { PostWorkoutLogger } from '@/components/app/post-workout-logger'
import { WorkoutTracker } from '@/components/app/workout-tracker'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { useSigmafitStore } from '@/store/sigmafit-store'

type WorkoutMode = 'live' | 'post'

export function WorkoutPage() {
  const [mode, setMode] = useState<WorkoutMode>('live')
  const session = useSigmafitStore((state) => state.session)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const workout = useSigmafitStore((state) => state.workout)
  const loadCurrentRoutine = useSigmafitStore((state) => state.loadCurrentRoutine)
  const startWorkoutSession = useSigmafitStore((state) => state.startWorkoutSession)
  const updateSessionSetDraft = useSigmafitStore((state) => state.updateSessionSetDraft)
  const completeWorkoutSet = useSigmafitStore((state) => state.completeWorkoutSet)
  const finishWorkoutSession = useSigmafitStore((state) => state.finishWorkoutSession)

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete) {
      void loadCurrentRoutine()
    }
  }, [loadCurrentRoutine, session.isAuthenticated, session.onboardingComplete])

  const workoutMetrics = useMemo(() => {
    const completedSets = training.activeSession
      ? training.activeSession.exercises.reduce(
          (total, exercise) => total + exercise.sessionSets.filter((setItem) => setItem.completed).length,
          0,
        )
      : 0
    const totalSets = training.activeSession
      ? training.activeSession.exercises.reduce((total, exercise) => total + exercise.sessionSets.length, 0)
      : routine.currentRoutine?.days.reduce(
          (total, day) => total + day.exercises.reduce((dayTotal, exercise) => dayTotal + exercise.sets, 0),
          0,
        ) ?? 0

    return [
      { icon: Activity, label: 'Readiness', value: `${workout.readiness}%` },
      {
        icon: Dumbbell,
        label: 'Rutina',
        value: routine.currentRoutine ? `${routine.currentRoutine.days.length} dias` : 'Sesion libre disponible',
      },
      {
        icon: Timer,
        label: 'Sesion activa',
        value: training.activeSession ? `${completedSets}/${totalSets} sets` : 'No iniciada',
      },
      {
        icon: CalendarRange,
        label: 'Modo',
        value: mode === 'live' ? 'En vivo' : 'Registro posterior',
      },
    ]
  }, [mode, routine.currentRoutine, training.activeSession, workout.readiness])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout"
        title={mode === 'live' ? 'Entrenamiento en vivo' : 'Registro post-entrenamiento'}
        subtitle={
          mode === 'live'
            ? 'Registra cada serie mientras entrenas y usa el temporizador de descanso.'
            : 'Describe una sesion terminada, revisa la interpretacion y guardala completa.'
        }
      />

      <div className="inline-flex rounded-full border border-white/10 bg-black/24 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'live'}
          onClick={() => setMode('live')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition ${
            mode === 'live' ? 'bg-red-500/16 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio size={16} />
          Entrenar en vivo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'post'}
          onClick={() => setMode('post')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition ${
            mode === 'post' ? 'bg-red-500/16 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={16} />
          Registrar después
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workoutMetrics.map((item) => (
          <PanelCard key={item.label} className="p-4" title={item.label}>
            <div className="flex items-center justify-between gap-3">
              <item.icon className="h-4 w-4 text-red-300" />
              <p className="text-right font-['Space_Grotesk'] text-2xl font-semibold text-white">{item.value}</p>
            </div>
          </PanelCard>
        ))}
      </section>

      {mode === 'post' ? (
        <PostWorkoutLogger routine={routine.currentRoutine} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <WorkoutTracker
            routine={routine.currentRoutine}
            activeSession={training.activeSession}
            isStarting={training.isStarting}
            isUpdatingSet={training.isUpdatingSet}
            isFinishing={training.isFinishing}
            trainingError={training.error}
            onStartSession={async (payload) => {
              await startWorkoutSession(payload)
            }}
            onSetDraftChange={updateSessionSetDraft}
            onCompleteSet={async (sessionId, setId, payload) => {
              await completeWorkoutSet(sessionId, setId, payload)
            }}
            onFinishSession={async (sessionId, payload) => {
              await finishWorkoutSession(sessionId, payload)
            }}
          />

          <div className="space-y-6">
            <PanelCard title="Estado del entrenamiento" subtitle="El tracker usa rutinas activas.">
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {routine.currentRoutine
                    ? `Rutina activa: ${routine.currentRoutine.name}.`
                    : 'No hay rutina activa. Usa el registro posterior para una sesion libre.'}
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {training.activeSession
                    ? `Sesion activa: ${training.activeSession.title}.`
                    : 'No hay una sesion en vivo activa.'}
                </div>
              </div>
            </PanelCard>

            <PanelCard title="Resumen de sesion" subtitle="Ultimo entrenamiento guardado.">
              {training.lastCompletedSummary ? (
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-red-300" />
                      <p className="font-medium text-white">Sesion finalizada</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {training.lastCompletedSummary.completedSets} series y{' '}
                      {training.lastCompletedSummary.totalVolume.toLocaleString('es-EC')} kg de volumen.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                    Fatiga {training.lastCompletedSummary.fatigueLevel ?? 'sin dato'}/10, dolor{' '}
                    {training.lastCompletedSummary.painLevel ?? 'sin dato'}/10.
                  </div>
                </div>
              ) : (
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  Finaliza o registra una sesion para ver su resumen.
                </div>
              )}
            </PanelCard>

            {!routine.currentRoutine ? (
              <Link
                to="/dashboard"
                className="inline-flex rounded-full border border-red-500/16 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              >
                Crear rutina
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
