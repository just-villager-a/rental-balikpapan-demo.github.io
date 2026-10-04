<script setup lang="ts">
import { PhCalendarBlank, PhCheckCircle, PhIdentificationCard, PhLockSimple, PhMapPin } from '@phosphor-icons/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CustomerLayout from '@/layouts/CustomerLayout.vue'
import ProductMedia from '@/components/ProductMedia.vue'
import StatePanel from '@/components/StatePanel.vue'
import { checkoutContactSchema, createBooking, getCheckoutDraft } from '@/services/booking'
import { getDemoStateService } from '@/services/mockServices'
import { useDemoStore } from '@/stores/demo'
import { formatIdr } from '@/utils/currency'
import { formatWita } from '@/utils/datetime'
import { parseCheckoutQuery } from '@/utils/checkoutQuery'

const route = useRoute(); const router = useRouter(); const demo = useDemoStore()
const selection = computed(() => parseCheckoutQuery(route.query)); const draft = computed(() => selection.value ? getCheckoutDraft(selection.value) : undefined)
const form = reactive({ name: 'Raka Demo', whatsapp: '+628110000001', email: 'raka@example.test', note: '', termsAccepted: false })
const errors = reactive<Record<string, string>>({}); const submitting = ref(false); const conflict = ref(false)
const policy = computed(() => demo.state?.locationAndPolicyCopy ?? getDemoStateService().snapshot().locationAndPolicyCopy)
function submit() {
  Object.keys(errors).forEach(key => delete errors[key]); conflict.value = false
  const parsed = checkoutContactSchema.safeParse(form)
  if (!parsed.success) { parsed.error.issues.forEach(issue => { errors[String(issue.path[0])] ??= issue.message }); return }
  if (!selection.value) return
  submitting.value = true
  const result = createBooking({ ...selection.value, customer: { name: parsed.data.name, whatsapp: parsed.data.whatsapp, email: parsed.data.email || undefined }, note: parsed.data.note || undefined, termsAccepted: true })
  submitting.value = false
  if (!result.ok) { conflict.value = result.reason === 'unavailable'; return }
  router.push({ name: 'demo-payment', params: { bookingId: result.booking.id } })
}
onMounted(() => demo.hydrate())
</script>
<template>
  <CustomerLayout>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <StatePanel v-if="!selection || !draft" state="not-found" title="Pilihan booking belum tersedia" message="Pilih produk dan periode sewa dari katalog sebelum membuka checkout." />
      <template v-else>
        <div class="mb-8"><p class="text-sm font-extrabold text-muted">Langkah 1 dari 3</p><h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Lengkapi booking demo</h1><p class="mt-2 text-sm text-muted">Data ini hanya disimpan di browser untuk demonstrasi calon klien.</p></div>
        <div v-if="conflict" class="mb-6 rounded-xl border border-error bg-white p-5" role="alert"><h2 class="font-black text-error">Ketersediaan berubah</h2><p class="mt-2 text-sm leading-6">Unit tidak lagi cukup untuk pilihan ini. Data kontak tetap ada; kembali ke katalog untuk memilih periode atau produk lain.</p><RouterLink class="button-outline mt-4 inline-flex" :to="{ name: 'search', query: { pickup: selection.period.pickupAt, return: selection.period.returnAt } }">Kembali ke katalog</RouterLink></div>
        <form class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]" @submit.prevent="submit">
          <div class="grid gap-6">
            <section class="rounded-2xl border border-sand bg-white p-5 sm:p-7"><h2 class="text-xl font-black">Informasi penyewa</h2><div class="mt-5 grid gap-4 sm:grid-cols-2">
              <label class="field sm:col-span-2"><span>Nama lengkap</span><input v-model="form.name" autocomplete="name" :aria-invalid="Boolean(errors.name)" /><small v-if="errors.name" class="text-error">{{ errors.name }}</small></label>
              <label class="field"><span>Nomor WhatsApp</span><input v-model="form.whatsapp" inputmode="tel" autocomplete="tel" :aria-invalid="Boolean(errors.whatsapp)" /><small v-if="errors.whatsapp" class="text-error">{{ errors.whatsapp }}</small></label>
              <label class="field"><span>Email (opsional)</span><input v-model="form.email" type="email" autocomplete="email" :aria-invalid="Boolean(errors.email)" /><small v-if="errors.email" class="text-error">{{ errors.email }}</small></label>
              <label class="field sm:col-span-2"><span>Catatan (opsional)</span><textarea v-model="form.note" class="min-h-28 rounded-lg border border-sand p-3 text-sm" maxlength="500" /></label>
            </div></section>
            <section class="rounded-2xl border border-sand bg-white p-5 sm:p-7"><h2 class="flex items-center gap-2 text-xl font-black"><PhMapPin /> Pengambilan di counter</h2><p class="mt-3 text-sm leading-6 text-muted">{{ policy.pickupLocation }}. {{ policy.operatingHours }}.</p><div class="mt-5 flex gap-3 rounded-xl bg-surface p-4"><PhIdentificationCard class="mt-0.5 shrink-0" :size="24" /><p class="text-sm leading-6">{{ policy.guaranteeNotice }} Tidak ada foto atau nomor dokumen yang dikumpulkan.</p></div></section>
            <label class="flex gap-3 rounded-2xl border border-sand bg-white p-5 text-sm leading-6"><input v-model="form.termsAccepted" class="mt-1 size-5 shrink-0" type="checkbox" :aria-invalid="Boolean(errors.termsAccepted)" /><span><strong>Saya menyetujui syarat rental dan pembatalan demo.</strong><span class="mt-1 block text-muted">Kebijakan final masih memerlukan persetujuan klien.</span><small v-if="errors.termsAccepted" class="text-error">{{ errors.termsAccepted }}</small></span></label>
          </div>
          <aside><div class="sticky top-24 rounded-2xl border border-sand bg-white p-5"><h2 class="font-black">Ringkasan booking</h2><div class="mt-4 grid grid-cols-[4.5rem_1fr] gap-3"><div class="aspect-square overflow-hidden rounded-lg"><ProductMedia :alt="draft.item.name" :category="selection.kind === 'package' ? 'package' : 'camera'" /></div><div><p class="font-extrabold">{{ draft.item.name }}</p><p class="mt-1 text-xs text-muted">{{ selection.quantity }} unit</p></div></div><div class="mt-5 rounded-xl bg-surface p-4 text-xs"><p class="flex gap-2 font-bold"><PhCalendarBlank />{{ formatWita(selection.period.pickupAt) }}</p><p class="mt-2 pl-6 font-bold">hingga {{ formatWita(selection.period.returnAt) }}</p></div><ul class="mt-5 grid gap-2 border-b border-sand pb-4 text-sm"><li v-for="line in draft.quote.lines" :key="line.lineId" class="flex justify-between gap-3"><span>{{ line.name }}</span><strong>{{ formatIdr(line.total) }}</strong></li></ul><dl class="mt-4 grid gap-2 text-sm"><div class="flex justify-between"><dt>Total rental</dt><dd class="font-black">{{ formatIdr(draft.quote.rentalSubtotal) }}</dd></div><div class="flex justify-between"><dt>DP demo 30%</dt><dd>{{ formatIdr(draft.quote.depositDue) }}</dd></div><div class="flex justify-between text-muted"><dt>Sisa di counter</dt><dd>{{ formatIdr(draft.quote.remainingBalance) }}</dd></div></dl><button class="button-primary mt-5 inline-flex w-full" type="submit" :disabled="submitting"><PhLockSimple />{{ submitting ? 'Memeriksa...' : 'Buat Booking Demo' }}</button><p class="mt-3 flex gap-2 text-xs leading-5 text-muted"><PhCheckCircle class="mt-0.5 shrink-0" />Ketersediaan diperiksa kembali sebelum booking dibuat.</p></div></aside>
        </form>
      </template>
    </div>
  </CustomerLayout>
</template>
