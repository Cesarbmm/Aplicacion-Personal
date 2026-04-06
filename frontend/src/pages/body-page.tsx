import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { MiniChart } from '../components/mini-chart'
import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import { useUiStore } from '../store/ui-store'

const profileSchema = z.object({
  displayName: z.string().default(''),
  primaryGoal: z.string().default(''),
  experienceLevel: z.string().default('intermedio'),
  weeklyAvailability: z.number().min(1).max(7).default(3),
  equipmentAccess: z.string().default(''),
  limitations: z.string().default(''),
  laggingMuscles: z.string().default(''),
  preferredFocus: z.string().default(''),
  preferredUnit: z.string().default('metric'),
  coachingStyle: z.string().default('directo'),
  intensityPreference: z.string().default('moderada'),
  sex: z.string().default(''),
  age: z.number().nullable().default(null),
  heightCm: z.number().nullable().default(null),
})

const checkinSchema = z.object({
  checkinDate: z.string().min(4),
  weightKg: z.number().nullable().default(null),
  bodyFatPct: z.number().nullable().default(null),
  waistCm: z.number().nullable().default(null),
  chestCm: z.number().nullable().default(null),
  hipCm: z.number().nullable().default(null),
  armCm: z.number().nullable().default(null),
  thighCm: z.number().nullable().default(null),
  heightCm: z.number().nullable().default(null),
  age: z.number().nullable().default(null),
  sex: z.string().default(''),
  activityLevel: z.string().default(''),
  goal: z.string().default(''),
  caloriesTarget: z.number().nullable().default(null),
  basalMetabolism: z.number().nullable().default(null),
  habitScore: z.number().nullable().default(null),
  notes: z.string().default(''),
})

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function toNumber(value: string) {
  if (!value) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function BodyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [activeStep, setActiveStep] = useState<'perfil' | 'objetivo' | 'checkin' | 'seguimiento'>('perfil')
  const bodyQuery = useQuery({
    queryKey: ['body'],
    queryFn: api.bodyCheckins,
  })

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      displayName: '',
      primaryGoal: '',
      experienceLevel: 'intermedio',
      weeklyAvailability: 3,
      equipmentAccess: '',
      limitations: '',
      laggingMuscles: '',
      preferredFocus: '',
      preferredUnit: 'metric',
      coachingStyle: 'directo',
      intensityPreference: 'moderada',
      sex: '',
      age: null,
      heightCm: null,
    },
  })

  const checkinForm = useForm<z.infer<typeof checkinSchema>>({
    resolver: zodResolver(checkinSchema) as never,
    defaultValues: {
      checkinDate: new Date().toISOString().slice(0, 10),
      weightKg: null,
      bodyFatPct: null,
      waistCm: null,
      chestCm: null,
      hipCm: null,
      armCm: null,
      thighCm: null,
      heightCm: null,
      age: null,
      sex: '',
      activityLevel: '',
      goal: '',
      caloriesTarget: null,
      basalMetabolism: null,
      habitScore: null,
      notes: '',
    },
  })
  const checkinValues = useWatch({ control: checkinForm.control })

  useEffect(() => {
    if (!bodyQuery.data) return
    profileForm.reset({
      ...bodyQuery.data.profile,
      equipmentAccess: bodyQuery.data.profile.equipmentAccess.join(', '),
      laggingMuscles: bodyQuery.data.profile.laggingMuscles.join(', '),
    })
    if (bodyQuery.data.latestCheckin) {
      checkinForm.reset(bodyQuery.data.latestCheckin)
    }
  }, [bodyQuery.data, checkinForm, profileForm])

  const saveProfileMutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => api.saveBodyProfile({
      ...values,
      equipmentAccess: parseList(values.equipmentAccess),
      laggingMuscles: parseList(values.laggingMuscles),
    }),
    onSuccess: () => {
      setStatusMessage('Perfil fitness actualizado.')
      void queryClient.invalidateQueries({ queryKey: ['body'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const saveCheckinMutation = useMutation({
    mutationFn: api.saveBodyCheckin,
    onSuccess: () => {
      setStatusMessage('Check-in corporal guardado.')
      void queryClient.invalidateQueries({ queryKey: ['body'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (!bodyQuery.data) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando cuerpo y perfil fitness...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cuerpo"
        title="Perfil y seguimiento corporal"
        subtitle="El onboarding ya crea la base del atleta. Aqui revisas, ajustas y das seguimiento al perfil y al progreso corporal."
        actions={(
          <button type="button" onClick={() => void navigate({ to: '/welcome' })} className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
            Editar perfil base
          </button>
        )}
      />

      <PanelCard title="Ruta guiada" subtitle="Sigue este orden para que plan, coach y progreso tengan contexto desde el primer dia.">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { key: 'perfil', label: '1. Perfil base', note: 'Nombre, nivel y disponibilidad.' },
            { key: 'objetivo', label: '2. Objetivo', note: 'Meta fisica, foco y limitaciones.' },
            { key: 'checkin', label: '3. Check-in', note: 'Peso, medidas y notas del momento.' },
            { key: 'seguimiento', label: '4. Seguimiento', note: 'Tendencia y revision continua.' },
          ].map((step) => (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveStep(step.key as typeof activeStep)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${activeStep === step.key ? 'border-red-500/35 bg-red-500/12' : 'border-white/6 bg-black/20 hover:border-white/10 hover:bg-white/[0.04]'}`}
            >
              <p className="font-medium text-white">{step.label}</p>
              <p className="mt-2 text-sm text-zinc-400">{step.note}</p>
            </button>
          ))}
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PanelCard title="Seguimiento" subtitle="Lo importante para revisar tu estado sin abrir mil pantallas.">
          <div className="space-y-3">
            {bodyQuery.data.insights.map((item) => (
              <div key={item} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-zinc-300">
                {item}
              </div>
            ))}
            <MiniChart points={bodyQuery.data.weightSeries} />
          </div>
        </PanelCard>

        <PanelCard title="Ultimo check-in" subtitle="Resumen rapido antes de abrir el coach o el plan.">
          {bodyQuery.data.latestCheckin ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <p className="text-sm text-zinc-400">Peso</p>
                <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{bodyQuery.data.latestCheckin.weightKg ?? '-'} kg</p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <p className="text-sm text-zinc-400">Grasa corporal</p>
                <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{bodyQuery.data.latestCheckin.bodyFatPct ?? '-'}%</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-16 text-center text-zinc-500">Aun no hay check-ins corporales.</div>
          )}
        </PanelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="Perfil fitness" subtitle={activeStep === 'perfil' ? 'Empieza aqui con la base del atleta.' : activeStep === 'objetivo' ? 'Aqui aterrizas objetivo, foco y contexto.' : 'Datos que alimentan plan, coach y recomendaciones.'}>
          <form onSubmit={profileForm.handleSubmit((values) => saveProfileMutation.mutate(values as never))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input {...profileForm.register('displayName')} placeholder="Nombre visible" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...profileForm.register('primaryGoal')} placeholder="Objetivo principal" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...profileForm.register('experienceLevel')} placeholder="Nivel" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input type="number" {...profileForm.register('weeklyAvailability', { valueAsNumber: true })} placeholder="Dias por semana" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...profileForm.register('preferredFocus')} placeholder="Foco preferido" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input {...profileForm.register('preferredUnit')} placeholder="Unidad" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>
            <textarea {...profileForm.register('equipmentAccess')} rows={2} placeholder="Equipo disponible, separado por comas" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...profileForm.register('laggingMuscles')} rows={2} placeholder="Musculos rezagados, separado por comas" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <textarea {...profileForm.register('limitations')} rows={3} placeholder="Lesiones o limitaciones" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
                {saveProfileMutation.isPending ? 'Guardando...' : 'Guardar perfil'}
              </button>
              <button type="button" onClick={() => setActiveStep('checkin')} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10">
                Seguir con check-in
              </button>
            </div>
          </form>
        </PanelCard>

        <PanelCard title="Nuevo check-in" subtitle={activeStep === 'checkin' ? 'Ahora registra el estado corporal del momento.' : 'Registro rapido de peso, medidas y notas del momento.'}>
          <form onSubmit={checkinForm.handleSubmit((values) => saveCheckinMutation.mutate(values as never))} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input type="date" {...checkinForm.register('checkinDate')} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input value={checkinValues.weightKg ?? ''} onChange={(event) => checkinForm.setValue('weightKg', toNumber(event.target.value))} placeholder="Peso kg" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input value={checkinValues.bodyFatPct ?? ''} onChange={(event) => checkinForm.setValue('bodyFatPct', toNumber(event.target.value))} placeholder="% grasa" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input value={checkinValues.waistCm ?? ''} onChange={(event) => checkinForm.setValue('waistCm', toNumber(event.target.value))} placeholder="Cintura cm" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input value={checkinValues.armCm ?? ''} onChange={(event) => checkinForm.setValue('armCm', toNumber(event.target.value))} placeholder="Brazo cm" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <input value={checkinValues.thighCm ?? ''} onChange={(event) => checkinForm.setValue('thighCm', toNumber(event.target.value))} placeholder="Pierna cm" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            </div>
            <textarea {...checkinForm.register('notes')} rows={4} placeholder="Notas del estado corporal o habitos recientes" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
                {saveCheckinMutation.isPending ? 'Guardando...' : 'Guardar check-in'}
              </button>
              <button type="button" onClick={() => setActiveStep('seguimiento')} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10">
                Ir a seguimiento
              </button>
            </div>
          </form>
        </PanelCard>
      </div>
    </div>
  )
}
