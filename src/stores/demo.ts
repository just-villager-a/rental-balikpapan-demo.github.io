import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { DemoState } from '@/domain/models'
import type { HydrationStatus } from '@/repositories/demoRepository'
import { getDemoStateService } from '@/services/mockServices'
import { fixedClock } from '@/utils/datetime'

export const useDemoStore = defineStore('demo', () => {
  const state = ref<DemoState>()
  const hydrationStatus = ref<HydrationStatus>()
  const recoveryReason = ref<'corrupt' | 'incompatible'>()

  const activeScenario = computed(() =>
    state.value?.demoScenarios.find((scenario) => scenario.id === state.value?.activeScenarioId),
  )

  const clock = computed(() =>
    activeScenario.value ? fixedClock(activeScenario.value.asOf) : undefined,
  )

  function hydrate(): void {
    const result = getDemoStateService().hydrate()
    state.value = result.state
    hydrationStatus.value = result.status
    recoveryReason.value = result.reason
  }

  function reset(): void {
    state.value = getDemoStateService().reset()
    hydrationStatus.value = 'seeded'
    recoveryReason.value = undefined
  }

  return { state, hydrationStatus, recoveryReason, activeScenario, clock, hydrate, reset }
})
