import { resetCatalogPreviewFailures } from '@/services/catalog'
import { clearPreservedCheckout } from '@/services/booking'
import { getDemoStateService } from '@/services/mockServices'
import { resetAdminPreviewFailures } from '@/services/admin'
import type { DemoScenario, DemoState } from '@/domain/models'

export function listScenarios(): DemoScenario[] {
  return getDemoStateService().snapshot().demoScenarios
}

export function activateScenario(id: string): DemoState {
  const repository = getDemoStateService()
  const seed = repository.reset()
  if (!seed.demoScenarios.some(scenario => scenario.id === id)) throw new Error(`Unknown scenario: ${id}`)
  resetCatalogPreviewFailures(); resetAdminPreviewFailures(); clearPreservedCheckout()
  return repository.update(state => { state.activeScenarioId = id })
}

export function resetDemo(): DemoState {
  resetCatalogPreviewFailures(); resetAdminPreviewFailures(); clearPreservedCheckout()
  return getDemoStateService().reset()
}
