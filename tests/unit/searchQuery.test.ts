import { describe, expect, it } from 'vitest'
import { DEFAULT_PERIOD, parseSearchQuery, serializeSearchQuery } from '@/utils/searchQuery'

describe('catalog query state', () => {
  it('round-trips the rental period and filters through the URL', () => {
    const state = parseSearchQuery({
      pickup: '2026-10-20T08:30:00+08:00', return: '2026-10-22T10:00:00+08:00',
      category: 'camera,lens', brand: 'Sony', min: '100000', max: '500000', available: '1', sort: 'price_desc',
    })
    expect(parseSearchQuery(serializeSearchQuery(state))).toEqual(state)
  })

  it('falls back to the deterministic WITA period for malformed input', () => {
    expect(parseSearchQuery({ pickup: 'bad', return: 'worse' }).period).toEqual(DEFAULT_PERIOD)
  })
})
