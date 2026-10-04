<script setup lang="ts">
import { PhCamera, PhChatText, PhList, PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const menuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen w-full max-w-full overflow-x-hidden bg-canvas text-ink">
    <header class="sticky top-0 z-40 border-b border-sand bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-18 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2 font-extrabold tracking-tight" aria-label="Sewa Balikpapan, beranda">
          <span class="grid size-9 place-items-center rounded-lg bg-brand-yellow"><PhCamera :size="21" weight="bold" /></span>
          <span>Sewa Balikpapan</span>
        </RouterLink>
        <nav class="ml-auto hidden items-center gap-7 text-sm font-semibold md:flex" aria-label="Navigasi utama">
          <RouterLink class="nav-link" to="/search?category=camera">Kamera</RouterLink>
          <RouterLink class="nav-link" to="/search?category=iphone">iPhone</RouterLink>
          <RouterLink class="nav-link" to="/search">Semua Produk</RouterLink>
          <RouterLink class="nav-link" to="/my-bookings">Riwayat</RouterLink>
        </nav>
        <button class="button-outline hidden lg:inline-flex" type="button" title="Pengiriman pesan belum diaktifkan">
          <PhChatText :size="19" /> Tanya Admin
        </button>
        <RouterLink class="button-primary hidden sm:inline-flex" to="/search"><PhMagnifyingGlass :size="18" /> Cari Sewa</RouterLink>
        <button class="ml-auto grid size-11 place-items-center rounded-lg border border-sand md:hidden" type="button" :aria-expanded="menuOpen" aria-label="Buka menu" @click="menuOpen = !menuOpen">
          <PhX v-if="menuOpen" :size="22" /><PhList v-else :size="22" />
        </button>
      </div>
      <nav v-if="menuOpen" class="border-t border-sand bg-white px-4 py-3 md:hidden" aria-label="Navigasi seluler">
        <RouterLink class="mobile-nav-link" to="/search?category=camera" @click="menuOpen = false">Kamera</RouterLink>
        <RouterLink class="mobile-nav-link" to="/search?category=iphone" @click="menuOpen = false">iPhone</RouterLink>
        <RouterLink class="mobile-nav-link" to="/search" @click="menuOpen = false">Semua Produk</RouterLink>
        <RouterLink class="mobile-nav-link" to="/my-bookings" @click="menuOpen = false">Riwayat Booking</RouterLink>
      </nav>
    </header>
    <main class="min-w-0"><slot /></main>
    <footer class="border-t border-sand bg-ink text-white">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div><p class="font-extrabold">Sewa Balikpapan</p><p class="mt-2 max-w-sm text-sm leading-6 text-white/65">Prototype katalog rental kamera dan iPhone di Balikpapan.</p></div>
        <div><p class="text-sm font-bold">Informasi demo</p><p class="mt-2 text-sm leading-6 text-white/65">Lokasi dan jam operasional final akan dikonfirmasi.</p></div>
        <div><p class="text-sm font-bold">Kontak</p><p class="mt-2 text-sm leading-6 text-white/65">Fitur WhatsApp dan email belum mengirim pesan nyata.</p></div>
      </div>
    </footer>
  </div>
</template>
