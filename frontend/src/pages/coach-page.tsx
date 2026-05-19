import { useEffect } from 'react'
import { AlertTriangle, BarChart3, UsersRound } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { useSigmafitStore } from '@/store/sigmafit-store'

const trendLabels = {
  improving: 'mejorando',
  stable: 'estable',
  declining: 'en riesgo',
  insufficient_data: 'sin datos',
} as const

export function CoachPage() {
  const coach = useSigmafitStore((state) => state.coach)
  const loadCoachOverview = useSigmafitStore((state) => state.loadCoachOverview)
  const athletes = coach.overview?.athletes ?? []

  useEffect(() => {
    void loadCoachOverview()
  }, [loadCoachOverview])

  const athletesToReview = athletes.filter(
    (athlete) => athlete.weakPoints.length > 0 || (athlete.averagePain ?? 0) >= 7,
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach"
        title="Panel de seguimiento para entrenadores."
        subtitle="Vista inicial B2B2C para detectar adherencia, fatiga, dolor reportado y prioridades de seguimiento por atleta."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Atletas"
          value={`${athletes.length}`}
          caption="Usuarios visibles para el gimnasio."
          icon={<UsersRound size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Revisar hoy"
          value={`${athletesToReview}`}
          caption="Atletas con puntos debiles o molestias que ameritan seguimiento."
          icon={<AlertTriangle size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Seguimiento"
          value={athletes.length > 0 ? 'Activo' : 'Pendiente'}
          caption="Resumen de progreso y alertas del grupo."
          icon={<BarChart3 size={18} className="text-red-200" />}
        />
      </section>

      <PanelCard
        title="Athletes overview"
        subtitle="Resumen accionable para entrenadores y administradores del gimnasio."
      >
        {coach.isLoading ? (
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-5 text-sm text-slate-300">
            Cargando atletas...
          </div>
        ) : null}

        {coach.error ? (
          <div className="rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-5 text-sm text-red-100">
            {coach.error}
          </div>
        ) : null}

        {!coach.isLoading && athletes.length === 0 ? (
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-5 text-sm leading-7 text-slate-300">
            Todavia no hay atletas con perfil para mostrar.
          </div>
        ) : null}

        <div className="grid gap-4">
          {athletes.map((athlete) => (
            <article key={athlete.userId} className="rounded-[28px] border border-white/10 bg-black/24 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-red-200/80">Atleta</p>
                  <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.04em] text-white">
                    {athlete.name}
                  </h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{athlete.coachInsight}</p>
                </div>
                <span className="rounded-full border border-red-400/18 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                  {trendLabels[athlete.progressionTrend]}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Adherencia</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                    {Math.round(athlete.consistencyRate * 100)}%
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fatiga</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                    {athlete.averageFatigue ?? 's/d'}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dolor</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                    {athlete.averagePain ?? 's/d'}
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sesiones perdidas</p>
                  <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">
                    {athlete.missedSessions}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(athlete.weakPoints.length > 0 ? athlete.weakPoints : ['sin alertas criticas']).map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </PanelCard>
    </div>
  )
}
