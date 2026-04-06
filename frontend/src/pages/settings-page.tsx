import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Download } from 'lucide-react'

import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import { useUiStore } from '../store/ui-store'

const settingsSchema = z.object({
  coachApiEnabled: z.boolean().default(false),
  coachApiModel: z.string().default('gpt-5.2'),
  coachApiKey: z.string().default(''),
  displayName: z.string().default(''),
  preferredUnit: z.string().default('metric'),
  coachingStyle: z.string().default('directo'),
  weeklyAvailability: z.number().min(1).max(7).default(3),
  preferredFocus: z.string().default(''),
  intensityPreference: z.string().default('moderada'),
  dbPath: z.string().default(''),
  exportPath: z.string().default(''),
})

export function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings,
  })

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema) as never,
    defaultValues: {
      coachApiEnabled: false,
      coachApiModel: 'gpt-5.2',
      coachApiKey: '',
      displayName: '',
      preferredUnit: 'metric',
      coachingStyle: 'directo',
      weeklyAvailability: 3,
      preferredFocus: '',
      intensityPreference: 'moderada',
      dbPath: '',
      exportPath: '',
    },
  })

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset(settingsQuery.data)
    }
  }, [form, settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: api.saveSettings,
    onSuccess: () => {
      setStatusMessage('Configuracion sincronizada con la API local.')
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
      void queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
      void queryClient.invalidateQueries({ queryKey: ['coach-context'] })
    },
  })

  const exportJsonMutation = useMutation({
    mutationFn: api.exportJson,
    onSuccess: (result) => {
      setStatusMessage(`Export JSON listo: ${result.path}`)
    },
  })

  const exportCsvMutation = useMutation({
    mutationFn: api.exportCsv,
    onSuccess: (result) => {
      setStatusMessage(`Export CSV listo: ${(result.paths || []).length} archivos.`)
    },
  })

  if (!settingsQuery.data) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando configuracion...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuracion"
        title="Preferencias reales de desktop y coach"
        subtitle="Unidades, tono del coach, foco preferido, exportaciones y conexion API local sin llenar la pantalla de ruido."
        actions={(
          <button type="button" onClick={() => void navigate({ to: '/welcome' })} className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
            Reabrir onboarding
          </button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard title="Preferencias" subtitle="Todo lo que da coherencia al resto del producto.">
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values as never))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input {...form.register('displayName')} placeholder="Nombre visible" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('preferredFocus')} placeholder="Foco preferido" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('preferredUnit')} placeholder="Unidad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('coachingStyle')} placeholder="Estilo coach" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input type="number" {...form.register('weeklyAvailability', { valueAsNumber: true })} placeholder="Dias semana" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...form.register('intensityPreference')} placeholder="Preferencia intensidad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>

            <div className="grid gap-3 md:grid-cols-[auto_1fr]">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                <input type="checkbox" {...form.register('coachApiEnabled')} />
                Activar OpenAI
              </label>
              <input {...form.register('coachApiModel')} placeholder="Modelo" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>

            <input {...form.register('coachApiKey')} placeholder="OpenAI Secret API key" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />

            <button type="submit" className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
              {saveMutation.isPending ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </form>
        </PanelCard>

        <div className="space-y-6">
          <PanelCard title="Rutas locales" subtitle="Referencia para saber donde esta viviendo la nueva app.">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <p className="text-sm text-zinc-400">Base de datos</p>
                <p className="mt-2 break-all text-sm text-zinc-200">{settingsQuery.data.dbPath}</p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <p className="text-sm text-zinc-400">Exports</p>
                <p className="mt-2 break-all text-sm text-zinc-200">{settingsQuery.data.exportPath}</p>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Backups y portabilidad" subtitle="Acciones rapidas para sacar tus datos sin tocar la base manualmente.">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => exportJsonMutation.mutate()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                <Download size={16} />
                {exportJsonMutation.isPending ? 'Exportando JSON...' : 'Exportar JSON'}
              </button>
              <button
                type="button"
                onClick={() => exportCsvMutation.mutate()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                <Download size={16} />
                {exportCsvMutation.isPending ? 'Exportando CSV...' : 'Exportar CSV'}
              </button>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  )
}
