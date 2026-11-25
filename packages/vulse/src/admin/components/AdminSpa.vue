<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import SideNav from './SideNav.vue'
import ToastHost from './ToastHost.vue'
import LoginForm from './LoginForm.vue'
import TwoFactorPanel from './TwoFactorPanel.vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { adminRoutes, isAdminPath, type AdminPage } from '../client/spa-routes.js'
import { ADMIN_NAVIGATION } from '../client/spa-navigation.js'

type Shell = {
  collections: { name: string; label: string; singleton?: boolean }[]
  userEmail: string
  isAdmin: boolean
  status: { mode: 'development' | 'production'; database: 'local SQLite' | 'remote D1'; warningCount: number }
}
type PageData = {
  shell: Shell; title: string; activePath: string; props: Record<string, unknown>
  previewUrl?: string; historyUrl?: string
}
type Status = {
  mode: string; database: string; version: string
  bindings: Record<string, boolean>; warnings: string[]
}

const router = useRouter()
const route = useRoute()
const href = computed(() => route.fullPath)
const page = computed(() => adminRoutes.find(r => r.page === route.name)?.page as AdminPage | undefined)
const next = computed(() => typeof route.query.next === 'string' ? route.query.next : '/admin')
const shell = shallowRef<Shell | null>(null)
const data = shallowRef<PageData | null>(null)
const error = ref('')
const loading = ref(true)
const viewKey = ref(0)
const counts = computed(() => (data.value?.props.counts ?? []) as { name: string; label: string; total: number | null }[])
const status = computed(() => data.value?.props.status as Status | undefined)
const bindingLabels: Record<string, string> = { db: 'D1 database (DB)', bucket: 'R2 bucket (BUCKET)', queue: 'Form queue (FORM_QUEUE)', images: 'Cloudflare Images' }
let controller: AbortController | undefined
let sequence = 0

function localPath(url: URL) { return url.pathname + url.search + url.hash }

async function load() {
  const id = ++sequence
  controller?.abort()
  controller = new AbortController()
  data.value = null
  error.value = ''
  loading.value = true
  if (page.value === 'login') {
    shell.value = null
    document.title = 'Sign in — Vulse'
    loading.value = false
    return
  }
  if (!page.value) {
    error.value = 'Page not found'
    loading.value = false
    return
  }
  try {
    const response = await fetch('/api/vulse/admin/page?path=' + encodeURIComponent(href.value), {
      credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (id !== sequence) return
    if (response.status === 401) {
      go('/admin/login?next=' + encodeURIComponent(href.value), true)
      return
    }
    const body = await response.json() as { ok: boolean; data?: PageData; error?: { message?: string } }
    if (id !== sequence) return
    if (!response.ok || !body.ok || !body.data) throw new Error(body.error?.message ?? 'Could not load page')
    shell.value = body.data.shell
    data.value = body.data
    document.title = body.data.title + ' — Vulse'
    viewKey.value++
  } catch (err) {
    if (id !== sequence) return
    error.value = err instanceof Error ? err.message : 'Could not load page'
  } finally {
    if (id === sequence) loading.value = false
  }
}
function go(target: string, replace = false) {
  const url = new URL(target, window.location.href)
  if (url.origin !== window.location.origin || !isAdminPath(url.pathname)) {
    window.location.href = url.href
    return
  }
  const path = localPath(url)
  if (router.resolve(path).fullPath === route.fullPath) {
    void load()
    return
  }
  void (replace ? router.replace(path) : router.push(path)).catch(err => {
    error.value = err instanceof Error ? err.message : 'Navigation failed'
  })
}
function onNavigation(event: Event) {
  const target = (event as CustomEvent<{ href: string }>).detail?.href
  if (!target) return
  event.preventDefault()
  go(target)
}
function onClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const a = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin || !isAdminPath(url.pathname)) return
  if (url.hash && url.pathname === route.path && url.search === new URL(href.value, location.origin).search) return
  event.preventDefault()
  go(url.href)
}
onMounted(() => {
  window.addEventListener(ADMIN_NAVIGATION, onNavigation)
  document.addEventListener('click', onClick)
})
watch(() => route.fullPath, () => { void load() }, { immediate: true })
onBeforeUnmount(() => {
  sequence++
  controller?.abort()
  window.removeEventListener(ADMIN_NAVIGATION, onNavigation)
  document.removeEventListener('click', onClick)
})
</script>

<template>
  <div v-if="page === 'login'" class="min-h-screen grid place-items-center bg-zinc-50">
    <LoginForm :next="next" />
  </div>
  <div v-else class="flex min-h-screen">
    <SideNav v-if="shell" :collections="shell.collections" :active-path="data?.activePath ?? ''"
      :user-email="shell.userEmail" :is-admin="shell.isAdmin" :status="shell.status" />
    <main class="flex-1 overflow-auto p-8 max-w-6xl">
      <p v-if="loading" role="status" class="text-sm text-zinc-500">Loading…</p>
      <section v-else-if="error" role="alert" class="rounded border bg-white p-4">
        <p class="text-sm text-red-700">{{ error }}</p>
        <div class="mt-3 flex gap-4 text-sm">
          <button type="button" class="underline" @click="load">Retry</button>
          <a href="/admin" class="underline">Dashboard</a>
          <a v-if="!shell" href="/admin/login" class="underline">Sign in</a>
        </div>
      </section>
      <template v-else-if="data">
        <template v-if="page === 'dashboard'">
          <h1 class="text-2xl font-semibold mb-6">Dashboard</h1>
          <div class="grid grid-cols-3 gap-4">
            <a v-for="c in counts" :key="c.name" :href="'/admin/collections/' + encodeURIComponent(c.name)" class="block p-4 rounded-xl border bg-white hover:shadow-sm">
              <div class="text-sm text-zinc-500">{{ c.label }}</div>
              <div class="text-3xl font-semibold mt-1">{{ c.total ?? '—' }}</div>
            </a>
          </div>
        </template>
        <template v-else-if="page === 'account'">
          <h1 class="text-2xl font-semibold mb-6">Account</h1>
          <section class="rounded-xl border bg-white p-6 mb-6">
            <h2 class="text-base font-semibold mb-2">Profile</h2>
            <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
              <dt class="text-zinc-500">Name</dt><dd>{{ data.props.name }}</dd>
              <dt class="text-zinc-500">Email</dt><dd class="font-mono">{{ data.props.email }}</dd>
            </dl>
          </section>
          <section class="rounded-xl border bg-white p-6">
            <h2 class="text-base font-semibold mb-1">Two-factor authentication</h2>
            <p class="text-sm text-zinc-600 mb-4">Add an optional second step using an authenticator app.</p>
            <TwoFactorPanel :key="viewKey" :initial-enabled="Boolean(data.props.twoFactorEnabled)" />
          </section>
        </template>
        <template v-else-if="page === 'status' && status">
          <h1 class="mb-4 text-2xl font-semibold">Status</h1>
          <section class="mb-6 rounded-xl border bg-white p-4">
            <h2 class="mb-2 text-sm font-semibold text-zinc-700">Environment</h2>
            <p>{{ status.mode }} · {{ status.database }}</p>
            <p class="mt-2 text-xs text-zinc-500">Database mode is inferred from the runtime, not measured.</p>
          </section>
          <section class="mb-6 rounded-xl border bg-white p-4">
            <h2 class="mb-2 text-sm font-semibold text-zinc-700">Version</h2>
            <p class="font-mono text-sm">@vulsecms/core {{ status.version }}</p>
          </section>
          <section class="mb-6 rounded-xl border bg-white p-4">
            <h2 class="mb-2 text-sm font-semibold text-zinc-700">Bindings</h2>
            <ul class="space-y-1 text-sm">
              <li v-for="(ok, key) in status.bindings" :key="key">{{ ok ? '✓' : '✗' }} {{ bindingLabels[key] ?? key }}</li>
            </ul>
          </section>
          <section class="rounded-xl border bg-white p-4">
            <h2 class="mb-2 text-sm font-semibold text-zinc-700">Warnings</h2>
            <p v-if="!status.warnings.length" class="text-sm text-emerald-700">All clear — no configuration warnings.</p>
            <ul v-else class="space-y-1 text-sm text-amber-800"><li v-for="warning in status.warnings" :key="warning">{{ warning }}</li></ul>
          </section>
        </template>
        <template v-else>
          <h1 v-if="['media','users','settings','auth','redirects','revisions'].includes(page ?? '')" class="text-2xl font-semibold mb-4">{{ data.title }}</h1>
          <div v-if="page === 'entry-edit'" class="mb-4 flex items-center gap-4">
            <a v-if="data.historyUrl" :href="data.historyUrl" class="text-sm text-zinc-600 underline">View history</a>
            <a v-if="data.previewUrl" :href="data.previewUrl" class="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50">Preview</a>
          </div>
          <RouterView v-slot="{ Component }">
            <component v-if="Component" :is="Component" :key="viewKey" v-bind="data.props" />
          </RouterView>
        </template>
      </template>
    </main>
  </div>
  <ToastHost />
</template>
