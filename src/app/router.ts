import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/pages/LandingPage.vue'
import PackageDetailPage from '@/pages/PackageDetailPage.vue'
import ProductDetailPage from '@/pages/ProductDetailPage.vue'
import SearchPage from '@/pages/SearchPage.vue'
import BookingDetailPage from '@/pages/BookingDetailPage.vue'
import BookingHistoryPage from '@/pages/BookingHistoryPage.vue'
import CheckoutPage from '@/pages/CheckoutPage.vue'
import ConfirmationPage from '@/pages/ConfirmationPage.vue'
import PaymentPage from '@/pages/PaymentPage.vue'
import ConflictPage from '@/pages/ConflictPage.vue'
import DemoControlsPage from '@/pages/DemoControlsPage.vue'
import AdminOverviewPage from '@/pages/AdminOverviewPage.vue'
import AdminBookingListPage from '@/pages/AdminBookingListPage.vue'
import AdminBookingDetailPage from '@/pages/AdminBookingDetailPage.vue'

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
    { path: '/checkout', name: 'checkout', component: CheckoutPage },
    { path: '/checkout/conflict', name: 'checkout-conflict', component: ConflictPage },
    { path: '/bookings/:bookingId/payment', name: 'demo-payment', component: PaymentPage },
    { path: '/bookings/:bookingId/confirmation', name: 'booking-confirmation', component: ConfirmationPage },
    { path: '/my-bookings', name: 'customer-bookings', component: BookingHistoryPage },
    { path: '/my-bookings/:bookingId', name: 'customer-booking-detail', component: BookingDetailPage },
    { path: '/admin', name: 'admin-overview', component: AdminOverviewPage },
    { path: '/admin/bookings', name: 'admin-bookings', component: AdminBookingListPage },
    { path: '/admin/bookings/:bookingId', name: 'admin-booking-detail', component: AdminBookingDetailPage },
    { path: '/demo', name: 'demo-controls', component: DemoControlsPage },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})
