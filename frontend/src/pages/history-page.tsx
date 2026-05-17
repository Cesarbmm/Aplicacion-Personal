import { useEffect } from 'react'
import { Activity, BarChart3, LineChart as LineChartIcon, ShieldCheck } from 'lucide-react'

import { ProgressChart } from '@/components/app/progress-chart'
import { MetricCard } from '@/components/metric-card'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { getSigmaProgressView } from '@/lib/sigmafit/mock-adapter'
import type { SigmaAdaptiveRecommendationType } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const adaptiveLabels: Record<SigmaAdaptiveRecommendationType, string> = {
  progress: 'progresar',
  maintain: 'mantener',
  deload: 'descarga',
  simplify: 'simplificar',
}

export function ProgressPage() {
  const session = useSigmafitStore((state) => state.session)
  const profile = useSigmafitStore((state) => state.profile)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const assistedLog = useSigmafitStore((state) => state.assistedLog)
  const adaptive = useSigmafitStore((state) => state.adaptive)
  const monthlySummary = useSigmafitStore((state) => state.monthlySummary)
  const coach = useSigmafitStore((state) => state.coach)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const preferences = useSigmafitStore((state) => state.preferences)
  const loadAdaptiveSummary = useSigmafitStore((state) => state.loadAdaptiveSummary)
  const loadMonthlySummary = useSigmafitStore((state) => state.loadMonthlySummary)
  const generateAdaptiveRecommendation = useSigmafitStore((state) => state.generateAdaptiveRecommendation)

  const data = getSigmaProgressView({
    session,
    profile,
    routine,
    training,
    assistedLog,
    adaptive,
    monthlySummary,
    coach,
    workout,
    progressHistory,
    preferences,
  })
  const adaptiveSummary = adaptive.summary
  const recommendation = adaptiveSummary?.recommendation

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete) {
      void loadAdaptiveSummary()
      void loadMonthlySummary()
    }
  }, [loadAdaptiveSummary, loadMonthlySummary, session.isAuthenticated, session.onboardingComplete])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Progreso explicado para ajustar el siguiente bloque."
        subtitle="Volumen, consistencia, fuerza proyectada y fatiga se leen como indicadores operativos, no como diagnosticos aislados."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {data.heroStats.map((item, index) => (
          <MetricCard
            key={item.label}
            title={item.label}
            value={item.value}
            caption={
              index === 0
                ? 'Carga acumulada del corte actual.'
                : index === 1
                  ? 'Cumplimiento promedio.'
                  : 'Fuerza estimada del movimiento principal.'
            }
            icon={
              index === 0 ? (
                <BarChart3 size={18} className="text-red-200" />
              ) : index === 1 ? (
                <ShieldCheck size={18} className="text-red-200" />
              ) : (
                <LineChartIcon size={18} className="text-red-200" />
              )
            }
          />
        ))}
      </section>

      <ProgressChart data={data.trend} />

      <PanelCard
        title="Resumen mensual"
        subtitle="Lectura de volumen, adherencia y fatiga promedio para el atleta y el gimnasio."
      >
        {monthlySummary.summary ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-red-400/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
              <span className="font-medium text-white">{monthlySummary.summary.month}.</span>{' '}
              {monthlySummary.summary.summary}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Volumen mensual</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {monthlySummary.summary.totalVolume.toLocaleString('es-EC')} kg
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sesiones</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {monthlySummary.summary.completedSessions}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Consistencia</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {Math.round(monthlySummary.summary.consistencyRate * 100)}%
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">RPE/fatiga</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {monthlySummary.summary.averageRpe ?? 'sin dato'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
            {monthlySummary.isLoading
              ? 'Cargando resumen mensual...'
              : 'Aun no hay resumen mensual. Finaliza sesiones para construir esta lectura.'}
          </div>
        )}
      </PanelCard>

      <PanelCard
        title="Lectura adaptativa"
        subtitle="Reglas deterministicas sobre cumplimiento, fatiga, dolor y rendimiento real."
        action={
          <button
            type="button"
            onClick={() => {
              void generateAdaptiveRecommendation()
            }}
            disabled={adaptive.isGenerating}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/16 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/16 disabled:opacity-50"
          >
            <Activity size={16} />
            {adaptive.isGenerating ? 'Actualizando...' : 'Actualizar'}
          </button>
        }
      >
        {recommendation ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-red-400/14 bg-red-500/8 px-4 py-4 text-sm leading-7 text-slate-200">
              <span className="font-medium text-white">
                Recomendacion: {adaptiveLabels[recommendation.type]}.
              </span>{' '}
              {recommendation.summary}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cumplimiento</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {Math.round((adaptiveSummary?.completionRate ?? 0) * 100)}%
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fatiga</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {adaptiveSummary?.averageFatigue ?? 'sin dato'}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dolor</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {adaptiveSummary?.averagePain ?? 'sin dato'}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ajuste carga</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                  {recommendation.suggestedLoadChangePercent}%
                </p>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
              {recommendation.reasoning} Analiza {adaptiveSummary?.sessionsAnalyzed ?? 0} sesiones,{' '}
              {adaptiveSummary?.completedSets ?? 0}/{adaptiveSummary?.plannedSets ?? 0} series y{' '}
              {(adaptiveSummary?.totalVolume ?? 0).toLocaleString('es-EC')} kg de volumen aproximado.
            </div>
            <div className="rounded-[22px] border border-amber-400/18 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-100">
              Esta lectura no reemplaza supervision profesional. Si el dolor es alto o persistente, reduce carga,
              revisa tecnica y busca apoyo calificado.
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
            Aun no hay recomendacion. Finaliza una sesion con reps, peso, fatiga, dolor y notas para alimentar el
            ajuste adaptativo.
          </div>
        )}
      </PanelCard>

      <PanelCard title="Que significan estas metricas" subtitle="Definiciones usadas por SigmaFit para evitar lecturas ambiguas.">
        <div className="grid gap-3 md:grid-cols-2">
          {data.metricDefinitions.map((item) => (
            <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </PanelCard>

      <PanelCard
        title="Objetivo corporal"
        subtitle={profile.goal === 'weight_loss' ? 'La app registra peso objetivo, pero calorias queda pendiente para un sprint nutricional.' : 'Referencia corporal para interpretar el bloque actual.'}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Peso actual</p>
            <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{data.bodyTarget.currentWeightKg} kg</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Peso objetivo</p>
            <p className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">{data.bodyTarget.targetWeightKg} kg</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Calorias</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              {data.bodyTarget.caloriesTracked ? 'Registro activo' : 'No se registran todavia; por ahora el progreso usa entrenamiento y peso.'}
            </p>
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Recomendaciones del bloque" subtitle="Conclusion operativa del estado actual.">
        <div className="grid gap-3 md:grid-cols-3">
          {data.recommendations.map((item) => (
            <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  )
}
