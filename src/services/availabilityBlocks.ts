import { z } from 'zod'
import type { AvailabilityBlock, AvailabilityBlockReason, RentalPeriod } from '@/domain/models'
import { findUnitConflict } from '@/services/availability'
import { getDemoStateService } from '@/services/mockServices'
import { parseInstant } from '@/utils/datetime'

const inputSchema = z.object({
  inventoryUnitId: z.string().min(1, 'Pilih unit fisik.'),
  reason: z.enum(['maintenance', 'damage', 'internal_use', 'manual_hold']),
  period: z.object({
    pickupAt: z.string().min(1),
    returnAt: z.string().min(1),
    timezone: z.literal('Asia/Makassar'),
  }),
  note: z.string().trim().max(300, 'Catatan maksimal 300 karakter.').optional(),
})

export interface CreateAvailabilityBlockInput {
  inventoryUnitId: string
  reason: AvailabilityBlockReason
  period: RentalPeriod
  note?: string
}

export type CreateAvailabilityBlockResult =
  | { ok: true; block: AvailabilityBlock }
  | { ok: false; reason: 'invalid' | 'conflict'; message: string }

export function listBlockableUnits() {
  const state = getDemoStateService().snapshot()
  return state.inventoryUnits
    .filter(unit => unit.lifecycle === 'active')
    .map(unit => ({
      id: unit.id,
      assetLabel: unit.assetLabel,
      productName: state.products.find(product => product.id === unit.productId)?.name ?? unit.productId,
    }))
    .sort((a, b) => a.assetLabel.localeCompare(b.assetLabel))
}

export function createAvailabilityBlock(input: CreateAvailabilityBlockInput): CreateAvailabilityBlockResult {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'invalid', message: parsed.error.issues[0]?.message ?? 'Data blok tidak valid.' }

  let start: Date
  let end: Date
  try {
    start = parseInstant(input.period.pickupAt)
    end = parseInstant(input.period.returnAt)
  } catch {
    return { ok: false, reason: 'invalid', message: 'Tanggal dan waktu harus valid dalam WITA.' }
  }
  if (end <= start) return { ok: false, reason: 'invalid', message: 'Waktu selesai harus setelah waktu mulai.' }

  const repository = getDemoStateService()
  const state = repository.snapshot()
  const unit = state.inventoryUnits.find(candidate => candidate.id === input.inventoryUnitId && candidate.lifecycle === 'active')
  if (!unit) return { ok: false, reason: 'invalid', message: 'Unit fisik aktif tidak ditemukan.' }
  const now = state.demoScenarios.find(scenario => scenario.id === state.activeScenarioId)?.asOf ?? '2026-10-04T10:00:00+08:00'
  const conflict = findUnitConflict(unit.id, input.period, state.bookings, state.availabilityBlocks, now)
  if (conflict?.kind === 'booking') {
    return { ok: false, reason: 'conflict', message: `Unit sudah dialokasikan ke booking ${conflict.booking.reference} pada periode tersebut.` }
  }
  if (conflict?.kind === 'block') {
    return { ok: false, reason: 'conflict', message: `Unit sudah memiliki blok ${conflict.block.id} pada periode tersebut.` }
  }

  const block: AvailabilityBlock = {
    id: `block-demo-${String(state.availabilityBlocks.length + 1).padStart(3, '0')}`,
    inventoryUnitId: input.inventoryUnitId,
    reason: input.reason,
    period: input.period,
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    createdAt: now,
  }
  repository.update(draft => { draft.availabilityBlocks.push(block) })
  return { ok: true, block }
}
