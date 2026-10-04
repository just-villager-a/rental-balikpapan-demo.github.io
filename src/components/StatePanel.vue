<script setup lang="ts">
import { PhArrowClockwise, PhInfo, PhSpinnerGap } from '@phosphor-icons/vue'
defineProps<{ state: 'loading' | 'empty' | 'error' | 'not-found'; title: string; message: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <section class="grid min-h-64 place-items-center rounded-2xl border border-sand bg-white p-8 text-center" :aria-busy="state === 'loading'">
    <div class="max-w-md">
      <PhSpinnerGap v-if="state === 'loading'" class="mx-auto animate-spin" :size="34" />
      <PhInfo v-else class="mx-auto" :size="34" />
      <h2 class="mt-4 text-xl font-extrabold">{{ title }}</h2><p class="mt-2 text-sm leading-6 text-muted">{{ message }}</p>
      <button v-if="state === 'error'" class="button-primary mx-auto mt-5 inline-flex" type="button" @click="$emit('retry')"><PhArrowClockwise :size="18" /> Coba Lagi</button>
    </div>
  </section>
</template>
