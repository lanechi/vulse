import { defineComponent } from 'vue'
import { createRouter, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import { adminRoutes, type AdminPage } from './spa-routes.js'

type RouteView = NonNullable<RouteRecordRaw['component']>
const EmptyView = defineComponent({ name: 'AdminShellView', render: () => null })

/** Vue Router owns client navigation; the server separately validates page requests. */
export function createAdminRouter(
  history: RouterHistory,
  views: Partial<Record<AdminPage, RouteView>>,
  extraRoutes: RouteRecordRaw[] = [],
) {
  const routes: RouteRecordRaw[] = adminRoutes.map(route => ({
    path: route.pattern,
    name: route.page,
    sensitive: true,
    component: views[route.page] ?? EmptyView,
    meta: { adminOnly: route.adminOnly === true },
  }))
  return createRouter({
    history,
    routes: [
      ...routes,
      ...extraRoutes,
      { path: '/admin/:pathMatch(.*)*', name: 'admin-not-found', component: EmptyView },
      { path: '/:pathMatch(.*)*', redirect: '/admin' },
    ],
    scrollBehavior: () => ({ top: 0 }),
  })
}
