import * as Progress from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

type ProgressBarProps = {
  value: number
  className?: string
  indicatorClassName?: string
}

export function ProgressBar({ value, className, indicatorClassName }: ProgressBarProps) {
  return (
    <Progress.Root
      className={cn('relative h-2.5 overflow-hidden rounded-full bg-white/8', className)}
      value={value}
    >
      <Progress.Indicator
        className={cn(
          'h-full w-full rounded-full bg-gradient-to-r from-red-600 via-red-500 to-red-500 transition-transform duration-500',
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)` }}
      />
    </Progress.Root>
  )
}

