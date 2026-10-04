import type { CatalogFilters, RentalPeriod } from '@/domain/models'
import { parseInstant } from '@/utils/datetime'

export interface SearchQueryState {
  period: RentalPeriod
  filters: CatalogFilters
}

type QueryValue = string | (string | null)[] | null | undefined
type QueryRecord = Record<string, QueryValue>

export const DEFAULT_PERIOD: RentalPeriod = {
  pickupAt: '2026-10-10T09:00:00+08:00',
  returnAt: '2026-10-12T09:00:00+08:00',
  timezone: 'Asia/Makassar',
}

export const DEFAULT_FILTERS: CatalogFilters = {
  categories: [],
  brands: [],
  availableOnly: false,
  sort: 'recommended',
}

function first(value: QueryValue): string | undefined {
  return (Array.isArray(value) ? value[0] : value) ?? undefined
}

function csv(value: QueryValue): string[] {
  return (first(value) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function money(value: QueryValue): number | undefined {
  const parsed = Number(first(value))
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined
}

export function parseSearchQuery(query: QueryRecord): SearchQueryState {
  const pickup = first(query.pickup)
  const returning = first(query.return)
  let period = DEFAULT_PERIOD
  try {
    if (pickup && returning && parseInstant(returning) > parseInstant(pickup)) {
      period = { pickupAt: pickup, returnAt: returning, timezone: 'Asia/Makassar' }
    }
  } catch {
    period = DEFAULT_PERIOD
  }

  const sort = first(query.sort)
  return {
    period,
    filters: {
      categories: csv(query.category),
      brands: csv(query.brand),
      minDailyRate: money(query.min),
      maxDailyRate: money(query.max),
      availableOnly: first(query.available) === '1',
      sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'recommended',
    },
  }
}

export function hasInvalidSearchPeriod(query: QueryRecord): boolean {
  const pickup = first(query.pickup)
  const returning = first(query.return)
  if (!pickup && !returning) return false
  if (!pickup || !returning) return true
  try { return parseInstant(returning) <= parseInstant(pickup) } catch { return true }
}

export function serializeSearchQuery(state: SearchQueryState): Record<string, string> {
  const query: Record<string, string> = {
    pickup: state.period.pickupAt,
    return: state.period.returnAt,
  }
  if (state.filters.categories.length) query.category = state.filters.categories.join(',')
  if (state.filters.brands.length) query.brand = state.filters.brands.join(',')
  if (state.filters.minDailyRate !== undefined) query.min = String(state.filters.minDailyRate)
  if (state.filters.maxDailyRate !== undefined) query.max = String(state.filters.maxDailyRate)
  if (state.filters.availableOnly) query.available = '1'
  if (state.filters.sort !== 'recommended') query.sort = state.filters.sort
  return query
}

export function toDateTimeLocal(value: string): string {
  return value.slice(0, 16)
}

export function fromWitaDateTimeLocal(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Invalid date and time')
  return `${value}:00+08:00`
}
