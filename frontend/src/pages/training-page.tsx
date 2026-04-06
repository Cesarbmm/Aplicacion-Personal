import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Minus, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'

import { MiniChart } from '../components/mini-chart'
import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import type { DraftExercise, TrainingDraftPayload, TrainingSet } from '../lib/types'
import { cn, formatDate, formatNumber } from '../lib/utils'
import { useUiStore } from '../store/ui-store'

function numericValue(value: string) {
  if (!value) return null
  const next = Number(value.replace(',', '.'))
  return Number.isFinite(next) ? next : null
}

function createEmptySet(partial?: Partial<TrainingSet>): TrainingSet {
  return {
    type: 'trabajo',
    reps: null,
    weight: null,
    rest: 90,
    rir: 2,
    rpe: null,
    tempo: '',
    unilateral: false,
    pain: false,
    completedStatus: 'completado',
    notes: '',
    ...partial,
  }
}

function estimateDraftVolume(exercises: DraftExercise[]) {
  return exercises.reduce((sessionTotal, exercise) => (
    sessionTotal + exercise.sets.reduce((setTotal, setItem) => setTotal + ((setItem.weight || 0) * (setItem.reps || 0)), 0)
  ), 0)
}

export function TrainingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [focusOverride, setFocusOverride] = useState('')
  const [draftOverride, setDraftOverride] = useState<TrainingDraftPayload['sessionDraft'] | null>(null)
  const [selectedExercise, setSelectedExercise] = useState(0)
  const [exercisePickerValue, setExercisePickerValue] = useState('')

  const templatesQuery = useQuery({
    queryKey: ['training-templates'],
    queryFn: api.trainingTemplates,
  })

  const focus = focusOverride || templatesQuery.data?.activeFocus || ''
  const focusOptions = useMemo(() => {
    if (!templatesQuery.data) return []
    return templatesQuery.data.focusCatalog.length
      ? templatesQuery.data.focusCatalog.map((item) => item.name)
      : templatesQuery.data.focuses
  }, [templatesQuery.data])

  const draftQuery = useQuery({
    queryKey: ['training-draft', focus],
    queryFn: () => api.trainingDraft(focus),
    enabled: !!focus,
  })

  const libraryQuery = useQuery({
    queryKey: ['training-library'],
    queryFn: () => api.exercises({}),
  })

  const draft = draftOverride ?? (draftQuery.data?.sessionDraft ? structuredClone(draftQuery.data.sessionDraft) : null)
  const activeIndex = draft ? Math.min(selectedExercise, Math.max(draft.exercises.length - 1, 0)) : 0
  const activeExercise = draft?.exercises[activeIndex] ?? null

  const addExerciseOptions = useMemo(() => {
    const used = new Set(draft?.exercises.map((item) => item.exerciseName))
    return (libraryQuery.data?.items || []).filter((item) => !used.has(item.name))
  }, [draft?.exercises, libraryQuery.data?.items])

  const sessionStats = useMemo(() => {
    if (!draft) {
      return { exerciseCount: 0, setCount: 0, painCount: 0, estimatedVolume: 0 }
    }
    const setCount = draft.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)
    const painCount = draft.exercises.reduce((total, exercise) => total + exercise.sets.filter((setItem) => setItem.pain).length, 0)
    return {
      exerciseCount: draft.exercises.length,
      setCount,
      painCount,
      estimatedVolume: estimateDraftVolume(draft.exercises),
    }
  }, [draft])

  function commitDraft(transform: (current: TrainingDraftPayload['sessionDraft']) => TrainingDraftPayload['sessionDraft']) {
    setDraftOverride((current) => {
      const base = current ?? (draftQuery.data?.sessionDraft ? structuredClone(draftQuery.data.sessionDraft) : null)
      return base ? transform(base) : base
    })
  }

  function discardDraft() {
    setDraftOverride(null)
    setSelectedExercise(0)
    setExercisePickerValue('')
    setStatusMessage('Cambios descartados. Volviste al draft base del foco actual.')
  }

  function updateSessionField(field: keyof TrainingDraftPayload['sessionDraft'], value: unknown) {
    commitDraft((current) => ({ ...current, [field]: value }))
  }

  function updateExercise(index: number, next: DraftExercise) {
    commitDraft((current) => {
      const exercises = [...current.exercises]
      exercises[index] = next
      return { ...current, exercises }
    })
  }

  function updateExerciseField(index: number, field: keyof DraftExercise, value: unknown) {
    const current = draft?.exercises[index]
    if (!current) return
    updateExercise(index, { ...current, [field]: value })
  }

  function updateSetField(exerciseIndex: number, setIndex: number, field: keyof TrainingSet, value: unknown) {
    const exercise = draft?.exercises[exerciseIndex]
    if (!exercise) return
    const nextSets = [...exercise.sets]
    nextSets[setIndex] = { ...nextSets[setIndex], [field]: value }
    updateExercise(exerciseIndex, { ...exercise, sets: nextSets })
  }

  function addSet(exerciseIndex: number) {
    const exercise = draft?.exercises[exerciseIndex]
    if (!exercise) return
    const last = exercise.sets[exercise.sets.length - 1]
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: [...exercise.sets, createEmptySet(last ? { ...last } : undefined)],
    })
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    const exercise = draft?.exercises[exerciseIndex]
    if (!exercise || exercise.sets.length <= 1) return
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: exercise.sets.filter((_, index) => index !== setIndex),
    })
  }

  function addExercise(name: string) {
    const definition = libraryQuery.data?.items.find((item) => item.name === name)
    if (!definition) return
    commitDraft((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          exerciseId: definition.id,
          exerciseName: definition.name,
          goal: '',
          notes: '',
          targetSets: 3,
          targetReps: '8-12',
          targetWeight: null,
          targetRest: 90,
          targetRir: 2,
          progressionRule: '',
          exercise: definition,
          sets: Array.from({ length: 3 }, () => createEmptySet()),
        },
      ],
    }))
    setExercisePickerValue('')
    setSelectedExercise(draft?.exercises.length || 0)
  }

  function removeExercise(index: number) {
    if (!draft || draft.exercises.length <= 1) return
    commitDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((_, exerciseIndex) => exerciseIndex !== index),
    }))
    setSelectedExercise((current) => Math.max(0, Math.min(current, draft.exercises.length - 2)))
    setStatusMessage('Ejercicio retirado del draft actual.')
  }

  const saveSessionMutation = useMutation({
    mutationFn: api.saveSession,
    onSuccess: async () => {
      setStatusMessage('Sesion guardada en SQLite desde la shell React.')
      setDraftOverride(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['plan'] }),
        queryClient.invalidateQueries({ queryKey: ['coach-context'] }),
        queryClient.invalidateQueries({ queryKey: ['training-draft', focus] }),
      ])
    },
  })

  const saveTemplateMutation = useMutation({
    mutationFn: api.saveTemplate,
    onSuccess: async () => {
      setStatusMessage('Plantilla actualizada desde el workspace de entrenamiento.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['training-templates'] }),
        queryClient.invalidateQueries({ queryKey: ['training-draft', focus] }),
      ])
    },
  })

  function saveTemplateFromDraft() {
    if (!draft || !draftQuery.data) return
    saveTemplateMutation.mutate({
      id: draft.sourceTemplateId,
      focus,
      name: draftQuery.data.template?.name || `${focus} premium`,
      description: draftQuery.data.template?.description || `Plantilla editable para ${focus}.`,
      goal: draftQuery.data.template?.goal || draft.blockName,
      exercises: draft.exercises.map((exercise, index) => ({
        id: null,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        exerciseOrder: index + 1,
        setType: exercise.sets[0]?.type || 'trabajo',
        defaultSets: exercise.targetSets || exercise.sets.length || 3,
        defaultReps: exercise.targetReps || '8-12',
        defaultWeight: exercise.targetWeight,
        defaultRest: exercise.targetRest || 90,
        targetRir: exercise.targetRir,
        progressionRule: exercise.progressionRule,
        notes: exercise.notes,
      })),
    })
  }

  if (!templatesQuery.data || !draftQuery.data || !draft) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando workspace de entrenamiento...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrenar"
        title={`Rutina de hoy: ${focus}`}
        subtitle="La pantalla se centra en lo que importa: plantilla, ejercicio activo y registro. El resto queda plegado para no distraer."
        actions={
          <>
            <button
              type="button"
              onClick={saveTemplateFromDraft}
              className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              Guardar en plantilla
            </button>
            <button
              type="button"
              onClick={() => saveSessionMutation.mutate(draft)}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18"
            >
              <Save size={16} />
              Guardar sesion
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-white/16 hover:bg-white/[0.08]"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <PanelCard className="p-4" title="Ejercicios" subtitle="En cola para hoy">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{sessionStats.exerciseCount}</p>
        </PanelCard>
        <PanelCard className="p-4" title="Sets" subtitle="Listos para registrar">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{sessionStats.setCount}</p>
        </PanelCard>
        <PanelCard className="p-4" title="Volumen actual" subtitle={`Alertas por dolor: ${sessionStats.painCount}`}>
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{formatNumber(sessionStats.estimatedVolume, ' kg')}</p>
        </PanelCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <PanelCard title="Plantilla y foco" subtitle="Selecciona el foco, revisa la base y mantente dentro del flujo del dia.">
          <div className="space-y-4">
            <select
              value={focus}
              onChange={(event) => {
                setFocusOverride(event.target.value)
                setDraftOverride(null)
                setSelectedExercise(0)
                setExercisePickerValue('')
              }}
              className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            >
              {focusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <div className="rounded-2xl border border-red-500/15 bg-red-500/8 p-4">
              <p className="font-medium text-white">{draftQuery.data.template?.name || `${focus} sin plantilla`}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{draftQuery.data.template?.description || draftQuery.data.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <span className="rounded-full border border-white/8 px-3 py-1">{draft.blockName || 'Sin bloque'}</span>
                <span className="rounded-full border border-white/8 px-3 py-1">{draft.durationMinutes || 75} min</span>
              </div>
            </div>

            <div className="space-y-2">
              {draft.exercises.map((exercise, index) => (
                <button
                  key={`${exercise.exerciseName}-${index}`}
                  type="button"
                  onClick={() => setSelectedExercise(index)}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-3 text-left transition',
                    activeIndex === index
                      ? 'border-red-500/35 bg-red-500/12'
                      : 'border-white/6 bg-black/20 hover:border-white/10 hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{exercise.exerciseName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{index + 1}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{exercise.targetSets || exercise.sets.length} sets · {exercise.targetReps || '-'}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2 rounded-2xl border border-dashed border-white/8 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Agregar ejercicio</p>
              <select
                value={exercisePickerValue}
                onChange={(event) => {
                  setExercisePickerValue(event.target.value)
                  if (event.target.value) addExercise(event.target.value)
                }}
                className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Elegir desde la biblioteca</option>
                {addExerciseOptions.map((item) => <option key={item.id ?? item.name} value={item.name}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title={activeExercise?.exerciseName || 'Sesion'}
          subtitle="Editor central de sets, reps, carga, descanso y notas. Todo se registra aqui sin tocar la plantilla base."
          action={activeExercise ? (
            <button
              type="button"
              onClick={() => removeExercise(activeIndex)}
              disabled={draft.exercises.length <= 1}
              className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/8 px-3 py-2 text-xs uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
              Quitar
            </button>
          ) : null}
        >
          {activeExercise ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-4">
                <input value={activeExercise.targetReps} onChange={(event) => updateExerciseField(activeIndex, 'targetReps', event.target.value)} placeholder="Reps objetivo" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <input value={activeExercise.targetWeight ?? ''} onChange={(event) => updateExerciseField(activeIndex, 'targetWeight', numericValue(event.target.value))} placeholder="Peso objetivo" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <input value={activeExercise.targetRest ?? ''} onChange={(event) => updateExerciseField(activeIndex, 'targetRest', numericValue(event.target.value))} placeholder="Descanso seg" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <input value={activeExercise.targetRir ?? ''} onChange={(event) => updateExerciseField(activeIndex, 'targetRir', numericValue(event.target.value))} placeholder="RIR base" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input value={activeExercise.goal} onChange={(event) => updateExerciseField(activeIndex, 'goal', event.target.value)} placeholder="Objetivo tactico del ejercicio" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <input value={activeExercise.progressionRule} onChange={(event) => updateExerciseField(activeIndex, 'progressionRule', event.target.value)} placeholder="Regla de progresion" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              </div>

              <textarea value={activeExercise.notes} onChange={(event) => updateExerciseField(activeIndex, 'notes', event.target.value)} rows={3} placeholder="Notas del ejercicio, cues o ajustes" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />

              <div className="space-y-3">
                {activeExercise.sets.map((setItem, setIndex) => (
                  <div key={`${activeExercise.exerciseName}-${setIndex}`} className="rounded-2xl border border-white/6 bg-zinc-950/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Set {setIndex + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeSet(activeIndex, setIndex)}
                        disabled={activeExercise.sets.length <= 1}
                        className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition hover:border-white/16 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={12} />
                        Quitar
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-6">
                      <input value={setItem.type} onChange={(event) => updateSetField(activeIndex, setIndex, 'type', event.target.value)} placeholder="Tipo" className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                      <input value={setItem.reps ?? ''} onChange={(event) => updateSetField(activeIndex, setIndex, 'reps', numericValue(event.target.value))} placeholder="Reps" className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                      <input value={setItem.weight ?? ''} onChange={(event) => updateSetField(activeIndex, setIndex, 'weight', numericValue(event.target.value))} placeholder="Peso" className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                      <input value={setItem.rest ?? ''} onChange={(event) => updateSetField(activeIndex, setIndex, 'rest', numericValue(event.target.value))} placeholder="Descanso" className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                      <input value={setItem.rir ?? ''} onChange={(event) => updateSetField(activeIndex, setIndex, 'rir', numericValue(event.target.value))} placeholder="RIR" className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                      <label className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                        <input type="checkbox" checked={setItem.pain} onChange={(event) => updateSetField(activeIndex, setIndex, 'pain', event.target.checked)} />
                        Dolor
                      </label>
                    </div>
                    <input value={setItem.notes} onChange={(event) => updateSetField(activeIndex, setIndex, 'notes', event.target.value)} placeholder="Nota corta del set" className="mt-3 w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => addSet(activeIndex)} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10">
                <Plus size={16} />
                Agregar set
              </button>
            </div>
          ) : null}
        </PanelCard>

        <div className="space-y-6">
          <details className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <summary className="cursor-pointer list-none">
              <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">Control de sesion</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">Fecha, duracion, estado y notas. Lo dejamos plegado para no quitarle foco a la ejecucion.</p>
            </summary>
            <div className="mt-4 space-y-3">
              <input value={draft.sessionDate} onChange={(event) => updateSessionField('sessionDate', event.target.value)} type="date" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={draft.durationMinutes ?? ''} onChange={(event) => updateSessionField('durationMinutes', numericValue(event.target.value))} placeholder="Duracion min" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <input value={draft.perceivedEnergy ?? ''} onChange={(event) => updateSessionField('perceivedEnergy', numericValue(event.target.value))} placeholder="Energia percibida" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={draft.readinessScore ?? ''} onChange={(event) => updateSessionField('readinessScore', numericValue(event.target.value))} placeholder="Readiness" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                <select value={draft.completionStatus} onChange={(event) => updateSessionField('completionStatus', event.target.value)} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
                  <option value="completado">Completado</option>
                  <option value="parcial">Parcial</option>
                  <option value="omitido">Omitido</option>
                </select>
              </div>
              <textarea value={draft.notes} onChange={(event) => updateSessionField('notes', event.target.value)} rows={4} placeholder="Resumen tactico de la sesion" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>
          </details>

          <PanelCard
            title="Coach y progreso"
            subtitle="Solo lo esencial para ajustar el dia sin abrir cinco paneles."
            action={(
              <button
                type="button"
                onClick={() => void navigate({ to: '/coach' })}
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.16em] text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Abrir coach
              </button>
            )}
          >
            <div className="space-y-3">
              {draftQuery.data.watchToday.slice(0, 3).map((item) => (
                <div key={item} className="rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-50/90">
                  {item}
                </div>
              ))}
              {draftQuery.data.preCheckin ? (
                <div className="rounded-2xl border border-white/6 bg-black/20 p-4 text-sm text-zinc-300">
                  Pre-checkin · energia {draftQuery.data.preCheckin.energy ?? '-'} · fatiga {draftQuery.data.preCheckin.fatigue ?? '-'} · intencion {draftQuery.data.preCheckin.trainingIntent || '-'}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 p-4 text-sm text-zinc-500">
                  Todavia no hay check-in previo. Si quieres ajuste fino, pasa por el coach antes de entrenar.
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard title="Progreso contextual" subtitle="Tendencia reciente del foco actual.">
            <div className="space-y-4">
              {draftQuery.data.progressCards.slice(0, 3).map((item) => (
                <div key={item.exercise} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.exercise}</p>
                    <p className="text-sm text-zinc-400">{item.series.length} muestras</p>
                  </div>
                  <MiniChart points={item.series} />
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Sesiones recientes" subtitle="Referencia rapida para no repetir errores ni entrar frio.">
            <div className="space-y-3">
              {draftQuery.data.recentSessions.slice(0, 4).map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{formatDate(session.sessionDate)}</p>
                    <p className="text-sm text-zinc-400">{formatNumber(session.volume, ' kg')}</p>
                  </div>
                  <p className="text-sm text-zinc-400">{session.exerciseCount} ejercicios · readiness {session.readinessScore ?? '-'}</p>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  )
}
