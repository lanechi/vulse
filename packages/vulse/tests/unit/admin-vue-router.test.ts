import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAdminRouter } from '../../src/admin/client/spa-router.js'
import { adminRoutes } from '../../src/admin/client/spa-routes.js'

describe('Vue Router admin navigation', () => {
  it('resolves all 28 route records and keeps role metadata', () => {
    const router = createAdminRouter(createMemoryHistory(), {})
    for (const route of adminRoutes) {
      const path = route.pattern.replace(/:([a-z]+)/g, 'sample')
      expect(router.resolve(path).name, path).toBe(route.page)
      expect(router.resolve(path).meta.adminOnly).toBe(route.adminOnly === true)
    }
  })
  it('navigates and retains query and dynamic params', async () => {
    const router = createAdminRouter(createMemoryHistory(), {})
    await router.push('/admin/collections/pages/item?locale=zh-CN')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('entry-edit')
    expect(router.currentRoute.value.params.id).toBe('item')
    expect(router.currentRoute.value.query.locale).toBe('zh-CN')
    await router.push('/admin/media')
    expect(router.currentRoute.value.name).toBe('media')
    expect(router.resolve('/admin/unknown').name).toBe('admin-not-found')
  })
})
