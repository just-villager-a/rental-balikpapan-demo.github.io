<script setup lang="ts">
import { PhCheckCircle, PhProhibit, PhWarningCircle } from '@phosphor-icons/vue'
import { computed } from 'vue'
import type { AvailabilityLabel } from '@/domain/models'

const props = defineProps<{ status: AvailabilityLabel; count?: number }>()
const label = computed(() => props.status === 'available' ? (props.count ? `${props.count} unit tersedia` : 'Tersedia') : props.status === 'limited' ? 'Stok terbatas' : 'Tidak tersedia')
</script>
<template>
  <span class="status-badge" :class="`status-${status}`">
    <PhCheckCircle v-if="status === 'available'" :size="15" weight="fill" />
    <PhWarningCircle v-else-if="status === 'limited'" :size="15" weight="fill" />
    <PhProhibit v-else :size="15" weight="fill" />{{ label }}
  </span>
</template>
