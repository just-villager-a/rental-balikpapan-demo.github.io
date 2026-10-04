import { describe, expect, it } from 'vitest'

import { STORAGE_KEY, STORAGE_PREFIX } from '@/domain/constants'
import { DemoRepository } from '@/repositories/demoRepository'

class MemoryStorage implements Storage {
  #data = new Map<string, string>()

  get length(): number {
    return this.#data.size
  }

  clear(): void {
    this.#data.clear()
  }

  getItem(key: string): string | null {
    return this.#data.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.#data.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.#data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.#data.set(key, value)
  }
}

describe('DemoRepository', () => {
  it('loads and validates the versioned seed', () => {
    const repository = new DemoRepository(new MemoryStorage())
    const result = repository.hydrate()
    expect(result.status).toBe('seeded')
    expect(result.state.products).toHaveLength(12)
    expect(result.state.bookings).toHaveLength(10)
  })

  it('restores compatible state and detects corrupt or incompatible state', () => {
    const storage = new MemoryStorage()
    const repository = new DemoRepository(storage)
    repository.update((draft) => {
      draft.bookingSequence = 42
    })
    expect(new DemoRepository(storage).hydrate()).toMatchObject({
      status: 'restored',
      state: { bookingSequence: 42 },
    })

    storage.setItem(STORAGE_KEY, '{broken')
    expect(new DemoRepository(storage).hydrate()).toMatchObject({
      status: 'recovery_required',
      reason: 'corrupt',
    })

    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 999 }))
    expect(new DemoRepository(storage).hydrate()).toMatchObject({
      status: 'recovery_required',
      reason: 'incompatible',
    })
  })

  it('commits only valid updates', () => {
    const storage = new MemoryStorage()
    const repository = new DemoRepository(storage)
    expect(() =>
      repository.update((draft) => {
        draft.products[0]!.dailyRate = -1
      }),
    ).toThrow()
    expect(repository.snapshot().products[0]?.dailyRate).toBe(350_000)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('reset removes only prototype namespaced keys', () => {
    const storage = new MemoryStorage()
    storage.setItem('unrelated', 'keep')
    storage.setItem(`${STORAGE_PREFIX}old:state`, 'remove')
    storage.setItem(STORAGE_KEY, 'remove')

    const repository = new DemoRepository(storage)
    const reset = repository.reset()
    expect(storage.getItem('unrelated')).toBe('keep')
    expect(storage.getItem(`${STORAGE_PREFIX}old:state`)).toBeNull()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(reset.bookingSequence).toBe(11)
  })
})
