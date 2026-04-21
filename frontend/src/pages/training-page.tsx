import { useState } from 'react'
import { Activity, Flame, Gauge, Sparkles } from 'lucide-react'

import { RpeModal } from '@/components/app/rpe-modal'
import { WorkoutTracker } from '@/components/app/workout-tracker'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { getSigmaWorkoutView } from '@/lib/sigmafit/mock-adapter'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function WorkoutPage() {
  const session = useSigmafitStore((state) => state.session)
  const profile = useSigmafitStore((state) => state.profile)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const preferences = useSigmafitStore((state) => state.preferences)
  const updateWorkoutSet = useSigmafitStore((state) => state.updateWorkoutSet)
  const setActiveExercise = useSigmafitStore((state) => state.setActiveExercise)
  const submitWorkoutRpe = useSigmafitStore((state) => state.submitWorkoutRpe)

  const data = getSigmaWorkoutView({ session, profile, workout, progressHistory, preferences })
  const [rpeModalOpen, setRpeModalOpen] = useState(false)
  const [rpeDraft, setRpeDraft] = useState(workout.lastSessionRpe ?? 7)

  function handleSubmitRpe() {
    submitWorkoutRpe(rpeDraft)
    setRpeModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workout"
        title={`${data.title} en vivo`}
        subtitle={data.notes}
        actions={
          <LiquidButton size="md" onClick={() => setRpeModalOpen(true)}>
            Cerrar con RPE
          </LiquidButton>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Gauge, label: 'Readiness', value: `${data.readiness}%` },
          { icon: Activity, label: 'Sets completados', value: `${data.completedSets}/${data.totalSets}` },
          { icon: Flame, label: 'Duracion objetivo', value: `${data.sessionLengthMinutes} min` },
          { icon: Sparkles, label: 'Bloque', value: data.block },
        ].map((item) => (
          <PanelCard key={item.label} className="p-4" title={item.label}>
            <div className="flex items-center justify-between gap-3">
              <item.icon className="h-4 w-4 text-cyan-300" />
              <p className="text-right font-['Space_Grotesk'] text-2xl font-semibold text-white">{item.value}</p>
            </div>
          </PanelCard>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <WorkoutTracker
          exercises={data.exercises}
          activeExerciseId={workout.activeExerciseId}
          completedSets={data.completedSets}
          totalSets={data.totalSets}
          onSelectExercise={setActiveExercise}
          onSetChange={updateWorkoutSet}
        />

        <div className="space-y-6">
          <PanelCard title="Contexto de la sesion" subtitle={data.focus}>
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Readiness live</span>
                  <span className="text-sm text-cyan-200">{data.readiness}%</span>
                </div>
                <ProgressBar value={data.readiness} />
              </div>

              <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 px-4 py-4 text-sm leading-7 text-slate-200">
                El tracker esta desacoplado del backend. Puedes editar cargas, reps y sets mientras el estado
                se conserva en localStorage.
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Que valida esta vista" subtitle="Checklist del sprint actual.">
            <div className="space-y-3">
              {[
                'Layout interno con sidebar SigmaFit.',
                'Workout tracker reutilizable y editable.',
                'Modal RPE conectado al store persistente.',
                'Datos mock listos para cambiar por adapters reales.',
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </div>

      <RpeModal
        open={rpeModalOpen}
        value={rpeDraft}
        onValueChange={setRpeDraft}
        onClose={() => setRpeModalOpen(false)}
        onSubmit={handleSubmitRpe}
      />
    </div>
  )
}

