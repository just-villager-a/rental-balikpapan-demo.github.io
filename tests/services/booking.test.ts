// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { checkoutContactSchema, createBooking, getBooking, getCheckoutDraft, listBookingCalendarEvents, listDemoCustomerBookings, submitDemoPayment } from '@/services/booking'
import { getDemoStateService } from '@/services/mockServices'
import type { CheckoutSelection } from '@/domain/models'
import { DEFAULT_PERIOD } from '@/utils/searchQuery'

const selection: CheckoutSelection = {
  kind: 'package', itemId: 'pkg-camera-creator', quantity: 1, addOnIds: [], period: DEFAULT_PERIOD,
}

describe('customer booking happy path', () => {
  beforeEach(() => getDemoStateService().reset())

  it('builds a package quote without charging components twice', () => {
    const draft = getCheckoutDraft(selection)
    expect(draft?.quote.lines).toHaveLength(1)
    expect(draft?.quote.rentalSubtotal).toBe(1_150_000)
  })

  it('atomically allocates, persists, lists, and confirms a demo booking', () => {
    const result = createBooking({
      ...selection,
      customer: { name: 'Raka Demo', whatsapp: '+628110000001', email: 'raka@example.test' },
      termsAccepted: true,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.booking).toMatchObject({ status: 'waiting_payment', paymentStatus: 'unpaid', guaranteeStatus: 'required' })
    expect(result.booking.allocations).toHaveLength(3)
    expect(listDemoCustomerBookings().some(booking => booking.id === result.booking.id)).toBe(true)
    expect(listBookingCalendarEvents().some(event => event.id === result.booking.id)).toBe(true)
    expect(getDemoStateService().hydrate().status).toBe('restored')
    expect(getBooking(result.booking.id)).toBeDefined()

    const paid = submitDemoPayment(result.booking.id, 'deposit_paid')
    expect(paid).toMatchObject({ status: 'confirmed', paymentStatus: 'deposit_paid' })
    expect(paid?.pricing.depositPaid).toBe(paid?.pricing.depositDue)
  })

  it('rejects unavailable inventory at the final check', () => {
    const result = createBooking({
      kind: 'product', itemId: 'prod-phone-15pro', quantity: 1, addOnIds: [], period: DEFAULT_PERIOD,
      customer: { name: 'Raka Demo', whatsapp: '+628110000001' }, termsAccepted: true,
    })
    expect(result).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('rejects invalid contact details and missing consent', () => {
    expect(checkoutContactSchema.safeParse({ name: '', whatsapp: '0812', email: 'bad', termsAccepted: false }).success).toBe(false)
  })
})
