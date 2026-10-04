import { z } from 'zod'

import { DEMO_SCHEMA_VERSION, WITA_TIMEZONE } from '@/domain/constants'

const id = z.string().min(1)
const money = z.number().int().nonnegative()
const dateTimeIso = z.string().datetime({ offset: true })
const rentalPeriod = z.object({
  pickupAt: dateTimeIso,
  returnAt: dateTimeIso,
  timezone: z.literal(WITA_TIMEZONE),
})
const packageComponent = z.object({
  productId: id,
  quantity: z.number().int().positive(),
  variantTags: z.array(z.string()).optional(),
})
const pricedLine = z.object({
  lineId: id,
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  priceUnit: z.enum(['per_day', 'one_time']),
  unitPrice: money,
  total: money,
})
const allocation = z.object({
  id,
  bookingId: id,
  bookingLineId: id,
  inventoryUnitId: id,
  componentProductId: id,
  releasedAt: dateTimeIso.optional(),
})
const bookingEvent = z.object({
  id,
  at: dateTimeIso,
  actor: z.enum(['demo_customer', 'demo_admin', 'system']),
  label: z.string().min(1),
})
const customerContact = z.object({
  name: z.string().min(1),
  whatsapp: z.string().min(1),
  email: z.string().email().optional(),
})

export const demoStateSchema = z
  .object({
    schemaVersion: z.literal(DEMO_SCHEMA_VERSION),
    activeScenarioId: id,
    bookingSequence: z.number().int().nonnegative(),
    products: z.array(
      z.object({
        id,
        slug: id,
        category: z.enum(['camera', 'lens', 'iphone', 'accessory']),
        serviceCategory: z.enum(['camera', 'iphone']),
        name: z.string().min(1),
        brand: z.string().min(1),
        dailyRate: money,
        summary: z.string(),
        specifications: z.record(z.string(), z.string()),
        includedItems: z.array(z.string()),
        imagePaths: z.array(z.string()),
        isFeatured: z.boolean(),
      }),
    ),
    inventoryUnits: z.array(
      z.object({
        id,
        productId: id,
        assetLabel: id,
        lifecycle: z.enum(['active', 'inactive', 'retired', 'lost']),
        variantTags: z.array(z.string()),
      }),
    ),
    packages: z.array(
      z.object({
        id,
        slug: id,
        name: z.string().min(1),
        serviceCategory: z.enum(['camera', 'iphone']),
        dailyRate: money,
        components: z.array(packageComponent).min(1),
        imagePaths: z.array(z.string()),
      }),
    ),
    addOns: z.array(
      z.object({
        id,
        productId: id.optional(),
        name: z.string().min(1),
        price: money,
        priceUnit: z.enum(['per_day', 'one_time']),
        stockTracked: z.boolean(),
        applicableTo: z.array(id),
      }),
    ),
    customers: z.array(
      z.object({
        id,
        name: z.string().min(1),
        whatsapp: z.string().min(1),
        email: z.string().email().optional(),
        isDemoCustomer: z.boolean(),
      }),
    ),
    bookings: z.array(
      z.object({
        id,
        reference: id,
        customerId: id,
        primaryServiceCategory: z.enum(['camera', 'iphone']),
        period: rentalPeriod,
        createdAt: dateTimeIso,
        updatedAt: dateTimeIso,
        holdExpiresAt: dateTimeIso.optional(),
        status: z.enum([
          'draft',
          'waiting_payment',
          'confirmed',
          'picked_up',
          'returned',
          'completed',
          'expired',
          'cancelled',
          'rejected',
        ]),
        paymentStatus: z.enum([
          'unpaid',
          'pending_verification',
          'deposit_paid',
          'paid_in_full',
          'failed',
          'expired',
          'refunded',
        ]),
        guaranteeStatus: z.enum(['required', 'presented', 'accepted', 'returned']),
        lines: z.array(
          z.object({
            id,
            kind: z.enum(['product', 'package', 'addon']),
            itemId: id,
            nameSnapshot: z.string().min(1),
            quantity: z.number().int().positive(),
            priceUnit: z.enum(['per_day', 'one_time']),
            unitPriceSnapshot: money,
            packageComponentsSnapshot: z.array(packageComponent).optional(),
          }),
        ),
        allocations: z.array(allocation),
        pricing: z.object({
          billableDays: z.number().int().positive(),
          lines: z.array(pricedLine),
          rentalSubtotal: money,
          depositDue: money,
          depositPaid: money,
          remainingBalance: money,
          currency: z.literal('IDR'),
          policyVersion: id,
        }),
        customerSnapshot: customerContact,
        timeline: z.array(bookingEvent),
        note: z.string().optional(),
      }),
    ),
    availabilityBlocks: z.array(
      z.object({
        id,
        inventoryUnitId: id,
        reason: z.enum(['maintenance', 'damage', 'internal_use', 'manual_hold']),
        period: rentalPeriod,
        note: z.string().optional(),
        createdAt: dateTimeIso,
      }),
    ),
    demoScenarios: z.array(
      z.object({
        id,
        label: z.string().min(1),
        asOf: dateTimeIso,
        startRoute: z.string().startsWith('/'),
        mode: z.enum(['normal', 'loading', 'recoverable_error', 'final_conflict', 'empty']),
      }),
    ),
    locationAndPolicyCopy: z.object({
      timezone: z.literal(WITA_TIMEZONE),
      operatingHours: z.string().min(1),
      pickupLocation: z.string().min(1),
      guaranteeNotice: z.string().min(1),
      policyVersion: id,
      provisional: z.boolean(),
    }),
  })
  .superRefine((state, context) => {
    const productIds = new Set(state.products.map((product) => product.id))
    const unitIds = new Set(state.inventoryUnits.map((unit) => unit.id))

    state.inventoryUnits.forEach((unit, index) => {
      if (!productIds.has(unit.productId)) {
        context.addIssue({
          code: 'custom',
          path: ['inventoryUnits', index, 'productId'],
          message: 'Inventory unit references an unknown product',
        })
      }
    })

    state.packages.forEach((rentalPackage, packageIndex) => {
      rentalPackage.components.forEach((component, componentIndex) => {
        if (!productIds.has(component.productId)) {
          context.addIssue({
            code: 'custom',
            path: ['packages', packageIndex, 'components', componentIndex, 'productId'],
            message: 'Package component references an unknown product',
          })
        }
      })
    })

    state.availabilityBlocks.forEach((block, index) => {
      if (!unitIds.has(block.inventoryUnitId)) {
        context.addIssue({
          code: 'custom',
          path: ['availabilityBlocks', index, 'inventoryUnitId'],
          message: 'Availability block references an unknown inventory unit',
        })
      }
    })
  })
