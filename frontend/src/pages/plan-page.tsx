import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import { useUiStore } from '../store/ui-store'

const goalSchema = z.object({
  id: z.number().nullable().default(null),
  name: z.string().min(2),
  targetMetric: z.string().min(2),
  startValue: z.number().nullable().default(null),
  targetValue: z.number().nullable().default(null),
  unit: z.string().default('kg'),
  dueDate: z.string().default(''),
  priority: z.string().default('media'),
  status: z.string().default('activo'),
  notes: z.string().default(''),
})

const blockSchema = z.object({
  id: z.number().nullable().default(null),
  name: z.string().min(2),
  focus: z.string().default(''),
  phaseType: z.string().default(''),
  objective: z.string().default(''),
  weeklyFrequency: z.number().nullable().default(null),
  defaultTemplateId: z.number().nullable().default(null),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  status: z.string().default('activo'),
  notes: z.string().default(''),
  progressionNotes: z.string().default(''),
})

function toNumber(value: string) {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function PlanPage() {
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const planQuery = useQuery({
    queryKey: ['plan'],
    queryFn: api.plan,
  })

  const goalForm = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema) as never,
    defaultValues: {
      id: null,
      name: '',
      targetMetric: '',
      startValue: null,
      targetValue: null,
      unit: 'kg',
      dueDate: '',
      priority: 'media',
      status: 'activo',
      notes: '',
    },
  })

  const blockForm = useForm<z.infer<typeof blockSchema>>({
    resolver: zodResolver(blockSchema) as never,
    defaultValues: {
      id: null,
      name: '',
      focus: '',
      phaseType: '',
      objective: '',
      weeklyFrequency: null,
      defaultTemplateId: null,
      startDate: '',
      endDate: '',
      status: 'activo',
      notes: '',
      progressionNotes: '',
    },
  })

  useEffect(() => {
    if (!planQuery.data) return
    blockForm.setValue('focus', planQuery.data.activeFocus)
  }, [blockForm, planQuery.data])

  const saveGoalMutation = useMutation({
    mutationFn: api.savePlanGoal,
    onSuccess: () => {
      setStatusMessage('Meta guardada en el plan.')
      goalForm.reset()
      void queryClient.invalidateQueries({ queryKey: ['plan'] })
    },
  })

  const saveBlockMutation = useMutation({
    mutationFn: api.savePlanBlock,
    onSuccess: () => {
      setStatusMessage('Bloque guardado en el plan.')
      blockForm.reset()
      void queryClient.invalidateQueries({ queryKey: ['plan'] })
    },
  })

  if (!planQuery.data) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando plan operativo...</div>
  }

  const data = planQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan"
        title={`Ruta operativa para ${data.activeFocus}`}
        subtitle="Ahora puedes leer el plan y tambien editar metas y bloques sin salir de la nueva shell."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PanelCard title="Resumen del dia" subtitle={data.summary}>
          <div className="space-y-3">
            {data.reasons.map((reason) => (
              <div key={reason} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {reason}
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Bloque activo" subtitle="Lectura rapida de la fase y la progresion.">
          {data.activeBlock ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <p className="font-['Space_Grotesk'] text-xl font-semibold text-white">{data.activeBlock.name}</p>
                <p className="mt-2 text-sm text-zinc-400">{data.activeBlock.phaseType || 'Sin fase definida'} · {data.activeBlock.objective || 'Sin objetivo detallado'}</p>
                {data.activeBlock.progressionNotes ? <p className="mt-4 text-sm leading-7 text-zinc-300">{data.activeBlock.progressionNotes}</p> : null}
              </div>
              {data.watchToday.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-300/15 bg-amber-300/8 px-4 py-3 text-sm text-amber-100">{item}</div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-16 text-center text-zinc-500">Todavia no hay un bloque activo para este foco.</div>
          )}
        </PanelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="Metas" subtitle="Objetivos priorizados, visibles y editables.">
          <div className="space-y-3">
            {data.goals.length ? data.goals.map((goal) => (
              <div key={goal.id ?? goal.name} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{goal.name}</p>
                  <p className="text-sm text-zinc-400">{goal.priority}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{goal.targetMetric} · {goal.startValue ?? '-'} → {goal.targetValue ?? '-'} {goal.unit}</p>
                {goal.notes ? <p className="mt-3 text-sm leading-6 text-zinc-300">{goal.notes}</p> : null}
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-16 text-center text-zinc-500">Todavia no has registrado metas.</div>}
          </div>

          <form onSubmit={goalForm.handleSubmit((values) => saveGoalMutation.mutate(values as never))} className="mt-6 space-y-3 rounded-2xl border border-white/6 bg-black/20 p-4">
            <p className="font-medium text-white">Nueva meta</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input {...goalForm.register('name')} placeholder="Nombre" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...goalForm.register('targetMetric')} placeholder="Metrica" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input defaultValue="" onChange={(event) => goalForm.setValue('startValue', toNumber(event.target.value))} placeholder="Valor inicial" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input defaultValue="" onChange={(event) => goalForm.setValue('targetValue', toNumber(event.target.value))} placeholder="Valor objetivo" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...goalForm.register('unit')} placeholder="Unidad" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input type="date" {...goalForm.register('dueDate')} className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
            </div>
            <textarea {...goalForm.register('notes')} rows={3} placeholder="Notas de la meta" className="w-full rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
            <button type="submit" className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-400/18">
              {saveGoalMutation.isPending ? 'Guardando...' : 'Guardar meta'}
            </button>
          </form>
        </PanelCard>

        <PanelCard title="Bloques y ajustes" subtitle="Configura fases activas sin salir del panel operativo.">
          <div className="space-y-3">
            {data.recommendations.length ? data.recommendations.map((item) => (
              <div key={`${item.title}-${item.generatedOn}`} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">{item.actionType}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.summary}</p>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-16 text-center text-zinc-500">Aun no hay recomendaciones recientes.</div>}
          </div>

          <form onSubmit={blockForm.handleSubmit((values) => saveBlockMutation.mutate(values as never))} className="mt-6 space-y-3 rounded-2xl border border-white/6 bg-black/20 p-4">
            <p className="font-medium text-white">Nuevo bloque</p>
            <div className="grid gap-3 md:grid-cols-2">
              <input {...blockForm.register('name')} placeholder="Nombre bloque" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...blockForm.register('focus')} placeholder="Foco" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...blockForm.register('phaseType')} placeholder="Fase" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...blockForm.register('objective')} placeholder="Objetivo" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input defaultValue="" onChange={(event) => blockForm.setValue('weeklyFrequency', toNumber(event.target.value))} placeholder="Frecuencia semanal" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input type="date" {...blockForm.register('startDate')} className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input type="date" {...blockForm.register('endDate')} className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
              <input {...blockForm.register('status')} placeholder="Estado" className="rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
            </div>
            <textarea {...blockForm.register('progressionNotes')} rows={3} placeholder="Notas de progresion" className="w-full rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...blockForm.register('notes')} rows={3} placeholder="Notas del bloque" className="w-full rounded-2xl border border-white/8 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none" />
            <button type="submit" className="rounded-full border border-emerald-400/25 bg-emerald-400/12 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-400/18">
              {saveBlockMutation.isPending ? 'Guardando...' : 'Guardar bloque'}
            </button>
          </form>
        </PanelCard>
      </div>
    </div>
  )
}
