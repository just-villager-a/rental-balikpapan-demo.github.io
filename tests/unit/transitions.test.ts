import { describe, expect, it } from 'vitest'

import type { Booking } from '@/domain/models'
import {
  canTransitionBooking,
  canTransitionGuarantee,
  canTransitionPayment,
  expireBookingHolds,
  transitionBookingStatus,
  transitionGuaranteeStatus,
  transitionPaymentStatus,
} from '@/services/transitions'
import { quoteBooking } from '@/services/pricing'

const period = {
  pickupAt: '2026-10-10T09:00:00+08:00',
  returnAt: '2026-10-11T09:00:00+08:00',
  timezone: 'Asia/Makassar' as const,
}

function waitingBooking(): Booking {
  return {
    id: 'booking',
    reference: 'SKB-20261004-0001',
    customerId: 'customer',
    primaryServiceCategory: 'camera',
    period,
    createdAt: '2026-10-04T09:30:00+08:00',
    updatedAt: '2026-10-04T09:30:00+08:00',
    holdExpiresAt: '2026-10-04T10:00:00+08:00',
    status: 'waiting_payment',
    paymentStatus: 'unpaid',
    guaranteeStatus: 'required',
    lines: [],
    allocations: [
      {
        id: 'allocation',
        bookingId: 'booking',
        bookingLineId: 'line',
        inventoryUnitId: 'unit',
        componentProductId: 'product',
      },
    ],
    pricing: quoteBooking(period, [], 'demo-policy-v1'),
    customerSnapshot: { name: 'Demo', whatsapp: '+628110000000' },
    timeline: [],
  }
}

describe('status transitions', () => {
  it('rejects reverse and nonsensical transitions', () => {
    expect(canTransitionBooking({ status: 'completed', guaranteeStatus: 'returned' }, 'picked_up')).toBe(false)
    expect(canTransitionPayment('expired', 'pending_verification')).toBe(false)
    expect(canTransitionGuarantee('returned', 'accepted')).toBe(false)
  })

  it('requires an accepted guarantee before pickup', () => {
    expect(canTransitionBooking({ status: 'confirmed', guaranteeStatus: 'presented' }, 'picked_up')).toBe(false)
    expect(canTransitionBooking({ status: 'confirmed', guaranteeStatus: 'accepted' }, 'picked_up')).toBe(true)
  })

  it('changes only the requested state model', () => {
    const source = waitingBooking()
    const paid = transitionPaymentStatus(source, 'pending_verification', '2026-10-04T09:40:00+08:00')
    expect(paid.status).toBe('waiting_payment')
    expect(paid.paymentStatus).toBe('pending_verification')

    const confirmed = transitionBookingStatus(
      { ...source, status: 'confirmed', guaranteeStatus: 'accepted' },
      'picked_up',
      '2026-10-10T09:00:00+08:00',
    )
    expect(confirmed.paymentStatus).toBe('unpaid')

    const presented = transitionGuaranteeStatus(source, 'presented', '2026-10-10T08:55:00+08:00')
    expect(presented.status).toBe('waiting_payment')
    expect(presented.guaranteeStatus).toBe('presented')
  })

  it('expires holds and releases allocations at the boundary', () => {
    const [expired] = expireBookingHolds([waitingBooking()], '2026-10-04T10:00:00+08:00')
    expect(expired).toMatchObject({ status: 'expired', paymentStatus: 'expired' })
    expect(expired?.allocations[0]?.releasedAt).toBe('2026-10-04T10:00:00+08:00')
  })
})
