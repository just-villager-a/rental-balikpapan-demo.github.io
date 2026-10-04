import type { Booking, BookingStatus, GuaranteeStatus, PaymentStatus } from '@/domain/models'
import { getDemoStateService } from '@/services/mockServices'
import { calculateAdminOverview, filterAdminBookings, type AdminBookingFilter, type AdminOverviewSnapshot } from '@/services/analytics'
import { transitionBookingStatus, transitionGuaranteeStatus, transitionPaymentStatus } from '@/services/transitions'

export type AdminPreviewMode = 'normal' | 'loading' | 'error' | 'empty'
const failed = new Set<string>()
export function resetAdminPreviewFailures(): void { failed.clear() }

function stateAndNow() {
  const state = getDemoStateService().snapshot()
  const now = state.demoScenarios.find(scenario => scenario.id === state.activeScenarioId)?.asOf ?? '2026-10-04T10:00:00+08:00'
  return { state, now }
}

async function simulate(mode: AdminPreviewMode, key: string) {
  if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 650))
  if (mode === 'error' && !failed.has(key)) { failed.add(key); throw new Error('Simulated recoverable admin error') }
}

export async function getAdminOverview(mode: AdminPreviewMode = 'normal'): Promise<AdminOverviewSnapshot> {
  await simulate(mode, 'overview')
  const { state, now } = stateAndNow()
  return calculateAdminOverview(mode === 'empty' ? [] : state.bookings, now)
}

export async function listAdminBookings(filter?: AdminBookingFilter, mode: AdminPreviewMode = 'normal'): Promise<Booking[]> {
  await simulate(mode, `bookings-${filter ?? 'all'}`)
  const { state, now } = stateAndNow()
  return mode === 'empty' ? [] : filterAdminBookings(state.bookings, filter, now)
}

export interface AdminBookingDetailView {
  booking: Booking
  allocations: { id: string; unitLabel: string; productName: string }[]
  packageComponents: { lineId: string; productName: string; quantity: number }[]
}

export function getAdminBookingDetail(id: string): AdminBookingDetailView | undefined {
  const { state } = stateAndNow()
  const booking = state.bookings.find(value => value.id === id)
  if (!booking) return undefined
  return {
    booking,
    allocations: booking.allocations.map(allocation => ({
      id: allocation.id,
      unitLabel: state.inventoryUnits.find(unit => unit.id === allocation.inventoryUnitId)?.assetLabel ?? allocation.inventoryUnitId,
      productName: state.products.find(product => product.id === allocation.componentProductId)?.name ?? allocation.componentProductId,
    })),
    packageComponents: booking.lines.flatMap(line => line.packageComponentsSnapshot?.map(component => ({
      lineId: line.id,
      productName: state.products.find(product => product.id === component.productId)?.name ?? component.productId,
      quantity: component.quantity,
    })) ?? []),
  }
}

export type AdminTransition =
  | { kind: 'booking'; next: BookingStatus }
  | { kind: 'payment'; next: PaymentStatus }
  | { kind: 'guarantee'; next: GuaranteeStatus }

export function applyAdminTransition(id: string, transition: AdminTransition): { ok: true; booking: Booking } | { ok: false; message: string } {
  const repository = getDemoStateService()
  const { now } = stateAndNow()
  let updated: Booking | undefined
  try {
    repository.update(state => {
      const index = state.bookings.findIndex(booking => booking.id === id)
      if (index < 0) throw new Error('Booking tidak ditemukan.')
      const source = state.bookings[index]!
      updated = transition.kind === 'booking'
        ? transitionBookingStatus(source, transition.next, now)
        : transition.kind === 'payment'
          ? transitionPaymentStatus(source, transition.next, now)
          : transitionGuaranteeStatus(source, transition.next, now)
      state.bookings[index] = updated
    })
    return { ok: true, booking: updated! }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Transisi tidak valid.' }
  }
}
