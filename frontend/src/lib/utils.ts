import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values))
}

export function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `${new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatDate(value: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}
