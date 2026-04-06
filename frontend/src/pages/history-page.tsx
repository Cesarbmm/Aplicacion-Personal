import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import { formatDate, formatNumber } from '../lib/utils'
import { useUiStore } from '../store/ui-store'


export function HistoryPage() {
  const queryClient = useQueryClient()
  const setStatusMessage = useUiStore((state) => state.setStatusMessage)
  const [focus, setFocus] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIdOverride, setSelectedIdOverride] = useState<number | null>(null)
  const historyQuery = useQuery({
    queryKey: ['history', focus, status, search],
    queryFn: () => api.history({ focus, status, search }),
  })
  const selectedId = selectedIdOverride ?? historyQuery.data?.items[0]?.id ?? null

  const detailQuery = useQuery({
    queryKey: ['history-detail', selectedId],
    queryFn: () => api.historyDetail(selectedId as number),
    enabled: !!selectedId,
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteHistorySession,
    onSuccess: (_, deletedId) => {
      setStatusMessage('Sesion eliminada del historial.')
      if (selectedId === deletedId) {
        setSelectedIdOverride(null)
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['plan'] }),
      ])
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Historial"
        title="Lectura clara del progreso"
        subtitle="Filtros arriba, detalle a la derecha y acciones reales sobre la sesion seleccionada."
      />

      <PanelCard className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar sesion..." className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500" />
          <select value={focus} onChange={(event) => setFocus(event.target.value)} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Todos los focos</option>
            {historyQuery.data?.focusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none">
            <option value="">Todos los estados</option>
            {historyQuery.data?.statusOptions.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
            {historyQuery.data?.items.length || 0} sesiones visibles
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PanelCard title="Sesiones" subtitle="Selecciona una fila para abrir el detalle sin perder el contexto.">
          <div className="space-y-3">
            {historyQuery.data?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIdOverride(item.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedId === item.id ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-white/6 bg-black/20 hover:border-white/10 hover:bg-white/[0.035]'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-zinc-400">{formatDate(item.sessionDate)} · {item.exerciseCount} ejercicios · {item.setCount} sets</p>
                  </div>
                  <p className="text-sm text-zinc-300">{formatNumber(item.volume, ' kg')}</p>
                </div>
              </button>
            ))}
          </div>
        </PanelCard>

        <PanelCard
          title="Detalle"
          subtitle="Descripcion completa de la sesion seleccionada."
          action={
            selectedId ? (
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedId)}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-400/16"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            ) : null
          }
        >
          {!detailQuery.data ? (
            <div className="rounded-2xl border border-dashed border-white/8 bg-black/20 px-4 py-16 text-center text-zinc-500">Selecciona una sesion para verla completa.</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/6 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-['Space_Grotesk'] text-2xl font-semibold text-white">{detailQuery.data.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{formatDate(detailQuery.data.sessionDate)} · readiness {detailQuery.data.readinessScore ?? '-'} · {detailQuery.data.durationMinutes ?? '-'} min</p>
                  </div>
                  <p className="rounded-full border border-white/8 px-4 py-2 text-sm text-zinc-300">{detailQuery.data.completionStatus}</p>
                </div>
                {detailQuery.data.notes ? <p className="mt-4 text-sm leading-7 text-zinc-300">{detailQuery.data.notes}</p> : null}
              </div>

              <div className="space-y-3">
                {detailQuery.data.exercises.map((exercise) => (
                  <div key={exercise.exerciseName} className="rounded-2xl border border-white/6 bg-black/20 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{exercise.exerciseName}</p>
                        <p className="text-sm text-zinc-400">{exercise.targetReps || '-'} reps objetivo · descanso {exercise.targetRest ?? '-'} s</p>
                      </div>
                      <p className="text-sm text-zinc-300">{formatNumber(exercise.targetWeight, ' kg')}</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {exercise.sets.map((setItem, index) => (
                        <div key={`${exercise.exerciseName}-${index}`} className="rounded-xl border border-white/6 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
                          Set {index + 1}: {formatNumber(setItem.weight, ' kg')} · {setItem.reps ?? '-'} reps · RIR {setItem.rir ?? '-'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  )
}
