import { describe, expect, it } from 'vitest'
import { DemoRepository } from '@/repositories/demoRepository'
import { searchCatalogState } from '@/services/catalog'
import { DEFAULT_PERIOD } from '@/utils/searchQuery'

class MemoryStorage implements Storage {
  data = new Map<string, string>(); get length() { return this.data.size }
  clear() { this.data.clear() } getItem(key: string) { return this.data.get(key) ?? null }
  key(index: number) { return [...this.data.keys()][index] ?? null } removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, value) }
}
const state = new DemoRepository(new MemoryStorage()).snapshot()
const filters = { categories: [], brands: [], availableOnly: false, sort: 'recommended' as const }

describe('catalog search', () => {
  it('derives unavailable products from physical units and blocks', () => {
    const item = searchCatalogState(state, { period: DEFAULT_PERIOD, filters }).find(candidate => candidate.slug === 'iphone-15-pro-256gb')
    expect(item).toMatchObject({ availableCount: 0, availability: 'unavailable' })
  })

  it('applies categories, availability and prices without changing domain rules', () => {
    const results = searchCatalogState(state, { period: DEFAULT_PERIOD, filters: { ...filters, categories: ['camera'], availableOnly: true, maxDailyRate: 400000 } })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(item => item.serviceCategory === 'camera' && item.availableCount > 0 && item.dailyRate <= 400000)).toBe(true)
  })

  it('returns a stable empty result for unmatched filters', () => {
    expect(searchCatalogState(state, { period: DEFAULT_PERIOD, filters: { ...filters, brands: ['Not a real brand'] } })).toEqual([])
  })
})
