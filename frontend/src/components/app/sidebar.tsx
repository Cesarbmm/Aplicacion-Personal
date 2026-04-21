import { Link, useRouterState } from '@tanstack/react-router'
import { BarChart3, Dumbbell, LayoutDashboard, LogOut, RotateCcw, UserRound } from 'lucide-react'

import { useSigmafitStore } from '@/store/sigmafit-store'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', subtitle: 'Resumen diario', icon: LayoutDashboard },
  { to: '/workout', label: 'Workout', subtitle: 'Tracker en vivo', icon: Dumbbell },
  { to: '/progress', label: 'Progress', subtitle: 'Tendencias y bloques', icon: BarChart3 },
  { to: '/profile', label: 'Profile', subtitle: 'Atleta y ajustes', icon: UserRound },
] as const

export function Sidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const athlete = useSigmafitStore((state) => state.profile.displayName)
  const focus = useSigmafitStore((state) => state.profile.focus)
  const readiness = useSigmafitStore((state) => state.workout.readiness)
  const logout = useSigmafitStore((state) => state.logout)
  const resetDemo = useSigmafitStore((state) => state.resetDemo)

  return (
    <aside className="border-b border-white/8 px-4 py-4 xl:border-b-0 xl:border-r xl:px-5 xl:py-5">
      <div className="panel-surface flex h-full flex-col rounded-[32px] p-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Dumbbell size={22} />
          </div>
          <div>
            <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">SigmaFit</p>
            <p className="text-sm text-slate-500">Cold blue control</p>
          </div>
        </div>

        <div className="mb-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Atleta</p>
          <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{athlete}</p>
          <p className="mt-2 text-sm text-slate-400">Foco activo: {focus}</p>
          <div className="mt-4 rounded-full border border-cyan-400/12 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-200">
            Readiness {readiness}%
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.to
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block rounded-[24px] border px-4 py-3.5 transition ${
                  active
                    ? 'border-cyan-400/22 bg-cyan-400/10'
                    : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    active
                      ? 'border-cyan-400/18 bg-cyan-400/10 text-cyan-200'
                      : 'border-white/7 bg-black/20 text-slate-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <button
            type="button"
            onClick={resetDemo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
          >
            <RotateCcw size={16} />
            Reset demo
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300 transition hover:border-white/14 hover:bg-white/[0.05]"
          >
            <LogOut size={16} />
            Cerrar sesion mock
          </button>
        </div>
      </div>
    </aside>
  )
}

