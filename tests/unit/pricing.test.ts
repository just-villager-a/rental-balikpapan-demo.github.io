import { describe, expect, it } from 'vitest'

import type { RentalPeriod } from '@/domain/models'
import { billableDays, quoteBooking } from '@/services/pricing'
import { formatIdr } from '@/utils/currency'

const period = (pickupAt: string, returnAt: string): RentalPeriod => ({
  pickupAt,
  returnAt,
  timezone: 'Asia/Makassar',
})

describe('pricing', () => {
  it('charges exactly 24 hours as one day and 25 hours as two', () => {
    expect(billableDays(period('2026-10-10T09:00:00+08:00', '2026-10-11T09:00:00+08:00'))).toBe(1)
    expect(billableDays(period('2026-10-10T09:00:00+08:00', '2026-10-11T10:00:00+08:00'))).toBe(2)
  })

  it('rejects rentals shorter than 24 hours', () => {
    expect(() =>
      billableDays(period('2026-10-10T09:00:00+08:00', '2026-10-11T08:59:59+08:00')),
    ).toThrow('Minimum rental is 24 hours')
  })

  it('prices per-day and one-time lines and rounds the 30% DP half up', () => {
    const quote = quoteBooking(
      period('2026-10-10T09:00:00+08:00', '2026-10-12T09:00:00+08:00'),
      [
        { id: 'camera', name: 'Camera', quantity: 1, price: 350_000, priceUnit: 'per_day' },
        { id: 'tripod', name: 'Tripod', quantity: 1, price: 40_000, priceUnit: 'per_day' },
        { id: 'fee', name: 'One-time item', quantity: 1, price: 1, priceUnit: 'one_time' },
      ],
      'demo-policy-v1',
    )

    expect(quote.rentalSubtotal).toBe(780_001)
    expect(quote.depositDue).toBe(234_000)
    expect(quote.remainingBalance).toBe(546_001)

    const halfRupiah = quoteBooking(
      period('2026-10-10T09:00:00+08:00', '2026-10-11T09:00:00+08:00'),
      [{ id: 'small', name: 'Small', quantity: 1, price: 5, priceUnit: 'one_time' }],
      'demo-policy-v1',
    )
    expect(halfRupiah.depositDue).toBe(2)
    expect(formatIdr(350_000)).toBe('Rp350.000')
  })
})
