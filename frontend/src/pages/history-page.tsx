import { BarChart3, LineChart as LineChartIcon, ShieldCheck } from 'lucide-react'

import { ProgressChart } from '@/components/app/progress-chart'
import { MetricCard } from '@/components/metric-card'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { getSigmaProgressView } from '@/lib/sigmafit/mock-adapter'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function ProgressPage() {
  const session = useSigmafitStore((state) => state.session)
  const profile = useSigmafitStore((state) => state.profile)
  const routine = useSigmafitStore((state) => state.routine)
  const training = useSigmafitStore((state) => state.training)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const preferences = useSigmafitStore((state) => state.preferences)

  const data = getSigmaProgressView({ session, profile, routine, training, workout, progressHistory, preferences })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Lectura semanal para decidir el siguiente bloque."
        subtitle="Esta vista condensa lo mejor de historial y plan en una sola pantalla con charts reales y recomendaciones mock."
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
                <BarChart3 size={18} className="text-cyan-200" />
              ) : index === 1 ? (
                <ShieldCheck size={18} className="text-cyan-200" />
              ) : (
                <LineChartIcon size={18} className="text-cyan-200" />
              )
            }
          />
        ))}
      </section>

      <ProgressChart data={data.trend} />

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
