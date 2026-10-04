// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import ProductMedia from '@/components/ProductMedia.vue'
import RentalDetailPage from '@/components/RentalDetailPage.vue'
import StatePanel from '@/components/StatePanel.vue'
import SearchPage from '@/pages/SearchPage.vue'
import { getDemoStateService } from '@/services/mockServices'

beforeEach(() => { getDemoStateService().reset() })

describe('catalog UI states', () => {
  it.each([
    ['loading', 'Memuat'], ['empty', 'Kosong'], ['error', 'Bermasalah'],
  ] as const)('renders the %s state', (state, title) => {
    const wrapper = mount(StatePanel, { props: { state, title, message: 'Pesan status.' } })
    expect(wrapper.text()).toContain(title)
    expect(wrapper.find('button').exists()).toBe(state === 'error')
  })

  it('shows an accessible fallback when an image is missing', () => {
    const wrapper = mount(ProductMedia, { props: { alt: 'Sony A7', category: 'camera' } })
    expect(wrapper.get('[data-testid="missing-image"]').attributes('aria-label')).toContain('Sony A7')
  })

  it('updates the quote when quantity and add-ons change', async () => {
    const stub = { template: '<div />' }
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: stub }, { path: '/search', component: stub },
      { path: '/my-bookings', component: stub }, { path: '/products/:slug', component: stub },
      { path: '/checkout', name: 'checkout', component: stub },
    ] })
    await router.push('/products/sony-alpha-a7-iii-kit-28-70mm?pickup=2026-10-10T09:00:00%2B08:00&return=2026-10-12T09:00:00%2B08:00'); await router.isReady()
    const wrapper = mount(RentalDetailPage, { props: { kind: 'product' }, global: { plugins: [createPinia(), router] } })
    await flushPromises()
    expect(wrapper.get('[data-testid="quote-total"]').text()).toContain('700.000')
    await wrapper.get('button[aria-label="Tambah jumlah"]').trigger('click')
    expect(wrapper.get('[data-testid="quote-total"]').text()).toContain('1.400.000')
    const addOn = wrapper.find('input[type="checkbox"]'); expect(addOn.exists()).toBe(true); await addOn.setValue(true)
    expect(wrapper.get('[data-testid="quote-total"]').text()).not.toContain('1.400.000')
  })

  it('keeps active filters in the URL when sorting search results', async () => {
    const stub = { template: '<div />' }
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', name: 'landing', component: stub },
      { path: '/search', name: 'search', component: SearchPage },
      { path: '/products/:slug', name: 'product-detail', component: stub },
      { path: '/packages/:slug', name: 'package-detail', component: stub },
    ] })
    await router.push('/search?category=iphone&available=1'); await router.isReady()
    const wrapper = mount(SearchPage, { global: { plugins: [createPinia(), router] } })
    await flushPromises()
    const selects = wrapper.findAll('select')
    await selects.at(-1)!.setValue('price_desc'); await flushPromises()
    expect(router.currentRoute.value.query).toMatchObject({ category: 'iphone', available: '1', sort: 'price_desc' })
    expect(wrapper.text()).toContain('iPhone 14 Pro 256GB')
    expect(wrapper.text()).not.toContain('Sony Alpha A7 IV Body')
  })
})
