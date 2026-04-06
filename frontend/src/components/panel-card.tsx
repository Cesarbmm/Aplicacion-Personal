import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '../lib/utils'

type PanelCardProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}>

export function PanelCard({ title, subtitle, action, className, children }: PanelCardProps) {
  return (
    <section className={cn('rounded-[26px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl', className)}>
      {(title || subtitle || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-white">{title}</h3> : null}
            {subtitle ? <p className="text-sm leading-6 text-zinc-400">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
