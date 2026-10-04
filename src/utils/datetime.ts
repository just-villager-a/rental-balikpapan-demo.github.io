import { addMinutes, differenceInMilliseconds, isValid, parseISO } from 'date-fns'

import type { DateTimeIso, RentalPeriod } from '@/domain/models'

const WITA_OFFSET = '+08:00'
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/

export function parseInstant(value: DateTimeIso): Date {
  if (!ISO_WITH_OFFSET.test(value)) throw new Error(`Timestamp must include an offset: ${value}`)
  const parsed = parseISO(value)
  if (!isValid(parsed)) throw new Error(`Invalid timestamp: ${value}`)
  return parsed
}

export function assertRentalPeriod(period: RentalPeriod): void {
  const start = parseInstant(period.pickupAt)
  const end = parseInstant(period.returnAt)
  const duration = differenceInMilliseconds(end, start)
  if (duration <= 0) throw new Error('Return must be after pickup')
  if (duration < 24 * 60 * 60 * 1000) throw new Error('Minimum rental is 24 hours')
}

export function addWitaMinutes(value: DateTimeIso, minutes: number): DateTimeIso {
  const shifted = addMinutes(parseInstant(value), minutes)
  const witaClock = new Date(shifted.getTime() + 8 * 60 * 60 * 1000)
  return `${witaClock.toISOString().slice(0, 19)}${WITA_OFFSET}`
}

export function toWitaDateKey(value: DateTimeIso): string {
  const shifted = new Date(parseInstant(value).getTime() + 8 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

export function formatWita(value: DateTimeIso): string {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(parseInstant(value))
    .replace(' pukul ', ' · ')
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)} WITA`
}

export interface Clock {
  now(): DateTimeIso
}

export function fixedClock(now: DateTimeIso): Clock {
  parseInstant(now)
  return { now: () => now }
}
