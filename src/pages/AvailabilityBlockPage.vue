<script setup lang="ts">
import { PhArrowLeft, PhCalendarCheck, PhInfo, PhWrench } from '@phosphor-icons/vue'
import { nextTick, onMounted, reactive, ref } from 'vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import type { AvailabilityBlock, AvailabilityBlockReason } from '@/domain/models'
import { createAvailabilityBlock, listBlockableUnits } from '@/services/availabilityBlocks'
import { useDemoStore } from '@/stores/demo'
import { formatWita } from '@/utils/datetime'
import { fromWitaDateTimeLocal } from '@/utils/searchQuery'

const demo = useDemoStore()
const units = listBlockableUnits()
const error = ref('')
const errorSummary = ref<HTMLElement>()
const created = ref<AvailabilityBlock>()
const form = reactive({
  inventoryUnitId: '',
  reason: 'maintenance' as AvailabilityBlockReason,
  start: '2026-10-10T09:00',
  end: '2026-10-12T09:00',
  note: '',
})

const reasons: { value: AvailabilityBlockReason; label: string }[] = [
  { value: 'maintenance', label: 'Perawatan' },
  { value: 'damage', label: 'Kerusakan' },
  { value: 'internal_use', label: 'Pemakaian internal' },
  { value: 'manual_hold', label: 'Ditahan manual' },
]

async function submit() {
  error.value = ''
  if (!form.inventoryUnitId || !form.start || !form.end) {
    error.value = 'Lengkapi unit, waktu mulai, dan waktu selesai.'
  } else {
    try {
      const result = createAvailabilityBlock({
        inventoryUnitId: form.inventoryUnitId,
        reason: form.reason,
        period: {
          pickupAt: fromWitaDateTimeLocal(form.start),
          returnAt: fromWitaDateTimeLocal(form.end),
          timezone: 'Asia/Makassar',
        },
        note: form.note,
      })
      if (result.ok) created.value = result.block
      else error.value = result.message
    } catch {
      error.value = 'Tanggal dan waktu belum valid.'
    }
  }
  if (error.value) { await nextTick(); errorSummary.value?.focus() }
}

onMounted(() => {
  demo.hydrate()
  if (demo.activeScenario?.id === 'maintenance-block') form.inventoryUnitId = 'CAM-A7III-001'
})
</script>

<template>
  <AdminLayout>
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <RouterLink class="inline-flex min-h-11 items-center gap-2 text-sm font-black" to="/admin/calendar"><PhArrowLeft /> Kembali ke Kalender</RouterLink>
      <div class="mt-4">
        <p class="text-sm font-extrabold text-muted">Kontrol unit fisik · WITA</p>
        <h1 class="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Buat Blok Ketersediaan</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">Blok tersimpan pada unit fisik tertentu dan langsung memengaruhi ketersediaan pelanggan. Sistem tidak memindahkan alokasi booking secara otomatis.</p>
      </div>

      <section v-if="created" class="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6" role="status">
        <PhCalendarCheck :size="30" class="text-success" />
        <h2 class="mt-3 text-xl font-black">Blok unit berhasil dibuat</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ created.inventoryUnitId }} diblokir dari {{ formatWita(created.period.pickupAt) }} sampai {{ formatWita(created.period.returnAt) }}.</p>
        <div class="mt-5 flex flex-col gap-3 sm:flex-row"><RouterLink class="button-dark inline-flex" to="/admin/calendar">Lihat di Kalender</RouterLink><RouterLink class="button-outline inline-flex" to="/search">Periksa Ketersediaan Pelanggan</RouterLink></div>
      </section>

      <form v-else class="mt-8 rounded-2xl border border-sand bg-white p-5 sm:p-7" novalidate @submit.prevent="submit">
        <div v-if="error" ref="errorSummary" tabindex="-1" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-error" role="alert">{{ error }}</div>
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="field sm:col-span-2">Unit fisik<select v-model="form.inventoryUnitId" required><option value="">Pilih unit aktif</option><option v-for="unit in units" :key="unit.id" :value="unit.id">{{ unit.assetLabel }} · {{ unit.productName }}</option></select></label>
          <label class="field">Alasan<select v-model="form.reason"><option v-for="reason in reasons" :key="reason.value" :value="reason.value">{{ reason.label }}</option></select></label>
          <div class="flex items-center gap-2 rounded-xl bg-surface p-4 text-xs font-bold text-muted"><PhWrench :size="20" class="shrink-0" /> Hanya data operasional demo; tidak ada notifikasi eksternal.</div>
          <label class="field">Mulai (WITA)<input v-model="form.start" type="datetime-local" required /></label>
          <label class="field">Selesai (WITA)<input v-model="form.end" type="datetime-local" required /></label>
          <label class="field sm:col-span-2">Catatan internal (opsional)<textarea v-model="form.note" class="min-h-28 w-full rounded-[.65rem] border border-sand bg-white p-3 text-sm font-semibold text-ink" maxlength="300" /></label>
        </div>
        <div class="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-warning"><PhInfo :size="18" class="mt-0.5 shrink-0" /> Jika unit bertabrakan dengan booking atau blok yang ada, pembuatan akan ditolak dan konflik akan dijelaskan.</div>
        <button class="button-primary mt-6 inline-flex w-full sm:w-auto" type="submit"><PhCalendarCheck /> Simpan Blok Unit</button>
      </form>
    </div>
  </AdminLayout>
</template>
