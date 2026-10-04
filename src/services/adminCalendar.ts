import type {
  AvailabilityBlockReason,
  BookingStatus,
  DateTimeIso,
  RentalPeriod,
  ServiceCategory,
} from '@/domain/models'
import { getDemoStateService } from '@/services/mockServices'
import { parseInstant } from '@/utils/datetime'
import { statusLabel } from '@/utils/status'

export interface CalendarFilters {
  serviceCategory?: ServiceCategory
  productId?: string
  bookingStatus?: BookingStatus
}

export interface AdminCalendarEvent {
  id: string
  title: string
  start: DateTimeIso
  end: DateTimeIso
  color: string
  contrastColor: string
  extendedProps: {
    kind: 'booking' | 'block'
    bookingId?: string
    status: string
    productIds: string[]
  }
}

export type CalendarPreviewMode = 'normal' | 'loading' | 'error' | 'empty'

const failed = new Set<string>()
export function resetCalendarPreviewFailures(): void { failed.clear() }

const statusColors: Record<BookingStatus, string> = {
  draft: '#68655e',
  waiting_payment: '#a85b00',
  confirmed: '#2563eb',
  picked_up: '#7c3aed',
  returned: '#197a48',
  completed: '#166534',
  expired: '#68655e',
  cancelled: '#b42318',
  rejected: '#b42318',
}

const reasonLabels: Record<AvailabilityBlockReason, string> = {
  maintenance: 'Perawatan',
  damage: 'Kerusakan',
  internal_use: 'Pemakaian internal',
  manual_hold: 'Ditahan manual',
}

async function simulate(mode: CalendarPreviewMode): Promise<void> {
  if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 650))
  if (mode === 'error' && !failed.has('calendar')) {
    failed.add('calendar')
    throw new Error('Simulated recoverable calendar error')
  }
}

function intersects(range: RentalPeriod | undefined, start: DateTimeIso, end: DateTimeIso): boolean {
  if (!range) return true
  return parseInstant(start) < parseInstant(range.returnAt) && parseInstant(range.pickupAt) < parseInstant(end)
}

export async function listAdminCalendarEvents(
  filters: CalendarFilters = {},
  range?: RentalPeriod,
  mode: CalendarPreviewMode = 'normal',
): Promise<AdminCalendarEvent[]> {
  await simulate(mode)
  if (mode === 'empty') return []
  const state = getDemoStateService().snapshot()

  const bookingEvents = state.bookings.flatMap((booking): AdminCalendarEvent[] => {
    const productIds = [...new Set(booking.lines.flatMap(line =>
      line.kind === 'product'
        ? [line.itemId]
        : line.packageComponentsSnapshot?.map(component => component.productId) ?? [],
    ))]
    if (filters.serviceCategory && booking.primaryServiceCategory !== filters.serviceCategory) return []
    if (filters.productId && !productIds.includes(filters.productId)) return []
    if (filters.bookingStatus && booking.status !== filters.bookingStatus) return []
    if (!intersects(range, booking.period.pickupAt, booking.period.returnAt)) return []
    const color = statusColors[booking.status]
    return [{
      id: `booking-${booking.id}`,
      title: `Booking · ${statusLabel(booking.status)} · ${booking.reference}`,
      start: booking.period.pickupAt,
      end: booking.period.returnAt,
      color,
      contrastColor: '#ffffff',
      extendedProps: { kind: 'booking', bookingId: booking.id, status: booking.status, productIds },
    }]
  })

  const blockEvents = state.availabilityBlocks.flatMap((block): AdminCalendarEvent[] => {
    if (filters.bookingStatus) return []
    const unit = state.inventoryUnits.find(candidate => candidate.id === block.inventoryUnitId)
    const product = state.products.find(candidate => candidate.id === unit?.productId)
    if (!unit || !product) return []
    if (filters.serviceCategory && product.serviceCategory !== filters.serviceCategory) return []
    if (filters.productId && product.id !== filters.productId) return []
    if (!intersects(range, block.period.pickupAt, block.period.returnAt)) return []
    return [{
      id: `block-${block.id}`,
      title: `Blok · ${reasonLabels[block.reason]} · ${unit.assetLabel}`,
      start: block.period.pickupAt,
      end: block.period.returnAt,
      color: '#343434',
      contrastColor: '#ffffff',
      extendedProps: { kind: 'block', status: block.reason, productIds: [product.id] },
    }]
  })

  return [...bookingEvents, ...blockEvents]
}

export function calendarFilterOptions() {
  const state = getDemoStateService().snapshot()
  return {
    products: state.products.map(product => ({ id: product.id, name: product.name, serviceCategory: product.serviceCategory })),
  }
}
