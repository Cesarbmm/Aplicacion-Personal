import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { Sidebar } from '@/components/app/sidebar'
import { useSigmafitStore } from '@/store/sigmafit-store'

const routeMeta: Record<string, { label: string; subtitle: string }> = {
  '/dashboard': {
    label: 'Dashboard',
    subtitle: 'Resumen operativo para atleta, entrenador y gimnasio.',
  },
  '/workout': {
    label: 'Workout',
    subtitle: 'Tracker activo, descanso y captura de RPE sin depender del backend.',
  },
  '/progress': {
    label: 'Progress',
    subtitle: 'Volumen, consistencia, resumen mensual y ajuste adaptativo.',
  },
  '/profile': {
    label: 'Profile',
    subtitle: 'Identidad del atleta, preferencias y base de seguimiento.',
  },
  '/routine-builder': {
    label: 'Routine Builder',
    subtitle: 'Constructor manual de bloques usando el catalogo oficial de ejercicios.',
  },
  '/coach': {
    label: 'Coach',
    subtitle: 'Panel para entrenadores y administradores del gimnasio.',
  },
}

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const meta = routeMeta[pathname] ?? routeMeta['/dashboard']
  const athleteName = useSigmafitStore((state) => state.profile.displayName)
  const session = useSigmafitStore((state) => state.session)
  const lastRpe = useSigmafitStore((state) => state.workout.lastSessionRpe)
  const readiness = useSigmafitStore((state) => state.workout.readiness)
  const clearSyncError = useSigmafitStore((state) => state.clearSyncError)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(239,27,27,0.16),transparent_30%),linear-gradient(180deg,#100606_0%,#050505_100%)] text-white">
      <div
        className={`mx-auto grid min-h-screen max-w-[1700px] ${
          sidebarCollapsed ? 'xl:grid-cols-[96px_minmax(0,1fr)]' : 'xl:grid-cols-[310px_minmax(0,1fr)]'
        }`}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((current) => !current)} />

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#080505]/82 px-5 py-5 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <Link to="/dashboard" className="transition-colors hover:text-slate-300">
                    SigmaFit
                  </Link>
                  <ChevronRight size={14} />
                  <span>{meta.label}</span>
                </div>
                <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-[-0.05em] text-white">
                  {meta.label}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">{meta.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  {athleteName}
                </div>
                <div className="rounded-full border border-red-400/16 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                  Readiness {readiness}%
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  Ultimo RPE {lastRpe ?? 7}/10
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-[1380px] space-y-4">
              {session.lastSyncError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-amber-400/18 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
                  <span>{session.lastSyncError}</span>
                  <button
                    type="button"
                    onClick={clearSyncError}
                    className="rounded-full border border-amber-300/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-amber-100 transition hover:bg-amber-300/10"
                  >
                    Ocultar
                  </button>
                </div>
              ) : null}

              <div>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
