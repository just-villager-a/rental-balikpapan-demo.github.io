// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
import AdminOverviewPage from '@/pages/AdminOverviewPage.vue'
import AdminBookingListPage from '@/pages/AdminBookingListPage.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { activateScenario } from '@/services/scenario'
import { getDemoStateService } from '@/services/mockServices'

const stub = { template: '<div />' }
function router() { return createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: stub }, { path: '/demo', component: stub },
  { path: '/admin', component: AdminOverviewPage }, { path: '/admin/bookings', component: AdminBookingListPage },
  { path: '/admin/bookings/:bookingId', component: stub },
] }) }

beforeEach(() => getDemoStateService().reset())

describe('admin pages', () => {
  it('uses an accessible in-app dialog for confirmation', async () => {
    const wrapper = mount(ConfirmDialog, { attachTo: document.body, props: { open: true, title: 'Konfirmasi', message: 'Lanjutkan perubahan?' } })
    await flushPromises()
    expect(wrapper.get('dialog').attributes()).toHaveProperty('open')
    expect(document.activeElement).toBe(wrapper.get('button').element)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders fixed overview values and predefined drill-through links', async () => {
    const appRouter = router(); await appRouter.push('/admin'); await appRouter.isReady()
    const wrapper = mount(AdminOverviewPage, { global: { plugins: [createPinia(), appRouter] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Rp3.930.000')
    expect(wrapper.find('a[href="/admin/bookings?filter=created_today"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Belum dibayar')
  })

  it('renders the deterministic empty overview', async () => {
    activateScenario('admin-overview-empty')
    const appRouter = router(); await appRouter.push('/admin'); await appRouter.isReady()
    const wrapper = mount(AdminOverviewPage, { global: { plugins: [createPinia(), appRouter] } })
    await flushPromises(); expect(wrapper.text()).toContain('Belum ada data operasional')
  })

  it('round-trips an overview filter through the booking-list query', async () => {
    const appRouter = router(); await appRouter.push('/admin/bookings?filter=created_today'); await appRouter.isReady()
    const wrapper = mount(AdminBookingListPage, { global: { plugins: [createPinia(), appRouter] } })
    await flushPromises()
    expect(wrapper.text()).toContain('SKB-20261004-0003')
    expect(wrapper.text()).toContain('SKB-20261004-0010')
    expect(wrapper.text()).not.toContain('SKB-20261001-0001')
  })
})
