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
    <section className={cn('panel-surface rounded-[30px] p-5 md:p-6', className)}>
      {(title || subtitle || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h3 className="font-['Space_Grotesk'] text-lg font-semibold text-white">{title}</h3> : null}
            {subtitle ? <p className="text-sm leading-6 text-slate-400">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
