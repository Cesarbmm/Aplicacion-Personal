import { useEffect, useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import type { NavItem } from '../lib/types'

type PaletteItem = {
  key: string
  label: string
  subtitle: string
  route: string
  shortcut?: string
}

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
  items: NavItem[]
  actionItems?: PaletteItem[]
}

const routes: Record<string, string> = {
  dashboard: '/',
  training: '/training',
  exercises: '/exercises',
  history: '/history',
  plan: '/plan',
  body: '/body',
  coach: '/coach',
  settings: '/settings',
}

function PaletteSection({
  title,
  items,
  onSelect,
}: {
  title: string
  items: PaletteItem[]
  onSelect: (item: PaletteItem) => void
}) {
  if (!items.length) return null
  return (
    <div>
      <div className="sticky top-0 z-10 mb-3 bg-[#09090a] pb-2">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{title}</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-left transition hover:border-red-500/30 hover:bg-red-500/10"
            onClick={() => onSelect(item)}
          >
            <div>
              <p className="font-['Space_Grotesk'] text-lg font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.subtitle}</p>
            </div>
            {item.shortcut ? (
              <div className="flex items-center gap-2 rounded-full border border-white/8 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                <Sparkles size={14} />
                {item.shortcut}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

export function CommandPalette({ open, onClose, items, actionItems = [] }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuery('')
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const navigationItems = useMemo<PaletteItem[]>(
    () =>
      items.map((item, index) => ({
        key: item.key,
        label: item.label,
        subtitle: item.subtitle,
        route: routes[item.key] || '/',
        shortcut: `Ctrl+${index + 1}`,
      })),
    [items],
  )

  const normalized = query.trim().toLowerCase()
  const filteredNavigation = navigationItems.filter((item) =>
    !normalized || `${item.label} ${item.subtitle} ${item.key}`.toLowerCase().includes(normalized),
  )
  const filteredActions = actionItems.filter((item) =>
    !normalized || `${item.label} ${item.subtitle} ${item.key}`.toLowerCase().includes(normalized),
  )

  if (!open) return null

  function handleSelect(item: PaletteItem) {
    void navigate({ to: item.route as never })
    setQuery('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/72 px-4 pt-14 backdrop-blur-md" onClick={() => { setQuery(''); onClose() }}>
      <div
        className="w-full max-w-3xl rounded-[30px] border border-white/10 bg-[#09090a] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 mb-4 rounded-[22px] border border-white/8 bg-[#101012] p-2">
          <label className="flex items-center gap-3 rounded-2xl px-3 py-2 text-zinc-400">
            <Search size={18} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar modulo, accion o flujo"
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
          </label>
        </div>

        <div className="max-h-[68vh] space-y-6 overflow-y-auto pr-2">
          <PaletteSection title="Navegacion" items={filteredNavigation} onSelect={handleSelect} />
          <PaletteSection title="Flujos utiles" items={filteredActions} onSelect={handleSelect} />
          {!filteredNavigation.length && !filteredActions.length ? (
            <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.03] px-4 py-10 text-center text-sm text-zinc-500">
              No hay resultados para "{query}".
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
