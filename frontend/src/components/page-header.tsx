import type { ReactNode } from 'react'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p> : null}
        <h1 className="font-['Space_Grotesk'] text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-400 md:text-[15px]">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}
