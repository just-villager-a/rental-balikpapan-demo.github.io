import type {
  Booking,
  BookingStatus,
  DateTimeIso,
  GuaranteeStatus,
  PaymentStatus,
} from '@/domain/models'
import { parseInstant } from '@/utils/datetime'

const bookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  draft: ['waiting_payment'],
  waiting_payment: ['confirmed', 'expired', 'cancelled', 'rejected'],
  confirmed: ['picked_up', 'cancelled'],
  picked_up: ['returned'],
  returned: ['completed'],
  completed: [],
  expired: [],
  cancelled: [],
  rejected: [],
}

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  unpaid: ['pending_verification', 'failed', 'expired'],
  failed: ['pending_verification', 'expired'],
  pending_verification: ['deposit_paid', 'failed', 'expired'],
  deposit_paid: ['paid_in_full', 'refunded'],
  paid_in_full: ['refunded'],
  expired: [],
  refunded: [],
}

const guaranteeTransitions: Record<GuaranteeStatus, readonly GuaranteeStatus[]> = {
  required: ['presented'],
  presented: ['accepted'],
  accepted: ['returned'],
  returned: [],
}

export function canTransitionBooking(
  booking: Pick<Booking, 'status' | 'guaranteeStatus'>,
  next: BookingStatus,
): boolean {
  if (next === 'picked_up' && booking.guaranteeStatus !== 'accepted') return false
  return bookingTransitions[booking.status].includes(next)
}

export function canTransitionPayment(current: PaymentStatus, next: PaymentStatus): boolean {
  return paymentTransitions[current].includes(next)
}

export function canTransitionGuarantee(current: GuaranteeStatus, next: GuaranteeStatus): boolean {
  return guaranteeTransitions[current].includes(next)
}

function event(booking: Booking, at: DateTimeIso, label: string): Booking['timeline'][number] {
  return {
    id: `event-${booking.id}-${booking.timeline.length + 1}`,
    at,
    actor: 'demo_admin',
    label,
  }
}

export function transitionBookingStatus(
  booking: Booking,
  next: BookingStatus,
  at: DateTimeIso,
): Booking {
  if (!canTransitionBooking(booking, next)) {
    throw new Error(`Invalid booking transition: ${booking.status} -> ${next}`)
  }
  return {
    ...booking,
    status: next,
    updatedAt: at,
    timeline: [...booking.timeline, event(booking, at, `Status booking: ${next}`)],
  }
}

export function transitionPaymentStatus(
  booking: Booking,
  next: PaymentStatus,
  at: DateTimeIso,
): Booking {
  if (!canTransitionPayment(booking.paymentStatus, next)) {
    throw new Error(`Invalid payment transition: ${booking.paymentStatus} -> ${next}`)
  }
  return {
    ...booking,
    paymentStatus: next,
    updatedAt: at,
    timeline: [...booking.timeline, event(booking, at, `Status pembayaran: ${next}`)],
  }
}

export function transitionGuaranteeStatus(
  booking: Booking,
  next: GuaranteeStatus,
  at: DateTimeIso,
): Booking {
  if (!canTransitionGuarantee(booking.guaranteeStatus, next)) {
    throw new Error(`Invalid guarantee transition: ${booking.guaranteeStatus} -> ${next}`)
  }
  return {
    ...booking,
    guaranteeStatus: next,
    updatedAt: at,
    timeline: [...booking.timeline, event(booking, at, `Status jaminan: ${next}`)],
  }
}

export function expireBookingHolds(bookings: Booking[], asOf: DateTimeIso): Booking[] {
  const now = parseInstant(asOf).getTime()
  return bookings.map((booking) => {
    if (
      booking.status !== 'waiting_payment' ||
      !booking.holdExpiresAt ||
      parseInstant(booking.holdExpiresAt).getTime() > now
    ) {
      return booking
    }

    return {
      ...booking,
      status: 'expired',
      paymentStatus:
        booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'pending_verification'
          ? 'expired'
          : booking.paymentStatus,
      updatedAt: asOf,
      allocations: booking.allocations.map((allocation) => ({ ...allocation, releasedAt: asOf })),
      timeline: [
        ...booking.timeline,
        {
          id: `event-${booking.id}-expired`,
          at: asOf,
          actor: 'system',
          label: 'Masa tahan pembayaran berakhir',
        },
      ],
    }
  })
}
