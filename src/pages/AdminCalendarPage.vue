<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { PhCalendarBlank, PhFunnel, PhPlus, PhSquaresFour } from '@phosphor-icons/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminCalendarOptions } from '@/app/calendar'
import StatePanel from '@/components/StatePanel.vue'
import type { BookingStatus, ServiceCategory } from '@/domain/models'
import AdminLayout from '@/layouts/AdminLayout.vue'
import {
  calendarFilterOptions,
  listAdminCalendarEvents,
  type AdminCalendarEvent,
  type CalendarPreviewMode,
} from '@/services/adminCalendar'
import { useDemoStore } from '@/stores/demo'
import { statusLabel } from '@/utils/status'

const router = useRouter()
const demo = useDemoStore()
const events = ref<AdminCalendarEvent[]>([])
const allEventCount = ref(0)
const loading = ref(true)
const failed = ref(false)
const mobile = ref(false)
const serviceCategory = ref<'' | ServiceCategory>('')
const productId = ref('')
const bookingStatus = ref<'' | BookingStatus>('')
const options = calendarFilterOptions()
const statuses: BookingStatus[] = ['draft', 'waiting_payment', 'confirmed', 'picked_up', 'returned', 'completed', 'expired', 'cancelled', 'rejected']
let mediaQuery: MediaQueryList | undefined

function previewMode(): CalendarPreviewMode {
  const active = demo.activeScenario
  if (active?.id === 'admin-overview-empty') return 'empty'
  if (active?.mode === 'loading') return 'loading'
  if (active?.mode === 'recoverable_error') return 'error'
  return 'normal'
}

async function load() {
  loading.value = true
  failed.value = false
  try {
    const filters = {
      ...(serviceCategory.value ? { serviceCategory: serviceCategory.value } : {}),
      ...(productId.value ? { productId: productId.value } : {}),
      ...(bookingStatus.value ? { bookingStatus: bookingStatus.value } : {}),
    }
    const mode = previewMode()
    const [filtered, all] = await Promise.all([
      listAdminCalendarEvents(filters, undefined, mode),
      listAdminCalendarEvents({}, undefined, mode),
    ])
    events.value = filtered
    allEventCount.value = all.length
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

function updateViewport(event?: MediaQueryListEvent) {
  mobile.value = event?.matches ?? mediaQuery?.matches ?? false
}

const calendarOptions = computed(() => ({
  ...adminCalendarOptions,
  initialView: mobile.value ? 'listWeek' : 'dayGridMonth',
  headerToolbar: mobile.value
    ? { start: 'prev,next', center: 'title', end: 'timeGridDay,listWeek' }
    : adminCalendarOptions.headerToolbar,
  events: events.value,
  eventClick(info: { event: { extendedProps: { kind?: string; bookingId?: string } }; jsEvent: Event }) {
    if (info.event.extendedProps.kind === 'booking' && info.event.extendedProps.bookingId) {
      info.jsEvent.preventDefault()
      router.push(`/admin/bookings/${info.event.extendedProps.bookingId}`)
    }
  },
}))

watch([serviceCategory, productId, bookingStatus], load)
watch(serviceCategory, category => {
  const selected = options.products.find(product => product.id === productId.value)
  if (selected && category && selected.serviceCategory !== category) productId.value = ''
})

onMounted(() => {
  demo.hydrate()
  if (typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(max-width: 767px)')
    updateViewport()
    mediaQuery.addEventListener('change', updateViewport)
  }
  load()
})
onBeforeUnmount(() => mediaQuery?.removeEventListener('change', updateViewport))
</script>

<template>
  <AdminLayout>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm font-extrabold text-muted">Jadwal operasional · WITA</p>
          <h1 class="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Kalender Admin</h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">Booking dan blok unit berasal dari data prototype yang sama. Pilih booking untuk membuka detailnya.</p>
        </div>
        <RouterLink class="button-primary inline-flex shrink-0" to="/admin/availability-blocks/new"><PhPlus :size="18" /> Buat Blok Unit</RouterLink>
      </div>

      <section class="mt-7 rounded-2xl border border-sand bg-white p-4 sm:p-5" aria-labelledby="calendar-filters">
        <div class="flex items-center gap-2"><PhFunnel /><h2 id="calendar-filters" class="font-black">Filter kalender</h2></div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <label class="field">Kategori layanan<select v-model="serviceCategory"><option value="">Semua kategori</option><option value="camera">Kamera</option><option value="iphone">iPhone</option></select></label>
          <label class="field">Produk<select v-model="productId"><option value="">Semua produk</option><option v-for="product in options.products.filter(item => !serviceCategory || item.serviceCategory === serviceCategory)" :key="product.id" :value="product.id">{{ product.name }}</option></select></label>
          <label class="field">Status booking<select v-model="bookingStatus"><option value="">Semua status</option><option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option></select></label>
        </div>
      </section>

      <StatePanel v-if="loading" class="mt-6" state="loading" title="Memuat kalender" message="Menggabungkan booking dan blok unit dalam waktu WITA." />
      <StatePanel v-else-if="failed" class="mt-6" state="error" title="Kalender belum dapat dimuat" message="Kesalahan demo dapat dipulihkan tanpa mengubah data." @retry="load" />
      <StatePanel v-else-if="!events.length" class="mt-6" state="empty" :title="allEventCount ? 'Tidak ada hasil filter' : 'Belum ada acara kalender'" :message="allEventCount ? 'Ubah atau kosongkan filter untuk menampilkan acara lain.' : 'Belum ada booking atau blok unit pada skenario ini.'" />
      <section v-else class="admin-calendar mt-6 overflow-hidden rounded-2xl border border-sand bg-white p-3 sm:p-5" aria-label="Kalender booking dan blok unit">
        <FullCalendar :key="mobile ? 'mobile' : 'desktop'" :options="calendarOptions" />
      </section>

      <section class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-muted" aria-label="Legenda kalender">
        <span class="flex items-center gap-2"><PhCalendarBlank /> Booking: warna mengikuti status dan label selalu tertulis.</span>
        <span class="flex items-center gap-2"><PhSquaresFour /> Blok unit: latar arang dengan label “Blok”.</span>
      </section>
    </div>
  </AdminLayout>
</template>
