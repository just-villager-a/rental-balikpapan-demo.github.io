import seedJson from '@/data/seed.json'
import { demoStateSchema } from '@/data/seed.schema'
import { STORAGE_KEY, STORAGE_PREFIX } from '@/domain/constants'
import type { DemoState } from '@/domain/models'

export type HydrationStatus = 'seeded' | 'restored' | 'recovery_required'

export interface HydrationResult {
  status: HydrationStatus
  state: DemoState
  reason?: 'corrupt' | 'incompatible'
}

export class DemoRepository {
  readonly #seed: DemoState
  #state: DemoState

  constructor(private readonly storage: Storage) {
    this.#seed = demoStateSchema.parse(seedJson) as DemoState
    this.#state = structuredClone(this.#seed)
  }

  hydrate(): HydrationResult {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (!raw) return { status: 'seeded', state: this.snapshot() }

    let stored: unknown
    try {
      stored = JSON.parse(raw)
    } catch {
      return { status: 'recovery_required', reason: 'corrupt', state: this.snapshot() }
    }

    if (
      typeof stored !== 'object' ||
      stored === null ||
      !('schemaVersion' in stored) ||
      stored.schemaVersion !== this.#seed.schemaVersion
    ) {
      return { status: 'recovery_required', reason: 'incompatible', state: this.snapshot() }
    }

    const parsed = demoStateSchema.safeParse(stored)
    if (!parsed.success) {
      return { status: 'recovery_required', reason: 'corrupt', state: this.snapshot() }
    }

    this.#state = parsed.data as DemoState
    return { status: 'restored', state: this.snapshot() }
  }

  snapshot(): DemoState {
    return structuredClone(this.#state)
  }

  update(mutator: (draft: DemoState) => void): DemoState {
    const draft = this.snapshot()
    mutator(draft)
    const next = demoStateSchema.parse(draft) as DemoState
    this.storage.setItem(STORAGE_KEY, JSON.stringify(next))
    this.#state = next
    return this.snapshot()
  }

  reset(): DemoState {
    const keys = Array.from({ length: this.storage.length }, (_, index) => this.storage.key(index))
    keys.forEach((key) => {
      if (key?.startsWith(STORAGE_PREFIX)) this.storage.removeItem(key)
    })
    this.#state = structuredClone(this.#seed)
    return this.snapshot()
  }
}
