import type { DemoState } from '@/domain/models'
import type { HydrationResult } from '@/repositories/demoRepository'

export interface DemoStateService {
  hydrate(): HydrationResult
  snapshot(): DemoState
  update(mutator: (draft: DemoState) => void): DemoState
  reset(): DemoState
}
