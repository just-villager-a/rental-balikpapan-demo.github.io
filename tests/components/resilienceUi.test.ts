// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CheckoutPage from '@/pages/CheckoutPage.vue'
import BookingHistoryPage from '@/pages/BookingHistoryPage.vue'
import PaymentPage from '@/pages/PaymentPage.vue'
import { getPreservedCheckout } from '@/services/booking'
import { getDemoStateService } from '@/services/mockServices'
import { activateScenario } from '@/services/scenario'

const stub = { template: '<div />' }
const checkoutPath = '/checkout?kind=package&item=pkg-camera-creator&quantity=1&pickup=2026-10-10T09%3A00%3A00%2B08%3A00&return=2026-10-12T09%3A00%3A00%2B08%3A00'
function testRouter() {
  return createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: stub }, { path: '/search', name: 'search', component: stub },
    { path: '/checkout', name: 'checkout', component: CheckoutPage },
    { path: '/checkout/conflict', name: 'checkout-conflict', component: stub },
    { path: '/bookings/:bookingId/payment', name: 'demo-payment', component: PaymentPage },
    { path: '/bookings/:bookingId/confirmation', name: 'booking-confirmation', component: stub },
    { path: '/my-bookings', component: BookingHistoryPage },
    { path: '/my-bookings/:bookingId', name: 'customer-booking-detail', component: stub },
  ] })
}

beforeEach(() => getDemoStateService().reset())
afterEach(() => { document.body.innerHTML = '' })

describe('customer resilience UI', () => {
  it('focuses a validation summary after invalid checkout submission', async () => {
    const router = testRouter(); await router.push(checkoutPath); await router.isReady()
    const wrapper = mount(CheckoutPage, { attachTo: document.body, global: { plugins: [createPinia(), router] } })
    await wrapper.get('input[autocomplete="name"]').setValue('')
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Periksa kembali formulir')
    expect(document.activeElement).toBe(wrapper.get('[role="alert"]').element)
    wrapper.unmount()
  })

  it('preserves checkout input and routes a deterministic final conflict', async () => {
    activateScenario('final-check-conflict')
    const router = testRouter(); await router.push(checkoutPath); await router.isReady()
    const wrapper = mount(CheckoutPage, { global: { plugins: [createPinia(), router] } })
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('form').trigger('submit'); await flushPromises()
    expect(router.currentRoute.value.name).toBe('checkout-conflict')
    expect(getPreservedCheckout()?.customer.name).toBe('Raka Demo')
  })

  it('renders deterministic empty history', async () => {
    activateScenario('empty-history')
    const router = testRouter(); await router.push('/my-bookings'); await router.isReady()
    const wrapper = mount(BookingHistoryPage, { global: { plugins: [createPinia(), router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Belum ada booking')
  })

  it('recovers from a one-shot history error without losing data', async () => {
    activateScenario('recoverable-error')
    const router = testRouter(); await router.push('/my-bookings'); await router.isReady()
    const wrapper = mount(BookingHistoryPage, { global: { plugins: [createPinia(), router] } })
    await flushPromises(); expect(wrapper.text()).toContain('Riwayat belum dapat dimuat')
    const retry = wrapper.findAll('button').find(button => button.text().includes('Coba Lagi'))
    expect(retry).toBeDefined(); await retry!.trigger('click'); await flushPromises()
    expect(wrapper.text()).toContain('SKB-20261001-0001')
  })

  it('shows payment failure and permits a successful retry', async () => {
    activateScenario('payment-failed-retry')
    const router = testRouter(); await router.push('/bookings/booking-003/payment'); await router.isReady()
    const wrapper = mount(PaymentPage, { global: { plugins: [createPinia(), router] } })
    await flushPromises(); expect(wrapper.text()).toContain('Simulasi pembayaran gagal')
    const success = wrapper.findAll('button').find(button => button.text().includes('Berhasil'))
    expect(success).toBeDefined(); await success!.trigger('click'); await flushPromises()
    expect(router.currentRoute.value.name).toBe('booking-confirmation')
  })
})
