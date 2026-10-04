import { describe, expect, it } from 'vitest'
import seedJson from '@/data/seed.json'
import type { DemoState } from '@/domain/models'
import { calculateAdminOverview, filterAdminBookings } from '@/services/analytics'

const state = seedJson as DemoState
const asOf = '2026-10-04T10:00:00+08:00'

describe('admin analytics', () => {
  it('matches the fixed seeded overview definitions', () => {
    const overview = calculateAdminOverview(state.bookings, asOf)
    expect(overview).toMatchObject({
      bookingsToday: 2,
      activeRentals: 0,
      upcomingPickups: 2,
      estimatedRevenue: 3_930_000,
      distribution: { camera: 4, iphone: 2 },
    })
    expect(overview.trend).toHaveLength(30)
    expect(overview.trend.reduce((sum, point) => sum + point.count, 0)).toBe(10)
    expect(overview.attention.map(item => [item.booking.id, item.reasons])).toEqual([
      ['booking-003', ['Belum dibayar']],
      ['booking-004', ['Terlambat kembali']],
      ['booking-005', ['Pengambilan hari ini']],
    ])
  })

  it('deduplicates attention rows while retaining every reason', () => {
    const overdueUnpaid = { ...state.bookings.find(booking => booking.id === 'booking-004')!, paymentStatus: 'failed' as const }
    const overview = calculateAdminOverview([overdueUnpaid], asOf)
    expect(overview.attention).toHaveLength(1)
    expect(overview.attention[0]?.reasons).toEqual(['Belum dibayar', 'Terlambat kembali'])
  })

  it('applies only the predefined drill-through filters', () => {
    expect(filterAdminBookings(state.bookings, 'created_today', asOf).map(booking => booking.id)).toEqual(['booking-003', 'booking-010'])
    expect(filterAdminBookings(state.bookings, 'upcoming_pickup', asOf)).toHaveLength(2)
    expect(filterAdminBookings(state.bookings, 'pickup_today', asOf).map(booking => booking.id)).toEqual(['booking-005'])
  })
})
