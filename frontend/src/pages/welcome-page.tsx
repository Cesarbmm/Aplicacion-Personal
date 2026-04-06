import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Check, ChevronLeft, Dumbbell, Flame, Plus, Sparkles, Target } from 'lucide-react'

import { api } from '../lib/api'
import type { CustomFocusInput, FitnessProfile, TrainingDraftPayload } from '../lib/types'
import { cn } from '../lib/utils'
import { useUiStore } from '../store/ui-store'

const STEP_ORDER = ['welcome', 'profile', 'context', 'style', 'templates', 'finish'] as const

const DEFAULT_PROFILE: FitnessProfile = {
  displayName: '',
  primaryGoal: '',
  experienceLevel: 'intermedio',
  weeklyAvailability: 4,
  equipmentAccess: [],
  limitations: '',
  laggingMuscles: [],
  preferredFocus: '',
  preferredUnit: 'metric',
  coachingStyle: 'directo',
  intensityPreference: 'moderada',
  sex: '',
  age: null,
  heightCm: null,
}

function parseList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function stepIndexFromKey(step: string) {
  const index = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number])
  return index >= 0 ? index : 0
}

function FocusChip({
  active,
  label,
  subtitle,
  onClick,
}: {
  active: boolean
  label: string
  subtitle?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[22px] border px-4 py-4 text-left transition',
        active
          ? 'border-red-500/40 bg-red-500/12 shadow-[0_0_0_1px_rgba(239,68,68,0.18)]'
          : 'border-white/7 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.06]',
      )}
    >
      <p className="font-['Space_Grotesk'] text-base font-semibold text-white">{label}</p>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
    </button>
  )
}

export function WelcomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [stepOverride, setStepOverride] = useState<number | null>(null)
  const [profileDraft, setProfileDraft] = useState<FitnessProfile | null>(null)
  const [equipmentTextDraft, setEquipmentTextDraft] = useState<string | null>(null)
  const [laggingTextDraft, setLaggingTextDraft] = useState<string | null>(null)
  const [selectedFocusesDraft, setSelectedFocusesDraft] = useState<string[] | null>(null)
  const [customFocuses, setCustomFocuses] = useState<CustomFocusInput[]>([])
  const [customFocusName, setCustomFocusName] = useState('')
  const [customFocusDescription, setCustomFocusDescription] = useState('')
  const [templates, setTemplates] = useState<NonNullable<TrainingDraftPayload['template']>[]>([])

  const onboardingQuery = useQuery({
    queryKey: ['onboarding-state'],
    queryFn: api.onboardingState,
  })

  const baseProfile = onboardingQuery.data?.profile || DEFAULT_PROFILE
  const profile = profileDraft ?? baseProfile
  const equipmentText = equipmentTextDraft ?? baseProfile.equipmentAccess.join(', ')
  const laggingText = laggingTextDraft ?? baseProfile.laggingMuscles.join(', ')
  const selectedFocuses = useMemo(
    () => selectedFocusesDraft ?? onboardingQuery.data?.selectedFocuses ?? [],
    [selectedFocusesDraft, onboardingQuery.data?.selectedFocuses],
  )
  const presetFocuses = onboardingQuery.data?.focusCatalog || []
  const step = stepOverride ?? Math.max(0, stepIndexFromKey(onboardingQuery.data?.currentStep || 'welcome'))
  const currentStepKey = STEP_ORDER[step]
  const selectedCount = selectedFocuses.length
  const profileReady = Boolean(
    profile.displayName.trim() &&
    profile.primaryGoal.trim() &&
    profile.weeklyAvailability &&
    profile.preferredUnit &&
    profile.age &&
    profile.heightCm,
  )
  const canGenerate = profileReady && selectedFocuses.length > 0
  const templateCount = templates.length

  const saveProfileMutation = useMutation({
    mutationFn: api.saveOnboardingProfile,
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const nextProfile = {
        ...profile,
        equipmentAccess: parseList(equipmentText),
        laggingMuscles: parseList(laggingText),
      }
      await api.saveOnboardingProfile(nextProfile)
      await api.saveOnboardingFocuses({ selectedFocuses, customFocuses })
      return api.generateOnboardingTemplates({
        profile: nextProfile,
        selectedFocuses,
        customFocuses,
        limit: 4,
      })
    },
    onSuccess: (payload) => {
      setTemplates(payload.templates)
      setStatusMessage('Plantillas iniciales generadas. Ahora puedes pulirlas antes de entrar.')
      setStepOverride(4)
      void queryClient.invalidateQueries({ queryKey: ['onboarding-state'] })
      void queryClient.invalidateQueries({ queryKey: ['training-templates'] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: async () => api.completeOnboarding({
      profile: {
        ...profile,
        equipmentAccess: parseList(equipmentText),
        laggingMuscles: parseList(laggingText),
      },
      selectedFocuses,
      customFocuses,
      templates,
    }),
    onSuccess: async () => {
      setStatusMessage('Onboarding listo. Ya tienes perfil, focos y plantillas base para empezar fuerte.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
        queryClient.invalidateQueries({ queryKey: ['onboarding-state'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['training-templates'] }),
      ])
      void navigate({ to: '/' })
    },
  })

  const previewFacts = useMemo(() => ([
    { label: 'Nombre', value: profile.displayName || 'Pendiente' },
    { label: 'Objetivo', value: profile.primaryGoal || 'Pendiente' },
    { label: 'Dias', value: `${profile.weeklyAvailability || 0} / semana` },
    { label: 'Focos', value: selectedCount ? selectedFocuses.join(', ') : 'Pendiente' },
  ]), [profile.displayName, profile.primaryGoal, profile.weeklyAvailability, selectedCount, selectedFocuses])

  function updateProfile<K extends keyof FitnessProfile>(field: K, value: FitnessProfile[K]) {
    setProfileDraft((current) => ({ ...(current ?? profile), [field]: value }))
  }

  function toggleFocus(name: string) {
    setSelectedFocusesDraft((current) => {
      const source = current ?? selectedFocuses
      return source.includes(name)
        ? source.filter((item) => item !== name)
        : [...source, name]
    })
  }

  function addCustomFocus() {
    const name = customFocusName.trim()
    if (!name) return
    if (!customFocuses.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      const next = { name, description: customFocusDescription.trim() }
      setCustomFocuses((current) => [...current, next])
      setSelectedFocusesDraft((current) => {
        const source = current ?? selectedFocuses
        return source.includes(name) ? source : [...source, name]
      })
    }
    setCustomFocusName('')
    setCustomFocusDescription('')
  }

  function updateTemplateField(index: number, field: 'name' | 'description' | 'goal', value: string) {
    setTemplates((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)))
  }

  function updateTemplateExercise(
    templateIndex: number,
    exerciseIndex: number,
    field: 'exerciseName' | 'defaultSets' | 'defaultReps' | 'defaultRest' | 'notes',
    value: string | number,
  ) {
    setTemplates((current) => current.map((template, currentTemplateIndex) => {
      if (currentTemplateIndex !== templateIndex) return template
      return {
        ...template,
        exercises: template.exercises.map((exercise, currentExerciseIndex) => {
          if (currentExerciseIndex !== exerciseIndex) return exercise
          return { ...exercise, [field]: value }
        }),
      }
    }))
  }

  function nextStep() {
    if (currentStepKey === 'profile' || currentStepKey === 'context') {
      void saveProfileMutation.mutateAsync({
        ...profile,
        equipmentAccess: parseList(equipmentText),
        laggingMuscles: parseList(laggingText),
      }).then(() => {
        setStepOverride((current) => Math.min((current ?? step) + 1, STEP_ORDER.length - 1))
      })
      return
    }
    setStepOverride((current) => Math.min((current ?? step) + 1, STEP_ORDER.length - 1))
  }

  if (!onboardingQuery.data) {
    return <div className="flex min-h-screen items-center justify-center bg-[#060607] text-zinc-400">Preparando onboarding...</div>
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(190,24,93,0.18),_transparent_30%),radial-gradient(circle_at_right,_rgba(220,38,38,0.16),_transparent_25%),linear-gradient(180deg,_#0a0a0b_0%,_#050506_100%)] text-zinc-100">
      <div className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[36px] border border-white/7 bg-white/[0.035] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-red-300/75">Bapp Setup</p>
                <h1 className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                  Tu base premium para entrenar mejor.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 md:text-[15px]">
                  Antes de entrar al producto vamos a perfilar al atleta, elegir focos reales y dejar tus plantillas iniciales
                  editables. Menos ruido, mas claridad desde el dia uno.
                </p>
              </div>
              <div className="hidden rounded-[28px] border border-red-500/20 bg-red-500/10 p-4 text-red-100 lg:block">
                <Dumbbell size={30} />
              </div>
            </div>

            <div className="mb-8 grid gap-3 md:grid-cols-6">
              {STEP_ORDER.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStepOverride(index)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-left transition',
                    step === index
                      ? 'border-red-500/40 bg-red-500/12'
                      : 'border-white/7 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]',
                  )}
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Paso {index + 1}</p>
                  <p className="mt-2 font-medium text-white">
                    {{
                      welcome: 'Bienvenida',
                      profile: 'Perfil',
                      context: 'Contexto',
                      style: 'Focos',
                      templates: 'Plantillas',
                      finish: 'Entrada',
                    }[item]}
                  </p>
                </button>
              ))}
            </div>

            {currentStepKey === 'welcome' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { icon: <Target size={18} />, title: 'Perfil util', text: 'No preguntas por preguntar. Solo lo que afecta plan, coach y progreso.' },
                    { icon: <Flame size={18} />, title: 'Plantillas reales', text: 'Tus focos se convierten en rutinas base editables antes de entrar.' },
                    { icon: <Sparkles size={18} />, title: 'Coach con contexto', text: 'La IA ya no te responde en vacio; lee tu base y tu rutina.' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-white/7 bg-black/25 p-5">
                      <div className="mb-4 inline-flex rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-100">{item.icon}</div>
                      <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">{item.title}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setStepOverride(1)} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-5 py-3 text-sm text-red-50 transition hover:bg-red-500/18">
                  Empezar configuracion
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : null}

            {currentStepKey === 'profile' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <input value={profile.displayName} onChange={(event) => updateProfile('displayName', event.target.value)} placeholder="Como quieres que te llame la app" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                <input value={profile.age ?? ''} onChange={(event) => updateProfile('age', event.target.value ? Number(event.target.value) : null)} placeholder="Edad" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                <select value={profile.sex} onChange={(event) => updateProfile('sex', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none">
                  <option value="">Sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                <input value={profile.heightCm ?? ''} onChange={(event) => updateProfile('heightCm', event.target.value ? Number(event.target.value) : null)} placeholder="Altura en cm" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                <select value={profile.preferredUnit} onChange={(event) => updateProfile('preferredUnit', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none">
                  <option value="metric">Sistema metrico</option>
                  <option value="imperial">Sistema imperial</option>
                </select>
                <select value={profile.experienceLevel} onChange={(event) => updateProfile('experienceLevel', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none">
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
            ) : null}

            {currentStepKey === 'context' ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={profile.primaryGoal} onChange={(event) => updateProfile('primaryGoal', event.target.value)} placeholder="Objetivo principal: hipertrofia, fuerza, recomposicion..." className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                  <input value={profile.weeklyAvailability} onChange={(event) => updateProfile('weeklyAvailability', Number(event.target.value) || 0)} type="number" min={1} max={7} placeholder="Dias por semana" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                </div>
                <textarea value={equipmentText} onChange={(event) => setEquipmentTextDraft(event.target.value)} rows={2} placeholder="Equipo disponible, separado por comas" className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                <textarea value={profile.limitations} onChange={(event) => updateProfile('limitations', event.target.value)} rows={3} placeholder="Lesiones, molestias o limitaciones relevantes" className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                <textarea value={laggingText} onChange={(event) => setLaggingTextDraft(event.target.value)} rows={2} placeholder="Musculos rezagados o prioritarios, separados por comas" className="w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
              </div>
            ) : null}

            {currentStepKey === 'style' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <select value={profile.intensityPreference} onChange={(event) => updateProfile('intensityPreference', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none">
                    <option value="moderada">Intensidad moderada</option>
                    <option value="alta">Alta intensidad</option>
                    <option value="tecnica">Tecnica y control</option>
                  </select>
                  <select value={profile.coachingStyle} onChange={(event) => updateProfile('coachingStyle', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none">
                    <option value="directo">Coach directo</option>
                    <option value="explicativo">Coach explicativo</option>
                    <option value="conciso">Coach conciso</option>
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {presetFocuses.map((focus) => (
                    <FocusChip key={focus.slug} active={selectedFocuses.includes(focus.name)} label={focus.name} subtitle={focus.description} onClick={() => toggleFocus(focus.name)} />
                  ))}
                  {customFocuses.map((focus) => (
                    <FocusChip key={focus.name} active={selectedFocuses.includes(focus.name)} label={focus.name} subtitle={focus.description || 'Foco personalizado'} onClick={() => toggleFocus(focus.name)} />
                  ))}
                </div>

                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/25 p-4">
                  <p className="font-medium text-white">Crear foco propio</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.2fr_auto]">
                    <input value={customFocusName} onChange={(event) => setCustomFocusName(event.target.value)} placeholder="Ejemplo: Torso estetico" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                    <input value={customFocusDescription} onChange={(event) => setCustomFocusDescription(event.target.value)} placeholder="Describe el enfoque o la combinacion" className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                    <button type="button" onClick={addCustomFocus} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10">
                      <Plus size={16} />
                      Anadir
                    </button>
                  </div>
                </div>

                <button type="button" disabled={!canGenerate || generateMutation.isPending} onClick={() => generateMutation.mutate()} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-5 py-3 text-sm text-red-50 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-45">
                  {generateMutation.isPending ? 'Generando plantillas...' : 'Generar plantillas iniciales'}
                  <Sparkles size={16} />
                </button>
              </div>
            ) : null}

            {currentStepKey === 'templates' ? (
              <div className="space-y-5">
                {!templateCount ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/25 px-4 py-14 text-center text-sm text-zinc-500">
                    Primero elige focos y genera plantillas. Aqui apareceran para editarlas antes de entrar.
                  </div>
                ) : (
                  templates.map((template, templateIndex) => (
                    <div key={`${template.focus}-${templateIndex}`} className="rounded-[26px] border border-white/8 bg-black/25 p-5">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={template.name} onChange={(event) => updateTemplateField(templateIndex, 'name', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                        <input value={template.goal} onChange={(event) => updateTemplateField(templateIndex, 'goal', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                      </div>
                      <textarea value={template.description} onChange={(event) => updateTemplateField(templateIndex, 'description', event.target.value)} rows={2} className="mt-3 w-full rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                      <div className="mt-4 space-y-3">
                        {template.exercises.map((exercise, exerciseIndex) => (
                          <div key={`${exercise.exerciseName}-${exerciseIndex}`} className="grid gap-3 rounded-2xl border border-white/7 bg-white/[0.03] p-4 md:grid-cols-[1.4fr_120px_120px_120px]">
                            <input value={exercise.exerciseName} onChange={(event) => updateTemplateExercise(templateIndex, exerciseIndex, 'exerciseName', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                            <input value={exercise.defaultSets} type="number" min={1} max={8} onChange={(event) => updateTemplateExercise(templateIndex, exerciseIndex, 'defaultSets', Number(event.target.value) || 0)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                            <input value={exercise.defaultReps} onChange={(event) => updateTemplateExercise(templateIndex, exerciseIndex, 'defaultReps', event.target.value)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                            <input value={exercise.defaultRest ?? ''} type="number" min={30} step={15} onChange={(event) => updateTemplateExercise(templateIndex, exerciseIndex, 'defaultRest', Number(event.target.value) || 0)} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-3 text-sm text-white outline-none" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {currentStepKey === 'finish' ? (
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  {previewFacts.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-black/25 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                      <p className="mt-2 font-medium text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 px-5 py-5 text-sm leading-7 text-red-50/90">
                  Entraras al producto con una base clara: perfil guardado, focos elegidos y {templateCount} plantilla{templateCount === 1 ? '' : 's'} lista{templateCount === 1 ? '' : 's'} para editar sobre la marcha.
                </div>
                <button type="button" disabled={!profileReady || !templateCount || completeMutation.isPending} onClick={() => completeMutation.mutate()} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-5 py-3 text-sm text-red-50 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-45">
                  {completeMutation.isPending ? 'Entrando al producto...' : 'Entrar a Bapp'}
                  <Check size={16} />
                </button>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-6">
              <button type="button" onClick={() => setStepOverride((current) => Math.max((current ?? step) - 1, 0))} className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-white/14 hover:bg-white/[0.06]">
                <ChevronLeft size={16} />
                Atras
              </button>
              {currentStepKey !== 'welcome' && currentStepKey !== 'style' && currentStepKey !== 'finish' ? (
                <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
                  Continuar
                  <ArrowRight size={16} />
                </button>
              ) : null}
              {currentStepKey === 'templates' ? (
                <button type="button" disabled={!templateCount} onClick={() => setStepOverride(5)} className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18 disabled:cursor-not-allowed disabled:opacity-45">
                  Revisar y entrar
                  <ArrowRight size={16} />
                </button>
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/7 bg-white/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Progreso del setup</p>
              <p className="mt-3 font-['Space_Grotesk'] text-4xl font-semibold text-white">{Math.round(((step + 1) / STEP_ORDER.length) * 100)}%</p>
              <div className="mt-4 h-2 rounded-full bg-white/7">
                <div className="h-2 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-rose-300" style={{ width: `${((step + 1) / STEP_ORDER.length) * 100}%` }} />
              </div>
              <div className="mt-5 space-y-3">
                {previewFacts.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/7 bg-black/25 px-4 py-3">
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/7 bg-white/[0.035] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Que desbloquea esto</p>
              <div className="mt-4 space-y-3">
                {[
                  'Dashboard con foco del dia y accesos utiles.',
                  'Entrenar con plantillas ya preparadas y editables.',
                  'Coach con mas contexto desde tu objetivo y disponibilidad.',
                  'Plan y cuerpo conectados a una base real, no vacia.',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/7 bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
