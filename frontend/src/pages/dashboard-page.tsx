import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, ArrowRight, Bot, CalendarDays, Dumbbell, Sparkles, Waves, Wrench } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { MiniChart } from '@/components/mini-chart'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import {
  formatSigmaExperienceLevel,
  formatSigmaGoal,
} from '@/lib/sigmafit/catalog'
import type {
  SigmaAdaptiveRecommendationType,
  SigmaExperienceLevel,
  SigmaRoutine,
  SigmaRoutineCreationMode,
} from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

type RoutineRecommendation = {
  badge: string
  message: string
  primaryFlow: SigmaRoutineCreationMode
  primaryLabel: string
  secondaryLabel: string
  secondaryHint: string
}

function getRoutineRecommendation(experienceLevel: SigmaExperienceLevel): RoutineRecommendation {
  if (experienceLevel === 'beginner') {
    return {
      badge: 'Recomendado para tu nivel',
      message:
        'Recomendado: usa el Coach Virtual para obtener una rutina estructurada y segura segun tu objetivo.',
      primaryFlow: 'coach',
      primaryLabel: 'Generar con Coach Virtual',
      secondaryLabel: 'Crear rutina manual',
      secondaryHint: 'Tambien puedes crearla manualmente, pero conviene partir de una base guiada.',
    }
  }

  if (experienceLevel === 'intermediate') {
    return {
      badge: 'Coach sugerido',
      message: 'Puedes usar el Coach Virtual como base y luego ajustar tu rutina.',
      primaryFlow: 'coach',
      primaryLabel: 'Generar con Coach Virtual',
      secondaryLabel: 'Crear rutina manual',
      secondaryHint: 'Si prefieres afinar tu propio bloque, el builder manual queda disponible.',
    }
  }

  return {
    badge: 'Opciones flexibles',
    message: 'Puedes crear tu propia rutina o generar una propuesta inicial del Coach Virtual.',
    primaryFlow: 'manual',
    primaryLabel: 'Crear rutina manual',
    secondaryLabel: 'Generar con Coach Virtual',
    secondaryHint: 'El Coach puede servirte como base y luego puedes personalizarla.',
  }
}

function getRoutineSourceLabel(source: 'backend' | 'fallback' | 'none') {
  if (source === 'fallback') {
    return 'guardada en este dispositivo'
  }

  if (source === 'backend') {
    return 'sincronizada'
  }

  return 'pendiente'
}

function getRoutineModeLabel(mode: SigmaRoutineCreationMode) {
  return mode === 'manual' ? 'Manual' : 'Coach Virtual'
}

const adaptiveLabels: Record<SigmaAdaptiveRecommendationType, string> = {
  progress: 'progresar',
  maintain: 'mantener',
  deload: 'descarga',
  simplify: 'simplificar',
}

function RoutineDaysGrid({ routine }: { routine: SigmaRoutine }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {routine.days.map((day) => (
        <div key={day.routineDayId} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{day.title}</p>
              <p className="mt-1 text-sm text-slate-400">{day.exercises.length} ejercicios</p>
            </div>
            <p className="text-sm text-red-200">
              {day.exercises.reduce((total, exercise) => total + exercise.sets, 0)} sets
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {day.exercises.map((exercise) => (
              <div
                key={exercise.routineExerciseId}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm text-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{exercise.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {exercise.muscleGroup}
                    </p>
                  </div>
                  <p className="text-right text-xs text-red-200">
                    {exercise.sets} x {exercise.reps}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-500">Descanso recomendado: {exercise.restSeconds}s</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const profile = useSigmafitStore((state) => state.profile)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const adaptive = useSigmafitStore((state) => state.adaptive)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const session = useSigmafitStore((state) => state.session)
  const loadCurrentRoutine = useSigmafitStore((state) => state.loadCurrentRoutine)
  const generateRoutineProposal = useSigmafitStore((state) => state.generateRoutineProposal)
  const acceptRoutineProposal = useSigmafitStore((state) => state.acceptRoutineProposal)
  const regenerateRoutineProposal = useSigmafitStore((state) => state.regenerateRoutineProposal)
  const selectRoutineFlow = useSigmafitStore((state) => state.selectRoutineFlow)
  const loadAdaptiveSummary = useSigmafitStore((state) => state.loadAdaptiveSummary)
  const generateAdaptiveRecommendation = useSigmafitStore((state) => state.generateAdaptiveRecommendation)

  const [isGenerating, setIsGenerating] = useState(false)
  const recommendation = getRoutineRecommendation(profile.experienceLevel)
  const latestProgressPoint = progressHistory[progressHistory.length - 1]
  const activeRoutine = routine.currentRoutine
  const proposedRoutine = routine.proposedRoutine

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete) {
      void loadCurrentRoutine()
      void loadAdaptiveSummary()
    }
  }, [loadAdaptiveSummary, loadCurrentRoutine, session.isAuthenticated, session.onboardingComplete])

  const dashboardMetrics = useMemo(
    () => [
      {
        title: 'Perfil',
        value: formatSigmaGoal(profile.goal),
        caption: `${formatSigmaExperienceLevel(profile.experienceLevel)} - ${profile.daysPerWeek} dias por semana`,
        icon: <Sparkles size={18} className="text-red-200" />,
      },
      {
        title: 'Rutina',
        value: activeRoutine ? getRoutineModeLabel(activeRoutine.creationMode) : proposedRoutine ? 'Propuesta lista' : 'Sin definir',
        caption: activeRoutine
          ? `${activeRoutine.name} activa desde ${getRoutineSourceLabel(routine.source)}.`
          : proposedRoutine
            ? `Propuesta pendiente desde ${getRoutineSourceLabel(routine.proposalSource)}.`
            : 'Primero elige como quieres crear tu plan.',
        icon: <CalendarDays size={18} className="text-red-200" />,
      },
      {
        title: 'Readiness',
        value: `${workout.readiness}%`,
        caption: 'Contexto actual del atleta antes de arrancar el siguiente bloque.',
        icon: <Waves size={18} className="text-red-200" />,
      },
      {
        title: 'Volumen',
        value: `${latestProgressPoint?.volume.toLocaleString('es-EC') ?? 0} kg`,
        caption: 'Historial acumulado de entrenamiento.',
        icon: <Dumbbell size={18} className="text-red-200" />,
      },
    ],
    [
      activeRoutine,
      latestProgressPoint?.volume,
      profile.daysPerWeek,
      profile.experienceLevel,
      profile.goal,
      proposedRoutine,
      routine.proposalSource,
      routine.source,
      workout.readiness,
    ],
  )

  async function handleGenerateProposal() {
    selectRoutineFlow('coach')
    setIsGenerating(true)
    try {
      await generateRoutineProposal()
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRegenerateProposal() {
    selectRoutineFlow('coach')
    setIsGenerating(true)
    try {
      await regenerateRoutineProposal()
    } finally {
      setIsGenerating(false)
    }
  }

  function renderRoutineDecisionPanel() {
    const primaryIsCoach = recommendation.primaryFlow === 'coach'

    return (
      <PanelCard
        title="Crear mi rutina"
        subtitle="Con estos datos SigmaFit puede generar una propuesta o permitirte crear tu propia rutina."
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/14 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
            <Sparkles size={14} />
            {recommendation.badge}
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
            {recommendation.message}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              `Objetivo: ${formatSigmaGoal(profile.goal)}.`,
              `Nivel: ${formatSigmaExperienceLevel(profile.experienceLevel)}.`,
              `Disponibilidad: ${profile.daysPerWeek} dias por semana.`,
            ].map((line) => (
              <div key={line} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                {line}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                void handleGenerateProposal()
              }}
              className={`rounded-[28px] border px-5 py-5 text-left transition ${
                primaryIsCoach
                  ? 'border-red-500/22 bg-red-500/10'
                  : 'border-white/8 bg-black/20 hover:border-red-500/20 hover:bg-red-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-red-300" />
                <p className="font-medium text-white">Generar con Coach Virtual</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Propuesta estructurada desde tu objetivo, nivel y disponibilidad semanal.
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-red-200">
                {primaryIsCoach ? 'Accion principal' : 'Accion secundaria'}
              </p>
            </button>

            <Link
              to="/routine-builder"
              onClick={() => {
                selectRoutineFlow('manual')
              }}
              className={`rounded-[28px] border px-5 py-5 text-left transition ${
                primaryIsCoach
                  ? 'border-white/8 bg-black/20 hover:border-red-500/20 hover:bg-red-500/10'
                  : 'border-red-500/22 bg-red-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-red-300" />
                <p className="font-medium text-white">Crear rutina manual</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{recommendation.secondaryHint}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-red-200">
                {primaryIsCoach ? 'Accion secundaria' : 'Accion principal'}
              </p>
            </Link>
          </div>

          {routine.error ? (
            <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
              {routine.error}
            </div>
          ) : null}

          {(isGenerating || routine.isLoading) ? (
            <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
              Generando propuesta...
            </div>
          ) : null}
        </div>
      </PanelCard>
    )
  }

  function renderProposalPanel() {
    if (!proposedRoutine) {
      return null
    }

    return (
      <PanelCard
        title="Propuesta del Coach Virtual"
        subtitle="Esta rutina fue generada con tu perfil actual."
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/14 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
            <Bot size={14} />
            {profile.experienceLevel === 'advanced' ? 'Base editable' : 'Recomendado para tu nivel'}
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              `Rutina: ${proposedRoutine.name}.`,
              `Objetivo: ${formatSigmaGoal(profile.goal)}.`,
              `Nivel: ${formatSigmaExperienceLevel(profile.experienceLevel)}.`,
              `Origen: ${getRoutineSourceLabel(routine.proposalSource)}.`,
            ].map((line) => (
              <div key={line} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                {line}
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
            {profile.experienceLevel === 'advanced'
              ? 'Puedes usarla como base o crear una personalizada.'
              : 'Esta propuesta ya respeta tu objetivo, tu nivel y los dias que declaraste en onboarding.'}
          </div>

          <RoutineDaysGrid routine={proposedRoutine} />

          {routine.error ? (
            <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
              {routine.error}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <LiquidButton size="md" onClick={() => acceptRoutineProposal()}>
              Usar esta rutina
            </LiquidButton>

            <button
              type="button"
              onClick={() => {
                void handleRegenerateProposal()
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
            >
              Regenerar propuesta
            </button>

            <Link
              to="/routine-builder"
              onClick={() => {
                selectRoutineFlow('manual')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
            >
              Crear manualmente
            </Link>
          </div>
        </div>
      </PanelCard>
    )
  }

  function renderActiveRoutinePanel() {
    if (!activeRoutine) {
      return null
    }

    return (
      <PanelCard
        title={activeRoutine.creationMode === 'manual' ? 'Rutina manual activa' : 'Rutina activa del Coach'}
        subtitle="Tu plan esta listo para iniciar sesiones."
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/14 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
            <Sparkles size={14} />
            {getRoutineModeLabel(activeRoutine.creationMode)} - {getRoutineSourceLabel(routine.source)}
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              `Nombre: ${activeRoutine.name}.`,
              `Dias: ${activeRoutine.daysPerWeek}.`,
              `Creacion: ${getRoutineModeLabel(activeRoutine.creationMode)}.`,
              `Estado: ${session.backendStatus === 'online' ? 'sincronizado' : 'en dispositivo'}.`,
            ].map((line) => (
              <div key={line} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                {line}
              </div>
            ))}
          </div>

          <RoutineDaysGrid routine={activeRoutine} />

          <div className="flex flex-wrap gap-3">
            <Link
              to="/workout"
              className="inline-flex items-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/16"
            >
              Abrir workout
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/routine-builder"
              onClick={() => {
                selectRoutineFlow('manual')
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
            >
              Crear otra rutina manual
            </Link>
          </div>
        </div>
      </PanelCard>
    )
  }

  function renderAdaptivePanel() {
    const summary = adaptive.summary
    const recommendation = summary?.recommendation

    return (
      <PanelCard
        title="Estado adaptativo"
        subtitle="Lectura simple de fatiga, dolor, cumplimiento y rendimiento real."
        action={
          <button
            type="button"
            onClick={() => {
              void generateAdaptiveRecommendation()
            }}
            disabled={adaptive.isGenerating}
            className="inline-flex items-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/16 disabled:opacity-50"
          >
            <Activity size={16} />
            {adaptive.isGenerating ? 'Actualizando...' : 'Actualizar recomendacion'}
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fatiga promedio</p>
              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                {summary?.averageFatigue ?? 'sin dato'}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dolor promedio</p>
              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                {summary?.averagePain ?? 'sin dato'}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cumplimiento</p>
              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
                {summary ? `${Math.round(summary.completionRate * 100)}%` : '0%'}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
            {recommendation ? (
              <>
                <span className="font-medium text-white">
                  Recomendacion: {adaptiveLabels[recommendation.type]}.
                </span>{' '}
                {recommendation.summary} {recommendation.reasoning}
              </>
            ) : (
              'Finaliza una sesion para que SigmaFit pueda generar una lectura adaptativa.'
            )}
          </div>

          <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
            Sesiones analizadas: {summary?.sessionsAnalyzed ?? 0}.
            {recommendation?.riskLevel === 'high'
              ? ' Precaucion: dolor alto no es diagnostico medico; reduce carga y revisa tecnica si persiste.'
              : ''}
          </div>

          {adaptive.error ? (
            <div className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
              {adaptive.error}
            </div>
          ) : null}
        </div>
      </PanelCard>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Hola, ${profile.displayName}.`}
        subtitle={
          activeRoutine
            ? 'Tu rutina activa ya esta definida y el tracker puede usarla sin pasos extra.'
            : proposedRoutine
              ? 'Ya tienes una propuesta del Coach. Revisala antes de activarla.'
              : 'El onboarding solo define tu perfil. Ahora decide como quieres crear tu plan.'
        }
        actions={
          <>
            {activeRoutine ? (
              <Link
                to="/workout"
                className="inline-flex items-center gap-2 rounded-full border border-red-500/16 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/16"
              >
                Abrir workout
                <ArrowRight size={16} />
              </Link>
            ) : null}
            <Link
              to="/progress"
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-red-500/20 hover:bg-red-500/10"
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
        {activeRoutine ? renderActiveRoutinePanel() : proposedRoutine ? renderProposalPanel() : renderRoutineDecisionPanel()}

        <PanelCard title="Proxima accion" subtitle="Acceso directo al entrenamiento.">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-red-500/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
              {training.activeSession
                ? `Hay una sesion activa en ${training.activeSession.title}. Puedes retomarla desde Workout.`
                : activeRoutine
                  ? `La rutina ${activeRoutine.name} ya esta activa. Entra a Workout para iniciar la sesion del dia.`
                  : proposedRoutine
                    ? 'Tienes una propuesta pendiente. Aceptala o regenerala antes de pasar al tracker.'
                    : 'Aun no existe una rutina activa. Primero elige si quieres usar el Coach Virtual o crearla manualmente.'}
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

      {renderAdaptivePanel()}
    </div>
  )
}
