import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Command,
  Dumbbell,
  FolderKanban,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'

import { api } from '../lib/api'
import { cn } from '../lib/utils'
import { useUiStore } from '../store/ui-store'
import { CommandPalette } from './command-palette'

const routeMap: Record<string, string> = {
  dashboard: '/',
  training: '/training',
  exercises: '/exercises',
  history: '/history',
  plan: '/plan',
  body: '/body',
  coach: '/coach',
  settings: '/settings',
}

const iconMap = {
  dashboard: LayoutDashboard,
  training: Dumbbell,
  exercises: Target,
  history: History,
  plan: FolderKanban,
  body: UserRound,
  coach: Sparkles,
  settings: Settings,
} as const

type AppShellProps = {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const commandOpen = useUiStore((state) => state.commandOpen)
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)
  const statusMessage = useUiStore((state) => state.statusMessage)
  const clearStatusMessage = useUiStore((state) => state.clearStatusMessage)
  const [sidebarPreference, setSidebarPreference] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem('bapp.sidebarCollapsed')
    return stored === null ? null : stored === '1'
  })

  const bootstrapQuery = useQuery({
    queryKey: ['bootstrap'],
    queryFn: api.bootstrap,
  })

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: api.settings,
  })

  const sidebarCollapsed = sidebarPreference ?? Boolean(bootstrapQuery.data?.sidebarCollapsed)

  const saveSettingsMutation = useMutation({
    mutationFn: api.saveSettings,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settings'] }),
        queryClient.invalidateQueries({ queryKey: ['bootstrap'] }),
      ])
    },
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
      if (event.ctrlKey && /^[1-8]$/.test(event.key)) {
        const item = bootstrapQuery.data?.navigation[Number(event.key) - 1]
        if (item) {
          event.preventDefault()
          void navigate({ to: routeMap[item.key] || '/' })
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bootstrapQuery.data?.navigation, navigate, setCommandOpen])

  useEffect(() => {
    if (!statusMessage) return
    const timer = window.setTimeout(() => clearStatusMessage(), 4200)
    return () => window.clearTimeout(timer)
  }, [clearStatusMessage, statusMessage])

  const navigation = bootstrapQuery.data?.navigation || []
  const activeItem = navigation.find((item) => routeMap[item.key] === pathname) || navigation[0]
  const coachActionItems = useMemo(() => ([
    { key: 'open-training', label: 'Abrir rutina de hoy', subtitle: 'Ir directo a Entrenar', route: '/training' },
    { key: 'open-coach', label: 'Revisar coach', subtitle: 'Ver ajustes y check-ins', route: '/coach' },
    { key: 'reopen-onboarding', label: 'Editar base del atleta', subtitle: 'Reabrir onboarding inteligente', route: '/welcome' },
  ]), [])

  function toggleSidebar() {
    const next = !sidebarCollapsed
    setSidebarPreference(next)
    window.localStorage.setItem('bapp.sidebarCollapsed', next ? '1' : '0')
    if (settingsQuery.data) {
      saveSettingsMutation.mutate({ ...settingsQuery.data, sidebarCollapsed: next })
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(185,28,28,0.18),_transparent_30%),radial-gradient(circle_at_right,_rgba(136,19,55,0.18),_transparent_22%),linear-gradient(180deg,_#0b0b0c_0%,_#050506_100%)] text-zinc-100">
      <div className={cn('mx-auto grid min-h-screen max-w-[1700px] gap-0', sidebarCollapsed ? 'xl:grid-cols-[104px_minmax(0,1fr)]' : 'xl:grid-cols-[308px_minmax(0,1fr)]')}>
        <aside className="border-b border-white/6 px-4 py-4 xl:border-b-0 xl:border-r xl:px-5 xl:py-6">
          <div className="flex h-full flex-col rounded-[30px] border border-white/8 bg-black/30 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className={cn('mb-6 flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between gap-3')}>
              <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-100">
                  <Dumbbell size={22} />
                </div>
                {!sidebarCollapsed ? (
                  <div>
                    <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">Bapp Gym Coach</p>
                    <p className="text-sm text-zinc-500">Negro, rojo y enfoque real</p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-2 text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white"
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>

            {!sidebarCollapsed ? (
              <div className="mb-6 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Atleta</p>
                <p className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{bootstrapQuery.data?.profileName || 'Atleta'}</p>
                <p className="mt-2 text-sm text-zinc-400">Foco activo: {bootstrapQuery.data?.activeFocus || '-'}</p>
              </div>
            ) : null}

            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const active = routeMap[item.key] === pathname
                const Icon = iconMap[item.key as keyof typeof iconMap] || Target
                return (
                  <Link
                    key={item.key}
                    to={routeMap[item.key] || '/'}
                    className={cn(
                      'group block rounded-[22px] border transition',
                      sidebarCollapsed ? 'px-3 py-3' : 'px-4 py-3.5',
                      active
                        ? 'border-red-500/35 bg-red-500/12 shadow-[0_0_0_1px_rgba(239,68,68,0.16)]'
                        : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]',
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'gap-3')}>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border transition', active ? 'border-red-500/20 bg-red-500/10 text-red-100' : 'border-white/7 bg-black/30 text-zinc-400 group-hover:text-white')}>
                        <Icon size={18} />
                      </div>
                      {!sidebarCollapsed ? (
                        <div className="min-w-0">
                          <p className="font-['Space_Grotesk'] text-base font-semibold text-white">{item.label}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">{item.subtitle}</p>
                        </div>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </nav>

            <button
              type="button"
              className={cn(
                'mt-6 rounded-[24px] border border-white/8 bg-white/[0.04] transition hover:border-red-500/30 hover:bg-red-500/10',
                sidebarCollapsed ? 'px-3 py-3' : 'px-4 py-4 text-left',
              )}
              onClick={() => setCommandOpen(true)}
              title={sidebarCollapsed ? 'Abrir palette' : undefined}
            >
              <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between gap-3')}>
                {!sidebarCollapsed ? (
                  <div>
                    <p className="font-medium text-white">Command Palette</p>
                    <p className="text-sm text-zinc-500">Navegacion, acciones y flujos utiles</p>
                  </div>
                ) : null}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-400">
                  <Command size={14} />
                  {!sidebarCollapsed ? 'Ctrl+K' : null}
                </div>
              </div>
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-white/6 bg-[#070708]/85 px-5 py-5 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-red-300/80">Shell premium</p>
                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">{activeItem?.label || 'Inicio'}</h2>
                <p className="mt-1 text-sm text-zinc-500">{activeItem?.subtitle || bootstrapQuery.data?.startupReport}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300">
                  <Activity size={16} className="text-red-300" />
                  {bootstrapQuery.data?.activeFocus || '-'}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10"
                  onClick={() => setCommandOpen(true)}
                >
                  <Sparkles size={16} className="text-red-200" />
                  Abrir palette
                </button>
              </div>
            </div>
            {statusMessage ? (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-50">
                <p>{statusMessage}</p>
                <button
                  type="button"
                  onClick={clearStatusMessage}
                  className="rounded-full border border-red-300/20 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-red-50/90 transition hover:bg-red-500/10"
                >
                  Cerrar
                </button>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-[1360px]">{children}</div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        items={navigation}
        actionItems={coachActionItems}
      />
    </div>
  )
}
