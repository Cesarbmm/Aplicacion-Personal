import { useState } from 'react'
import { CalendarDays, CheckCircle2, Send, X } from 'lucide-react'

import type {
  SigmaCoachMonthlyReport,
  SigmaMonthlyReportStatus,
} from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

const statusLabels: Record<SigmaMonthlyReportStatus, string> = {
  draft: 'Borrador',
  reviewed: 'Revisado',
  delivered: 'Entregado',
}

const trendLabels = {
  improving: 'Mejorando',
  stable: 'Estable',
  declining: 'En riesgo',
  insufficient_data: 'Sin datos',
} as const

export function CoachMonthlyReportPanel({
  report,
  onClose,
}: {
  report: SigmaCoachMonthlyReport
  onClose: () => void
}) {
  const saveCoachMonthlyReport = useSigmafitStore((state) => state.saveCoachMonthlyReport)
  const isSaving = useSigmafitStore((state) => state.coach.isReportSaving)
  const reportError = useSigmafitStore((state) => state.coach.reportError)
  const reportSaved = useSigmafitStore((state) => state.coach.reportSaved)
  const [coachNotes, setCoachNotes] = useState(report.coachNotes)
  const [status, setStatus] = useState<SigmaMonthlyReportStatus>(report.status)

  async function saveReport() {
    await saveCoachMonthlyReport({
      athleteId: report.athlete.userId,
      month: report.month,
      coachNotes,
      status,
    })
  }

  return (
    <section className="panel-surface rounded-[32px] p-5 md:p-7" aria-label="Reporte mensual del atleta">
      <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-red-200">Reporte mensual</p>
          <h2 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-white">
            {report.athlete.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {report.gym.name} · {report.month}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-red-400/18 bg-red-500/10 px-4 py-2 text-sm text-red-100">
            {statusLabels[report.status]}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reporte mensual"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-slate-300 transition hover:bg-white/[0.06]"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Sesiones', report.metrics.completedSessions],
          ['Consistencia', `${Math.round(report.metrics.consistencyRate * 100)}%`],
          ['Cumplimiento', `${Math.round(report.metrics.completionRate * 100)}%`],
          ['Volumen', `${report.metrics.totalVolume.toLocaleString('es-EC')} kg`],
          ['Fatiga', report.metrics.averageFatigue ?? 's/d'],
          ['Dolor', report.metrics.averagePain ?? 's/d'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-[24px] border border-red-400/14 bg-red-500/8 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-white">Conclusión del sistema</p>
              <span className="text-xs uppercase tracking-[0.18em] text-red-200">
                {trendLabels[report.metrics.progressionTrend]}
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">{report.generatedSummary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <ReportList title="Puntos fuertes" items={report.strengths} />
            <ReportList title="Puntos débiles" items={report.weaknesses} />
            <ReportList title="Oportunidades" items={report.opportunities} />
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Siguiente mes</p>
            <p className="mt-3 text-sm leading-7 text-slate-200">{report.recommendation}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center gap-2">
              <CalendarDays size={17} className="text-red-200" />
              <p className="font-medium text-white">Sesiones recientes</p>
            </div>
            <div className="mt-4 space-y-3">
              {report.sessions.length > 0 ? (
                report.sessions.map((session) => (
                  <div key={session.sessionId} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">
                        {new Date(session.date).toLocaleDateString('es-EC')}
                      </p>
                      <p className="text-xs text-red-200">{session.completedSets} series</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {session.totalVolume.toLocaleString('es-EC')} kg · Fatiga {session.fatigueLevel ?? 's/d'} ·
                      Dolor {session.painLevel ?? 's/d'}
                    </p>
                    {session.athleteNotes ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">{session.athleteNotes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-400">No hay sesiones registradas para este mes.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-5">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Observación del coach
              </span>
              <textarea
                value={coachNotes}
                onChange={(event) => setCoachNotes(event.target.value)}
                rows={5}
                placeholder="Añade una conclusión breve y accionable para el atleta."
                className="w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-red-400/30"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Estado</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as SigmaMonthlyReportStatus)}
                className="w-full rounded-2xl border border-white/10 bg-[#110d0d] px-4 py-3 text-sm text-white"
              >
                <option value="draft">Borrador</option>
                <option value="reviewed">Revisado</option>
                <option value="delivered">Entregado al atleta</option>
              </select>
            </label>

            {reportError ? <p className="mt-3 text-sm text-red-200">{reportError}</p> : null}
            {reportSaved ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-100">
                <CheckCircle2 size={16} />
                Reporte guardado.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void saveReport()}
              disabled={isSaving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-400/18 bg-red-500/12 px-5 py-3 text-sm font-medium text-red-50 transition hover:bg-red-500/18 disabled:opacity-50"
            >
              <Send size={16} />
              {isSaving ? 'Guardando...' : 'Guardar reporte'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
