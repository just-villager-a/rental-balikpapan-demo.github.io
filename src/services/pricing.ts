import { differenceInMilliseconds } from 'date-fns'

import type { PricingSnapshot, QuoteLineInput, RentalPeriod } from '@/domain/models'
import { assertRentalPeriod, parseInstant } from '@/utils/datetime'

const DAY_MS = 24 * 60 * 60 * 1000

export function billableDays(period: RentalPeriod): number {
  assertRentalPeriod(period)
  return Math.max(
    1,
    Math.ceil(
      differenceInMilliseconds(parseInstant(period.returnAt), parseInstant(period.pickupAt)) / DAY_MS,
    ),
  )
}

export function quoteBooking(
  period: RentalPeriod,
  inputs: QuoteLineInput[],
  policyVersion: string,
): PricingSnapshot {
  const days = billableDays(period)
  const lines = inputs.map((line) => {
    if (!Number.isSafeInteger(line.price) || line.price < 0) throw new Error('Price must be integer IDR')
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('Quantity must be positive')
    const total = line.price * line.quantity * (line.priceUnit === 'per_day' ? days : 1)
    return {
      lineId: line.id,
      name: line.name,
      quantity: line.quantity,
      priceUnit: line.priceUnit,
      unitPrice: line.price,
      total,
    }
  })
  const rentalSubtotal = lines.reduce((sum, line) => sum + line.total, 0)
  const depositDue = Math.floor((rentalSubtotal * 30 + 50) / 100)

  return {
    billableDays: days,
    lines,
    rentalSubtotal,
    depositDue,
    depositPaid: 0,
    remainingBalance: rentalSubtotal - depositDue,
    currency: 'IDR',
    policyVersion,
  }
}
