import type {
  AddOn,
  AllocationRequirement,
  AllocationResult,
  AvailabilityBlock,
  Booking,
  BookingSelectionLine,
  DateTimeIso,
  InventoryUnit,
  RentalPackage,
  RentalPeriod,
} from '@/domain/models'
import { BLOCKING_BOOKING_STATUSES, INSPECTION_BUFFER_MINUTES } from '@/domain/constants'
import { addWitaMinutes, assertRentalPeriod, parseInstant } from '@/utils/datetime'

export function expandAllocationRequirements(
  lines: BookingSelectionLine[],
  packages: RentalPackage[],
  addOns: AddOn[],
): AllocationRequirement[] {
  return lines.flatMap((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error('Selection quantity must be positive')
    }
    if (line.kind === 'product') {
      return [{ bookingLineId: line.id, productId: line.itemId, quantity: line.quantity }]
    }
    if (line.kind === 'package') {
      const rentalPackage = packages.find((candidate) => candidate.id === line.itemId)
      if (!rentalPackage) throw new Error(`Unknown package: ${line.itemId}`)
      return rentalPackage.components.map((component) => ({
        bookingLineId: line.id,
        productId: component.productId,
        quantity: component.quantity * line.quantity,
        variantTags: component.variantTags,
      }))
    }

    const addOn = addOns.find((candidate) => candidate.id === line.itemId)
    if (!addOn) throw new Error(`Unknown add-on: ${line.itemId}`)
    if (!addOn.stockTracked) return []
    if (!addOn.productId) throw new Error(`Stock-tracked add-on lacks a product: ${line.itemId}`)
    return [{ bookingLineId: line.id, productId: addOn.productId, quantity: line.quantity }]
  })
}

export function overlaps(a: RentalPeriod, b: RentalPeriod): boolean {
  return (
    parseInstant(a.pickupAt).getTime() < parseInstant(b.returnAt).getTime() &&
    parseInstant(b.pickupAt).getTime() < parseInstant(a.returnAt).getTime()
  )
}

function bookingBlocks(booking: Booking, asOf: DateTimeIso): boolean {
  if (!BLOCKING_BOOKING_STATUSES.has(booking.status)) return false
  if (booking.status === 'waiting_payment' && booking.holdExpiresAt) {
    return parseInstant(booking.holdExpiresAt).getTime() > parseInstant(asOf).getTime()
  }
  return true
}

export type UnitConflict =
  | { kind: 'booking'; booking: Booking }
  | { kind: 'block'; block: AvailabilityBlock }

export function findUnitConflict(
  unitId: string,
  requestedPeriod: RentalPeriod,
  bookings: Booking[],
  availabilityBlocks: AvailabilityBlock[],
  asOf: DateTimeIso,
): UnitConflict | undefined {
  const bookingConflict = bookings.find(
    (booking) =>
      bookingBlocks(booking, asOf) &&
      booking.allocations.some(
        (allocation) => allocation.inventoryUnitId === unitId && !allocation.releasedAt,
      ) &&
      overlaps(requestedPeriod, {
        ...booking.period,
        returnAt: addWitaMinutes(booking.period.returnAt, INSPECTION_BUFFER_MINUTES),
      }),
  )
  if (bookingConflict) return { kind: 'booking', booking: bookingConflict }

  const blockConflict = availabilityBlocks.find(
    (block) => block.inventoryUnitId === unitId && overlaps(requestedPeriod, block.period),
  )
  return blockConflict ? { kind: 'block', block: blockConflict } : undefined
}

export function allocateRequirements(input: {
  requirements: AllocationRequirement[]
  period: RentalPeriod
  units: InventoryUnit[]
  bookings: Booking[]
  availabilityBlocks: AvailabilityBlock[]
  asOf: DateTimeIso
}): AllocationResult {
  assertRentalPeriod(input.period)
  const reserved = new Set<string>()
  const allocations: AllocationResult['allocations'] = []

  for (const requirement of input.requirements) {
    if (!Number.isInteger(requirement.quantity) || requirement.quantity < 1) {
      throw new Error('Allocation quantity must be positive')
    }

    const eligible = input.units
      .filter(
        (unit) =>
          unit.productId === requirement.productId &&
          unit.lifecycle === 'active' &&
          !reserved.has(unit.id) &&
          (requirement.variantTags ?? []).every((tag) => unit.variantTags.includes(tag)) &&
          !findUnitConflict(
            unit.id,
            input.period,
            input.bookings,
            input.availabilityBlocks,
            input.asOf,
          ),
      )
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, requirement.quantity)

    if (eligible.length !== requirement.quantity) {
      return { available: false, allocations: [], unavailableRequirement: requirement }
    }

    for (const unit of eligible) {
      reserved.add(unit.id)
      allocations.push({
        bookingLineId: requirement.bookingLineId,
        inventoryUnitId: unit.id,
        componentProductId: requirement.productId,
      })
    }
  }

  return { available: true, allocations }
}
