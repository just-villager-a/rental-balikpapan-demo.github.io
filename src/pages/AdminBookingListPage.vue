<script setup lang="ts">
import { PhArrowRight, PhCalendarBlank, PhFunnelX } from '@phosphor-icons/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import StatePanel from '@/components/StatePanel.vue'
import type { Booking } from '@/domain/models'
import { listAdminBookings, type AdminPreviewMode } from '@/services/admin'
import type { AdminBookingFilter } from '@/services/analytics'
import { useDemoStore } from '@/stores/demo'
import { formatIdr } from '@/utils/currency'
import { formatWita } from '@/utils/datetime'
import { statusLabel } from '@/utils/status'

const route = useRoute(); const demo = useDemoStore(); const bookings = ref<Booking[]>([]); const loading = ref(true); const failed = ref(false)
const filterLabels: Record<AdminBookingFilter, string> = { created_today: 'Dibuat hari ini', active: 'Rental aktif', upcoming_pickup: 'Pengambilan 7 hari', camera: 'Kamera', iphone: 'iPhone', unpaid: 'Belum dibayar', overdue: 'Terlambat', pickup_today: 'Ambil hari ini' }
const selected = computed(() => Object.hasOwn(filterLabels, String(route.query.filter)) ? String(route.query.filter) as AdminBookingFilter : undefined)
function mode(): AdminPreviewMode { return demo.activeScenario?.mode === 'loading' ? 'loading' : demo.activeScenario?.mode === 'recoverable_error' ? 'error' : 'normal' }
async function load() { loading.value = true; failed.value = false; try { bookings.value = await listAdminBookings(selected.value, mode()) } catch { failed.value = true } finally { loading.value = false } }
watch(() => route.fullPath, load)
onMounted(() => { demo.hydrate(); load() })
</script>

<template><AdminLayout><div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-extrabold text-muted">Ledger operasional</p><h1 class="mt-1 text-3xl font-black tracking-tight">Daftar Booking</h1><p class="mt-2 text-sm text-muted">Filter dibatasi pada drill-through yang disetujui untuk prototype.</p></div><RouterLink v-if="selected" class="button-outline inline-flex" to="/admin/bookings"><PhFunnelX /> Hapus filter</RouterLink></div>
<nav class="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filter booking"><RouterLink v-for="(label, key) in filterLabels" :key="key" :to="`/admin/bookings?filter=${key}`" class="min-h-11 shrink-0 rounded-lg border px-3 py-2 text-sm font-bold" :class="selected === key ? 'border-ink bg-ink text-white' : 'border-sand bg-white'">{{ label }}</RouterLink></nav>
<StatePanel v-if="loading" class="mt-6" state="loading" title="Memuat booking" message="Membaca ledger dari penyimpanan demo." /><StatePanel v-else-if="failed" class="mt-6" state="error" title="Booking belum dapat dimuat" message="Kesalahan demo dapat dipulihkan tanpa mengubah data." @retry="load" /><StatePanel v-else-if="!bookings.length" class="mt-6" state="empty" title="Tidak ada booking pada filter ini" message="Hapus filter atau pilih drill-through lain." />
<section v-else class="mt-6 overflow-hidden rounded-2xl border border-sand bg-white"><div class="hidden grid-cols-[1fr_1.1fr_1.4fr_.8fr_.8fr_auto] gap-4 bg-surface px-5 py-3 text-xs font-black text-muted lg:grid"><span>Referensi</span><span>Pelanggan</span><span>Periode WITA</span><span>Status</span><span>Total</span><span>Aksi</span></div><article v-for="booking in bookings" :key="booking.id" class="grid gap-4 border-t border-sand p-5 first:border-t-0 lg:grid-cols-[1fr_1.1fr_1.4fr_.8fr_.8fr_auto] lg:items-center"><div><span class="text-xs font-bold text-muted lg:hidden">Referensi</span><p class="font-black">{{ booking.reference }}</p><p class="mt-1 text-xs uppercase tracking-wider text-muted">{{ booking.primaryServiceCategory }}</p></div><div><span class="text-xs font-bold text-muted lg:hidden">Pelanggan</span><p class="font-bold">{{ booking.customerSnapshot.name }}</p><p class="mt-1 text-xs text-muted">{{ booking.customerSnapshot.whatsapp }}</p></div><div><span class="text-xs font-bold text-muted lg:hidden">Periode WITA</span><p class="flex gap-2 text-sm"><PhCalendarBlank class="mt-0.5 shrink-0" />{{ formatWita(booking.period.pickupAt) }}</p><p class="mt-1 pl-6 text-xs text-muted">hingga {{ formatWita(booking.period.returnAt) }}</p></div><div class="flex flex-wrap gap-2 lg:block"><span class="status-badge status-limited">{{ statusLabel(booking.status) }}</span><span class="status-badge status-available lg:mt-2">{{ statusLabel(booking.paymentStatus) }}</span></div><strong class="tabular-nums">{{ formatIdr(booking.pricing.rentalSubtotal) }}</strong><RouterLink class="button-dark inline-flex" :to="`/admin/bookings/${booking.id}`" :aria-label="`Buka ${booking.reference}`">Detail <PhArrowRight /></RouterLink></article></section></div></AdminLayout></template>
