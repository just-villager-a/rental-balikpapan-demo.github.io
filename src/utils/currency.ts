import type { MoneyIdr } from '@/domain/models'

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatIdr(value: MoneyIdr): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('IDR must be a non-negative integer')
  return idr.format(value).replace(/\u00a0/g, '')
}
