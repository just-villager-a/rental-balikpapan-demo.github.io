<script setup lang="ts">
import { PhArrowClockwise, PhPlay, PhPresentationChart } from '@phosphor-icons/vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import type { DemoScenario } from '@/domain/models'
import { activateScenario, listScenarios, resetDemo } from '@/services/scenario'
import { useDemoStore } from '@/stores/demo'

const router = useRouter(); const demo = useDemoStore()
const milestoneIds = new Set(['happy-camera-package', 'iphone-unavailable', 'final-check-conflict', 'payment-pending-success', 'payment-failed-retry', 'payment-expired', 'empty-history', 'loading-state', 'recoverable-error', 'admin-overview-populated', 'admin-overview-empty'])
const scenarios = computed(() => listScenarios().filter(scenario => milestoneIds.has(scenario.id)))
function start(scenario: DemoScenario) {
  demo.state = activateScenario(scenario.id)
  if (scenario.id === 'final-check-conflict') {
    router.push('/checkout?kind=package&item=pkg-camera-creator&quantity=1&pickup=2026-10-10T09%3A00%3A00%2B08%3A00&return=2026-10-12T09%3A00%3A00%2B08%3A00')
  } else router.push(scenario.startRoute)
}
function reset() { demo.state = resetDemo() }
onMounted(() => demo.hydrate())
</script>
<template><CustomerLayout><div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14"><div class="flex items-start gap-4"><span class="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-yellow"><PhPresentationChart :size="23" /></span><div><p class="text-sm font-extrabold text-error">Presenter controls · demo only</p><h1 class="mt-1 text-3xl font-black">Scenario Controls</h1><p class="mt-2 text-sm leading-6 text-muted">Memulai skenario akan mereset data lokal prototype agar hasilnya deterministik.</p></div></div><div class="mt-8 grid gap-3 sm:grid-cols-2"><article v-for="scenario in scenarios" :key="scenario.id" class="flex flex-col rounded-2xl border border-sand bg-white p-5"><span class="text-xs font-extrabold uppercase tracking-widest text-muted">{{ scenario.mode }}</span><h2 class="mt-2 font-black">{{ scenario.label }}</h2><button class="button-outline mt-5 inline-flex" type="button" @click="start(scenario)"><PhPlay /> Jalankan Skenario</button></article></div><button class="button-primary mt-6 inline-flex" type="button" @click="reset"><PhArrowClockwise /> Reset ke Data Awal</button></div></CustomerLayout></template>
