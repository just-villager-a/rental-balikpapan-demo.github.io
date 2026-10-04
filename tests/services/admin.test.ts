// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyAdminTransition, getAdminBookingDetail, getAdminOverview, listAdminBookings } from '@/services/admin'
import { getDemoStateService } from '@/services/mockServices'

describe('admin services', () => {
  beforeEach(() => getDemoStateService().reset())

  it('reads overview, list, and detail from the same repository state', async () => {
    expect((await getAdminOverview()).estimatedRevenue).toBe(3_930_000)
    expect((await listAdminBookings('created_today')).map(booking => booking.id)).toEqual(['booking-003', 'booking-010'])
    expect(getAdminBookingDetail('booking-001')?.allocations.length).toBeGreaterThan(0)
  })

  it('keeps booking, payment, and guarantee transitions separate and guarded', () => {
    expect(applyAdminTransition('booking-001', { kind: 'booking', next: 'picked_up' }).ok).toBe(false)
    expect(applyAdminTransition('booking-001', { kind: 'guarantee', next: 'presented' }).ok).toBe(true)
    expect(applyAdminTransition('booking-001', { kind: 'guarantee', next: 'accepted' }).ok).toBe(true)
    expect(applyAdminTransition('booking-001', { kind: 'booking', next: 'picked_up' }).ok).toBe(true)
    const paid = applyAdminTransition('booking-003', { kind: 'payment', next: 'pending_verification' })
    expect(paid.ok && paid.booking).toMatchObject({ status: 'waiting_payment', paymentStatus: 'pending_verification' })
  })
})
