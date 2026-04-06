import { describe, expect, it } from 'vitest'

import { formatDate, formatNumber } from './utils'

describe('utils', () => {
  it('formats numbers in es locale', () => {
    expect(formatNumber(1234.5, ' kg')).toContain('1')
    expect(formatNumber(1234.5, ' kg')).toContain('kg')
  })

  it('formats iso dates', () => {
    expect(formatDate('2026-04-02')).toMatch(/2026/)
  })
})
