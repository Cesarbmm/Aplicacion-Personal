import { useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Link } from '@tanstack/react-router'
import { Bell, RefreshCcw, Save } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PanelCard } from '@/components/panel-card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { getSigmaProfileView } from '@/lib/sigmafit/mock-adapter'
import type { SigmaProfile } from '@/lib/sigmafit/types'
import { useSigmafitStore } from '@/store/sigmafit-store'

export function ProfilePage() {
  const session = useSigmafitStore((state) => state.session)
  const profile = useSigmafitStore((state) => state.profile)
  const workout = useSigmafitStore((state) => state.workout)
  const progressHistory = useSigmafitStore((state) => state.progressHistory)
  const preferences = useSigmafitStore((state) => state.preferences)
  const updateProfile = useSigmafitStore((state) => state.updateProfile)
  const updatePreferences = useSigmafitStore((state) => state.updatePreferences)
  const resetDemo = useSigmafitStore((state) => state.resetDemo)
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<SigmaProfile>(profile)

  const data = getSigmaProfileView({ session, profile, workout, progressHistory, preferences })

  useEffect(() => {
    setDraft(profile)
  }, [profile])

  function saveProfile() {
    updateProfile(draft)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  function togglePreference(key: 'adaptiveCoach' | 'reminders' | 'recoveryAlerts') {
    updatePreferences({ [key]: !preferences[key] })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Perfil, preferencias y base del coach."
        subtitle="Body y settings se consolidan aqui usando tabs y persistencia local para que el siguiente sprint solo conecte adapters reales."
        actions={
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
          >
            Reabrir onboarding
          </Link>
        }
      />

      <Tabs.Root defaultValue="summary" className="space-y-6">
        <Tabs.List className="inline-flex rounded-full border border-white/8 bg-white/[0.04] p-1">
          <Tabs.Trigger value="summary" className="rounded-full px-4 py-2 text-sm text-slate-300 data-[state=active]:bg-cyan-400/12 data-[state=active]:text-white">
            Resumen
          </Tabs.Trigger>
          <Tabs.Trigger value="preferences" className="rounded-full px-4 py-2 text-sm text-slate-300 data-[state=active]:bg-cyan-400/12 data-[state=active]:text-white">
            Preferencias
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="summary" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <PanelCard title="Base del atleta" subtitle="Ajustes que alimentan dashboard, progress y workout.">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Nombre</span>
                  <input
                    value={draft.displayName}
                    onChange={(event) => setDraft((current) => ({ ...current, displayName: event.target.value }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Email</span>
                  <input
                    value={draft.email}
                    onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Objetivo</span>
                  <select
                    value={draft.objective}
                    onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value as SigmaProfile['objective'] }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Fuerza">Fuerza</option>
                    <option value="Recomposicion">Recomposicion</option>
                    <option value="Resistencia">Resistencia</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Disponibilidad</span>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={draft.availability}
                    onChange={(event) => setDraft((current) => ({ ...current, availability: Number(event.target.value) || 1 }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Coach</span>
                  <select
                    value={draft.coachingStyle}
                    onChange={(event) => setDraft((current) => ({ ...current, coachingStyle: event.target.value as SigmaProfile['coachingStyle'] }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="Directo">Directo</option>
                    <option value="Analitico">Analitico</option>
                    <option value="Motivador">Motivador</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Unidad</span>
                  <select
                    value={draft.preferredUnit}
                    onChange={(event) => setDraft((current) => ({ ...current, preferredUnit: event.target.value as SigmaProfile['preferredUnit'] }))}
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Notas base</span>
                <textarea
                  rows={4}
                  value={draft.notes}
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={resetDemo}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08]"
                >
                  <RefreshCcw size={16} />
                  Reset demo
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-400/16 bg-cyan-400/10 px-4 py-2.5 text-sm text-cyan-200 transition hover:bg-cyan-400/16"
                >
                  <Save size={16} />
                  {saved ? 'Guardado local' : 'Guardar cambios'}
                </button>
              </div>
            </PanelCard>

            <PanelCard title="Resumen conectado" subtitle="Lectura directa del estado del atleta.">
              <div className="space-y-3">
                {data.weeklySummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Readiness actual</span>
                  <span className="text-sm text-cyan-200">{workout.readiness}%</span>
                </div>
                <ProgressBar value={workout.readiness} />
              </div>
            </PanelCard>
          </div>
        </Tabs.Content>

        <Tabs.Content value="preferences" className="space-y-6">
          <PanelCard title="Preferencias SigmaFit" subtitle="Todo se guarda localmente para validar la experiencia.">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  key: 'adaptiveCoach' as const,
                  label: 'Coach adaptativo',
                  value: preferences.adaptiveCoach,
                },
                {
                  key: 'reminders' as const,
                  label: 'Recordatorios',
                  value: preferences.reminders,
                },
                {
                  key: 'recoveryAlerts' as const,
                  label: 'Alertas de recuperacion',
                  value: preferences.recoveryAlerts,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => togglePreference(item.key)}
                  className="rounded-[24px] border border-white/8 bg-black/20 px-5 py-5 text-left transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white">{item.label}</span>
                    <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                      item.value ? 'bg-cyan-400/12 text-cyan-200' : 'bg-white/[0.06] text-slate-400'
                    }`}>
                      {item.value ? 'Activo' : 'Off'}
                    </span>
                  </div>
                </button>
              ))}

              <div className="rounded-[24px] border border-white/8 bg-black/20 px-5 py-5">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-cyan-300" />
                  <p className="font-medium text-white">Minutos de recordatorio</p>
                </div>
                <input
                  type="number"
                  value={preferences.reminderMinutes}
                  onChange={(event) => updatePreferences({ reminderMinutes: Number(event.target.value) || 0 })}
                  className="mt-4 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>
          </PanelCard>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

