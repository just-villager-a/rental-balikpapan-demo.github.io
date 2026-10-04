<script setup lang="ts">
import { PhCalendarBlank, PhCheck, PhInfo, PhMinus, PhPlus, PhShieldCheck } from '@phosphor-icons/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { AddOn, Product, RentalPackage } from '@/domain/models'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import AvailabilityBadge from '@/components/AvailabilityBadge.vue'
import ProductMedia from '@/components/ProductMedia.vue'
import StatePanel from '@/components/StatePanel.vue'
import { getPackageDetail, getProductDetail, quoteSelection, type PackageDetailView, type PreviewMode, type ProductDetailView } from '@/services/catalog'
import { getDemoStateService } from '@/services/mockServices'
import { useDemoStore } from '@/stores/demo'
import { formatIdr } from '@/utils/currency'
import { formatWita } from '@/utils/datetime'
import { parseSearchQuery } from '@/utils/searchQuery'
import { serializeCheckoutQuery } from '@/utils/checkoutQuery'

const props = defineProps<{ kind: 'product' | 'package' }>()
const route = useRoute(); const demo = useDemoStore(); const period = computed(() => parseSearchQuery(route.query).period)
const productDetail = ref<ProductDetailView>(); const packageDetail = ref<PackageDetailView>(); const loading = ref(true); const failed = ref(false)
const quantity = ref(1); const selectedIds = ref<string[]>([])
const item = computed<Product | RentalPackage | undefined>(() => productDetail.value?.product ?? packageDetail.value?.rentalPackage)
const addOns = computed<AddOn[]>(() => productDetail.value?.addOns ?? packageDetail.value?.addOns ?? [])
const availableCount = computed(() => productDetail.value?.availableCount ?? (packageDetail.value?.available ? 1 : 0))
const available = computed(() => availableCount.value > 0)
const quote = computed(() => item.value ? quoteSelection(item.value, quantity.value, period.value, addOns.value.filter(addOn => selectedIds.value.includes(addOn.id))) : undefined)
const checkoutTarget = computed(() => item.value ? { name: 'checkout', query: serializeCheckoutQuery({ kind: props.kind, itemId: item.value.id, quantity: quantity.value, addOnIds: selectedIds.value, period: period.value }) } : { name: 'search' })
const policy = computed(() => demo.state?.locationAndPolicyCopy ?? getDemoStateService().snapshot().locationAndPolicyCopy)
function mode(): PreviewMode { return route.query.preview === 'loading' ? 'loading' : route.query.preview === 'error' ? 'error' : 'normal' }
async function load() { loading.value = true; failed.value = false; productDetail.value = undefined; packageDetail.value = undefined; selectedIds.value = []; quantity.value = 1; try { const slug = String(route.params.slug); if (props.kind === 'product') productDetail.value = await getProductDetail(slug, period.value, mode()); else packageDetail.value = await getPackageDetail(slug, period.value, mode()) } catch { failed.value = true } finally { loading.value = false } }
function toggleAddOn(id: string) { selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter(value => value !== id) : [...selectedIds.value, id] }
watch(() => route.fullPath, load)
onMounted(() => { demo.hydrate(); load() })
</script>
<template>
  <CustomerLayout>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <StatePanel v-if="loading" state="loading" title="Memeriksa unit" message="Ketersediaan dihitung untuk periode WITA yang dipilih." />
      <StatePanel v-else-if="failed" state="error" title="Detail belum dapat dimuat" message="Kesalahan demo ini dapat dipulihkan. Pilihan tanggalmu tetap tersimpan." @retry="load" />
      <StatePanel v-else-if="!item" state="not-found" title="Produk tidak ditemukan" message="Tautan ini tidak cocok dengan katalog demo saat ini." />
      <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        <div>
          <nav class="mb-5 text-xs font-bold text-muted" aria-label="Breadcrumb"><RouterLink to="/">Beranda</RouterLink> / <RouterLink to="/search">Katalog</RouterLink> / <span class="text-ink">{{ item.name }}</span></nav>
          <div class="grid gap-3 sm:grid-cols-[1fr_5.5rem]">
            <div class="aspect-[4/3] overflow-hidden rounded-2xl border border-sand bg-surface"><ProductMedia :src="item.imagePaths[0]" :alt="item.name" :category="kind === 'package' ? 'package' : productDetail?.product.category" eager /></div>
            <div class="grid grid-cols-3 gap-2 sm:grid-cols-1"><div v-for="index in 3" :key="index" class="aspect-square overflow-hidden rounded-xl border border-sand"><ProductMedia :alt="`${item.name} tampilan ${index}`" :category="kind === 'package' ? 'package' : productDetail?.product.category" /></div></div>
          </div>
          <div class="mt-8 lg:hidden"><AvailabilityBadge :status="available ? (availableCount === 1 ? 'limited' : 'available') : 'unavailable'" :count="availableCount" /><h1 class="mt-3 text-3xl font-black tracking-tight">{{ item.name }}</h1><p class="mt-3"><strong class="text-2xl">{{ formatIdr(item.dailyRate) }}</strong><span class="text-sm text-muted"> / hari</span></p>
            <section class="mt-6 rounded-2xl border border-sand bg-white p-5"><div class="flex items-center justify-between"><h2 class="flex items-center gap-2 font-black"><PhCalendarBlank /> Jadwal Sewa</h2><span class="rounded-md bg-brand-yellow px-2 py-1 text-xs font-black">{{ quote?.billableDays }} hari</span></div><dl class="mt-4 grid gap-3 border-t border-sand pt-4 text-sm"><div class="flex justify-between gap-4"><dt class="text-muted">Mulai</dt><dd class="text-right font-bold">{{ formatWita(period.pickupAt) }}</dd></div><div class="flex justify-between gap-4"><dt class="text-muted">Selesai</dt><dd class="text-right font-bold">{{ formatWita(period.returnAt) }}</dd></div><div class="flex justify-between gap-4 border-t border-sand pt-3"><dt>Total estimasi</dt><dd class="font-black">{{ quote ? formatIdr(quote.rentalSubtotal) : '' }}</dd></div></dl></section>
            <fieldset v-if="addOns.length" class="mt-6 rounded-2xl border border-sand bg-white p-5"><legend class="px-1 text-lg font-black">Tambahan aksesori</legend><label v-for="addOn in addOns" :key="addOn.id" class="mt-2 flex min-h-14 items-center justify-between gap-3 rounded-xl bg-surface px-3 text-sm"><span class="flex items-center gap-3"><input type="checkbox" :checked="selectedIds.includes(addOn.id)" @change="toggleAddOn(addOn.id)" />{{ addOn.name }}</span><strong class="text-xs">+{{ formatIdr(addOn.price) }}</strong></label></fieldset>
          </div>
          <section class="mt-10 border-t border-sand pt-8"><h2 class="text-xl font-black">Tentang item</h2><p v-if="productDetail" class="mt-3 max-w-2xl leading-7 text-charcoal">{{ productDetail.product.summary }}</p><p v-else class="mt-3 max-w-2xl leading-7 text-charcoal">Paket berisi komponen wajib yang dialokasikan bersama untuk seluruh periode sewa.</p></section>
          <section v-if="productDetail" class="mt-8 grid gap-8 border-t border-sand pt-8 sm:grid-cols-2"><div><h2 class="font-black">Spesifikasi</h2><dl class="mt-4 grid gap-3"><div v-for="(value, key) in productDetail.product.specifications" :key="key" class="flex justify-between gap-4 border-b border-sand pb-2 text-sm"><dt class="capitalize text-muted">{{ key }}</dt><dd class="font-bold">{{ value }}</dd></div></dl></div><div><h2 class="font-black">Sudah termasuk</h2><ul class="mt-4 grid gap-2"><li v-for="included in productDetail.product.includedItems" :key="included" class="flex gap-2 text-sm"><PhCheck class="mt-0.5 shrink-0 text-success" weight="bold" />{{ included }}</li></ul></div></section>
          <section v-if="packageDetail" class="mt-8 border-t border-sand pt-8"><h2 class="font-black">Isi paket</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2"><li v-for="component in packageDetail.components" :key="component.product.id" class="rounded-xl border border-sand bg-white p-4"><p class="text-xs font-bold uppercase tracking-widest text-muted">{{ component.quantity }} unit</p><p class="mt-1 font-extrabold">{{ component.product.name }}</p></li></ul></section>
          <section class="mt-8 border-t border-sand pt-8"><div class="flex gap-3"><PhShieldCheck class="mt-1 shrink-0" :size="25" /><div><h2 class="font-black">Pengambilan dan jaminan</h2><p class="mt-2 text-sm leading-6 text-muted">{{ policy.pickupLocation }}. {{ policy.operatingHours }}.</p><p class="mt-2 text-sm leading-6 text-muted">{{ policy.guaranteeNotice }}</p></div></div></section>
        </div>

        <aside class="hidden lg:block"><div class="sticky top-25 rounded-2xl border border-sand bg-white p-6">
          <AvailabilityBadge :status="available ? (availableCount === 1 ? 'limited' : 'available') : 'unavailable'" :count="availableCount" />
          <h1 class="mt-3 text-2xl font-black tracking-tight">{{ item.name }}</h1><p class="mt-2 text-sm text-muted"><strong class="text-xl text-ink">{{ formatIdr(item.dailyRate) }}</strong> / hari</p>
          <div class="mt-6 rounded-xl bg-surface p-4 text-xs leading-5"><p class="flex gap-2 font-bold"><PhCalendarBlank class="mt-0.5 shrink-0" />{{ formatWita(period.pickupAt) }}</p><p class="mt-2 pl-6 font-bold">hingga {{ formatWita(period.returnAt) }}</p></div>
          <label class="mt-5 block text-xs font-extrabold">Jumlah unit</label><div class="mt-2 flex items-center justify-between rounded-lg border border-sand"><button class="grid size-11 place-items-center" type="button" aria-label="Kurangi jumlah" :disabled="quantity === 1" @click="quantity--"><PhMinus /></button><strong data-testid="quantity">{{ quantity }}</strong><button class="grid size-11 place-items-center" type="button" aria-label="Tambah jumlah" :disabled="quantity >= availableCount" @click="quantity++"><PhPlus /></button></div>
          <fieldset v-if="addOns.length" class="mt-5"><legend class="text-xs font-extrabold">Tambahan</legend><label v-for="addOn in addOns" :key="addOn.id" class="mt-2 flex min-h-11 items-center justify-between gap-3 text-sm"><span class="flex items-center gap-2"><input type="checkbox" :checked="selectedIds.includes(addOn.id)" @change="toggleAddOn(addOn.id)" />{{ addOn.name }}</span><span class="text-xs font-bold">+{{ formatIdr(addOn.price) }}</span></label></fieldset>
          <div v-if="quote" class="mt-6 border-t border-sand pt-5"><div class="flex justify-between text-sm"><span>{{ quote.billableDays }} hari</span><strong data-testid="quote-total">{{ formatIdr(quote.rentalSubtotal) }}</strong></div><div class="mt-2 flex justify-between text-sm text-muted"><span>Deposit demo</span><span>{{ formatIdr(quote.depositDue) }}</span></div></div>
          <RouterLink v-if="available" class="button-primary mt-5 inline-flex w-full" :to="checkoutTarget">Lanjutkan Pemesanan</RouterLink><button v-else class="button-disabled mt-5 w-full" type="button" disabled>Tidak tersedia di periode ini</button><p class="mt-3 flex gap-2 text-xs leading-5 text-muted"><PhInfo class="mt-0.5 shrink-0" />Tidak ada pembayaran atau pengiriman pesan nyata pada prototype ini.</p>
        </div></aside>
      </div>
    </div>
    <div v-if="item" class="sticky bottom-0 z-30 border-t border-sand bg-white p-3 lg:hidden"><div class="mx-auto flex max-w-2xl items-center justify-between gap-4"><div><p class="text-xs text-muted">{{ quote?.billableDays }} hari</p><strong data-testid="mobile-quote-total">{{ quote ? formatIdr(quote.rentalSubtotal) : '' }}</strong></div><RouterLink v-if="available" class="button-primary inline-flex" :to="checkoutTarget">Lanjutkan</RouterLink><button v-else class="button-disabled" type="button" disabled>Tidak tersedia</button></div></div>
  </CustomerLayout>
</template>
