<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'

const route = useRoute()
watch(() => route.fullPath, async () => { await nextTick(); const heading = document.querySelector<HTMLElement>('h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }) })
</script>

<template>
  <RouterView />
</template>
