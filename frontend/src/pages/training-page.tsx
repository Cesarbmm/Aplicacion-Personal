import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarRange, Dumbbell, Timer, Trophy } from 'lucide-react'

import { WorkoutTracker } from '@/components/app/workout-tracker'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function WorkoutPage() {
  const session = useSigmafitStore((state) => state.session)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const workout = useSigmafitStore((state) => state.workout)
  const loadCurrentRoutine = useSigmafitStore((state) => state.loadCurrentRoutine)
  const generateRoutine = useSigmafitStore((state) => state.generateRoutine)
  const startWorkoutSession = useSigmafitStore((state) => state.startWorkoutSession)
  const updateSessionSetDraft = useSigmafitStore((state) => state.updateSessionSetDraft)
  const completeWorkoutSet = useSigmafitStore((state) => state.completeWorkoutSet)
  const finishWorkoutSession = useSigmafitStore((state) => state.finishWorkoutSession)

  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete && !routine.currentRoutine) {
      void loadCurrentRoutine()
    }
  }, [
    loadCurrentRoutine,
    routine.currentRoutine,
    session.isAuthenticated,
    session.onboardingComplete,
  ])

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
          (total, day) => total + day.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + exercise.sets, 0),
          0,
        ) ?? 0

    return [
      { icon: Activity, label: 'Readiness', value: `${workout.readiness}%` },
      { icon: Dumbbell, label: 'Rutina', value: routine.currentRoutine ? `${routine.currentRoutine.days.length} dias` : 'Sin bloque' },
      {
        icon: Timer,
        label: 'Sesion activa',
        value: training.activeSession ? `${completedSets}/${totalSets} sets` : 'No iniciada',
      },
      {
        icon: CalendarRange,
        label: 'Fuente',
        value: routine.currentRoutine ? routine.source : 'Pendiente',
      },
    ]
  }, [routine.currentRoutine, routine.source, training.activeSession, workout.readiness])

  async function handleGenerateRoutine() {
    setIsGenerating(true)
    try {
      await generateRoutine()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout"
        title={training.activeSession ? `${training.activeSession.title} en vivo` : 'Rutina semanal y tracker en vivo'}
        subtitle={
          training.activeSession
            ? 'Marca series, registra peso y deja que SigmaFit gestione el descanso y el resumen de la sesion.'
            : 'Selecciona un dia del bloque semanal, inicia una sesion y lleva el control detallado del entrenamiento.'
        }
        actions={
          routine.currentRoutine ? null : (
            <LiquidButton size="md" onClick={() => void handleGenerateRoutine()} disabled={isGenerating || routine.isLoading}>
              {isGenerating || routine.isLoading ? 'Generando rutina...' : 'Generar rutina semanal'}
            </LiquidButton>
          )
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workoutMetrics.map((item) => (
          <PanelCard key={item.label} className="p-4" title={item.label}>
            <div className="flex items-center justify-between gap-3">
              <item.icon className="h-4 w-4 text-cyan-300" />
              <p className="text-right font-['Space_Grotesk'] text-2xl font-semibold text-white">{item.value}</p>
            </div>
          </PanelCard>
        ))}
      </section>

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
          onFinishSession={async (sessionId) => {
            await finishWorkoutSession(sessionId)
          }}
        />

        <div className="space-y-6">
          <PanelCard title="Estado del Coach" subtitle="La rutina se consulta desde backend y usa fallback local solo si es necesario.">
            <div className="space-y-3">
              {[
                routine.currentRoutine
                  ? `Rutina actual: ${routine.currentRoutine.name}.`
                  : 'No hay rutina generada todavia.',
                training.activeSession
                  ? `Sesion activa: ${training.activeSession.title}.`
                  : 'No hay una sesion activa en este momento.',
                `Backend: ${session.backendStatus}.`,
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Resumen de sesion" subtitle="Cierre del entrenamiento en vivo del Sprint 2.">
            {training.lastCompletedSummary ? (
              <div className="space-y-3">
                <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-cyan-300" />
                    <p className="font-medium text-white">Ultima sesion finalizada</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {training.lastCompletedSummary.completedSets} series completadas y un volumen aproximado de{' '}
                    {training.lastCompletedSummary.totalVolume.toLocaleString('es-EC')}.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  Estado: {training.lastCompletedSummary.status}
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
                Finaliza una sesion para guardar el resumen del entrenamiento en vivo.
              </div>
            )}
          </PanelCard>

          {!routine.currentRoutine ? (
            <PanelCard title="Desbloqueo del Sprint 2" subtitle="Ruta minima para activar el tracker.">
              <div className="space-y-4">
                <p className="text-sm leading-7 text-slate-300">
                  El onboarding ya define objetivo, nivel y dias disponibles. Usa ese perfil para generar la rutina
                  semanal y habilitar las sesiones en vivo.
                </p>
                <LiquidButton size="md" onClick={() => void handleGenerateRoutine()} disabled={isGenerating || routine.isLoading}>
                  {isGenerating || routine.isLoading ? 'Generando rutina...' : 'Generar rutina semanal'}
                </LiquidButton>
              </div>
            </PanelCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
