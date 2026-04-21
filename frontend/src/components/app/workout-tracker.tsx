import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Dumbbell, Flame, TimerReset } from 'lucide-react'

import { ProgressBar } from '@/components/ui/progress-bar'
import type { SigmaWorkoutExercise, SigmaWorkoutSet } from '@/lib/sigmafit/types'

type WorkoutTrackerProps = {
  exercises: SigmaWorkoutExercise[]
  activeExerciseId: string
  completedSets: number
  totalSets: number
  onSelectExercise: (exerciseId: string) => void
  onSetChange: (exerciseId: string, setId: string, patch: Partial<SigmaWorkoutSet>) => void
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function WorkoutTracker({
  exercises,
  activeExerciseId,
  completedSets,
  totalSets,
  onSelectExercise,
  onSetChange,
}: WorkoutTrackerProps) {
  const activeExercise =
    exercises.find((exercise) => exercise.id === activeExerciseId) ?? exercises[0]
  const [timerState, setTimerState] = useState(() => ({
    exerciseId: activeExercise?.id ?? '',
    value: activeExercise?.restSeconds ?? 90,
  }))
  const restTimer =
    timerState.exerciseId === activeExercise?.id ? timerState.value : (activeExercise?.restSeconds ?? 90)

  useEffect(() => {
    if (!activeExercise || restTimer <= 0) return undefined
    const exerciseId = activeExercise.id
    const restSeconds = activeExercise.restSeconds
    const timer = window.setInterval(() => {
      setTimerState((current) => {
        const baseValue = current.exerciseId === exerciseId ? current.value : restSeconds
        return {
          exerciseId,
          value: baseValue > 0 ? baseValue - 1 : 0,
        }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeExercise, restTimer])

  if (!activeExercise) return null

  function handleSelectExercise(exerciseId: string) {
    const nextExercise = exercises.find((exercise) => exercise.id === exerciseId)
    onSelectExercise(exerciseId)
    if (nextExercise) {
      setTimerState({
        exerciseId,
        value: nextExercise.restSeconds,
      })
    }
  }

  function resetRestTimer() {
    setTimerState({
      exerciseId: activeExercise.id,
      value: activeExercise.restSeconds,
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="panel-surface rounded-[30px] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Exercises</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">Tracker en vivo</h3>
          </div>
          <div className="rounded-full border border-cyan-400/14 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            {completedSets}/{totalSets} sets
          </div>
        </div>

        <ProgressBar value={(completedSets / Math.max(totalSets, 1)) * 100} />

        <div className="mt-5 space-y-3">
          {exercises.map((exercise) => {
            const exerciseCompleted = exercise.sets.filter((setItem) => setItem.completed).length
            const active = exercise.id === activeExerciseId
            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => handleSelectExercise(exercise.id)}
                className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                  active
                    ? 'border-cyan-400/22 bg-cyan-400/10'
                    : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{exercise.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{exercise.focus}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-cyan-200">
                      {exerciseCompleted}/{exercise.sets.length}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      RPE target {exercise.targetRpe}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel-surface rounded-[30px] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{activeExercise.focus}</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{activeExercise.name}</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">{activeExercise.note}</p>
          </div>
          <div className="rounded-[26px] border border-white/8 bg-black/20 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Descanso</p>
            <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{formatSeconds(restTimer)}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Clock3, label: 'Rest target', value: `${activeExercise.restSeconds}s` },
            { icon: Flame, label: 'Target RPE', value: `${activeExercise.targetRpe}/10` },
            { icon: Dumbbell, label: 'Sustitucion', value: activeExercise.substitute },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <item.icon className="h-4 w-4 text-cyan-300" />
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {activeExercise.sets.map((setItem, index) => (
            <div
              key={setItem.id}
              className="grid gap-3 rounded-[24px] border border-white/8 bg-black/20 p-4 md:grid-cols-[auto_1fr_1fr_auto]"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSetChange(activeExercise.id, setItem.id, { completed: !setItem.completed })}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    setItem.completed
                      ? 'border-cyan-400/20 bg-cyan-400/12 text-cyan-200'
                      : 'border-white/8 bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <CheckCircle2 size={18} />
                </button>
                <div>
                  <p className="font-medium text-white">Set {index + 1}</p>
                  <p className="text-sm text-slate-500">{setItem.completed ? 'Completado' : 'Pendiente'}</p>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Peso</span>
                <input
                  type="number"
                  value={setItem.weight}
                  onChange={(event) =>
                    onSetChange(activeExercise.id, setItem.id, { weight: Number(event.target.value) || 0 })
                  }
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Reps</span>
                <input
                  type="number"
                  value={setItem.reps}
                  onChange={(event) =>
                    onSetChange(activeExercise.id, setItem.id, { reps: Number(event.target.value) || 0 })
                  }
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <button
                type="button"
                onClick={resetRestTimer}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
              >
                <TimerReset size={16} />
                Reiniciar descanso
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
