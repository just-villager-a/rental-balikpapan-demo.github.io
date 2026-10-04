// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createAvailabilityBlock } from '@/services/availabilityBlocks'
import { listAdminCalendarEvents } from '@/services/adminCalendar'
import { createBooking } from '@/services/booking'
import { getProductDetail } from '@/services/catalog'
import { getDemoStateService } from '@/services/mockServices'
import { DEFAULT_PERIOD } from '@/utils/searchQuery'

describe('admin calendar and availability blocks', () => {
  beforeEach(() => getDemoStateService().reset())

  it('projects a customer-created booking into the admin calendar', async () => {
    const result = createBooking({
      kind: 'package',
      itemId: 'pkg-camera-creator',
      quantity: 1,
      addOnIds: [],
      period: DEFAULT_PERIOD,
      customer: { name: 'Raka Demo', whatsapp: '+628110000001' },
      termsAccepted: true,
      submissionToken: 'calendar-projection',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const events = await listAdminCalendarEvents()
    expect(events).toContainEqual(expect.objectContaining({
      id: `booking-${result.booking.id}`,
      extendedProps: expect.objectContaining({ bookingId: result.booking.id }),
    }))
  })

  it('filters booking and block events by category, product, and booking status', async () => {
    const cameraEvents = await listAdminCalendarEvents({ serviceCategory: 'camera' })
    expect(cameraEvents.length).toBeGreaterThan(0)
    expect(cameraEvents.every(event => event.extendedProps.kind === 'block' || event.extendedProps.productIds.length)).toBe(true)

    const confirmed = await listAdminCalendarEvents({ bookingStatus: 'confirmed' })
    expect(confirmed.length).toBeGreaterThan(0)
    expect(confirmed.every(event => event.extendedProps.kind === 'booking' && event.extendedProps.status === 'confirmed')).toBe(true)

    const sony = await listAdminCalendarEvents({ productId: 'prod-cam-sony-a7iii' })
    expect(sony.some(event => event.extendedProps.kind === 'block')).toBe(true)
    expect(sony.every(event => event.extendedProps.productIds.includes('prod-cam-sony-a7iii'))).toBe(true)
  })

  it('rejects booking and existing-block conflicts with an explanation', () => {
    const bookingConflict = createAvailabilityBlock({
      inventoryUnitId: 'CAM-A7III-001',
      reason: 'maintenance',
      period: {
        pickupAt: '2026-10-15T09:00:00+08:00',
        returnAt: '2026-10-16T09:00:00+08:00',
        timezone: 'Asia/Makassar',
      },
    })
    expect(bookingConflict).toMatchObject({ ok: false, reason: 'conflict' })
    expect(bookingConflict.ok ? '' : bookingConflict.message).toContain('SKB-20261001-0001')

    const blockConflict = createAvailabilityBlock({
      inventoryUnitId: 'CAM-A7III-003',
      reason: 'damage',
      period: DEFAULT_PERIOD,
    })
    expect(blockConflict).toMatchObject({ ok: false, reason: 'conflict' })
  })

  it('persists a valid block and immediately changes customer availability', async () => {
    const before = await getProductDetail('sony-alpha-a7-iii-kit-28-70mm', DEFAULT_PERIOD)
    const result = createAvailabilityBlock({
      inventoryUnitId: 'CAM-A7III-001',
      reason: 'maintenance',
      period: DEFAULT_PERIOD,
      note: 'Uji demo',
    })
    expect(result.ok).toBe(true)
    const after = await getProductDetail('sony-alpha-a7-iii-kit-28-70mm', DEFAULT_PERIOD)
    expect(after?.availableCount).toBe((before?.availableCount ?? 0) - 1)
    expect(getDemoStateService().hydrate().state.availabilityBlocks.some(block => block.id === (result.ok && result.block.id))).toBe(true)
    expect((await listAdminCalendarEvents()).some(event => event.id === `block-${result.ok && result.block.id}`)).toBe(true)

    getDemoStateService().reset()
    expect(getDemoStateService().snapshot().availabilityBlocks).toHaveLength(2)
  })

  it('requires a positive interval without imposing the 24-hour rental minimum', () => {
    const shortBlock = createAvailabilityBlock({
      inventoryUnitId: 'CAM-A7III-002',
      reason: 'manual_hold',
      period: {
        pickupAt: '2026-10-13T09:00:00+08:00',
        returnAt: '2026-10-13T10:00:00+08:00',
        timezone: 'Asia/Makassar',
      },
    })
    expect(shortBlock.ok).toBe(true)

    const backwards = createAvailabilityBlock({
      inventoryUnitId: 'CAM-A7III-002',
      reason: 'manual_hold',
      period: {
        pickupAt: '2026-10-14T10:00:00+08:00',
        returnAt: '2026-10-14T09:00:00+08:00',
        timezone: 'Asia/Makassar',
      },
    })
    expect(backwards).toMatchObject({ ok: false, reason: 'invalid' })
  })
})
