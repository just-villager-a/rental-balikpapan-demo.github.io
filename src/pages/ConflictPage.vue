<script setup lang="ts">
import { PhArrowLeft, PhCalendarBlank, PhMagnifyingGlass, PhWarningCircle } from '@phosphor-icons/vue'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import StatePanel from '@/components/StatePanel.vue'
import { getCheckoutDraft, getPreservedCheckout } from '@/services/booking'
import { useDemoStore } from '@/stores/demo'
import { formatWita } from '@/utils/datetime'
import { parseCheckoutQuery } from '@/utils/checkoutQuery'

const route = useRoute(); const demo = useDemoStore(); const selection = computed(() => parseCheckoutQuery(route.query)); const draft = computed(() => selection.value ? getCheckoutDraft(selection.value) : undefined); const preserved = computed(() => getPreservedCheckout())
onMounted(() => demo.hydrate())
</script>
<template><CustomerLayout><div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16"><StatePanel v-if="!selection || !draft" state="not-found" title="Pilihan konflik tidak ditemukan" message="Mulai kembali dari katalog untuk memilih produk dan periode." /><template v-else><div class="rounded-2xl border border-warning bg-white p-6 sm:p-8"><span class="grid size-12 place-items-center rounded-xl bg-brand-yellow"><PhWarningCircle :size="26" weight="fill" /></span><h1 class="mt-5 text-3xl font-black">Ketersediaan baru saja berubah</h1><p class="mt-3 leading-7 text-muted">Kami memeriksa ulang sebelum membuat booking. Pilihan tidak diganti diam-diam dan belum ada pembayaran yang dilakukan.</p><div class="mt-6 rounded-xl bg-surface p-4"><p class="font-extrabold">{{ draft.item.name }}</p><p class="mt-2 flex gap-2 text-sm text-muted"><PhCalendarBlank class="shrink-0" />{{ formatWita(selection.period.pickupAt) }} sampai {{ formatWita(selection.period.returnAt) }}</p><p v-if="preserved" class="mt-3 text-xs font-bold text-success">Data kontak dan pilihan tambahan tetap tersimpan selama sesi ini.</p></div><div class="mt-7 grid gap-3 sm:grid-cols-2"><RouterLink class="button-primary inline-flex" :to="{ name: 'search', query: { pickup: selection.period.pickupAt, return: selection.period.returnAt, category: draft.item.serviceCategory } }"><PhMagnifyingGlass /> Pilih Alternatif</RouterLink><RouterLink class="button-outline inline-flex" :to="{ name: 'search', query: { pickup: selection.period.pickupAt, return: selection.period.returnAt } }"><PhCalendarBlank /> Ubah Tanggal</RouterLink><RouterLink class="button-outline inline-flex sm:col-span-2" to="/search">Hapus Pilihan & Kembali ke Hasil</RouterLink><RouterLink v-if="preserved" class="button-outline inline-flex sm:col-span-2" :to="{ name: 'checkout', query: route.query }"><PhArrowLeft /> Kembali ke Checkout</RouterLink></div></div></template></div></CustomerLayout></template>
