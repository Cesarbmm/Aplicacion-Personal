import { Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react'

import { MetricCard } from '@/components/metric-card'
import { MiniChart } from '@/components/mini-chart'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { getSigmaDashboardView } from '@/lib/sigmafit/mock-adapter'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function DashboardPage() {
  const session = useSigmafitStore((state) => state.session)
  const profile = useSigmafitStore((state) => state.profile)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const preferences = useSigmafitStore((state) => state.preferences)

  const data = getSigmaDashboardView({ session, profile, workout, progressHistory, preferences })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={data.headline}
        subtitle={data.subheadline}
        actions={
          <>
            <Link
              to="/workout"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/16"
            >
              Abrir workout
              <ArrowRight size={16} />
            </Link>
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
        {data.metrics.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            caption={card.caption}
            icon={<TrendingUp size={18} className="text-cyan-200" />}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <PanelCard
          title={`Sesion activa / ${workout.title}`}
          subtitle={workout.notes}
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/14 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
              <Sparkles size={14} />
              Coach listo
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div className="space-y-3">
                {data.nextSession.map((exercise) => (
                  <div key={exercise.id} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{exercise.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{exercise.focus}</p>
                      </div>
                      <p className="text-sm text-slate-500">{exercise.sets.length} sets</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{exercise.note}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {data.insightCards.map((line) => (
                  <div key={line} className="rounded-[22px] border border-cyan-400/12 bg-cyan-400/8 px-4 py-4 text-sm leading-7 text-slate-200">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300">Readiness del bloque</span>
                <span className="text-sm text-cyan-200">{workout.readiness}%</span>
              </div>
              <ProgressBar value={workout.readiness} />
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Preview semanal" subtitle="El shell interno ya refleja volumen, consistencia y fuerza proyectada.">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-slate-400">Volumen</p>
              <MiniChart points={data.progressPreview.map((point) => ({ date: point.week, value: point.volume }))} />
            </div>
            <div>
              <p className="mb-3 text-sm text-slate-400">1RM proyectado</p>
              <MiniChart
                points={data.progressPreview.map((point) => ({ date: point.week, value: point.projectedOneRm }))}
                strokeClassName="stroke-sky-300"
              />
            </div>
          </div>
        </PanelCard>
      </section>
    </div>
  )
}

