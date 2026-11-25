import type { APIRoute } from 'astro'
import { createDb } from '../../core/db.js'
import { registryForRequest } from '../../core/blueprints/load.js'
import { fieldDescriptorsFromBlueprint } from '../../core/blueprints/reflect-fields.js'
import { readLocalesConfig } from '../../core/locales.js'
import { resolvePreviewConfig } from '../../core/blueprints/preview-path.js'
import { EntriesRepo } from '../../core/repos/entries.js'
import { getRuntimeEnv } from '../env.js'
import { getRuntime } from '../runtime.js'
import { getVulseStatus } from '../status.js'
import { matchAdminRoute, activeAdminPath } from '../../admin/client/spa-routes.js'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' },
  })
}
function fail(status: number, message: string) {
  return json({ ok: false, error: { message } }, status)
}
type EntryData = {
  collection: string
  content: Record<string, unknown>
  draftContent: Record<string, unknown> | null
  slug: string
  status: 'draft' | 'published'
  hasUnpublishedChanges: boolean
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const requestUrl = new URL(request.url)
    const raw = requestUrl.searchParams.get('path') ?? '/admin'
    if (!raw.startsWith('/') || raw.startsWith('//')) return fail(400, 'Invalid admin path')
    const url = new URL(raw, requestUrl.origin)
    if (url.origin !== requestUrl.origin) return fail(400, 'Invalid admin path')
    const route = matchAdminRoute(url.pathname)
    if (!route || route.page === 'login') return fail(404, 'Page not found')

    const env = getRuntimeEnv()
    const db = createDb(env.DB)
    const registry = await registryForRequest(db)
    const rt = await getRuntime(env, registry, requestUrl.origin)
    const session = await rt.auth.api.getSession({ headers: request.headers })
    if (!session) return fail(401, 'Sign in required')
    const user = session.user as typeof session.user & { role?: string; twoFactorEnabled?: boolean }
    const isAdmin = user.role === 'admin'
    if (!isAdmin && user.role !== 'editor') return fail(403, 'Forbidden')
    if (route.adminOnly && !isAdmin) return fail(403, 'Administrator access required')

    const collections = registry.list().map(b => ({ name: b.name, label: b.label, singleton: b.singleton }))
    const status = getVulseStatus(env)
    const shell = {
      collections, userEmail: user.email, isAdmin,
      status: { mode: status.mode, database: status.database, warningCount: status.warnings.length },
    }
    const p = route.params
    let title = route.title
    let props: Record<string, unknown> = {}
    let previewUrl: string | undefined
    let historyUrl: string | undefined

    const entryRequest = (locale: string) => {
      const api = new URL(requestUrl.origin + '/api/vulse/entries/' + encodeURIComponent(p.name!))
      api.searchParams.set('locale', locale)
      return new Request(api.toString(), { headers: request.headers })
    }

    switch (route.page) {
      case 'dashboard': {
        // Use the existing read-authorized list API for totals, not unrestricted DB counts.
        const counts = await Promise.all(collections.map(async c => {
          const api = new URL('/api/vulse/entries/' + encodeURIComponent(c.name), requestUrl.origin)
          const response = await rt.routes.entries.list(new Request(api.toString(), { headers: request.headers }), { collection: c.name })
          const body = await response.json() as { ok: boolean; data?: { total: number } }
          return { name: c.name, label: c.label, total: body.ok ? body.data?.total ?? 0 : null }
        }))
        props = { counts }
        break
      }
      case 'entries': case 'entry-new': case 'entry-edit': case 'revisions': {
        const bp = registry.get(p.name!)
        if (!bp) return fail(404, 'Collection not found')
        const config = await readLocalesConfig(db)
        const requested = url.searchParams.get('locale')
        const locale = requested && config.locales.includes(requested) ? requested : config.defaultLocale
        const localeProps = { entryLocale: locale, supportedLocales: config.locales, defaultLocale: config.defaultLocale }
        if (route.page === 'entries') {
          title = bp.label
          props = { collection: bp.name, label: bp.label, columns: bp.admin.listColumns ?? [bp.admin.titleField], tree: bp.tree === true, ...localeProps }
          break
        }
        const fields = fieldDescriptorsFromBlueprint(bp)
        const editorProps = {
          collection: bp.name, fields, draftsEnabled: bp.drafts === true,
          seoEnabled: bp.seo === true, seoMapping: bp.admin.seoMapping,
          tree: bp.tree === true, titleField: bp.admin.titleField, ...localeProps,
        }
        if (route.page === 'entry-new') {
          title = 'New ' + bp.label
          props = { ...editorProps, initial: {}, parentId: url.searchParams.get('parent_id') }
          break
        }
        const id = p.id!
        const repo = new EntriesRepo(db)
        const candidates = await repo.listLocales(id)
        // Do not expose locale metadata, draft content or cross-collection IDs
        // without checking the existing entry read policy on each locale.
        const readable = new Map<string, EntryData>()
        for (const candidate of candidates) {
          const rawRow = await repo.findById(id, candidate.locale)
          if (!rawRow || rawRow.collection !== bp.name) continue
          const response = await rt.routes.entries.findById(entryRequest(candidate.locale), { collection: bp.name, id })
          if (response.status >= 500) return fail(500, 'Could not load entry')
          if (!response.ok) continue
          const body = await response.json() as { ok: boolean; data?: EntryData }
          if (body.ok && body.data) readable.set(candidate.locale, body.data)
        }
        if (readable.size === 0) return fail(404, 'Entry not found')
        const row = readable.get(locale)
        if (candidates.some(c => c.locale === locale) && !row) return fail(404, 'Entry not found')
        if (route.page === 'revisions') {
          if (!row) return fail(404, 'Translation not found')
          props = { collection: bp.name, entryId: id, ...localeProps }
          break
        }
        const preview = resolvePreviewConfig(bp)
        const initial = row ? {
          ...(bp.drafts && row.draftContent ? row.draftContent : row.content),
          slug: row.slug, status: row.status, hasUnpublishedChanges: row.hasUnpublishedChanges,
        } : { status: 'draft' }
        title = 'Edit ' + bp.label
        props = {
          ...editorProps, entryId: id, initial, hasUnpublishedChanges: row?.hasUnpublishedChanges ?? false,
          previewPath: preview.path, livePreviewAllowed: preview.live !== false,
          existingLocales: [...readable.keys()],
        }
        historyUrl = '/admin/collections/' + encodeURIComponent(bp.name) + '/' + encodeURIComponent(id) + '/revisions?locale=' + encodeURIComponent(locale)
        if (row) {
          const path = preview.path.replace('{slug}', encodeURIComponent(row.slug))
          previewUrl = '/api/vulse/preview/start?to=' + encodeURIComponent(path)
        }
        break
      }
      case 'account':
        props = { email: user.email, name: user.name, twoFactorEnabled: Boolean(user.twoFactorEnabled) }
        break
      case 'status': props = { status }; break
      case 'user-edit': props = { userId: p.id }; break
      case 'form-new': case 'set-new': case 'global-new': props = { handle: null }; break
      case 'form-edit': case 'set-edit': case 'global-edit': props = { handle: p.handle }; break
      case 'submissions': props = { formHandle: p.handle }; break
      case 'submission': props = { formHandle: p.handle, submissionId: p.id }; break
      case 'schema-new': case 'schema-edit':
        props = { handle: p.handle ?? null, isAdmin }; break
    }
    return json({ ok: true, data: { shell, title, activePath: activeAdminPath(route), props, previewUrl, historyUrl } })
  } catch (err) {
    console.error('[vulse] admin page data failed:', err)
    return fail(500, 'Could not load admin page')
  }
}
