import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  UsersRound,
} from 'lucide-react'

import { CoachMonthlyReportPanel } from '@/components/app/coach-monthly-report'
import { MetricCard } from '@/components/metric-card'
import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import type { SigmaMonthlyReportStatus } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const trendLabels = {
  improving: 'mejorando',
  stable: 'estable',
  declining: 'en riesgo',
  insufficient_data: 'sin datos',
} as const

const reportStatusLabels: Record<SigmaMonthlyReportStatus, string> = {
  draft: 'Borrador',
  reviewed: 'Revisado',
  delivered: 'Entregado',
}

export function CoachPage() {
  const coach = useSigmafitStore((state) => state.coach)
  const loadCoachOverview = useSigmafitStore((state) => state.loadCoachOverview)
  const loadCoachMonthlyReport = useSigmafitStore((state) => state.loadCoachMonthlyReport)
  const clearCoachMonthlyReport = useSigmafitStore((state) => state.clearCoachMonthlyReport)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const athletes = coach.overview?.athletes ?? []

  useEffect(() => {
    void loadCoachOverview()
  }, [loadCoachOverview])

  const activeAthletes = athletes.filter((athlete) => athlete.completedSessions > 0).length
  const lowAdherence = athletes.filter((athlete) => athlete.consistencyRate < 0.6).length
  const highFatigue = athletes.filter((athlete) => (athlete.averageFatigue ?? 0) >= 8).length
  const highPain = athletes.filter((athlete) => (athlete.averagePain ?? 0) >= 7).length

  async function openReport(athleteId: string) {
    await loadCoachMonthlyReport(athleteId, month)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coach"
        title={coach.overview?.gymName ?? 'Panel del gimnasio'}
        subtitle="Seguimiento mensual y prioridades de los atletas de tu gimnasio."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Atletas"
          value={`${athletes.length}`}
          caption="Perfiles vinculados."
          icon={<UsersRound size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Activos"
          value={`${activeAthletes}`}
          caption="Con sesiones este mes."
          icon={<Activity size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Baja adherencia"
          value={`${lowAdherence}`}
          caption="Menos del 60%."
          icon={<CalendarCheck size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Fatiga alta"
          value={`${highFatigue}`}
          caption="Promedio de 8 o más."
          icon={<AlertTriangle size={18} className="text-red-200" />}
        />
        <MetricCard
          title="Dolor alto"
          value={`${highPain}`}
          caption="Promedio de 7 o más."
          icon={<HeartPulse size={18} className="text-red-200" />}
        />
      </section>

      {coach.isReportLoading ? (
        <div className="panel-surface rounded-[28px] px-5 py-6 text-sm text-slate-300">
          Preparando reporte mensual...
        </div>
      ) : null}

      {coach.selectedReport ? (
        <CoachMonthlyReportPanel
          key={`${coach.selectedReport.reportId ?? 'draft'}-${coach.selectedReport.updatedAt ?? month}`}
          report={coach.selectedReport}
          onClose={clearCoachMonthlyReport}
        />
      ) : null}

      <PanelCard
        title="Atletas"
        subtitle="Selecciona un atleta para revisar y entregar su reporte mensual."
        action={
          <label className="flex items-center gap-3 text-sm text-slate-400">
            Mes
            <input
              type="month"
              value={month}
              onChange={(event) => {
                setMonth(event.target.value)
                clearCoachMonthlyReport()
              }}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            />
          </label>
        }
      >
        {coach.isLoading ? <p className="text-sm text-slate-300">Cargando atletas...</p> : null}
        {coach.error ? <p className="text-sm text-red-200">{coach.error}</p> : null}
        {!coach.isLoading && athletes.length === 0 ? (
          <p className="text-sm text-slate-300">Todavía no hay atletas vinculados al gimnasio.</p>
        ) : null}

        <div className="space-y-3">
          {athletes.map((athlete) => (
            <article
              key={athlete.userId}
              className="grid gap-4 rounded-[24px] border border-white/8 bg-black/20 p-4 lg:grid-cols-[1.2fr_repeat(4,0.65fr)_auto] lg:items-center"
            >
              <div>
                <p className="font-['Space_Grotesk'] text-xl font-semibold text-white">{athlete.name}</p>
                <p className="mt-1 text-sm text-slate-400">{athlete.coachInsight}</p>
              </div>
              <CompactMetric label="Sesiones" value={`${athlete.completedSessions}`} />
              <CompactMetric label="Consistencia" value={`${Math.round(athlete.consistencyRate * 100)}%`} />
              <CompactMetric label="Fatiga" value={`${athlete.averageFatigue ?? 's/d'}`} />
              <CompactMetric label="Dolor" value={`${athlete.averagePain ?? 's/d'}`} />
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <span className="text-xs uppercase tracking-[0.16em] text-red-200">
                  {trendLabels[athlete.progressionTrend]} · {reportStatusLabels[athlete.reportStatus]}
                </span>
                <button
                  type="button"
                  onClick={() => void openReport(athlete.userId)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-400/18 bg-red-500/10 px-4 py-2 text-sm text-red-50 transition hover:bg-red-500/16"
                >
                  <ClipboardList size={16} />
                  Ver reporte mensual
                </button>
              </div>
            </article>
          ))}
        </div>
      </PanelCard>
    </div>
  )
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
    </div>
  )
}
