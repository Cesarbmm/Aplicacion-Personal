import type { ReactNode } from 'react'

type MetricCardProps = {
  title: string
  value: string
  caption: string
  icon?: ReactNode
}

export function MetricCard({ title, value, caption, icon }: MetricCardProps) {
  return (
    <article className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,21,31,0.92),rgba(9,14,22,0.96))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{title}</p>
        {icon}
      </div>
      <p className="font-['Space_Grotesk'] text-3xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{caption}</p>
    </article>
  )
}
