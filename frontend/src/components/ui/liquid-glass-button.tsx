"use client"

import * as React from 'react'
import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-red-500 text-slate-950 shadow-[0_10px_30px_rgba(239,27,27,0.25)] hover:bg-red-300',
        secondary:
          'border border-white/10 bg-white/[0.04] text-white hover:border-red-500/30 hover:bg-red-500/10',
        ghost: 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
      },
      size: {
        sm: 'h-10 px-4',
        md: 'h-11 px-5',
        lg: 'h-12 px-7',
        xl: 'h-14 px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  },
)

Button.displayName = 'Button'

const liquidButtonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'text-white',
        secondary: 'text-slate-100',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6 text-sm',
        xl: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'xl',
    },
  },
)

type LiquidButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof liquidButtonVariants> & {
    asChild?: boolean
  }

export function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: LiquidButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp className={cn(liquidButtonVariants({ variant, size, className }))} {...props}>
      <span className="absolute inset-0 rounded-full border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_28%,rgba(239,27,27,0.22)_100%)] shadow-[0_18px_40px_rgba(239,27,27,0.22),inset_0_1px_0_rgba(255,255,255,0.2)]" />
      <span className="absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(239,27,27,0.18),rgba(8,12,18,0.6))]" />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_30%)] opacity-70" />
      <span className="relative z-10 flex items-center gap-2">
        <Slottable>{children}</Slottable>
      </span>
    </Comp>
  )
}
