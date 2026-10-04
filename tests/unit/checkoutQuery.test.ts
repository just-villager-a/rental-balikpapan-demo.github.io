import { describe, expect, it } from 'vitest'
import { parseCheckoutQuery, serializeCheckoutQuery } from '@/utils/checkoutQuery'
import { DEFAULT_PERIOD } from '@/utils/searchQuery'

describe('checkout query', () => {
  it('round-trips a valid selection', () => {
    const source = { kind: 'product' as const, itemId: 'prod-cam-sony-a7iii', quantity: 2, addOnIds: ['addon-tripod'], period: DEFAULT_PERIOD }
    expect(parseCheckoutQuery(serializeCheckoutQuery(source))).toEqual(source)
  })

  it('rejects a missing item or invalid quantity', () => {
    expect(parseCheckoutQuery({ kind: 'product', quantity: '0' })).toBeUndefined()
  })
})
