import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import type { CoachCheckin } from '../lib/types'
import { useUiStore } from '../store/ui-store'

function createCheckin(phase: 'pre' | 'post', focus = ''): CoachCheckin {
  return {
    checkinDate: new Date().toISOString().slice(0, 10),
    phase,
    focus,
    sessionId: null,
    sleepHours: phase === 'pre' ? 7 : null,
    energy: 7,
    soreness: 3,
    fatigue: 3,
    motivation: 7,
    stress: 4,
    painPoints: '',
    trainingIntent: phase === 'pre' ? 'moderada' : '',
    bestExercise: '',
    worstExercise: '',
    desiredAdjustment: '',
    notes: '',
  }
}

const SCALE_HINTS: Record<string, [string, string]> = {
  sleepHours: ['Muy poco', 'Recuperador'],
  energy: ['Vacio', 'Encendido'],
  fatigue: ['Fresco', 'Destruido'],
  motivation: ['Baja', 'Alta'],
  stress: ['Bajo', 'Alto'],
  soreness: ['Leve', 'Alta'],
}

function ScaleField({
  label,
  value,
  min = 1,
  max = 10,
  step = 1,
  helper,
  onChange,
}: {
  label: string
  value: number | null
  min?: number
  max?: number
  step?: number
  helper?: [string, string]
  onChange: (value: number) => void
}) {
  return (
    <div className="rounded-2xl border border-white/7 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-medium text-white">{label}</p>
        <p className="font-['Space_Grotesk'] text-xl font-semibold text-white">{value ?? '-'}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-red-500"
      />
      {helper ? (
        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-500">
          <span>{helper[0]}</span>
          <span>{helper[1]}</span>
        </div>
      ) : null}
    </div>
  )
}

export function CoachPage() {
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [activePhase, setActivePhase] = useState<'pre' | 'post'>('pre')
  const [message, setMessage] = useState('Dame indicaciones concretas para entrenar hoy.')
  const [preCheckinDraft, setPreCheckinDraft] = useState<CoachCheckin | null>(null)
  const [postCheckinDraft, setPostCheckinDraft] = useState<CoachCheckin | null>(null)

  const coachQuery = useQuery({
    queryKey: ['coach-context'],
    queryFn: api.coachContext,
  })

  const respondMutation = useMutation({
    mutationFn: api.coachRespond,
    onSuccess: (payload) => {
      setStatusMessage('Coach actualizado con una respuesta nueva y contexto fresco.')
      void queryClient.setQueryData(['coach-context'], payload.context)
    },
  })

  const checkinMutation = useMutation({
    mutationFn: api.saveCoachCheckin,
    onSuccess: (_, variables) => {
      setStatusMessage(`Check-in ${variables.phase === 'pre' ? 'previo' : 'posterior'} guardado.`)
      if (variables.phase === 'pre') setPreCheckinDraft(null)
      if (variables.phase === 'post') setPostCheckinDraft(null)
      void queryClient.invalidateQueries({ queryKey: ['coach-context'] })
      void queryClient.invalidateQueries({ queryKey: ['training-draft'] })
    },
  })

  const promptGroups = useMemo(() => ([
    'Ajusta mis pesos de hoy segun el readiness.',
    'Dime si conviene bajar volumen o mantenerlo.',
    'Reordena la sesion para priorizar el objetivo del dia.',
    'Que tecnica debo vigilar mas hoy.',
  ]), [])

  if (!coachQuery.data) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando coach fitness...</div>
  }

  const focus = coachQuery.data.focus
  const preCheckin = preCheckinDraft ?? coachQuery.data.preCheckin ?? createCheckin('pre', focus)
  const postCheckin = postCheckinDraft ?? coachQuery.data.postCheckin ?? createCheckin('post', focus)
  const activeCheckin = activePhase === 'pre' ? preCheckin : postCheckin
  const setActiveCheckin = activePhase === 'pre' ? setPreCheckinDraft : setPostCheckinDraft

  function updateCheckinField<K extends keyof CoachCheckin>(field: K, value: CoachCheckin[K]) {
    setActiveCheckin({ ...activeCheckin, focus, phase: activePhase, [field]: value })
  }

  function submitPrompt(nextMessage: string) {
    setMessage(nextMessage)
    respondMutation.mutate(nextMessage)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach"
        title={`Coach tactico para ${focus}`}
        subtitle="Readiness, escalas claras y respuestas accionables. El coach deja de ser un chat ambiguo y pasa a leer tu contexto de verdad."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PanelCard className="p-4" title="Modo" subtitle="Origen de la respuesta">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{coachQuery.data.mode === 'api' ? 'API' : 'Local'}</p>
        </PanelCard>
        <PanelCard className="p-4" title="Energia" subtitle="Ultimo check-in previo">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{coachQuery.data.preCheckin?.energy ?? '-'}</p>
        </PanelCard>
        <PanelCard className="p-4" title="Fatiga" subtitle="Ultimo check-in previo">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{coachQuery.data.preCheckin?.fatigue ?? '-'}</p>
        </PanelCard>
        <PanelCard className="p-4" title="Mensajes" subtitle="Contexto disponible">
          <p className="font-['Space_Grotesk'] text-3xl font-semibold text-white">{coachQuery.data.messages.length}</p>
        </PanelCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <div className="space-y-6">
          <PanelCard title="Contexto de hoy" subtitle={`Modo ${coachQuery.data.mode}. El coach ya esta leyendo el foco activo, las alertas y el plan del dia.`}>
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4 text-sm leading-7 text-zinc-300">{coachQuery.data.planSummary}</div>
              {coachQuery.data.watchToday.map((item) => (
                <div key={item} className="rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm text-red-50/90">{item}</div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title="Check-ins guiados" subtitle="Usa escalas con significado real para que el coach pueda ajustar la sesion con criterio.">
            <div className="mb-4 flex flex-wrap gap-2">
              {([
                { key: 'pre', label: 'Previo', note: 'Como llegas hoy' },
                { key: 'post', label: 'Posterior', note: 'Como cerraste la sesion' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePhase(item.key)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${activePhase === item.key ? 'border-red-500/35 bg-red-500/12 text-red-50' : 'border-white/8 bg-white/[0.04] text-zinc-300 hover:border-white/16 hover:bg-white/[0.08]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={activeCheckin.checkinDate} onChange={(event) => updateCheckinField('checkinDate', event.target.value)} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                {activePhase === 'pre' ? (
                  <ScaleField label="Sueño" value={activeCheckin.sleepHours} min={3} max={10} step={0.5} helper={SCALE_HINTS.sleepHours} onChange={(value) => updateCheckinField('sleepHours', value)} />
                ) : (
                  <input value={activeCheckin.bestExercise} onChange={(event) => updateCheckinField('bestExercise', event.target.value)} placeholder="Ejercicio que mejor se sintio" className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ScaleField label="Energia" value={activeCheckin.energy} helper={SCALE_HINTS.energy} onChange={(value) => updateCheckinField('energy', value)} />
                <ScaleField label="Fatiga" value={activeCheckin.fatigue} helper={SCALE_HINTS.fatigue} onChange={(value) => updateCheckinField('fatigue', value)} />
                <ScaleField label="Motivacion" value={activeCheckin.motivation} helper={SCALE_HINTS.motivation} onChange={(value) => updateCheckinField('motivation', value)} />
                <ScaleField label="Estres" value={activeCheckin.stress} helper={SCALE_HINTS.stress} onChange={(value) => updateCheckinField('stress', value)} />
              </div>

              {activePhase === 'pre' ? (
                <div className="space-y-3">
                  <input value={activeCheckin.trainingIntent} onChange={(event) => updateCheckinField('trainingIntent', event.target.value)} placeholder="Ejemplo: quiero entrenar fuerte, moderado o tecnico" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                  <textarea value={activeCheckin.painPoints} onChange={(event) => updateCheckinField('painPoints', event.target.value)} rows={3} placeholder="Molestias o zonas sensibles. Ejemplo: hombro derecho cargado." className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={activeCheckin.worstExercise} onChange={(event) => updateCheckinField('worstExercise', event.target.value)} placeholder="Ejercicio mas flojo, raro o pesado de mas" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                  <input value={activeCheckin.desiredAdjustment} onChange={(event) => updateCheckinField('desiredAdjustment', event.target.value)} placeholder="Que quieres ajustar para la siguiente sesion" className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
                </div>
              )}

              <textarea value={activeCheckin.notes} onChange={(event) => updateCheckinField('notes', event.target.value)} rows={3} placeholder={activePhase === 'pre' ? 'Ejemplo: dormi bien, pero hoy me siento algo pesado en la sentadilla.' : 'Ejemplo: el jalon se sintio muy bien, pero el press se fue de tecnica al final.'} className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
              <button type="button" onClick={() => checkinMutation.mutate({ ...activeCheckin, focus, phase: activePhase })} className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
                {checkinMutation.isPending ? 'Guardando...' : `Guardar check-in ${activePhase === 'pre' ? 'previo' : 'posterior'}`}
              </button>
            </div>
          </PanelCard>

          <PanelCard title="Recomendaciones activas" subtitle="Lo que el sistema ya detecto para este foco.">
            <div className="space-y-3">
              {coachQuery.data.recommendations.length ? coachQuery.data.recommendations.map((item) => (
                <div key={`${item.title}-${item.generatedOn}`} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-red-200">{item.actionType}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{item.summary}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-10 text-center text-sm text-zinc-500">
                  Todavia no hay recomendaciones guardadas para este foco.
                </div>
              )}
            </div>
          </PanelCard>
        </div>

        <PanelCard title="Conversacion" subtitle="Pidele orden de ejercicios, pesos tentativos, volumen o ajustes concretos para hoy.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {promptGroups.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitPrompt(prompt)}
                  className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="max-h-[560px] space-y-3 overflow-y-auto pr-2">
              {coachQuery.data.messages.map((item) => (
                <div key={`${item.createdAt}-${item.id}`} className={`rounded-2xl border px-4 py-4 ${item.role === 'assistant' ? 'border-red-500/20 bg-red-500/10 text-zinc-100' : 'border-white/6 bg-black/20 text-zinc-300'}`}>
                  <p className="mb-2 text-xs uppercase tracking-[0.22em] text-zinc-500">{item.role}</p>
                  <p className="whitespace-pre-wrap text-sm leading-7">{item.content}</p>
                </div>
              ))}
            </div>

            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <button type="button" onClick={() => respondMutation.mutate(message)} className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
              {respondMutation.isPending ? 'Pensando...' : 'Preguntar al coach'}
            </button>
          </div>
        </PanelCard>
      </div>
    </div>
  )
}
