import type { CheckoutSelection } from '@/domain/models'
import { parseSearchQuery } from '@/utils/searchQuery'

type QueryValue = string | (string | null)[] | null | undefined
type QueryRecord = Record<string, QueryValue>

const first = (value: QueryValue) => (Array.isArray(value) ? value[0] : value) ?? undefined

export function parseCheckoutQuery(query: QueryRecord): CheckoutSelection | undefined {
  const kind = first(query.kind)
  const itemId = first(query.item)
  const quantity = Number(first(query.quantity) ?? 1)
  if ((kind !== 'product' && kind !== 'package') || !itemId || !Number.isInteger(quantity) || quantity < 1) return undefined
  return {
    kind,
    itemId,
    quantity,
    addOnIds: (first(query.addons) ?? '').split(',').filter(Boolean),
    period: parseSearchQuery(query).period,
  }
}

export function serializeCheckoutQuery(selection: CheckoutSelection): Record<string, string> {
  const query: Record<string, string> = {
    kind: selection.kind,
    item: selection.itemId,
    quantity: String(selection.quantity),
    pickup: selection.period.pickupAt,
    return: selection.period.returnAt,
  }
  if (selection.addOnIds.length) query.addons = selection.addOnIds.join(',')
  return query
}
