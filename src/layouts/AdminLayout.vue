<script setup lang="ts">
import { PhArrowLeft, PhBookOpen, PhChartBar, PhPresentationChart } from '@phosphor-icons/vue'
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f3f4f6] text-ink">
    <header class="border-b border-sand bg-white lg:hidden">
      <div class="flex min-h-16 items-center gap-3 px-4"><span class="grid size-9 place-items-center rounded-lg bg-brand-yellow"><PhChartBar :size="20" weight="bold" /></span><strong>Admin Demo</strong><RouterLink class="ml-auto text-sm font-bold" to="/">Toko</RouterLink></div>
      <nav class="flex gap-1 overflow-x-auto border-t border-sand px-3 py-2" aria-label="Navigasi admin"><RouterLink class="mobile-nav-link whitespace-nowrap" to="/admin">Ringkasan</RouterLink><RouterLink class="mobile-nav-link whitespace-nowrap" to="/admin/bookings">Booking</RouterLink><RouterLink class="mobile-nav-link whitespace-nowrap" to="/demo">Skenario</RouterLink></nav>
    </header>
    <div class="mx-auto grid max-w-[1440px] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside class="hidden min-h-screen border-r border-sand bg-white p-5 lg:block"><div class="sticky top-5"><div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-lg bg-brand-yellow"><PhChartBar :size="22" weight="bold" /></span><div><strong class="block">Sewa Balikpapan</strong><span class="text-xs font-bold text-error">Admin demo</span></div></div><nav class="mt-8 grid gap-2" aria-label="Navigasi admin"><RouterLink class="admin-nav-link" to="/admin"><PhChartBar /> Ringkasan</RouterLink><RouterLink class="admin-nav-link" to="/admin/bookings"><PhBookOpen /> Daftar Booking</RouterLink><RouterLink class="admin-nav-link" to="/demo"><PhPresentationChart /> Skenario Demo</RouterLink></nav><RouterLink class="mt-8 flex items-center gap-2 border-t border-sand pt-5 text-sm font-bold text-muted" to="/"><PhArrowLeft /> Kembali ke toko</RouterLink></div></aside>
      <main class="min-w-0"><div class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-warning">Data operasional simulasi · tanpa autentikasi atau sinkronisasi nyata</div><slot /></main>
    </div>
  </div>
</template>
