import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import type { ExerciseSummary } from '../lib/types'
import { useUiStore } from '../store/ui-store'

const exerciseSchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string().min(2),
  canonicalName: z.string().default(''),
  category: z.string().min(2),
  modality: z.string().min(2),
  movementPattern: z.string().default(''),
  primaryMuscles: z.string().default(''),
  secondaryMuscles: z.string().default(''),
  equipment: z.string().default(''),
  difficulty: z.string().default(''),
  loadType: z.string().default('peso'),
  defaultUnit: z.string().default('kg'),
  cues: z.string().default(''),
  technicalNotes: z.string().default(''),
  variantGroup: z.string().default(''),
  alternatives: z.string().default(''),
  isCompound: z.boolean().default(false),
  isCustom: z.boolean().default(true),
  status: z.string().default('activo'),
})

type ExerciseFormValues = z.infer<typeof exerciseSchema>

function blankExercise(): ExerciseFormValues {
  return {
    id: null,
    name: '',
    canonicalName: '',
    category: '',
    modality: 'fuerza',
    movementPattern: '',
    primaryMuscles: '',
    secondaryMuscles: '',
    equipment: '',
    difficulty: '',
    loadType: 'peso',
    defaultUnit: 'kg',
    cues: '',
    technicalNotes: '',
    variantGroup: '',
    alternatives: '',
    isCompound: false,
    isCustom: true,
    status: 'activo',
  }
}

function formFromExercise(exercise: ExerciseSummary | null): ExerciseFormValues {
  if (!exercise) return blankExercise()
  return {
    id: exercise.id,
    name: exercise.name,
    canonicalName: exercise.canonicalName,
    category: exercise.category,
    modality: exercise.modality,
    movementPattern: exercise.movementPattern,
    primaryMuscles: exercise.primaryMuscles.join(', '),
    secondaryMuscles: exercise.secondaryMuscles.join(', '),
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    loadType: exercise.loadType,
    defaultUnit: exercise.defaultUnit,
    cues: exercise.cues,
    technicalNotes: exercise.technicalNotes,
    variantGroup: exercise.variantGroup,
    alternatives: exercise.alternatives.join(', '),
    isCompound: exercise.isCompound,
    isCustom: exercise.isCustom,
    status: exercise.status,
  }
}

function payloadFromForm(values: ExerciseFormValues): ExerciseSummary {
  return {
    id: values.id ?? null,
    name: values.name,
    canonicalName: values.canonicalName,
    category: values.category,
    modality: values.modality,
    movementPattern: values.movementPattern,
    primaryMuscles: values.primaryMuscles.split(',').map((item) => item.trim()).filter(Boolean),
    secondaryMuscles: values.secondaryMuscles.split(',').map((item) => item.trim()).filter(Boolean),
    equipment: values.equipment,
    difficulty: values.difficulty,
    loadType: values.loadType,
    defaultUnit: values.defaultUnit,
    cues: values.cues,
    technicalNotes: values.technicalNotes,
    variantGroup: values.variantGroup,
    alternatives: values.alternatives.split(',').map((item) => item.trim()).filter(Boolean),
    isCompound: values.isCompound,
    isCustom: values.isCustom,
    status: values.status,
  }
}

export function ExercisesPage() {
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [filters, setFilters] = useState({ search: '', category: '', equipment: '', modality: '', origin: '' })
  const [selectedIdOverride, setSelectedIdOverride] = useState<number | null>(null)
  const exercisesQuery = useQuery({
    queryKey: ['exercises', filters],
    queryFn: () => api.exercises(filters),
  })
  const selectedId = selectedIdOverride ?? exercisesQuery.data?.items[0]?.id ?? null
  const selectedExercise = useMemo(() => exercisesQuery.data?.items.find((item) => item.id === selectedId) || null, [exercisesQuery.data?.items, selectedId])
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema) as never,
    defaultValues: blankExercise(),
  })

  useEffect(() => {
    form.reset(formFromExercise(selectedExercise))
  }, [form, selectedExercise])

  const saveMutation = useMutation({
    mutationFn: async (values: ExerciseFormValues) => {
      const payload = payloadFromForm(values)
      if (payload.id) return api.updateExercise(payload.id, payload)
      return api.createExercise(payload)
    },
    onSuccess: () => {
      setStatusMessage('Ejercicio guardado desde la nueva biblioteca React.')
      void queryClient.invalidateQueries({ queryKey: ['exercises'] })
      void queryClient.invalidateQueries({ queryKey: ['training-library'] })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ejercicios"
        title="Biblioteca master-detail"
        subtitle="Menos redundancia, mejor semantica y un editor que ya piensa en tracking serio."
        actions={<button type="button" onClick={() => { setSelectedIdOverride(null); form.reset(blankExercise()) }} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/8">Nuevo ejercicio</button>}
      />

      <PanelCard>
        <div className="grid gap-3 md:grid-cols-5">
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar..." className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Categoria</option>
            {exercisesQuery.data?.options.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={filters.equipment} onChange={(event) => setFilters((current) => ({ ...current, equipment: event.target.value }))} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Equipo</option>
            {exercisesQuery.data?.options.equipment.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={filters.modality} onChange={(event) => setFilters((current) => ({ ...current, modality: event.target.value }))} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Modalidad</option>
            {exercisesQuery.data?.options.modalities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={filters.origin} onChange={(event) => setFilters((current) => ({ ...current, origin: event.target.value }))} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Origen</option>
            <option value="base">Base</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PanelCard title="Catalogo" subtitle={`${exercisesQuery.data?.counts.total || 0} ejercicios visibles · ${exercisesQuery.data?.counts.custom || 0} personalizados.`}>
          <div className="space-y-3">
            {exercisesQuery.data?.items.map((exercise) => (
              <button key={exercise.id ?? exercise.name} type="button" onClick={() => setSelectedIdOverride(exercise.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedId === exercise.id ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-white/6 bg-black/20 hover:border-white/10 hover:bg-white/[0.04]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{exercise.name}</p>
                  <p className="text-sm text-zinc-400">{exercise.category}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{exercise.equipment} · {exercise.primaryMuscles.join(', ')}</p>
              </button>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Editor" subtitle="Identidad del ejercicio, tracking y notas tecnicas sin redundancia.">
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values as never))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input {...form.register('name')} placeholder="Nombre" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('canonicalName')} placeholder="Nombre canonico" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('category')} placeholder="Categoria" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('equipment')} placeholder="Equipo" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('modality')} placeholder="Modalidad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('movementPattern')} placeholder="Patron de movimiento" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('difficulty')} placeholder="Dificultad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('loadType')} placeholder="Tipo de carga" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('defaultUnit')} placeholder="Unidad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('variantGroup')} placeholder="Grupo variante" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>

            <textarea {...form.register('primaryMuscles')} rows={2} placeholder="Musculos principales separados por coma" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...form.register('secondaryMuscles')} rows={2} placeholder="Musculos secundarios separados por coma" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...form.register('cues')} rows={3} placeholder="Cues de ejecucion" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...form.register('technicalNotes')} rows={4} placeholder="Notas tecnicas" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <input type="checkbox" {...form.register('isCompound')} />
                Es compuesto
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <input type="checkbox" {...form.register('isCustom')} />
                Es personalizado
              </label>
            </div>

            <button type="submit" className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-400/18">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar ejercicio'}
            </button>
          </form>
        </PanelCard>
      </div>
    </div>
  )
}
