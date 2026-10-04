import { z } from 'zod'
import { HOLD_DURATION_MINUTES } from '@/domain/constants'
import type { AddOn, Booking, BookingLine, CheckoutSelection, CreateBookingInput, CreateBookingResult, Product, RentalPackage } from '@/domain/models'
import { allocateRequirements, expandAllocationRequirements } from '@/services/availability'
import { getDemoStateService } from '@/services/mockServices'
import { quoteBooking } from '@/services/pricing'
import { addWitaMinutes, toWitaDateKey } from '@/utils/datetime'

export const checkoutContactSchema = z.object({
  name: z.string().trim().min(2, 'Nama wajib diisi.'),
  whatsapp: z.string().trim().regex(/^\+?62\d{8,13}$/, 'Gunakan nomor Indonesia, contoh +62812...'),
  email: z.union([z.literal(''), z.string().trim().email('Format email belum benar.')]).optional(),
  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').optional(),
  termsAccepted: z.literal(true, { error: 'Persetujuan syarat wajib dipilih.' }),
})

export interface CheckoutDraftView {
  selection: CheckoutSelection
  item: Product | RentalPackage
  addOns: AddOn[]
  quote: Booking['pricing']
}

export interface PreservedCheckout {
  selection: CheckoutSelection
  customer: { name: string; whatsapp: string; email?: string }
  note?: string
}

let preservedCheckout: PreservedCheckout | undefined

export function preserveCheckout(value: PreservedCheckout): void { preservedCheckout = structuredClone(value) }
export function getPreservedCheckout(): PreservedCheckout | undefined { return preservedCheckout ? structuredClone(preservedCheckout) : undefined }
export function clearPreservedCheckout(): void { preservedCheckout = undefined }

function scenarioNow(): string {
  const state = getDemoStateService().snapshot()
  return state.demoScenarios.find((scenario) => scenario.id === state.activeScenarioId)?.asOf ?? '2026-10-04T10:00:00+08:00'
}

export function getCheckoutDraft(selection: CheckoutSelection): CheckoutDraftView | undefined {
  const state = getDemoStateService().snapshot()
  const item = selection.kind === 'product' ? state.products.find(value => value.id === selection.itemId) : state.packages.find(value => value.id === selection.itemId)
  if (!item) return undefined
  const addOns = selection.addOnIds.map(id => state.addOns.find(value => value.id === id)).filter((value): value is AddOn => Boolean(value && value.applicableTo.includes(item.id)))
  return {
    selection,
    item,
    addOns,
    quote: quoteBooking(selection.period, [
      { id: item.id, name: item.name, quantity: selection.quantity, price: item.dailyRate, priceUnit: 'per_day' },
      ...addOns.map(addOn => ({ id: addOn.id, name: addOn.name, quantity: 1, price: addOn.price, priceUnit: addOn.priceUnit })),
    ], state.locationAndPolicyCopy.policyVersion),
  }
}

export function createBooking(input: CreateBookingInput): CreateBookingResult {
  const parsed = checkoutContactSchema.safeParse({ ...input.customer, note: input.note ?? '', termsAccepted: input.termsAccepted })
  if (!parsed.success) return { ok: false, reason: 'invalid_selection' }
  const repository = getDemoStateService()
  const state = repository.snapshot()
  const existing = state.bookings.find(booking => booking.submissionToken === input.submissionToken)
  if (existing) return { ok: true, booking: existing }
  const draft = getCheckoutDraft(input)
  if (!draft) return { ok: false, reason: 'invalid_selection' }
  const bookingId = `booking-${String(state.bookingSequence).padStart(3, '0')}`
  const primaryLineId = `line-${bookingId}-1`
  const lines: BookingLine[] = [{
    id: primaryLineId, kind: input.kind, itemId: draft.item.id, nameSnapshot: draft.item.name,
    quantity: input.quantity, priceUnit: 'per_day', unitPriceSnapshot: draft.item.dailyRate,
    packageComponentsSnapshot: input.kind === 'package' ? (draft.item as RentalPackage).components : undefined,
  }, ...draft.addOns.map((addOn, index) => ({ id: `line-${bookingId}-${index + 2}`, kind: 'addon' as const, itemId: addOn.id, nameSnapshot: addOn.name, quantity: 1, priceUnit: addOn.priceUnit, unitPriceSnapshot: addOn.price }))]
  const selectionLines = lines.map(line => ({ id: line.id, kind: line.kind, itemId: line.itemId, quantity: line.quantity }))
  const allocation = allocateRequirements({ requirements: expandAllocationRequirements(selectionLines, state.packages, state.addOns), period: input.period, units: state.inventoryUnits, bookings: state.bookings, availabilityBlocks: state.availabilityBlocks, asOf: scenarioNow() })
  const activeScenario = state.demoScenarios.find(scenario => scenario.id === state.activeScenarioId)
  if (!allocation.available || activeScenario?.mode === 'final_conflict') return { ok: false, reason: 'unavailable' }

  const now = scenarioNow()
  const sequence = state.bookingSequence
  const booking: Booking = {
    id: bookingId,
    reference: `SKB-${toWitaDateKey(now).replaceAll('-', '')}-${String(sequence).padStart(4, '0')}`,
    customerId: 'cust-demo-raka', primaryServiceCategory: draft.item.serviceCategory, period: input.period,
    createdAt: now, updatedAt: now, holdExpiresAt: addWitaMinutes(now, HOLD_DURATION_MINUTES),
    status: 'waiting_payment', paymentStatus: 'unpaid', guaranteeStatus: 'required', lines,
    allocations: allocation.allocations.map((value, index) => ({ ...value, id: `alloc-${bookingId}-${index + 1}`, bookingId })),
    pricing: draft.quote,
    customerSnapshot: { name: parsed.data.name, whatsapp: parsed.data.whatsapp, email: parsed.data.email || undefined },
    timeline: [{ id: `event-${bookingId}-1`, at: now, actor: 'demo_customer', label: 'Booking demo dibuat' }],
    note: parsed.data.note || undefined,
    submissionToken: input.submissionToken,
  }
  repository.update(next => { next.bookings.push(booking); next.bookingSequence += 1 })
  return { ok: true, booking }
}

export function getBooking(id: string): Booking | undefined {
  return getDemoStateService().snapshot().bookings.find(booking => booking.id === id)
}

export function listDemoCustomerBookings(): Booking[] {
  return getDemoStateService().snapshot().bookings.filter(booking => booking.customerId === 'cust-demo-raka').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function listBookingCalendarEvents(): { id: string; title: string; start: string; end: string; status: Booking['status'] }[] {
  return getDemoStateService().snapshot().bookings.map(booking => ({
    id: booking.id, title: `${booking.reference} · ${booking.lines[0]?.nameSnapshot ?? 'Rental'}`,
    start: booking.period.pickupAt, end: booking.period.returnAt, status: booking.status,
  }))
}

export function submitDemoPayment(id: string, outcome: 'pending' | 'deposit_paid' | 'failed' | 'expired'): Booking | undefined {
  const repository = getDemoStateService(); const now = scenarioNow(); let result: Booking | undefined
  repository.update(state => {
    const index = state.bookings.findIndex(booking => booking.id === id); if (index < 0) return
    const source = state.bookings[index]!; if (source.status !== 'waiting_payment' || !['unpaid', 'pending_verification', 'failed'].includes(source.paymentStatus)) return
    if (outcome === 'expired') {
      result = { ...source, updatedAt: now, status: 'expired', paymentStatus: 'expired', allocations: source.allocations.map(value => ({ ...value, releasedAt: now })), timeline: [...source.timeline, { id: `event-${id}-${source.timeline.length + 1}`, at: now, actor: 'system', label: 'Masa pembayaran demo berakhir' }] }
      state.bookings[index] = result
      return
    }
    if (outcome === 'failed') {
      result = { ...source, updatedAt: now, paymentStatus: 'failed', timeline: [...source.timeline, { id: `event-${id}-${source.timeline.length + 1}`, at: now, actor: 'system', label: 'Pembayaran demo gagal' }] }
      state.bookings[index] = result
      return
    }
    const paid = outcome === 'deposit_paid'
    result = { ...source, updatedAt: now, status: paid ? 'confirmed' : source.status, paymentStatus: paid ? 'deposit_paid' : 'pending_verification', pricing: { ...source.pricing, depositPaid: paid ? source.pricing.depositDue : 0, remainingBalance: paid ? source.pricing.rentalSubtotal - source.pricing.depositDue : source.pricing.remainingBalance }, timeline: [...source.timeline, { id: `event-${id}-${source.timeline.length + 1}`, at: now, actor: 'system', label: paid ? 'DP demo berhasil' : 'Pembayaran demo menunggu verifikasi' }] }
    state.bookings[index] = result
  })
  return result
}
