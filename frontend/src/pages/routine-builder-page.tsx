import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Plus, Trash2, Wrench } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import {
  formatSigmaExperienceLevel,
  formatSigmaGoal,
} from '@/lib/sigmafit/catalog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type {
  SigmaManualRoutineDayInput,
  SigmaManualRoutineExerciseInput,
} from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

function buildInitialExercise(): SigmaManualRoutineExerciseInput {
  return {
    exerciseId: '',
    sets: 3,
    reps: '8-12',
    restSeconds: 90,
  }
}

function buildInitialDays(daysPerWeek: number): SigmaManualRoutineDayInput[] {
  return Array.from({ length: daysPerWeek }, (_, index) => ({
    dayNumber: index + 1,
    title: `Dia ${index + 1}`,
    exercises: [buildInitialExercise()],
  }))
}

export function RoutineBuilderPage() {
  const navigate = useNavigate()
  const profile = useSigmafitStore((state) => state.profile)
  const routine = useSigmafitStore((state) => state.routine)
  const loadExerciseCatalog = useSigmafitStore((state) => state.loadExerciseCatalog)
  const createManualRoutine = useSigmafitStore((state) => state.createManualRoutine)
  const selectRoutineFlow = useSigmafitStore((state) => state.selectRoutineFlow)

  const [routineName, setRoutineName] = useState(`Rutina ${formatSigmaGoal(profile.goal)}`)
  const [days, setDays] = useState<SigmaManualRoutineDayInput[]>(() => buildInitialDays(profile.daysPerWeek))
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    selectRoutineFlow('manual')
    void loadExerciseCatalog()
  }, [loadExerciseCatalog, selectRoutineFlow])

  const catalogOptions = useMemo(() => routine.exerciseCatalog, [routine.exerciseCatalog])

  function updateDay(dayNumber: number, patch: Partial<SigmaManualRoutineDayInput>) {
    setDays((current) =>
      current.map((day) => (day.dayNumber === dayNumber ? { ...day, ...patch } : day)),
    )
  }

  function updateExercise(
    dayNumber: number,
    exerciseIndex: number,
    patch: Partial<SigmaManualRoutineExerciseInput>,
  ) {
    setDays((current) =>
      current.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              exercises: day.exercises.map((exercise, index) =>
                index === exerciseIndex
                  ? {
                      ...exercise,
                      ...patch,
                    }
                  : exercise,
              ),
            }
          : day,
      ),
    )
  }

  function addExercise(dayNumber: number) {
    setDays((current) =>
      current.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              exercises: [
                ...day.exercises,
                {
                  ...buildInitialExercise(),
                  exerciseId: catalogOptions[0]?.exerciseId ?? '',
                },
              ],
            }
          : day,
      ),
    )
  }

  function removeExercise(dayNumber: number, exerciseIndex: number) {
    setDays((current) =>
      current.map((day) =>
        day.dayNumber === dayNumber
          ? {
              ...day,
              exercises: day.exercises.filter((_, index) => index !== exerciseIndex),
            }
          : day,
      ),
    )
  }

  function validateForm() {
    if (!routineName.trim()) {
      return 'Define un nombre para la rutina manual antes de guardarla.'
    }

    for (const day of days) {
      if (!day.title.trim()) {
        return `Define un titulo para el dia ${day.dayNumber}.`
      }

      if (day.exercises.length === 0) {
        return `Agrega al menos un ejercicio en el dia ${day.dayNumber}.`
      }

      for (const exercise of day.exercises) {
        if (!exercise.exerciseId && !catalogOptions[0]?.exerciseId) {
          return `Selecciona un ejercicio valido para el dia ${day.dayNumber}.`
        }

        if (exercise.sets <= 0) {
          return `Los sets del dia ${day.dayNumber} deben ser positivos.`
        }

        if (!exercise.reps.trim()) {
          return `Las repeticiones del dia ${day.dayNumber} no pueden quedar vacias.`
        }

        if (exercise.restSeconds <= 0) {
          return `El descanso del dia ${day.dayNumber} debe ser positivo.`
        }
      }
    }

    return null
  }

  async function handleSaveRoutine() {
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError(null)
    const fallbackExerciseId = catalogOptions[0]?.exerciseId ?? ''
    const normalizedDays = days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        exerciseId: exercise.exerciseId || fallbackExerciseId,
      })),
    }))

    const result = await createManualRoutine({
      name: routineName.trim(),
      goal: profile.goal,
      daysPerWeek: profile.daysPerWeek,
      days: normalizedDays,
    })

    if (result.routineAvailable) {
      await navigate({ to: '/dashboard' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Routine Builder"
        title="Crear rutina manual"
        subtitle="El onboarding solo define el perfil. Aqui construyes un bloque propio usando el catalogo oficial."
        actions={
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
          >
            Volver al dashboard
          </Link>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <PanelCard
          title="Contexto del atleta"
          subtitle="Para nivel avanzado puedes crear una rutina desde cero. En otros niveles sigue siendo util, pero el Coach suele ser mejor punto de partida."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/14 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
              <Wrench size={14} />
              Builder manual
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
              {profile.experienceLevel === 'advanced'
                ? 'Puedes crear tu propia rutina o usar el Coach como base. Aqui tienes control completo del bloque.'
                : 'Aunque el Coach es la recomendacion principal para tu nivel, tambien puedes construir la rutina manualmente.'}
            </div>

            {[
              `Objetivo: ${formatSigmaGoal(profile.goal)}.`,
              `Nivel: ${formatSigmaExperienceLevel(profile.experienceLevel)}.`,
              `Dias disponibles: ${profile.daysPerWeek}.`,
              `Catalogo cargado: ${catalogOptions.length} ejercicios.`,
            ].map((line) => (
              <div key={line} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                {line}
              </div>
            ))}

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Nombre de la rutina</span>
              <input
                aria-label="nombre de la rutina"
                value={routineName}
                onChange={(event) => setRoutineName(event.target.value)}
                className="w-full rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
              />
            </label>

            {formError ? (
              <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                {formError}
              </div>
            ) : null}

            {routine.error ? (
              <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                {routine.error}
              </div>
            ) : null}

            <LiquidButton
              size="md"
              onClick={() => {
                void handleSaveRoutine()
              }}
              disabled={routine.isSavingManual || routine.isCatalogLoading}
            >
              {routine.isSavingManual ? 'Guardando rutina...' : 'Guardar rutina manual'}
            </LiquidButton>
          </div>
        </PanelCard>

        <PanelCard title="Dias del bloque" subtitle="Cada dia debe tener al menos un ejercicio antes de guardar.">
          {routine.isCatalogLoading ? (
            <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
              Cargando catalogo de ejercicios...
            </div>
          ) : null}

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.dayNumber} className="rounded-[26px] border border-white/8 bg-black/20 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dia {day.dayNumber}</p>
                    <input
                      aria-label={`titulo dia ${day.dayNumber}`}
                      value={day.title}
                      onChange={(event) => updateDay(day.dayNumber, { title: event.target.value })}
                      className="mt-2 w-full rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => addExercise(day.dayNumber)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
                  >
                    <Plus size={16} />
                    Agregar ejercicio
                  </button>
                </div>

                <div className="space-y-3">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={`${day.dayNumber}-${exerciseIndex}`}
                      className="grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 xl:grid-cols-[1.6fr_0.6fr_0.6fr_0.7fr_auto]"
                    >
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Ejercicio</span>
                        <Select
                          value={exercise.exerciseId}
                          onValueChange={(value) =>
                            updateExercise(day.dayNumber, exerciseIndex, { exerciseId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un ejercicio" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogOptions.map((option) => (
                              <SelectItem key={option.exerciseId} value={option.exerciseId}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Sets</span>
                        <input
                          aria-label={`sets dia ${day.dayNumber} fila ${exerciseIndex + 1}`}
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(event) =>
                            updateExercise(day.dayNumber, exerciseIndex, {
                              sets: Number(event.target.value) || 0,
                            })
                          }
                          className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Reps</span>
                        <input
                          aria-label={`reps dia ${day.dayNumber} fila ${exerciseIndex + 1}`}
                          value={exercise.reps}
                          onChange={(event) =>
                            updateExercise(day.dayNumber, exerciseIndex, { reps: event.target.value })
                          }
                          className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Descanso</span>
                        <input
                          aria-label={`descanso dia ${day.dayNumber} fila ${exerciseIndex + 1}`}
                          type="number"
                          min={1}
                          value={exercise.restSeconds}
                          onChange={(event) =>
                            updateExercise(day.dayNumber, exerciseIndex, {
                              restSeconds: Number(event.target.value) || 0,
                            })
                          }
                          className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                        />
                      </label>

                      <button
                        type="button"
                        aria-label={`eliminar ejercicio dia ${day.dayNumber} fila ${exerciseIndex + 1}`}
                        onClick={() => removeExercise(day.dayNumber, exerciseIndex)}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300 transition hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </section>
    </div>
  )
}
