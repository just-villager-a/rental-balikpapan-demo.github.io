<script setup lang="ts">
import { PhCamera, PhDeviceMobile, PhImageBroken, PhPackage } from '@phosphor-icons/vue'
import { ref } from 'vue'
const props = defineProps<{ src?: string; alt: string; category?: string; eager?: boolean }>()
const failed = ref(false)
</script>
<template>
  <img v-if="props.src && !failed" :src="props.src" :alt="alt" class="h-full w-full object-cover" :loading="eager ? 'eager' : 'lazy'" @error="failed = true" />
  <div v-else class="media-placeholder" role="img" :aria-label="`Gambar ${alt} belum tersedia`" data-testid="missing-image">
    <PhDeviceMobile v-if="category === 'iphone'" :size="52" weight="thin" />
    <PhPackage v-else-if="category === 'package'" :size="52" weight="thin" />
    <PhCamera v-else-if="category" :size="52" weight="thin" />
    <PhImageBroken v-else :size="52" weight="thin" />
    <span>Foto segera tersedia</span>
  </div>
</template>
