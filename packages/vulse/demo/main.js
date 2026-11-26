import { createApp } from 'vue'
import { createWebHashHistory } from 'vue-router'
import { createAdminRouter } from '../src/admin/client/spa-router.ts'
import { adminViews } from '../src/admin/components/spa-views.js'
import '../src/admin/styles/admin.css'
import './demo.css'
import DemoRoot from './DemoRoot.vue'
import DemoSite from './DemoSite.vue'
import { installDemoApi } from './mock-api.js'

installDemoApi()
const router = createAdminRouter(createWebHashHistory(), adminViews, [
  { path: '/', redirect: '/site' },
  { path: '/site', name: 'demo-site', component: DemoSite },
])
// There is no real authentication or identity in the static demo.
router.beforeEach(to => ['login', 'account'].includes(String(to.name)) ? '/admin' : true)
const app = createApp(DemoRoot)
app.use(router)
router.isReady().then(() => app.mount('#demo')).catch(err => {
  console.error('Demo startup failed', err)
  document.getElementById('demo').textContent = 'Demo failed to start. Please reload.'
})
