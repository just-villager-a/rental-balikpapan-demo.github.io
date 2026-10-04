<script setup lang="ts">
import { PhFunnel, PhSlidersHorizontal, PhX } from '@phosphor-icons/vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { CatalogFilters, CatalogItemView, RentalPeriod } from '@/domain/models'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import ProductCard from '@/components/ProductCard.vue'
import RentalSearchForm from '@/components/RentalSearchForm.vue'
import StatePanel from '@/components/StatePanel.vue'
import { filterOptions, searchCatalog, type PreviewMode } from '@/services/catalog'
import { getDemoStateService } from '@/services/mockServices'
import { useDemoStore } from '@/stores/demo'
import { formatWita } from '@/utils/datetime'
import { parseSearchQuery, serializeSearchQuery } from '@/utils/searchQuery'

const route = useRoute(); const router = useRouter(); const demo = useDemoStore()
const items = ref<CatalogItemView[]>([]); const loading = ref(true); const failed = ref(false); const filterOpen = ref(false)
const state = reactive(parseSearchQuery(route.query)); const filters = reactive<CatalogFilters>({ ...state.filters, categories: [...state.filters.categories], brands: [...state.filters.brands] })
const options = ref({ brands: [] as string[], categories: [] as string[] })
const activeCount = computed(() => filters.categories.length + filters.brands.length + Number(filters.availableOnly) + Number(filters.minDailyRate !== undefined) + Number(filters.maxDailyRate !== undefined))
function previewMode(): PreviewMode { return route.query.preview === 'loading' ? 'loading' : route.query.preview === 'error' ? 'error' : 'normal' }
async function load() { loading.value = true; failed.value = false; try { items.value = await searchCatalog({ period: state.period, filters }, previewMode()) } catch { failed.value = true } finally { loading.value = false } }
function syncFromRoute() { const parsed = parseSearchQuery(route.query); Object.assign(state.period, parsed.period); Object.assign(filters, parsed.filters); filters.categories = [...parsed.filters.categories]; filters.brands = [...parsed.filters.brands]; load() }
function apply() { router.replace({ name: 'search', query: serializeSearchQuery({ period: state.period, filters }) }); filterOpen.value = false }
function changePeriod(period: RentalPeriod, category: string) { Object.assign(state.period, period); filters.categories = category ? [category] : []; apply() }
function toggle(list: string[], value: string) { const index = list.indexOf(value); index >= 0 ? list.splice(index, 1) : list.push(value) }
function clear() { Object.assign(filters, { categories: [], brands: [], minDailyRate: undefined, maxDailyRate: undefined, availableOnly: false, sort: 'recommended' }); apply() }
watch(() => route.fullPath, syncFromRoute)
onMounted(() => { demo.hydrate(); options.value = filterOptions(getDemoStateService().snapshot()); syncFromRoute() })
</script>
<template>
  <CustomerLayout>
    <section class="hidden border-b border-sand bg-white md:block"><div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p class="text-sm font-extrabold uppercase tracking-widest text-muted">Katalog</p><h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Temukan perangkat untuk jadwalmu</h1><div class="mt-6"><RentalSearchForm compact :period="state.period" :initial-category="filters.categories[0]" @submit="changePeriod" /></div></div></section>
    <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="mb-5 text-2xl font-black md:hidden">Hasil Ketersediaan</h1><div class="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p class="text-sm font-bold text-muted">{{ formatWita(state.period.pickupAt) }} sampai</p><p class="mt-1 text-sm font-bold">{{ formatWita(state.period.returnAt) }}</p></div><div class="flex items-center gap-2"><button class="button-outline lg:hidden" type="button" @click="filterOpen = true"><PhFunnel /> Filter <span v-if="activeCount">({{ activeCount }})</span></button><label class="field min-w-44"><span>Urutkan</span><select v-model="filters.sort" @change="apply"><option value="recommended">Direkomendasikan</option><option value="price_asc">Harga terendah</option><option value="price_desc">Harga tertinggi</option></select></label></div></div>
      <div class="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside class="hidden lg:block"><div class="sticky top-24 rounded-2xl border border-sand bg-white p-5"><FilterFields :filters="filters" :options="options" @toggle-category="toggle(filters.categories, $event)" @toggle-brand="toggle(filters.brands, $event)" /><div class="mt-5 grid gap-2"><button class="button-dark" type="button" @click="apply">Terapkan filter</button><button class="min-h-11 text-sm font-bold text-muted" type="button" @click="clear">Reset</button></div></div></aside>
        <div>
          <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Memuat hasil"><div v-for="index in 6" :key="index" class="h-96 rounded-2xl skeleton" /></div>
          <StatePanel v-else-if="failed" state="error" title="Hasil belum dapat dimuat" message="Pilihan tanggal dan filter tetap tersimpan. Coba muat kembali." @retry="load" />
          <StatePanel v-else-if="!items.length" state="empty" title="Tidak ada unit yang cocok" message="Ubah periode atau hapus sebagian filter untuk melihat pilihan lain." />
          <div v-else><p class="mb-4 text-sm font-bold text-muted">{{ items.length }} pilihan ditemukan</p><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><ProductCard v-for="item in items" :key="item.id" :item="item" :period="state.period" /></div></div>
        </div>
      </div>
    </section>
    <div v-if="filterOpen" class="fixed inset-0 z-50 bg-ink/45 lg:hidden" @click.self="filterOpen = false"><aside class="ml-auto flex h-full w-[min(88vw,24rem)] flex-col bg-canvas p-5" role="dialog" aria-modal="true" aria-label="Filter produk"><div class="flex items-center justify-between"><h2 class="flex items-center gap-2 text-xl font-black"><PhSlidersHorizontal /> Filter</h2><button class="grid size-11 place-items-center" type="button" aria-label="Tutup filter" @click="filterOpen = false"><PhX :size="22" /></button></div><div class="mt-6 overflow-y-auto"><FilterFields :filters="filters" :options="options" @toggle-category="toggle(filters.categories, $event)" @toggle-brand="toggle(filters.brands, $event)" /></div><div class="mt-auto grid grid-cols-2 gap-2 pt-4"><button class="button-outline" type="button" @click="clear">Reset</button><button class="button-dark" type="button" @click="apply">Terapkan</button></div></aside></div>
  </CustomerLayout>
</template>

<script lang="ts">
import { defineComponent, h, type PropType } from 'vue'
const labels: Record<string, string> = { camera: 'Kamera', lens: 'Lensa', iphone: 'iPhone', accessory: 'Aksesori', package: 'Paket' }
const FilterFields = defineComponent({
  props: { filters: { type: Object as PropType<CatalogFilters>, required: true }, options: { type: Object as PropType<{ brands: string[]; categories: string[] }>, required: true } },
  emits: ['toggle-category', 'toggle-brand'],
  setup(props, { emit }) { return () => h('div', { class: 'grid gap-6' }, [
    h('fieldset', {}, [h('legend', { class: 'text-sm font-extrabold' }, 'Kategori'), h('div', { class: 'mt-3 grid gap-2' }, props.options.categories.map(value => h('label', { class: 'flex min-h-10 items-center gap-3 text-sm font-semibold' }, [h('input', { type: 'checkbox', checked: props.filters.categories.includes(value), onChange: () => emit('toggle-category', value) }), labels[value] ?? value])))]),
    h('fieldset', {}, [h('legend', { class: 'text-sm font-extrabold' }, 'Merek'), h('div', { class: 'mt-3 grid gap-2' }, props.options.brands.map(value => h('label', { class: 'flex min-h-10 items-center gap-3 text-sm font-semibold' }, [h('input', { type: 'checkbox', checked: props.filters.brands.includes(value), onChange: () => emit('toggle-brand', value) }), value])))]),
    h('label', { class: 'flex min-h-11 items-center gap-3 text-sm font-bold' }, [h('input', { type: 'checkbox', checked: props.filters.availableOnly, onChange: (event: Event) => { props.filters.availableOnly = (event.target as HTMLInputElement).checked } }), 'Hanya yang tersedia']),
  ]) }
})
</script>
