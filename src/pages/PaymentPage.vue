<script setup lang="ts">
import { PhBank, PhCheckCircle, PhInfo, PhLockSimple } from '@phosphor-icons/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import StatePanel from '@/components/StatePanel.vue'
import type { Booking } from '@/domain/models'
import { getBooking, submitDemoPayment } from '@/services/booking'
import { useDemoStore } from '@/stores/demo'
import { formatIdr } from '@/utils/currency'

const route = useRoute(); const router = useRouter(); const demo = useDemoStore(); const booking = ref<Booking>(); const busy = ref(false)
function load() { booking.value = getBooking(String(route.params.bookingId)) }
function pay(outcome: 'pending' | 'deposit_paid') { if (!booking.value) return; busy.value = true; const next = submitDemoPayment(booking.value.id, outcome); busy.value = false; if (next) router.push({ name: 'booking-confirmation', params: { bookingId: next.id } }) }
onMounted(() => { demo.hydrate(); load() })
</script>
<template><CustomerLayout><div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16"><StatePanel v-if="!booking" state="not-found" title="Booking tidak ditemukan" message="Booking demo ini tidak tersedia pada penyimpanan browser." /><template v-else><div class="text-center"><span class="mx-auto grid size-12 place-items-center rounded-xl bg-brand-yellow"><PhBank :size="25" /></span><p class="mt-5 text-sm font-extrabold text-muted">Langkah 2 dari 3</p><h1 class="mt-2 text-3xl font-black">Simulasi pembayaran DP</h1><p class="mt-3 text-sm leading-6 text-muted">Tidak ada uang yang ditransfer dan tidak ada koneksi ke penyedia pembayaran.</p></div><section class="mt-8 rounded-2xl border border-sand bg-white p-6 sm:p-8"><div class="flex justify-between gap-4 border-b border-sand pb-5"><div><p class="text-xs font-bold text-muted">Referensi booking</p><p class="mt-1 font-black">{{ booking.reference }}</p></div><span class="status-badge status-limited">{{ booking.paymentStatus }}</span></div><dl class="mt-6 grid gap-3"><div class="flex justify-between"><dt>Total rental</dt><dd class="font-black">{{ formatIdr(booking.pricing.rentalSubtotal) }}</dd></div><div class="flex justify-between text-lg"><dt>DP demo</dt><dd class="font-black">{{ formatIdr(booking.pricing.depositDue) }}</dd></div><div class="flex justify-between text-sm text-muted"><dt>Sisa di counter</dt><dd>{{ formatIdr(booking.pricing.remainingBalance) }}</dd></div></dl><div class="mt-6 grid gap-3 sm:grid-cols-2"><button class="button-outline inline-flex" type="button" :disabled="busy" @click="pay('pending')"><PhInfo /> Simulasikan Tertunda</button><button class="button-primary inline-flex" type="button" :disabled="busy" @click="pay('deposit_paid')"><PhCheckCircle /> Simulasikan DP Berhasil</button></div><p class="mt-5 flex gap-2 rounded-xl bg-surface p-4 text-xs leading-5 text-muted"><PhLockSimple class="mt-0.5 shrink-0" />Status pembayaran dan status booking disimpan terpisah dalam data demo.</p></section></template></div></CustomerLayout></template>
