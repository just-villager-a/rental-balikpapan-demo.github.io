import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/pages/LandingPage.vue'
import PackageDetailPage from '@/pages/PackageDetailPage.vue'
import ProductDetailPage from '@/pages/ProductDetailPage.vue'
import SearchPage from '@/pages/SearchPage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
    },
    { path: '/search', name: 'search', component: SearchPage },
    { path: '/products/:slug', name: 'product-detail', component: ProductDetailPage },
    { path: '/packages/:slug', name: 'package-detail', component: PackageDetailPage },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})
