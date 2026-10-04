<script setup lang="ts">
import { PhCalendarBlank, PhMagnifyingGlass } from '@phosphor-icons/vue'
import { ref, watch } from 'vue'
import type { RentalPeriod } from '@/domain/models'
import { assertRentalPeriod } from '@/utils/datetime'
import { fromWitaDateTimeLocal, toDateTimeLocal } from '@/utils/searchQuery'

const props = withDefaults(defineProps<{ period: RentalPeriod; initialCategory?: string; compact?: boolean }>(), { initialCategory: '', compact: false })
const emit = defineEmits<{ submit: [period: RentalPeriod, category: string] }>()
const pickup = ref(toDateTimeLocal(props.period.pickupAt)); const returnAt = ref(toDateTimeLocal(props.period.returnAt)); const category = ref(props.initialCategory); const error = ref('')
watch(() => props.period, (value) => { pickup.value = toDateTimeLocal(value.pickupAt); returnAt.value = toDateTimeLocal(value.returnAt) })
function submit() {
  const period: RentalPeriod = { pickupAt: fromWitaDateTimeLocal(pickup.value), returnAt: fromWitaDateTimeLocal(returnAt.value), timezone: 'Asia/Makassar' }
  try { assertRentalPeriod(period); error.value = ''; emit('submit', period, category.value) } catch { error.value = 'Durasi sewa minimum 24 jam dan waktu kembali harus setelah pengambilan.' }
}
</script>
<template>
  <form class="min-w-0 rounded-2xl border border-sand bg-white p-4" :class="compact ? '' : 'sm:p-5'" @submit.prevent="submit">
    <div class="grid min-w-0 gap-3" :class="compact ? 'md:grid-cols-[1fr_1fr_.8fr_auto]' : 'md:grid-cols-[1fr_1fr_.8fr_auto]'">
      <label class="field"><span>Mulai sewa</span><span class="field-icon-wrap"><PhCalendarBlank :size="18" /><input v-model="pickup" type="datetime-local" required /></span></label>
      <label class="field"><span>Selesai sewa</span><span class="field-icon-wrap"><PhCalendarBlank :size="18" /><input v-model="returnAt" type="datetime-local" required /></span></label>
      <label class="field"><span>Kategori</span><select v-model="category"><option value="">Semua kategori</option><option value="camera">Kamera</option><option value="lens">Lensa</option><option value="iphone">iPhone</option><option value="package">Paket</option></select></label>
      <button class="button-primary inline-flex self-end md:h-12" type="submit"><PhMagnifyingGlass :size="19" /> Cari</button>
    </div>
    <p v-if="error" class="mt-3 text-sm font-semibold text-error" role="alert">{{ error }}</p>
  </form>
</template>
