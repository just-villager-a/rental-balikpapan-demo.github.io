<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'
import { computed } from 'vue'
import type { CatalogItemView, RentalPeriod } from '@/domain/models'
import { formatIdr } from '@/utils/currency'
import AvailabilityBadge from './AvailabilityBadge.vue'
import ProductMedia from './ProductMedia.vue'

const props = defineProps<{ item: CatalogItemView; period: RentalPeriod }>()
const target = computed(() => ({
  name: props.item.kind === 'package' ? 'package-detail' : 'product-detail',
  params: { slug: props.item.slug },
  query: { pickup: props.period.pickupAt, return: props.period.returnAt },
}))
</script>
<template>
  <article class="group grid grid-cols-[7.5rem_1fr] overflow-hidden rounded-2xl border border-sand bg-white sm:block">
    <div class="aspect-square overflow-hidden bg-surface sm:aspect-[4/3]"><ProductMedia :src="item.imagePath" :alt="item.name" :category="item.category" /></div>
    <div class="flex min-w-0 flex-col p-4 sm:p-5">
      <AvailabilityBadge :status="item.availability" :count="item.availableCount" />
      <p class="mt-3 text-xs font-bold uppercase tracking-widest text-muted">{{ item.kind === 'package' ? 'Paket' : item.brand }}</p>
      <h3 class="mt-1 line-clamp-2 font-extrabold leading-snug">{{ item.name }}</h3>
      <p class="mt-2 hidden line-clamp-2 text-sm leading-6 text-muted sm:block">{{ item.summary }}</p>
      <div class="mt-auto flex items-end justify-between gap-3 pt-4">
        <p class="text-sm"><strong class="text-lg">{{ formatIdr(item.dailyRate) }}</strong><span class="text-muted"> / hari</span></p>
        <span v-if="item.availability === 'unavailable'" class="text-xs font-bold text-muted">Penuh</span>
        <RouterLink v-else :to="target" class="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-ink px-3 text-xs font-extrabold text-white transition-transform group-hover:translate-x-0.5" :aria-label="`Lihat ${item.name}`">Detail <PhArrowRight :size="15" /></RouterLink>
      </div>
    </div>
  </article>
</template>
