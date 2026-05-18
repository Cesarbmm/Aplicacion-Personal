import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Dumbbell, PlayCircle, TimerReset } from 'lucide-react'

import { ProgressBar } from '@/components/ui/progress-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SigmaRoutine, SigmaUnit, SigmaWorkoutSession } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

type WorkoutTrackerProps = {
  routine: SigmaRoutine | null
  activeSession: SigmaWorkoutSession | null
  isStarting: boolean
  isUpdatingSet: boolean
  isFinishing: boolean
  trainingError: string | null
  onStartSession: (payload: { routineId: string; routineDayId: string; unit: SigmaUnit }) => Promise<void> | void
  onSetDraftChange: (
    sessionId: string,
    setId: string,
    patch: Partial<{
      weight: number | null
      unit: SigmaUnit
      completed: boolean
      actualReps: number | null
      actualSeconds: number | null
    }>,
  ) => void
  onCompleteSet: (
    sessionId: string,
    setId: string,
    payload: {
      completed: boolean
      weight: number | null
      unit: SigmaUnit
      actualReps?: number | null
      actualSeconds?: number | null
    },
  ) => Promise<void> | void
  onFinishSession: (
    sessionId: string,
    payload: {
      fatigueLevel: number | null
      painLevel: number | null
      athleteNotes: string | null
    },
  ) => Promise<void> | void
}

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function normalizeExerciseName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function WorkoutTracker({
  routine,
  activeSession,
  isStarting,
  isUpdatingSet,
  isFinishing,
  trainingError,
  onStartSession,
  onSetDraftChange,
  onCompleteSet,
  onFinishSession,
}: WorkoutTrackerProps) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(routine?.days[0]?.routineDayId ?? null)
  const [restTimer, setRestTimer] = useState<{
    exerciseName: string | null
    value: number
  }>({
    exerciseName: null,
    value: 0,
  })
  const [fatigueLevel, setFatigueLevel] = useState(5)
  const [painLevel, setPainLevel] = useState(0)
  const [athleteNotes, setAthleteNotes] = useState('')
  const [assistedText, setAssistedText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const assistedLog = useSigmafitStore((state) => state.assistedLog)
  const parseTrainingLog = useSigmafitStore((state) => state.parseTrainingLog)
  const clearAssistedLog = useSigmafitStore((state) => state.clearAssistedLog)

  useEffect(() => {
    if (restTimer.value <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setRestTimer((current) => ({
        ...current,
        value: current.value > 0 ? current.value - 1 : 0,
      }))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [restTimer.value])

  const selectedDay = useMemo(
    () =>
      routine?.days.find(
        (day) =>
          day.routineDayId ===
          (activeSession?.routineDayId ?? selectedDayId ?? routine?.days[0]?.routineDayId ?? null),
      ) ??
      routine?.days[0] ??
      null,
    [activeSession?.routineDayId, routine, selectedDayId],
  )

  const completedSets = activeSession
    ? activeSession.exercises.reduce(
        (total, exercise) => total + exercise.sessionSets.filter((setItem) => setItem.completed).length,
        0,
      )
    : 0

  const totalSets = activeSession
    ? activeSession.exercises.reduce((total, exercise) => total + exercise.sessionSets.length, 0)
    : selectedDay?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0

  async function handleStartSession() {
    if (!routine || !selectedDay) {
      return
    }

    await onStartSession({
      routineId: routine.routineId,
      routineDayId: selectedDay.routineDayId,
      unit: 'kg',
    })
  }

  async function handleCompleteSet(
    payload: {
      sessionId: string
      setId: string
      completed: boolean
      weight: number | null
      unit: SigmaUnit
      actualReps?: number | null
      actualSeconds?: number | null
      exerciseName: string
      restSeconds: number
    },
  ) {
    await onCompleteSet(payload.sessionId, payload.setId, {
      completed: payload.completed,
      weight: payload.weight,
      unit: payload.unit,
      actualReps: payload.actualReps,
      actualSeconds: payload.actualSeconds,
    })

    if (payload.completed) {
      setRestTimer({
        exerciseName: payload.exerciseName,
        value: payload.restSeconds,
      })
    }
  }

  function handleResetTimer(value: number, exerciseName: string) {
    setRestTimer({
      exerciseName,
      value,
    })
  }

  async function handleParseAssistedText(text: string) {
    if (!text.trim()) {
      return
    }

    await parseTrainingLog(text)
  }

  async function handleConfirmAssistedLog() {
    const parsed = assistedLog.result?.parsed

    if (!activeSession || !parsed?.exerciseName || !parsed.reps) {
      return
    }

    const normalizedParsedName = normalizeExerciseName(parsed.exerciseName)
    const matchingExercise = activeSession.exercises.find((exercise) => {
      const normalizedName = normalizeExerciseName(exercise.name)
      return normalizedName.includes(normalizedParsedName) || normalizedParsedName.includes(normalizedName)
    })
    const nextSet = matchingExercise?.sessionSets.find((setItem) => !setItem.completed)

    if (!matchingExercise || !nextSet) {
      return
    }

    await handleCompleteSet({
      sessionId: activeSession.sessionId,
      setId: nextSet.setId,
      completed: true,
      weight: matchingExercise.trackingType === 'time' ? null : (parsed.weight ?? nextSet.weight ?? 0),
      unit: parsed.unit ?? nextSet.unit,
      actualReps: matchingExercise.trackingType === 'time' ? null : parsed.reps,
      actualSeconds: matchingExercise.trackingType === 'time' ? parsed.reps : null,
      exerciseName: matchingExercise.name,
      restSeconds: matchingExercise.restSeconds,
    })

    setAssistedText('')
    setFollowUpText('')
    clearAssistedLog()
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <section className="panel-surface rounded-[30px] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Rutina semanal</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
              {routine ? routine.name : 'Aun sin rutina'}
            </h3>
          </div>
          <div className="rounded-full border border-red-500/14 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {activeSession ? `${completedSets}/${totalSets} sets` : `${routine?.days.length ?? 0} dias`}
          </div>
        </div>

        <ProgressBar value={totalSets > 0 ? (completedSets / totalSets) * 100 : 0} />

        {!routine ? (
          <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
            Crea o acepta una rutina desde el dashboard para desbloquear el tracker en vivo.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {routine.days.map((day) => {
              const isSelected = day.routineDayId === (activeSession?.routineDayId ?? selectedDayId)
              const isActiveSessionDay = day.routineDayId === activeSession?.routineDayId

              return (
                <button
                  key={day.routineDayId}
                  type="button"
                  onClick={() => setSelectedDayId(day.routineDayId)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? 'border-red-500/22 bg-red-500/10'
                      : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{day.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{day.exercises.length} ejercicios</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-200">{day.exercises.reduce((total, exercise) => total + exercise.sets, 0)} sets</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {isActiveSessionDay ? 'En curso' : 'Disponible'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {routine && !activeSession ? (
          <button
            type="button"
            onClick={() => {
              void handleStartSession()
            }}
            disabled={isStarting || !selectedDay}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle size={16} />
            {isStarting ? 'Iniciando entrenamiento...' : 'Iniciar entrenamiento del dia'}
          </button>
        ) : null}

        {trainingError ? (
          <div className="mt-4 rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
            {trainingError}
          </div>
        ) : null}
      </section>

      <section className="panel-surface rounded-[30px] p-5">
        {activeSession ? (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Sesion activa</p>
                <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                  {activeSession.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  Marca cada serie, registra el peso y deja que el temporizador gestione el descanso.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-black/20 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Descanso activo</p>
                <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                  {formatSeconds(restTimer.value)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {restTimer.exerciseName ? `Ultima serie: ${restTimer.exerciseName}` : 'Esperando la primera serie'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                { icon: Clock3, label: 'Estado', value: activeSession.status === 'completed' ? 'Completada' : 'Activa' },
                { icon: Dumbbell, label: 'Dia', value: `Dia ${activeSession.dayNumber}` },
                { icon: TimerReset, label: 'Sets listos', value: `${completedSets}/${totalSets}` },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <item.icon className="h-4 w-4 text-red-300" />
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[26px] border border-red-400/14 bg-red-500/8 p-4" data-testid="assisted-training-log">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-medium text-white">Registro asistido</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Escribe una frase como: Hice press de banca, 4 series de 8 con 80kg.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/24 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {assistedLog.source === 'backend' ? 'backend' : assistedLog.source === 'local' ? 'local' : 'parser'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={assistedText}
                  onChange={(event) => setAssistedText(event.target.value)}
                  placeholder="Ejemplo: hice banca 4 series de 8 con 80kg"
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleParseAssistedText(assistedText)
                  }}
                  disabled={assistedLog.isParsing || !assistedText.trim()}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-400/16 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assistedLog.isParsing ? 'Interpretando...' : 'Interpretar'}
                </button>
              </div>

              {assistedLog.error ? (
                <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {assistedLog.error}
                </div>
              ) : null}

              {assistedLog.result ? (
                <div className="mt-4 rounded-[22px] border border-white/8 bg-black/22 px-4 py-4 text-sm leading-7 text-slate-300">
                  <p className="font-medium text-white">Datos interpretados</p>
                  <p>
                    {assistedLog.result.parsed.exerciseName ?? 'Ejercicio pendiente'} -{' '}
                    {assistedLog.result.parsed.sets ?? '?'} series x {assistedLog.result.parsed.reps ?? '?'} reps
                    {assistedLog.result.parsed.weight !== undefined
                      ? ` - ${assistedLog.result.parsed.weight}${assistedLog.result.parsed.unit ?? 'kg'}`
                      : ''}
                  </p>
                  {assistedLog.result.followUpQuestion ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        value={followUpText}
                        onChange={(event) => setFollowUpText(event.target.value)}
                        placeholder={assistedLog.result.followUpQuestion}
                        className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void handleParseAssistedText(`${assistedText}. ${followUpText}`)
                        }}
                        disabled={!followUpText.trim() || assistedLog.isParsing}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-red-400/20 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Responder
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void handleConfirmAssistedLog()
                      }}
                      disabled={isUpdatingSet}
                      className="mt-3 inline-flex items-center justify-center rounded-2xl border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16 disabled:opacity-50"
                    >
                      Confirmar y guardar primera serie pendiente
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {activeSession.exercises.map((exercise) => (
                <div key={exercise.routineExerciseId} className="rounded-[26px] border border-white/8 bg-black/20 p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{exercise.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {exercise.muscleGroup} - {exercise.equipment} - {exercise.reps}{' '}
                        {exercise.trackingType === 'time' ? 'objetivo' : 'reps'} - {exercise.restSeconds}s descanso
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{exercise.coachingCue}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetTimer(exercise.restSeconds, exercise.name)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
                    >
                      <TimerReset size={16} />
                      Reiniciar descanso
                    </button>
                  </div>

                  <div className="space-y-3">
                    {exercise.sessionSets.map((setItem) => {
                      const isTimeBased = exercise.trackingType === 'time'

                      return (
                        <div
                          key={setItem.setId}
                          className="grid gap-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 md:grid-cols-[auto_1fr_1fr_120px_auto]"
                        >
                        <div>
                          <p className="font-medium text-white">Set {setItem.setNumber}</p>
                          <p className="text-sm text-slate-500">
                            {setItem.completed
                              ? 'Completado'
                              : isTimeBased
                                ? `Objetivo ${setItem.targetReps}s`
                                : `Objetivo ${setItem.targetReps} reps`}
                          </p>
                        </div>

                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {isTimeBased ? 'Tiempo real seg' : 'Reps reales'}
                          </span>
                          <input
                            aria-label={`${isTimeBased ? 'segundos' : 'reps'} set ${setItem.setNumber}`}
                            type="number"
                            min={0}
                            value={isTimeBased ? (setItem.actualSeconds ?? setItem.targetReps) : (setItem.actualReps ?? setItem.targetReps)}
                            onChange={(event) =>
                              onSetDraftChange(activeSession.sessionId, setItem.setId, {
                                actualSeconds: isTimeBased ? Number(event.target.value) || 0 : setItem.actualSeconds,
                                actualReps: isTimeBased ? setItem.actualReps : Number(event.target.value) || 0,
                              })
                            }
                            className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                            {isTimeBased ? 'Carga' : 'Peso levantado'}
                          </span>
                          <input
                            aria-label={`peso set ${setItem.setNumber}`}
                            type="number"
                            min={0}
                            value={isTimeBased ? 0 : (setItem.weight ?? 0)}
                            disabled={isTimeBased}
                            onChange={(event) =>
                              onSetDraftChange(activeSession.sessionId, setItem.setId, {
                                weight: Number(event.target.value) || 0,
                              })
                            }
                            className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none disabled:opacity-45"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Unidad</span>
                          <Select
                            value={setItem.unit}
                            onValueChange={(value) =>
                              onSetDraftChange(activeSession.sessionId, setItem.setId, {
                                unit: value as SigmaUnit,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="kg" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="lb">lb</SelectItem>
                            </SelectContent>
                          </Select>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            void handleCompleteSet({
                              sessionId: activeSession.sessionId,
                              setId: setItem.setId,
                              completed: !setItem.completed,
                              weight: isTimeBased ? null : (setItem.weight ?? 0),
                              unit: setItem.unit,
                              actualReps: isTimeBased ? null : (setItem.actualReps ?? setItem.targetReps),
                              actualSeconds: isTimeBased ? (setItem.actualSeconds ?? setItem.targetReps) : null,
                              exerciseName: exercise.name,
                              restSeconds: exercise.restSeconds,
                            })
                          }}
                          disabled={isUpdatingSet}
                          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
                            setItem.completed
                              ? 'border-red-500/18 bg-red-500/12 text-red-100'
                              : 'border-white/8 bg-white/[0.04] text-slate-200 hover:border-red-500/20 hover:bg-red-500/10'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <CheckCircle2 size={16} />
                          {setItem.completed ? 'Reabrir' : 'Completar serie'}
                        </button>
                      </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[26px] border border-white/8 bg-black/20 p-4">
              <p className="font-medium text-white">Cierre de sesion</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Estos datos explican fatiga, dolor y observaciones para que el coach pueda ajustar mejor despues.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Fatiga percibida 1-10</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={fatigueLevel}
                    onChange={(event) => setFatigueLevel(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Dolor o molestia 0-10</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={painLevel}
                    onChange={(event) => setPainLevel(Math.max(0, Math.min(10, Number(event.target.value) || 0)))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Observacion del atleta</span>
                <textarea
                  value={athleteNotes}
                  onChange={(event) => setAthleteNotes(event.target.value)}
                  rows={3}
                  placeholder="Ejemplo: mucha fatiga en pierna, dolor leve de hombro, falto energia en la ultima serie..."
                  className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                void onFinishSession(activeSession.sessionId, {
                  fatigueLevel,
                  painLevel,
                  athleteNotes,
                })
              }}
              disabled={isFinishing}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFinishing ? 'Finalizando sesion...' : 'Finalizar sesion'}
            </button>
          </>
        ) : selectedDay ? (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Preview del dia</p>
                <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{selectedDay.title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  Revisa ejercicios, series, repeticiones y descanso antes de iniciar la sesion.
                </p>
              </div>
              <div className="rounded-[26px] border border-white/8 bg-black/20 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Carga del dia</p>
                <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                  {selectedDay.exercises.reduce((total, exercise) => total + exercise.sets, 0)} sets
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDay.exercises.map((exercise) => (
                <div
                  key={exercise.routineExerciseId}
                  className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{exercise.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {exercise.muscleGroup} - {exercise.equipment} - {exercise.reps}{' '}
                        {exercise.trackingType === 'time' ? 'objetivo' : 'reps'} - {exercise.restSeconds}s descanso
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{exercise.coachingCue}</p>
                    </div>
                    <p className="text-sm text-red-200">{exercise.sets} sets</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
            No hay un dia seleccionado. Genera una rutina para ver el plan semanal.
          </div>
        )}
      </section>
    </div>
  )
}
