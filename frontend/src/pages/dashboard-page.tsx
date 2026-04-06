import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Sparkles, TrendingUp } from 'lucide-react'

import { MetricCard } from '../components/metric-card'
import { MiniChart } from '../components/mini-chart'
import { PageHeader } from '../components/page-header'
import { PanelCard } from '../components/panel-card'
import { api } from '../lib/api'
import { formatNumber } from '../lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard,
  })

  if (isLoading || !data) {
    return <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-8 text-zinc-400">Cargando dashboard premium...</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inicio"
        title={data.heroTitle}
        subtitle={data.heroSubtitle}
        actions={
          <>
            {data.heroBadges.map((badge) => (
              <div key={badge.label} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300">
                <span className="text-zinc-500">{badge.label}: </span>
                <strong className="text-white">{badge.value}</strong>
              </div>
            ))}
            <button type="button" onClick={() => void navigate({ to: '/training' })} className="rounded-full border border-red-500/30 bg-red-500/12 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/18">
              Abrir rutina
            </button>
            <button type="button" onClick={() => void navigate({ to: '/coach' })} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10">
              Ver coach
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.cards.map((card) => (
          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            caption={card.caption}
            icon={<TrendingUp size={18} className="text-red-200" />}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <PanelCard
          title={data.nextSession.title}
          subtitle={data.nextSession.summary}
          action={(
            <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-100">
              <Sparkles size={14} />
              Coach listo
            </div>
          )}
        >
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {data.nextSession.items.map((item) => (
                <div key={item.exercise} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.exercise}</p>
                    <p className="text-sm text-zinc-400">{item.sets} sets</p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {item.reps} reps · {item.weight ? `${formatNumber(Number(item.weight), ' kg')}` : 'carga por sensaciones'} · RIR {item.rir || '-'}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Lo que vigilaria hoy</p>
              {data.coachInsight.map((line) => (
                <div key={line} className="rounded-2xl border border-red-500/15 bg-red-500/8 px-4 py-3 text-sm leading-6 text-red-50/90">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Progreso reciente" subtitle="Lectura rapida de carga y peso corporal sin saturar la pantalla.">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm text-zinc-400">Volumen por sesion</p>
              <MiniChart points={data.volumeSeries} />
            </div>
            <div>
              <p className="mb-3 text-sm text-zinc-400">Tendencia corporal</p>
              <MiniChart points={data.weightSeries} strokeClassName="stroke-red-300" />
            </div>
          </div>
        </PanelCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PanelCard title="Cargas recientes" subtitle="Los levantamientos mas utiles para abrir la semana con contexto.">
          <div className="space-y-3">
            {data.recentLoads.map((item) => (
              <div key={`${item.exercise}-${item.date}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{item.exercise}</p>
                  <p className="text-sm text-zinc-400">{item.date}</p>
                </div>
                <p className="text-right text-sm text-zinc-300">{formatNumber(item.weight, ' kg')} x {item.reps}</p>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Musculos trabajados" subtitle="Mapa simple de estimulo reciente para evitar sesgos al planear la siguiente sesion.">
          <div className="grid gap-3 md:grid-cols-2">
            {data.musclesWorked.map((item) => (
              <div key={item.name} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-zinc-400">{item.count} hits</p>
                </div>
                <div className="h-2 rounded-full bg-white/6">
                  <div className="h-2 rounded-full bg-gradient-to-r from-red-700 via-red-500 to-rose-300" style={{ width: `${Math.min(item.count * 18, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </section>
    </div>
  )
}
