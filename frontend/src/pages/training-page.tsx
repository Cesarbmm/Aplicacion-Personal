import { useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, CalendarRange, Dumbbell, Timer, Trophy } from 'lucide-react'

import { WorkoutTracker } from '@/components/app/workout-tracker'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function WorkoutPage() {
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
          (total, day) => total + day.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + exercise.sets, 0),
          0,
        ) ?? 0

    return [
      { icon: Activity, label: 'Readiness', value: `${workout.readiness}%` },
      {
        icon: Dumbbell,
        label: 'Rutina',
        value: routine.currentRoutine ? `${routine.currentRoutine.days.length} dias` : 'Sin rutina activa',
      },
      {
        icon: Timer,
        label: 'Sesion activa',
        value: training.activeSession ? `${completedSets}/${totalSets} sets` : 'No iniciada',
      },
      {
        icon: CalendarRange,
        label: 'Estado',
        value: routine.currentRoutine ? 'Lista' : routine.proposedRoutine ? 'Propuesta' : 'Pendiente',
      },
    ]
  }, [
    routine.currentRoutine,
    routine.proposedRoutine,
    training.activeSession,
    workout.readiness,
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout"
        title={training.activeSession ? `${training.activeSession.title} en vivo` : 'Rutina semanal y tracker en vivo'}
        subtitle={
          training.activeSession
            ? 'Marca series, registra peso y deja que SigmaFit gestione el descanso y el resumen de la sesion.'
            : routine.currentRoutine
              ? 'La rutina ya fue aceptada o creada manualmente. Selecciona un dia y comienza la sesion.'
              : 'Todavia no hay una rutina activa. Primero crea o acepta un plan desde el dashboard.'
        }
        actions={
          routine.currentRoutine ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
            >
              Volver al dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/16"
              >
                Elegir flujo de rutina
              </Link>
              <Link
                to="/routine-builder"
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
              >
                Crear manualmente
              </Link>
            </>
          )
        }
      />

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
          <PanelCard title="Estado del entrenamiento" subtitle="El tracker usa solo rutinas activas.">
            <div className="space-y-3">
              {[
                routine.currentRoutine
                  ? `Rutina activa: ${routine.currentRoutine.name}.`
                  : routine.proposedRoutine
                    ? 'Hay una propuesta pendiente. Debes aceptarla desde el dashboard.'
                    : 'No hay rutina activa todavia.',
                training.activeSession
                  ? `Sesion activa: ${training.activeSession.title}.`
                  : 'No hay una sesion activa en este momento.',
                `Conexion: ${session.backendStatus === 'online' ? 'sincronizada' : 'en dispositivo'}.`,
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Resumen de sesion" subtitle="Cierre del entrenamiento en vivo.">
            {training.lastCompletedSummary ? (
              <div className="space-y-3">
                <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-red-300" />
                    <p className="font-medium text-white">Ultima sesion finalizada</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {training.lastCompletedSummary.completedSets} series completadas y un volumen aproximado de{' '}
                    {training.lastCompletedSummary.totalVolume.toLocaleString('es-EC')} kg. Tambien registraste{' '}
                    {training.lastCompletedSummary.totalReps} reps reales
                    {training.lastCompletedSummary.totalSeconds > 0
                      ? ` y ${training.lastCompletedSummary.totalSeconds}s de trabajo por tiempo`
                      : ''}
                    .
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  Estado: {training.lastCompletedSummary.status}
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
                  Fatiga {training.lastCompletedSummary.fatigueLevel ?? 'sin dato'}/10, dolor{' '}
                  {training.lastCompletedSummary.painLevel ?? 'sin dato'}/10.
                  {training.lastCompletedSummary.athleteNotes
                    ? ` Nota: ${training.lastCompletedSummary.athleteNotes}`
                    : ' Sin observaciones registradas.'}
                </div>
                <div className="rounded-[22px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-red-100">
                  Estos datos alimentaran el ajuste adaptativo de tu proxima rutina.
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
                Finaliza una sesion para guardar el resumen del entrenamiento en vivo.
              </div>
            )}
          </PanelCard>

          {!routine.currentRoutine ? (
            <PanelCard title="Antes del tracker" subtitle="Primero define como quieres crear tu plan.">
              <div className="space-y-4">
                <p className="text-sm leading-7 text-slate-300">
                  El onboarding solo define objetivo, nivel y disponibilidad. El dashboard ahora separa la decision
                  entre propuesta del Coach Virtual y rutina manual.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16"
                  >
                    Ir al dashboard
                  </Link>
                  <Link
                    to="/routine-builder"
                    className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
                  >
                    Abrir builder manual
                  </Link>
                </div>
              </div>
            </PanelCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
