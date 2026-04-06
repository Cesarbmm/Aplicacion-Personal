import type { ReactNode } from 'react'

type MetricCardProps = {
  title: string
  value: string
  caption: string
  icon?: ReactNode
}

export function MetricCard({ title, value, caption, icon }: MetricCardProps) {
  return (
    <article className="rounded-[22px] border border-white/7 bg-[#09090a]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        {icon}
      </div>
      <p className="font-['Space_Grotesk'] text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{caption}</p>
    </article>
  )
}
