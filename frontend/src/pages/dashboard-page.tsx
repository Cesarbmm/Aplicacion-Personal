import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Dumbbell, Sparkles, Waves } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { MiniChart } from '@/components/mini-chart'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import { formatSigmaExperienceLevel, formatSigmaGoal } from '@/lib/sigmafit/catalog'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function DashboardPage() {
  const profile = useSigmafitStore((state) => state.profile)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const session = useSigmafitStore((state) => state.session)
  const loadCurrentRoutine = useSigmafitStore((state) => state.loadCurrentRoutine)
  const generateRoutine = useSigmafitStore((state) => state.generateRoutine)

  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete) {
      void loadCurrentRoutine()
    }
  }, [loadCurrentRoutine, session.isAuthenticated, session.onboardingComplete])

  const latestProgressPoint = progressHistory[progressHistory.length - 1]
  const routineDays = routine.currentRoutine?.days ?? []
  const todaysPreview = routineDays[0] ?? null

  const dashboardMetrics = useMemo(
    () => [
      {
        title: 'Perfil',
        value: formatSigmaGoal(profile.goal),
        caption: `${formatSigmaExperienceLevel(profile.experienceLevel)} · ${profile.daysPerWeek} dias por semana`,
        icon: <Sparkles size={18} className="text-cyan-200" />,
      },
      {
        title: 'Rutina activa',
        value: routine.currentRoutine ? `${routine.currentRoutine.days.length} dias` : 'Sin generar',
        caption: routine.currentRoutine
          ? `${routine.currentRoutine.name} disponible desde ${routine.source}.`
          : 'Genera el primer bloque semanal desde el coach virtual.',
        icon: <CalendarDays size={18} className="text-cyan-200" />,
      },
      {
        title: 'Readiness',
        value: `${workout.readiness}%`,
        caption: 'Contexto actual del atleta para arrancar el microciclo.',
        icon: <Waves size={18} className="text-cyan-200" />,
      },
      {
        title: 'Volumen',
        value: `${latestProgressPoint?.volume.toLocaleString('es-EC') ?? 0} kg`,
        caption: 'Historial mock acumulado listo para convivir con las nuevas sesiones.',
        icon: <Dumbbell size={18} className="text-cyan-200" />,
      },
    ],
    [
      latestProgressPoint?.volume,
      profile.daysPerWeek,
      profile.experienceLevel,
      profile.goal,
      routine.currentRoutine,
      routine.source,
      workout.readiness,
    ],
  )

  async function handleGenerateRoutine() {
    setIsGenerating(true)
    try {
      await generateRoutine()
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Hola, ${profile.displayName}. El coach virtual ya puede darte bloque.`}
        subtitle={
          routine.currentRoutine
            ? 'La rutina semanal se genera desde backend cuando esta disponible y cae a fallback local cuando hace falta.'
            : 'Completa la generación del primer bloque para desbloquear el flujo completo de entrenamiento en vivo.'
        }
        actions={
          <>
            {routine.currentRoutine ? (
              <Link
                to="/workout"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/16"
              >
                Abrir workout
                <ArrowRight size={16} />
              </Link>
            ) : (
              <LiquidButton size="md" onClick={() => void handleGenerateRoutine()} disabled={isGenerating || routine.isLoading}>
                {isGenerating || routine.isLoading ? 'Generando rutina...' : 'Generar rutina semanal'}
              </LiquidButton>
            )}
            <Link
              to="/progress"
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
            >
              Ver progreso
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            caption={card.caption}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <PanelCard
          title="Coach Virtual"
          subtitle={
            routine.currentRoutine
              ? 'Tu rutina semanal ya fue generada. Puedes revisar los dias, ejercicios y volumen de cada bloque.'
              : 'No hay rutina activa todavia. El backend la genera desde perfil + catalogo oficial de ejercicios.'
          }
          action={
            routine.currentRoutine ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/14 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles size={14} />
                Fuente {routine.source}
              </div>
            ) : null
          }
        >
          {!routine.currentRoutine ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
                El usuario ya tiene onboarding completo. El siguiente paso es generar el bloque semanal con base
                en objetivo, nivel y dias disponibles.
              </div>

              <LiquidButton size="md" onClick={() => void handleGenerateRoutine()} disabled={isGenerating || routine.isLoading}>
                {isGenerating || routine.isLoading ? 'Generando rutina...' : 'Generar rutina semanal'}
              </LiquidButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {routineDays.map((day) => (
                  <div key={day.routineDayId} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{day.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{day.exercises.length} ejercicios</p>
                      </div>
                      <p className="text-sm text-cyan-200">
                        {day.exercises.reduce((total, exercise) => total + exercise.sets, 0)} sets
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      {day.exercises.slice(0, 3).map((exercise) => (
                        <div
                          key={exercise.routineExerciseId}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-slate-300"
                        >
                          {exercise.name} · {exercise.sets} x {exercise.reps}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {routine.error ? (
                <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                  {routine.error}
                </div>
              ) : null}
            </div>
          )}
        </PanelCard>

        <PanelCard title="Proxima accion" subtitle="Acceso rapido al entrenamiento del dia y lectura del estado actual.">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-cyan-400/14 bg-cyan-400/8 px-4 py-4 text-sm leading-7 text-slate-200">
              {training.activeSession
                ? `Hay una sesion activa en ${training.activeSession.title}. Puedes retomarla desde Workout.`
                : todaysPreview
                  ? `La primera jornada lista es ${todaysPreview.title}. Entra a Workout para iniciar la sesion y registrar series.`
                  : 'Primero genera una rutina para habilitar la sesion en vivo.'}
            </div>

            <div>
              <p className="mb-3 text-sm text-slate-400">Volumen historico</p>
              <MiniChart points={progressHistory.map((point) => ({ date: point.week, value: point.volume }))} />
            </div>

            <div className="space-y-3">
              {[
                `Objetivo actual: ${formatSigmaGoal(profile.goal)}.`,
                `Nivel declarado: ${formatSigmaExperienceLevel(profile.experienceLevel)}.`,
                `Disponibilidad: ${profile.daysPerWeek} dias por semana.`,
              ].map((line) => (
                <div key={line} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </PanelCard>
      </section>
    </div>
  )
}
