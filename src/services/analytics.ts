import type { Booking, BookingStatus, DateTimeIso, MoneyIdr, ServiceCategory } from '@/domain/models'
import { addWitaMinutes, parseInstant, toWitaDateKey } from '@/utils/datetime'

export type AdminBookingFilter = 'created_today' | 'active' | 'upcoming_pickup' | 'camera' | 'iphone' | 'unpaid' | 'overdue' | 'pickup_today'
export type AttentionReason = 'Belum dibayar' | 'Terlambat kembali' | 'Pengambilan hari ini'

export interface AdminOverviewSnapshot {
  bookingsToday: number
  activeRentals: number
  upcomingPickups: number
  estimatedRevenue: MoneyIdr
  distribution: Record<ServiceCategory, number>
  trend: { date: string; count: number }[]
  attention: { booking: Booking; reasons: AttentionReason[] }[]
}

const revenueStatuses = new Set<BookingStatus>(['waiting_payment', 'confirmed', 'picked_up', 'returned', 'completed'])
const openStatuses = new Set<BookingStatus>(['waiting_payment', 'confirmed', 'picked_up', 'returned'])

function between(value: DateTimeIso, start: number, end: number): boolean {
  const instant = parseInstant(value).getTime()
  return instant >= start && instant <= end
}

export function filterAdminBookings(bookings: Booking[], filter: AdminBookingFilter | undefined, asOf: DateTimeIso): Booking[] {
  if (!filter) return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const now = parseInstant(asOf).getTime()
  const today = toWitaDateKey(asOf)
  const weekEnd = parseInstant(addWitaMinutes(asOf, 7 * 24 * 60)).getTime()
  return bookings.filter((booking) => {
    if (filter === 'created_today') return booking.status !== 'draft' && toWitaDateKey(booking.createdAt) === today
    if (filter === 'active') { const instant = parseInstant(asOf).getTime(); return booking.status === 'picked_up' && parseInstant(booking.period.pickupAt).getTime() <= instant && instant < parseInstant(booking.period.returnAt).getTime() }
    if (filter === 'upcoming_pickup') return booking.status === 'confirmed' && between(booking.period.pickupAt, now, weekEnd)
    if (filter === 'camera' || filter === 'iphone') return booking.primaryServiceCategory === filter
    if (filter === 'unpaid') return openStatuses.has(booking.status) && (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'failed')
    if (filter === 'overdue') return booking.status === 'picked_up' && parseInstant(booking.period.returnAt).getTime() < now
    return booking.status === 'confirmed' && toWitaDateKey(booking.period.pickupAt) === today
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function calculateAdminOverview(bookings: Booking[], asOf: DateTimeIso): AdminOverviewSnapshot {
  const month = toWitaDateKey(asOf).slice(0, 7)
  const included = bookings.filter(booking => revenueStatuses.has(booking.status) && toWitaDateKey(booking.period.pickupAt).startsWith(month))
  const attention = bookings.flatMap((booking) => {
    const reasons: AttentionReason[] = []
    if (openStatuses.has(booking.status) && (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'failed')) reasons.push('Belum dibayar')
    if (booking.status === 'picked_up' && parseInstant(booking.period.returnAt).getTime() < parseInstant(asOf).getTime()) reasons.push('Terlambat kembali')
    if (booking.status === 'confirmed' && toWitaDateKey(booking.period.pickupAt) === toWitaDateKey(asOf)) reasons.push('Pengambilan hari ini')
    return reasons.length ? [{ booking, reasons }] : []
  })
  const trendDates = Array.from({ length: 30 }, (_, index) => toWitaDateKey(addWitaMinutes(asOf, (index - 29) * 24 * 60)))
  return {
    bookingsToday: filterAdminBookings(bookings, 'created_today', asOf).length,
    activeRentals: filterAdminBookings(bookings, 'active', asOf).length,
    upcomingPickups: filterAdminBookings(bookings, 'upcoming_pickup', asOf).length,
    estimatedRevenue: included.reduce((sum, booking) => sum + booking.pricing.rentalSubtotal, 0),
    distribution: {
      camera: included.filter(booking => booking.primaryServiceCategory === 'camera').length,
      iphone: included.filter(booking => booking.primaryServiceCategory === 'iphone').length,
    },
    trend: trendDates.map(date => ({ date, count: bookings.filter(booking => booking.status !== 'draft' && toWitaDateKey(booking.createdAt) === date).length })),
    attention,
  }
}
