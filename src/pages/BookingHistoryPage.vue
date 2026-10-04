<script setup lang="ts">
import { PhCalendarBlank, PhClockCounterClockwise } from '@phosphor-icons/vue'
import { computed, onMounted, ref } from 'vue'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import StatePanel from '@/components/StatePanel.vue'
import type { Booking } from '@/domain/models'
import { listDemoCustomerBookings } from '@/services/booking'
import { useDemoStore } from '@/stores/demo'
import { formatIdr } from '@/utils/currency'
import { formatWita } from '@/utils/datetime'

const demo = useDemoStore()
const bookings = ref<Booking[]>([])
const loading = ref(true)
const failed = ref(false)
let errorShown = false
const activeStatuses = new Set(['waiting_payment', 'confirmed', 'picked_up', 'returned'])
const upcoming = computed(() => bookings.value.filter(booking => activeStatuses.has(booking.status)))
const past = computed(() => bookings.value.filter(booking => !activeStatuses.has(booking.status)))

async function load() {
  loading.value = true
  failed.value = false
  const mode = demo.activeScenario?.mode
  if (mode === 'loading') await new Promise(resolve => setTimeout(resolve, 650))
  if (mode === 'recoverable_error' && !errorShown) {
    errorShown = true
    loading.value = false
    failed.value = true
    return
  }
  bookings.value = mode === 'empty' ? [] : listDemoCustomerBookings()
  loading.value = false
}

onMounted(() => { demo.hydrate(); load() })
</script>

<template>
  <CustomerLayout>
    <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div class="flex items-start gap-4">
        <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-yellow"><PhClockCounterClockwise :size="23" /></span>
        <div><p class="text-sm font-extrabold text-muted">Akun demo, tanpa login</p><h1 class="mt-1 text-3xl font-black">Riwayat Booking</h1><p class="mt-2 text-sm leading-6 text-muted">Hanya booking milik pelanggan demo yang ditampilkan.</p></div>
      </div>
      <StatePanel v-if="loading" class="mt-8" state="loading" title="Memuat riwayat" message="Mengambil booking demo dari penyimpanan browser." />
      <StatePanel v-else-if="failed" class="mt-8" state="error" title="Riwayat belum dapat dimuat" message="Kesalahan demo ini dapat dipulihkan tanpa mengubah data." @retry="load" />
      <StatePanel v-else-if="!bookings.length" class="mt-8" state="empty" title="Belum ada booking" message="Pilih produk dari katalog untuk menjalankan alur booking demo." />
      <template v-else>
        <section v-for="group in [{ title: 'Aktif dan mendatang', items: upcoming }, { title: 'Selesai atau berakhir', items: past }]" :key="group.title" class="mt-10">
          <h2 class="text-xl font-black">{{ group.title }}</h2>
          <p v-if="!group.items.length" class="mt-3 text-sm text-muted">Tidak ada booking pada kelompok ini.</p>
          <div v-else class="mt-4 grid gap-3">
            <article v-for="booking in group.items" :key="booking.id" class="grid gap-4 rounded-2xl border border-sand bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><div class="flex flex-wrap items-center gap-2"><strong>{{ booking.reference }}</strong><span class="status-badge status-limited">{{ booking.status }}</span><span class="status-badge status-available">{{ booking.paymentStatus }}</span></div><p class="mt-3 font-extrabold">{{ booking.lines[0]?.nameSnapshot ?? 'Booking rental' }}</p><p class="mt-2 flex items-center gap-2 text-xs text-muted"><PhCalendarBlank :size="16" />{{ formatWita(booking.period.pickupAt) }} sampai {{ formatWita(booking.period.returnAt) }}</p></div>
              <div class="flex items-center justify-between gap-4 sm:block sm:text-right"><p class="font-black">{{ formatIdr(booking.pricing.rentalSubtotal) }}</p><RouterLink class="button-outline mt-2 inline-flex" :to="{ name: 'customer-booking-detail', params: { bookingId: booking.id } }">Lihat Detail</RouterLink></div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </CustomerLayout>
</template>
