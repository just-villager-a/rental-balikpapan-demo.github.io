import { DemoRepository } from '@/repositories/demoRepository'
import type { DemoStateService } from '@/services/contracts'

let demoStateService: DemoStateService | undefined

export function getDemoStateService(): DemoStateService {
  demoStateService ??= new DemoRepository(window.localStorage)
  return demoStateService
}
