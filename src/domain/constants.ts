export const DEMO_SCHEMA_VERSION = 2
export const STORAGE_PREFIX = 'sewa-balikpapan:demo:'
export const STORAGE_KEY = `${STORAGE_PREFIX}v${DEMO_SCHEMA_VERSION}:state`
export const WITA_TIMEZONE = 'Asia/Makassar' as const
export const INSPECTION_BUFFER_MINUTES = 60
export const HOLD_DURATION_MINUTES = 30

import type { BookingStatus } from './models'

export const BLOCKING_BOOKING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  'waiting_payment',
  'confirmed',
  'picked_up',
  'returned',
])
