import { describe, expect, it } from 'vitest'

import { addWitaMinutes, formatWita, parseInstant, toWitaDateKey } from '@/utils/datetime'

describe('WITA date utilities', () => {
  it('requires an explicit timestamp offset', () => {
    expect(() => parseInstant('2026-10-04T10:00:00')).toThrow('include an offset')
  })

  it('formats and groups by WITA regardless of the source offset', () => {
    expect(toWitaDateKey('2026-10-03T17:30:00Z')).toBe('2026-10-04')
    expect(formatWita('2026-10-04T01:00:00Z')).toContain('09.00 WITA')
  })

  it('adds minutes while retaining an explicit WITA offset', () => {
    expect(addWitaMinutes('2026-10-04T23:45:00+08:00', 30)).toBe('2026-10-05T00:15:00+08:00')
  })
})
