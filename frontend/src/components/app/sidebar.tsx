import { Link, useRouterState } from '@tanstack/react-router'
import { BarChart3, ChevronLeft, ChevronRight, Dumbbell, LayoutDashboard, LogOut, RotateCcw, UserRound, UsersRound, Wrench } from 'lucide-react'

import { useSigmafitStore } from '@/store/sigmafit-store'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', subtitle: 'Resumen diario', icon: LayoutDashboard },
  { to: '/workout', label: 'Workout', subtitle: 'Tracker en vivo', icon: Dumbbell },
  { to: '/routine-builder', label: 'Builder', subtitle: 'Rutina manual', icon: Wrench },
  { to: '/progress', label: 'Progress', subtitle: 'Tendencias y bloques', icon: BarChart3 },
  { to: '/coach', label: 'Coach', subtitle: 'Panel gimnasio', icon: UsersRound },
  { to: '/profile', label: 'Profile', subtitle: 'Atleta y ajustes', icon: UserRound },
] as const

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-200">
            <Dumbbell size={22} />
          </div>
          <div className={collapsed ? 'hidden' : 'block'}>
            <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">SigmaFit</p>
            <p className="text-sm text-slate-500">Gym platform control</p>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto hidden h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300 transition hover:border-red-400/20 hover:bg-red-500/10 xl:inline-flex"
            aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className={`mb-6 rounded-[26px] border border-white/8 bg-white/[0.03] p-4 ${collapsed ? 'hidden xl:block xl:p-2' : ''}`}>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Atleta</p>
          <p className={`mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white ${collapsed ? 'hidden' : ''}`}>{athlete}</p>
          <p className={`mt-2 text-sm text-slate-400 ${collapsed ? 'hidden' : ''}`}>Foco activo: {focus}</p>
          <div className={`mt-4 rounded-full border border-red-400/12 bg-red-500/8 px-4 py-2 text-sm text-red-100 ${collapsed ? 'px-2 text-center text-xs' : ''}`}>
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
                title={collapsed ? item.label : undefined}
                className={`block rounded-[24px] border px-4 py-3.5 transition ${
                  active
                    ? 'border-red-400/22 bg-red-500/10'
                    : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]'
                }`}
              >
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    active
                      ? 'border-red-400/18 bg-red-500/10 text-red-100'
                      : 'border-white/7 bg-black/20 text-slate-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className={`min-w-0 ${collapsed ? 'hidden' : 'block'}`}>
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
            title="Reset demo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 transition hover:border-red-400/20 hover:bg-red-500/10"
          >
            <RotateCcw size={16} />
            <span className={collapsed ? 'hidden' : 'inline'}>Reset demo</span>
          </button>
          <button
            type="button"
            onClick={logout}
            title="Cerrar sesion mock"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-300 transition hover:border-white/14 hover:bg-white/[0.05]"
          >
            <LogOut size={16} />
            <span className={collapsed ? 'hidden' : 'inline'}>Cerrar sesion mock</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
