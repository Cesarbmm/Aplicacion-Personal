import { useEffect } from 'react'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  HeartPulse,
  MessageSquareText,
  TrendingUp,
} from 'lucide-react'

import { ProgressChart } from '@/components/app/progress-chart'
import { MetricCard } from '@/components/metric-card'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { useSigmafitStore } from '@/store/sigmafit-store'

const trendLabels = {
  improving: 'Mejorando',
  stable: 'Estable',
  declining: 'En riesgo',
  insufficient_data: 'Sin datos',
} as const

const recommendationLabels = {
  progress: 'progresar',
  maintain: 'mantener',
  deload: 'descarga',
  simplify: 'simplificar',
} as const

export function ProgressPage() {
  const session = useSigmafitStore((state) => state.session)
  const monthly = useSigmafitStore((state) => state.monthlySummary)
  const adaptive = useSigmafitStore((state) => state.adaptive)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const loadMonthlySummary = useSigmafitStore((state) => state.loadMonthlySummary)
  const loadAdaptiveSummary = useSigmafitStore((state) => state.loadAdaptiveSummary)
  const generateAdaptiveRecommendation = useSigmafitStore(
    (state) => state.generateAdaptiveRecommendation,
  )
  const summary = monthly.summary
  const recommendation = adaptive.summary?.recommendation

  useEffect(() => {
    if (session.isAuthenticated && session.onboardingComplete) {
      void loadMonthlySummary()
      void loadAdaptiveSummary()
    }
  }, [loadAdaptiveSummary, loadMonthlySummary, session.isAuthenticated, session.onboardingComplete])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Tu mes de entrenamiento"
        subtitle="Volumen, constancia y respuesta al entrenamiento en una lectura simple."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Volumen"
          value={`${summary?.totalVolume.toLocaleString('es-EC') ?? 0} kg`}
          caption="Carga completada este mes."
          icon={<BarChart3 size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Sesiones"
          value={`${summary?.completedSessions ?? 0}`}
          caption="Entrenamientos finalizados."
          icon={<CalendarCheck size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Consistencia"
          value={`${Math.round((summary?.consistencyRate ?? 0) * 100)}%`}
          caption="Frecuencia frente al plan."
          icon={<Activity size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Fatiga"
          value={`${summary?.averageRpe ?? 's/d'}`}
          caption="Promedio reportado."
          icon={<TrendingUp size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Dolor"
          value={`${summary?.averagePain ?? 's/d'}`}
          caption="Promedio reportado."
          icon={<HeartPulse size={18} className="text-red-200" />}
        />
      </section>

      <ProgressChart data={progressHistory} />

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="Resumen mensual" subtitle={summary ? trendLabels[summary.progressionTrend] : 'Pendiente'}>
          {summary ? (
            <div className="space-y-4">
              <p className="rounded-[24px] border border-red-400/14 bg-red-500/8 p-5 text-sm leading-7 text-slate-200">
                {summary.summary}
              </p>
              <div className="rounded-[22px] border border-white/8 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recomendación personal</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {recommendation?.summary ??
                    'Mantén el registro de tus sesiones para recibir una recomendación más precisa.'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              {monthly.isLoading ? 'Preparando tu resumen...' : 'Completa sesiones para construir tu resumen mensual.'}
            </p>
          )}
        </PanelCard>

        <PanelCard
          title="Ajuste para el siguiente bloque"
          subtitle="Basado en cumplimiento, fatiga y molestias reportadas."
          action={
            <button
              type="button"
              onClick={() => void generateAdaptiveRecommendation()}
              disabled={adaptive.isGenerating}
              className="rounded-full border border-red-400/16 bg-red-500/10 px-4 py-2 text-sm text-red-100 disabled:opacity-50"
            >
              {adaptive.isGenerating ? 'Actualizando...' : 'Actualizar'}
            </button>
          }
        >
          {recommendation ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-100">
                Recomendación: {recommendationLabels[recommendation.type]}
              </p>
              <p className="text-sm leading-7 text-slate-200">{recommendation.reasoning}</p>
              <p className="rounded-[22px] border border-white/8 bg-black/20 p-4 text-sm text-slate-300">
                Cambio de carga sugerido: {recommendation.suggestedLoadChangePercent}% · Volumen:{' '}
                {recommendation.suggestedVolumeChange}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-300">
              Finaliza una sesión con fatiga, dolor y notas para generar una lectura personal.
            </p>
          )}
        </PanelCard>
      </div>

      {summary?.deliveredReport ? (
        <PanelCard
          title="Revisión de tu coach"
          subtitle={`Entregada por ${summary.deliveredReport.coachName}`}
        >
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-red-400/14 bg-red-500/8 p-5">
              <div className="flex items-center gap-2 text-red-100">
                <MessageSquareText size={18} />
                <p className="font-medium">Observación final</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {summary.deliveredReport.coachNotes}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Próximo paso</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {summary.deliveredReport.recommendation}
              </p>
            </div>
          </div>
        </PanelCard>
      ) : null}
    </div>
  )
}
