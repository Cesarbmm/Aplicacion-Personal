import { cn } from '../lib/utils'

type MiniChartProps = {
  points: { date: string; value: number }[]
  strokeClassName?: string
}

export function MiniChart({ points, strokeClassName }: MiniChartProps) {
  if (!points.length) {
    return <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/8 bg-black/20 text-sm text-slate-500">Aun no hay suficientes datos.</div>
  }

  const max = Math.max(...points.map((point) => point.value), 1)
  const min = Math.min(...points.map((point) => point.value), 0)
  const range = Math.max(max - min, 1)
  const plotted = points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 100
    const y = 100 - ((point.value - min) / range) * 100
    return `${x},${y}`
  })

  return (
    <div className="space-y-3">
      <div className="h-32 rounded-2xl border border-white/6 bg-zinc-950/80 p-3">
        <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="chart-fill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(14,165,233,0.45)" />
              <stop offset="100%" stopColor="rgba(14,165,233,0.02)" />
            </linearGradient>
          </defs>
          <polyline
            fill="url(#chart-fill)"
            points={`${plotted.join(' ')} 100,100 0,100`}
            opacity="0.6"
          />
          <polyline
            fill="none"
            points={plotted.join(' ')}
            className={cn('stroke-cyan-300', strokeClassName)}
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-600">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}
