import { useState } from 'react'
import { CheckCircle2, FileText, Save } from 'lucide-react'

import type {
  SigmaParsedTrainingLog,
  SigmaRoutine,
  SigmaTrainingLogFeedback,
  SigmaTrainingLogParseResult,
  SigmaUnit,
} from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

type PostWorkoutLoggerProps = {
  routine: SigmaRoutine | null
}

const exampleText =
  'Banca 4x8 con 80kg y plancha 3 series de 45 segundos. Fatiga 7, dolor 2.'

function getParsedItems(result: SigmaTrainingLogParseResult | null) {
  if (result?.items?.length) {
    return result.items
  }

  return result?.parsed ? [result.parsed] : []
}

function getParsedFeedback(result: SigmaTrainingLogParseResult | null): SigmaTrainingLogFeedback {
  return (
    result?.sessionFeedback ?? {
      fatigueLevel: null,
      painLevel: null,
      athleteNotes: 'Registro post-entrenamiento.',
    }
  )
}

export function PostWorkoutLogger({ routine }: PostWorkoutLoggerProps) {
  const assistedLog = useSigmafitStore((state) => state.assistedLog)
  const parseTrainingLog = useSigmafitStore((state) => state.parseTrainingLog)
  const savePostWorkoutSession = useSigmafitStore((state) => state.savePostWorkoutSession)
  const clearAssistedLog = useSigmafitStore((state) => state.clearAssistedLog)
  const [rawText, setRawText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState(routine?.days[0]?.routineDayId ?? '')
  const [items, setItems] = useState<SigmaParsedTrainingLog[]>(() =>
    getParsedItems(assistedLog.result),
  )
  const [feedback, setFeedback] = useState<SigmaTrainingLogFeedback>(() =>
    getParsedFeedback(assistedLog.result),
  )

  async function interpret(text = rawText) {
    if (!text.trim()) {
      setValidationError('Describe el entrenamiento antes de interpretarlo.')
      return
    }
    setValidationError(null)
    await parseTrainingLog(text)
    const result = useSigmafitStore.getState().assistedLog.result
    setItems(getParsedItems(result))
    setFeedback(getParsedFeedback(result))
  }

  function updateItem(index: number, patch: Partial<SigmaParsedTrainingLog>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  async function saveSession() {
    const validItems = items.filter(
      (item) => item.exerciseName && item.sets && (item.reps || item.actualSeconds),
    )
    if (validItems.length !== items.length || validItems.length === 0) {
      setValidationError('Completa ejercicio, series y repeticiones o segundos antes de guardar.')
      return
    }

    setValidationError(null)
    const result = await savePostWorkoutSession({
      routineId: routine?.routineId ?? null,
      routineDayId: selectedDayId || null,
      rawText,
      items: validItems.map((item) => ({
        exerciseName: item.exerciseName!,
        sets: item.sets!,
        reps: item.reps ?? null,
        weight: item.weight ?? null,
        unit: item.unit ?? 'kg',
        actualSeconds: item.actualSeconds ?? null,
      })),
      feedback,
    })

    if (result.finished) {
      setRawText('')
      setFollowUpText('')
      setItems([])
      setFeedback({
        fatigueLevel: null,
        painLevel: null,
        athleteNotes: '',
      })
      clearAssistedLog()
    }
  }

  return (
    <section className="panel-surface rounded-[30px] p-5 md:p-6" data-testid="post-workout-logger">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-400/18 bg-red-500/10 text-red-200">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-['Space_Grotesk'] text-2xl font-semibold text-white">
            Registrar después
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Describe la sesion completa y revisa los datos antes de guardarlos.
          </p>
        </div>
      </div>

      <textarea
        value={rawText}
        onChange={(event) => setRawText(event.target.value)}
        rows={6}
        placeholder={exampleText}
        aria-label="Descripcion del entrenamiento terminado"
        className="mt-6 w-full rounded-[24px] border border-white/10 bg-black/24 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-red-400/30"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void interpret()}
          disabled={!rawText.trim() || assistedLog.isParsing}
          className="rounded-full border border-red-400/18 bg-red-500/10 px-5 py-2.5 text-sm text-red-100 transition hover:bg-red-500/16 disabled:opacity-50"
        >
          {assistedLog.isParsing ? 'Interpretando...' : 'Interpretar entrenamiento'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRawText(exampleText)
            clearAssistedLog()
          }}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-slate-300"
        >
          Usar ejemplo
        </button>
      </div>

      {assistedLog.error ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {assistedLog.error}
        </div>
      ) : null}

      {validationError ? (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {validationError}
        </div>
      ) : null}

      {(assistedLog.result?.followUpQuestions?.length ?? 0) > 0 ? (
        <div className="mt-5 rounded-[24px] border border-amber-400/18 bg-amber-400/10 p-4">
          <p className="font-medium text-amber-100">Faltan algunos datos</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-50/80">
            {assistedLog.result?.followUpQuestions?.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <input
              value={followUpText}
              onChange={(event) => setFollowUpText(event.target.value)}
              placeholder="Completa la informacion faltante"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="button"
              onClick={() => void interpret(`${rawText}. ${followUpText}`)}
              disabled={!followUpText.trim()}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white disabled:opacity-50"
            >
              Reinterpretar
            </button>
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-red-300" />
            <h4 className="font-medium text-white">Vista previa editable</h4>
          </div>

          {routine ? (
            <label className="block max-w-md space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Dia asociado</span>
              <select
                value={selectedDayId}
                onChange={(event) => setSelectedDayId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#110d0d] px-4 py-3 text-sm text-white"
              >
                <option value="">Sesion libre</option>
                {routine.days.map((day) => (
                  <option key={day.routineDayId} value={day.routineDayId}>
                    {day.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-400">
              Se guardara como sesion libre.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.exerciseName ?? 'exercise'}-${index}`}
                className="grid gap-3 rounded-[24px] border border-white/8 bg-black/20 p-4 md:grid-cols-6"
              >
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs text-slate-500">Ejercicio</span>
                  <input
                    value={item.exerciseName ?? ''}
                    onChange={(event) => updateItem(index, { exerciseName: event.target.value })}
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white"
                  />
                </label>
                <NumberField label="Series" value={item.sets} onChange={(sets) => updateItem(index, { sets })} />
                {item.trackingType === 'time' ? (
                  <NumberField
                    label="Segundos"
                    value={item.actualSeconds}
                    onChange={(actualSeconds) => updateItem(index, { actualSeconds })}
                  />
                ) : (
                  <NumberField label="Reps" value={item.reps} onChange={(reps) => updateItem(index, { reps })} />
                )}
                <NumberField label="Peso" value={item.weight} onChange={(weight) => updateItem(index, { weight })} />
                <label className="space-y-2">
                  <span className="text-xs text-slate-500">Unidad</span>
                  <select
                    value={item.unit ?? 'kg'}
                    onChange={(event) => updateItem(index, { unit: event.target.value as SigmaUnit })}
                    className="w-full rounded-xl border border-white/8 bg-[#110d0d] px-3 py-2 text-sm text-white"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </label>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <NumberField
              label="Fatiga"
              value={feedback.fatigueLevel ?? undefined}
              onChange={(fatigueLevel) => setFeedback((current) => ({ ...current, fatigueLevel: fatigueLevel ?? null }))}
            />
            <NumberField
              label="Dolor"
              value={feedback.painLevel ?? undefined}
              onChange={(painLevel) => setFeedback((current) => ({ ...current, painLevel: painLevel ?? null }))}
            />
            <label className="space-y-2">
              <span className="text-xs text-slate-500">Notas</span>
              <input
                value={feedback.athleteNotes ?? ''}
                onChange={(event) =>
                  setFeedback((current) => ({ ...current, athleteNotes: event.target.value || null }))
                }
                className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void saveSession()}
            disabled={assistedLog.isSaving || assistedLog.result?.status === 'needs_follow_up'}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/18 bg-red-500/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-500/16 disabled:opacity-50"
          >
            <Save size={16} />
            {assistedLog.isSaving ? 'Guardando...' : 'Guardar sesion'}
          </button>
        </div>
      ) : null}

      {assistedLog.lastSavedSummary ? (
        <div className="mt-5 rounded-[24px] border border-red-400/18 bg-red-500/10 p-4 text-sm text-red-50">
          Sesion guardada: {assistedLog.lastSavedSummary.completedSets} series y{' '}
          {assistedLog.lastSavedSummary.totalVolume.toLocaleString('es-EC')} kg de volumen.
        </div>
      ) : null}
    </section>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        type="number"
        min="0"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}
        className="w-full rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white"
      />
    </label>
  )
}
