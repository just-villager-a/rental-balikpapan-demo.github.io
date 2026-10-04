import { describe, expect, it } from 'vitest'

import type { Booking, InventoryUnit, RentalPeriod } from '@/domain/models'
import { allocateRequirements, expandAllocationRequirements, overlaps } from '@/services/availability'
import { quoteBooking } from '@/services/pricing'

const requested: RentalPeriod = {
  pickupAt: '2026-10-10T09:00:00+08:00',
  returnAt: '2026-10-11T09:00:00+08:00',
  timezone: 'Asia/Makassar',
}

const units: InventoryUnit[] = [
  { id: 'UNIT-002', productId: 'camera', assetLabel: 'UNIT-002', lifecycle: 'active', variantTags: [] },
  { id: 'UNIT-001', productId: 'camera', assetLabel: 'UNIT-001', lifecycle: 'active', variantTags: [] },
  { id: 'UNIT-003', productId: 'camera', assetLabel: 'UNIT-003', lifecycle: 'inactive', variantTags: [] },
]

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking',
    reference: 'SKB-20261001-0001',
    customerId: 'customer',
    primaryServiceCategory: 'camera',
    period: requested,
    createdAt: '2026-10-01T09:00:00+08:00',
    updatedAt: '2026-10-01T09:00:00+08:00',
    status: 'confirmed',
    paymentStatus: 'deposit_paid',
    guaranteeStatus: 'required',
    lines: [],
    allocations: [
      {
        id: 'allocation',
        bookingId: 'booking',
        bookingLineId: 'line',
        inventoryUnitId: 'UNIT-001',
        componentProductId: 'camera',
      },
    ],
    pricing: quoteBooking(requested, [], 'demo-policy-v1'),
    customerSnapshot: { name: 'Demo', whatsapp: '+628110000000' },
    timeline: [],
    ...overrides,
  }
}

describe('availability', () => {
  it('uses half-open overlap boundaries', () => {
    expect(
      overlaps(requested, {
        pickupAt: requested.returnAt,
        returnAt: '2026-10-12T09:00:00+08:00',
        timezone: 'Asia/Makassar',
      }),
    ).toBe(false)
  })

  it('applies the one-hour inspection buffer', () => {
    const existing = booking({
      period: {
        pickupAt: '2026-10-09T09:00:00+08:00',
        returnAt: '2026-10-10T08:30:00+08:00',
        timezone: 'Asia/Makassar',
      },
    })
    const result = allocateRequirements({
      requirements: [{ bookingLineId: 'new-line', productId: 'camera', quantity: 2 }],
      period: requested,
      units,
      bookings: [existing],
      availabilityBlocks: [],
      asOf: '2026-10-04T10:00:00+08:00',
    })

    expect(result.available).toBe(false)
    expect(result.allocations).toEqual([])
  })

  it('allocates active units deterministically and atomically', () => {
    const result = allocateRequirements({
      requirements: [{ bookingLineId: 'new-line', productId: 'camera', quantity: 2 }],
      period: requested,
      units,
      bookings: [],
      availabilityBlocks: [],
      asOf: '2026-10-04T10:00:00+08:00',
    })

    expect(result.available).toBe(true)
    expect(result.allocations.map((allocation) => allocation.inventoryUnitId)).toEqual([
      'UNIT-001',
      'UNIT-002',
    ])

    const unavailable = allocateRequirements({
      requirements: [
        { bookingLineId: 'first', productId: 'camera', quantity: 2 },
        { bookingLineId: 'second', productId: 'camera', quantity: 1 },
      ],
      period: requested,
      units,
      bookings: [],
      availabilityBlocks: [],
      asOf: '2026-10-04T10:00:00+08:00',
    })
    expect(unavailable).toMatchObject({ available: false, allocations: [] })
  })

  it('expands package components and only stock-tracked add-ons', () => {
    const requirements = expandAllocationRequirements(
      [
        { id: 'package-line', kind: 'package', itemId: 'package', quantity: 2 },
        { id: 'tracked-line', kind: 'addon', itemId: 'tracked', quantity: 1 },
        { id: 'service-line', kind: 'addon', itemId: 'service', quantity: 1 },
      ],
      [
        {
          id: 'package',
          slug: 'package',
          name: 'Package',
          serviceCategory: 'camera',
          dailyRate: 1,
          components: [{ productId: 'camera', quantity: 1 }],
          imagePaths: [],
        },
      ],
      [
        {
          id: 'tracked',
          productId: 'tripod',
          name: 'Tripod',
          price: 1,
          priceUnit: 'per_day',
          stockTracked: true,
          applicableTo: [],
        },
        {
          id: 'service',
          name: 'Service',
          price: 1,
          priceUnit: 'one_time',
          stockTracked: false,
          applicableTo: [],
        },
      ],
    )

    expect(requirements).toEqual([
      { bookingLineId: 'package-line', productId: 'camera', quantity: 2 },
      { bookingLineId: 'tracked-line', productId: 'tripod', quantity: 1 },
    ])
  })

  it('ignores an expired waiting-payment hold', () => {
    const result = allocateRequirements({
      requirements: [{ bookingLineId: 'new-line', productId: 'camera', quantity: 2 }],
      period: requested,
      units,
      bookings: [
        booking({
          status: 'waiting_payment',
          paymentStatus: 'unpaid',
          holdExpiresAt: '2026-10-04T09:59:59+08:00',
        }),
      ],
      availabilityBlocks: [],
      asOf: '2026-10-04T10:00:00+08:00',
    })

    expect(result.available).toBe(true)
  })
})
