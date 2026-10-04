<script setup lang="ts">
import { PhWarning } from '@phosphor-icons/vue'
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string }>(), { confirmLabel: 'Konfirmasi' })
const emit = defineEmits<{ confirm: []; cancel: [] }>()
const dialog = ref<HTMLDialogElement>()
const cancelButton = ref<HTMLButtonElement>()

watch(() => props.open, async (open) => {
  await nextTick()
  if (open) {
    if (!dialog.value?.open) {
      if (typeof dialog.value?.showModal === 'function') dialog.value.showModal()
      else dialog.value?.setAttribute('open', '')
    }
    cancelButton.value?.focus()
  } else if (dialog.value?.open) {
    if (typeof dialog.value.close === 'function') dialog.value.close()
    else dialog.value.removeAttribute('open')
  }
}, { immediate: true })

function backdrop(event: MouseEvent) { if (event.target === dialog.value) emit('cancel') }
</script>

<template>
  <dialog ref="dialog" class="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-sand bg-white p-0 text-ink shadow-none backdrop:bg-black/50" @cancel.prevent="emit('cancel')" @click="backdrop">
    <div class="p-6"><span class="grid size-11 place-items-center rounded-xl bg-brand-yellow"><PhWarning :size="23" weight="bold" /></span><h2 class="mt-5 text-2xl font-black">{{ title }}</h2><p class="mt-3 text-sm leading-6 text-muted">{{ message }}</p><div class="mt-7 grid gap-2 sm:grid-cols-2"><button ref="cancelButton" class="button-outline inline-flex" type="button" @click="emit('cancel')">Batal</button><button class="button-dark inline-flex" type="button" @click="emit('confirm')">{{ confirmLabel }}</button></div></div>
  </dialog>
</template>
