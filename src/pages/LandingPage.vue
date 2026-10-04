<script setup lang="ts">
import { PhArrowRight, PhCheckCircle } from '@phosphor-icons/vue'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CatalogItemView, RentalPeriod } from '@/domain/models'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import ProductCard from '@/components/ProductCard.vue'
import RentalSearchForm from '@/components/RentalSearchForm.vue'
import StatePanel from '@/components/StatePanel.vue'
import { getFeaturedItems, type PreviewMode } from '@/services/catalog'
import { useDemoStore } from '@/stores/demo'
import { DEFAULT_FILTERS, DEFAULT_PERIOD, serializeSearchQuery } from '@/utils/searchQuery'
import cameraLogo from '../../assets/brand/sewa-kamera-logo.jpg'
import iphoneLogo from '../../assets/brand/sewa-iphone-logo.jpg'

const demo = useDemoStore(); const route = useRoute(); const router = useRouter()
const featured = ref<CatalogItemView[]>([]); const loading = ref(true); const error = ref(false)
function mode(): PreviewMode { return route.query.preview === 'loading' ? 'loading' : route.query.preview === 'error' ? 'error' : 'normal' }
async function load() { loading.value = true; error.value = false; try { featured.value = await getFeaturedItems(DEFAULT_PERIOD, mode()) } catch { error.value = true } finally { loading.value = false } }
function search(period: RentalPeriod, category: string) { const filters = { ...DEFAULT_FILTERS, categories: category ? [category] : [] }; router.push({ name: 'search', query: serializeSearchQuery({ period, filters }) }) }
onMounted(() => { demo.hydrate(); load() })
</script>
<template>
  <CustomerLayout>
    <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <div class="rounded-2xl border border-sand bg-white p-5 sm:p-8">
        <p class="inline-flex items-center gap-2 rounded-md bg-surface px-3 py-1.5 text-xs font-extrabold"><span class="size-2 rounded-full bg-success" /> Counter WITA siap melayani</p>
        <h1 class="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-[-.035em] sm:text-5xl">Rental Kamera & iPhone di Balikpapan</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">Unit terawat, tarif harian transparan, dan pengambilan langsung di counter Balikpapan.</p>
        <div class="mt-6 rounded-xl bg-surface p-2 sm:p-4"><RentalSearchForm :period="DEFAULT_PERIOD" @submit="search" /><p class="mt-3 px-2 text-xs text-muted">Perhitungan rental berbasis 24 jam dan ketersediaan unit fisik.</p></div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div><h2 class="text-2xl font-black tracking-tight">Pilih Kategori Alat</h2><p class="mt-1 text-sm text-muted">Katalog siap pakai untuk kebutuhan dokumentasi dan konten.</p></div>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <RouterLink v-for="category in [{ label: 'Sewa Kamera Balikpapan', value: 'camera', image: cameraLogo, note: 'Kamera, lensa, dan aksesori' }, { label: 'Sewa iPhone Balikpapan', value: 'iphone', image: iphoneLogo, note: 'Pilihan iPhone untuk konten' }]" :key="category.value" :to="`/search?category=${category.value}`" class="group grid grid-cols-[5.5rem_1fr] gap-4 rounded-xl border border-sand bg-white p-4 sm:grid-cols-[7rem_1fr] sm:p-6">
          <img :src="category.image" :alt="category.label" class="aspect-square w-full rounded-lg object-cover" /><div class="flex min-w-0 flex-col"><p class="text-lg font-extrabold">{{ category.label }}</p><p class="mt-2 text-sm text-muted">{{ category.note }}</p><span class="mt-auto flex items-center justify-between border-t border-sand pt-4 text-xs font-bold">Buka katalog <PhArrowRight class="transition-transform group-hover:translate-x-1" /></span></div>
        </RouterLink>
      </div>
    </section>

    <section class="border-y border-sand bg-white"><div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div class="flex items-end justify-between"><div><p class="text-sm font-extrabold uppercase tracking-widest text-muted">Pilihan populer</p><h2 class="mt-2 text-3xl font-black tracking-tight">Perangkat unggulan</h2></div><RouterLink class="button-outline hidden sm:inline-flex" to="/search">Semua produk</RouterLink></div>
      <div v-if="loading" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Memuat produk"><div v-for="index in 4" :key="index" class="h-96 rounded-2xl skeleton" /></div>
      <StatePanel v-else-if="error" class="mt-8" state="error" title="Produk belum dapat dimuat" message="Kesalahan demo ini dapat dipulihkan tanpa kehilangan pilihanmu." @retry="load" />
      <StatePanel v-else-if="!featured.length" class="mt-8" state="empty" title="Belum ada produk unggulan" message="Gunakan pencarian untuk melihat semua produk demo." />
      <div v-else class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><ProductCard v-for="item in featured" :key="item.id" :item="item" :period="DEFAULT_PERIOD" /></div>
    </div></section>

    <section class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div class="rounded-2xl border border-sand bg-white p-6 sm:p-8"><p class="text-xs font-extrabold uppercase tracking-widest text-warning">Standar operasional counter</p><h2 class="mt-2 text-2xl font-black tracking-tight">Pengambilan & pengembalian unit langsung di counter Balikpapan</h2><div class="mt-6 grid gap-3 md:grid-cols-3"><div v-for="step in ['Jaminan fisik asli dibawa saat pengambilan.', 'Deposit dan jaminan diperlakukan terpisah.', 'Fungsi unit diperiksa bersama di counter.']" :key="step" class="flex gap-3 rounded-xl bg-surface p-4 text-sm font-semibold leading-6"><PhCheckCircle class="mt-1 shrink-0 text-success" />{{ step }}</div></div></div></section>
  </CustomerLayout>
</template>
