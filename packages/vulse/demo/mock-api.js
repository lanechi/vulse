/**
 * Demo-only in-memory API. Never imported by the production Astro entry.
 * No credentials, network requests, emails, D1 or R2 writes.
 */
import { reactive } from 'vue'
import { matchAdminRoute, activeAdminPath } from '../src/admin/client/spa-routes.ts'
import { fieldDescriptorsFromDefinitions } from '../src/admin/client/form-from-zod.ts'

const now = () => new Date().toISOString()
const clone = value => JSON.parse(JSON.stringify(value))
const uid = () => crypto.randomUUID()
const fields = [
  { name: 'title', label: 'Title', optional: false, ui: { kind: 'text' } },
  { name: 'body', label: 'Body', optional: false, ui: { kind: 'textarea' } },
]
function blueprint(handle, label) {
  return { handle, label, singleton: false, tree: false, drafts: true, seo: false,
    preview: { path: '/{slug}', live: false }, fields: clone(fields) }
}
function makeEntry(collection, id, locale, slug, title, body, status = 'published') {
  return { id, collection, locale, slug, status, content: { title, body }, draftContent: null,
    hasUnpublishedChanges: false, parentId: null, sortOrder: 0, version: 1,
    createdAt: now(), updatedAt: now(), publishedAt: status === 'published' ? now() : null }
}
function mediaSample(id, label, color) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" fill="' + color + '"/><circle cx="225" cy="90" r="40" fill="#fafaf7" opacity=".85"/><path d="M0 270L100 135L180 230L245 165L320 250V320H0Z" fill="#0b0b0c" opacity=".65"/><text x="18" y="28" fill="#fafaf7" font-family="sans-serif" font-size="16">' + label + '</text></svg>'
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  return { id, r2Key: 'sample/' + id, mime: 'image/svg+xml', alt: label, width: 320, height: 320, deliveryUrl: url, previewUrl: url }
}
const contact = { handle: 'contact', label: 'Contact form', enabled: true,
  definition: { handle: 'contact', label: 'Contact form', fields: [
    { name: 'name', label: 'Name', ui: { kind: 'text' }, optional: false },
    { name: 'email', label: 'Email', ui: { kind: 'email' }, optional: false },
    { name: 'message', label: 'Message', ui: { kind: 'textarea' }, optional: false },
  ], settings: { enabled: true, successMessage: 'Thank you!', honeypotField: '_hp', notifyEmails: [] }, actions: [] } }

function seed() {
  return {
    settings: { siteName: 'Northline Studio', deployHookUrl: '', locales: ['en', 'zh-CN'], defaultLocale: 'en', allowMemberSignUp: false, allowedSignUpDomains: [] },
    blueprints: [blueprint('pages', 'Pages'), blueprint('posts', 'Posts')],
    entries: [
      makeEntry('pages', 'home', 'en', 'home', 'A better way to build and manage your website.', 'Northline Studio is a sample business website. Edit this page in Vulse and publish to see your changes here.'),
      makeEntry('pages', 'about', 'en', 'about', 'About us', 'A small team focused on practical digital solutions and well-designed websites.'),
      makeEntry('pages', 'services', 'en', 'services', 'Services', 'Website design, content management and digital support for local businesses.'),
      makeEntry('pages', 'contact', 'en', 'contact', 'Contact', 'This is a demonstration page. No real enquiries are collected.'),
      makeEntry('pages', 'home', 'zh-CN', 'home', '简单、高效的网站内容管理', '这是 Vulse 示例网站。可以在后台编辑首页并发布，然后返回此页面查看结果。'),
      makeEntry('pages', 'about', 'zh-CN', 'about', '关于我们', '我们提供面向小型企业的示例数字服务。'),
      makeEntry('pages', 'services', 'zh-CN', 'services', '服务介绍', '网站建设、内容管理和数字化支持。'),
      makeEntry('posts', 'welcome', 'en', 'welcome', 'Welcome to Vulse', 'An example published article.'),
      makeEntry('posts', 'draft', 'en', 'new-project', 'A new project', 'An example draft, not shown to site visitors.', 'draft'),
    ],
    forms: [clone(contact)],
    submissions: [{ id: 'sample-1', formHandle: 'contact', payload: { name: 'Sample visitor', email: 'visitor@example.invalid', message: 'I would like to learn about your services.' }, status: 'processed', fileRefs: [], error: null, createdAt: now() }],
    media: [mediaSample('sample-a', 'Orange landscape', '#f46b43'), mediaSample('sample-b', 'Blue landscape', '#41647e'), mediaSample('sample-c', 'Green landscape', '#426b62')],
    sets: [{ handle: 'callout', label: 'Callout', fields: [{ name: 'text', label: 'Text', optional: false, ui: { kind: 'textarea' } }] }],
    globals: [{ set: { handle: 'site', label: 'Site information', fields: [{ name: 'tagline', label: 'Tagline', optional: false, ui: { kind: 'text' } }] }, value: { content: { tagline: 'A practical CMS for Astro' } } }],
    users: [{ id: 'demo-editor', name: 'Sample editor', displayName: 'Sample editor', email: 'editor@example.invalid', role: 'editor' }],
    redirects: [{ id: 'redirect-1', fromPath: '/old-about', toUrl: '/about', status: 301, enabled: true, hits: 0, lastHitAt: null, createdAt: now(), updatedAt: now() }],
    revisions: {},
  }
}
export const demoState = reactive(seed())
export function resetDemo() { Object.assign(demoState, seed()) }
function ok(data) { return new Response(JSON.stringify({ ok: true, data }), { headers: { 'content-type': 'application/json' } }) }
function fail(message, status = 400) { return new Response(JSON.stringify({ ok: false, error: { code: 'DEMO_ERROR', message } }), { status, headers: { 'content-type': 'application/json' } }) }
function find(list, key, value) { return list.find(x => x[key] === value) }
function remove(list, row) { list.splice(list.indexOf(row), 1) }
function getEntry(collection, id, locale) { return demoState.entries.find(e => e.collection === collection && e.id === id && e.locale === locale) }
function uniqueSlug(collection, locale, requested, id) {
  let slug = requested; let n = 2
  while (demoState.entries.some(e => e.collection === collection && e.locale === locale && e.slug === slug && e.id !== id)) slug = requested + '-' + n++
  return slug
}
function addRevision(row) {
  const key = row.collection + '/' + row.id + '/' + row.locale
  const list = demoState.revisions[key] ??= []
  list.unshift({ id: uid(), version: row.version, authorId: null, createdAt: now(), changeSummary: 'Demo update', content: clone(row.content) })
}
function pageData(raw) {
  const url = new URL(raw || '/admin', 'https://demo.invalid')
  const route = matchAdminRoute(url.pathname)
  if (!route) return fail('Page not found', 404)
  const p = route.params
  const loc = demoState.settings.locales.includes(url.searchParams.get('locale')) ? url.searchParams.get('locale') : demoState.settings.defaultLocale
  const shell = { collections: demoState.blueprints.map(b => ({ name: b.handle, label: b.label, singleton: b.singleton })), isAdmin: true, userEmail: '' }
  const result = { shell, title: route.title, activePath: activeAdminPath(route), props: {} }
  const props = result.props
  const entryLocale = { entryLocale: loc, supportedLocales: demoState.settings.locales, defaultLocale: demoState.settings.defaultLocale }
  switch (route.page) {
    case 'dashboard':
      props.counts = shell.collections.map(c => ({ ...c, total: demoState.entries.filter(e => e.collection === c.name && e.locale === loc).length }))
      break
    case 'entries': case 'entry-new': case 'entry-edit': case 'revisions': {
      const bp = find(demoState.blueprints, 'handle', p.name)
      if (!bp) return fail('Collection not found', 404)
      const rows = demoState.entries.filter(e => e.collection === p.name && e.id === p.id)
      const row = getEntry(p.name, p.id, loc)
      if (route.page === 'entries') {
        result.title = bp.label
        Object.assign(props, { collection: bp.handle, label: bp.label, columns: [bp.fields.find(f => f.name === 'title')?.name ?? bp.fields[0]?.name ?? 'title'], tree: false, ...entryLocale })
      } else if (route.page === 'revisions') {
        if (!row) return fail('Translation not found', 404)
        Object.assign(props, { collection: p.name, entryId: p.id, ...entryLocale })
      } else {
        if (route.page === 'entry-edit' && !rows.length) return fail('Entry not found', 404)
        const editing = route.page === 'entry-edit'
        result.title = (editing ? 'Edit ' : 'New ') + bp.label
        Object.assign(props, {
          collection: bp.handle, fields: fieldDescriptorsFromDefinitions(bp.fields),
          titleField: bp.fields.find(f => f.name === 'title')?.name ?? bp.fields[0]?.name,
          draftsEnabled: !!bp.drafts, seoEnabled: false, tree: false, ...entryLocale,
          initial: row ? { ...(row.draftContent ?? row.content), slug: row.slug, status: row.status } : {},
        })
        if (editing) {
          Object.assign(props, { entryId: p.id, existingLocales: rows.map(e => e.locale), hasUnpublishedChanges: !!row?.hasUnpublishedChanges, previewPath: '/{slug}', livePreviewAllowed: false })
          result.historyUrl = '/admin/collections/' + p.name + '/' + p.id + '/revisions?locale=' + encodeURIComponent(loc)
        }
      }
      break
    }
    case 'status':
      props.status = { mode: 'demo (browser only)', database: 'None — mock API', version: 'demo', bindings: { db: false, bucket: false, queue: false, images: false }, warnings: ['No Cloudflare services are connected.'] }
      break
    case 'schema-new': case 'schema-edit': Object.assign(props, { handle: p.handle ?? null, isAdmin: true }); break
    case 'form-new': case 'set-new': case 'global-new': props.handle = null; break
    case 'form-edit': case 'set-edit': case 'global-edit': props.handle = p.handle; break
    case 'submissions': props.formHandle = p.handle; break
    case 'submission': Object.assign(props, { formHandle: p.handle, submissionId: p.id }); break
    case 'user-edit': props.userId = p.id; break
  }
  return ok(result)
}
async function dispatch(request) {
  const url = new URL(request.url)
  const parts = url.pathname.replace(/^\/api\/vulse\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  const [area, name, id, action, version, restore] = parts
  const method = request.method
  const read = method === 'GET'
  if (area === 'admin' && name === 'page' && read) return pageData(url.searchParams.get('path'))
  const body = !read && method !== 'DELETE' && request.headers.get('content-type')?.includes('application/json') ? await request.json() : {}
  if (area === 'settings') {
    if (read) return ok(demoState.settings)
    if (method === 'PUT' && Object.hasOwn(demoState.settings, name)) { demoState.settings[name] = body.value; return ok(body.value) }
  }
  if (area === 'entries') {
    const bp = find(demoState.blueprints, 'handle', name)
    if (!bp) return fail('Collection not found', 404)
    const locale = body.locale ?? url.searchParams.get('locale') ?? demoState.settings.defaultLocale
    if (id === 'tree' && read) return ok(demoState.entries.filter(e => e.collection === name && e.locale === locale).map(e => ({ ...e, children: [] })))
    let row = getEntry(name, id, locale)
    if (read && !id) {
      const items = demoState.entries.filter(e => e.collection === name && e.locale === locale)
      return ok({ items, total: items.length, page: 1, pageSize: 250 })
    }
    if (action === 'locales' && read) return ok(demoState.entries.filter(e => e.collection === name && e.id === id).map(e => ({ locale: e.locale, slug: e.slug, status: e.status })))
    if (action === 'revisions') {
      const key = name + '/' + id + '/' + locale
      if (!row) return fail('Entry not found', 404)
      const list = demoState.revisions[key] ?? [{ id: 'initial', version: row.version, createdAt: row.updatedAt, content: row.content, changeSummary: 'Initial sample', authorId: null }]
      if (read) return ok(list)
      if (restore === 'restore' && method === 'POST') {
        const rev = list.find(r => r.version === Number(version))
        if (!rev) return fail('Revision not found', 404)
        row.content = clone(rev.content); row.draftContent = null; row.hasUnpublishedChanges = false; row.version++; addRevision(row)
        return ok(row)
      }
    }
    if (read) return row ? ok(row) : fail('Entry not found', 404)
    if (action === 'publish' && method === 'POST' && row) {
      row.content = row.draftContent ?? row.content; row.draftContent = null; row.status = 'published'; row.hasUnpublishedChanges = false; row.version++; row.updatedAt = now(); addRevision(row)
      return ok(row)
    }
    if (method === 'DELETE' && row) { remove(demoState.entries, row); return ok({}) }
    if ((method === 'POST' && (!id || action === 'locales')) || method === 'PUT') {
      if (!body.slug || !body.content || typeof body.content !== 'object') return fail('A title and slug are required')
      if (!row && method === 'PUT') return fail('Entry not found', 404)
      const nextId = id ?? uid()
      const slug = uniqueSlug(name, locale, body.slug, nextId)
      if (!row) {
        row = makeEntry(name, nextId, locale, slug, '', '', body.publish ? 'published' : body.status ?? 'draft')
        row.content = clone(body.content)
        demoState.entries.push(row)
        row = getEntry(name, nextId, locale)
      } else if (row.status === 'published' && bp.drafts && !body.publish) {
        row.draftContent = clone(body.content); row.hasUnpublishedChanges = true
      } else {
        row.content = clone(body.content); row.draftContent = null; row.hasUnpublishedChanges = false
        row.status = body.publish ? 'published' : body.status ?? row.status
      }
      row.slug = slug; row.version++; row.updatedAt = now(); addRevision(row)
      return ok(row)
    }
  }
  if (area === 'blueprints') {
    if (name === 'templates' && read) return ok([])
    if (name === 'import' || name === 'templates') return fail('Schema imports require the full server', 501)
    const row = find(demoState.blueprints, 'handle', name)
    if (read) return name ? (row ? ok(row) : fail('Schema not found', 404)) : ok(demoState.blueprints)
    if (method === 'POST' && !name) { if (!body.handle || !body.fields?.length) return fail('Handle and fields are required'); if (find(demoState.blueprints,'handle',body.handle)) return fail('Handle already exists'); demoState.blueprints.push({ ...body, tree: false }); return ok(body) }
    if (method === 'PATCH' && row) { Object.assign(row, body, { handle: name, tree: false }); return ok(row) }
    if (method === 'DELETE' && row) { remove(demoState.blueprints, row); demoState.entries = demoState.entries.filter(e => e.collection !== name); return ok({}) }
  }
  if (area === 'media') {
    const row = find(demoState.media, 'id', name)
    if (read) return name ? (row ? ok(row) : fail('Asset not found', 404)) : ok(demoState.media)
    if (method === 'POST' && !name) {
      const file = (await request.formData()).get('file')
      if (!(file instanceof File) || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) return fail('Demo accepts PNG, JPEG, WebP or GIF up to 5 MB')
      const blob = URL.createObjectURL(file)
      const mid = uid()
      const item = { id: mid, r2Key: 'demo/' + mid, mime: file.type, alt: file.name, width: null, height: null, deliveryUrl: blob, previewUrl: blob }
      demoState.media.push(item); return ok(item)
    }
    if (method === 'PATCH' && row) { row.alt = body.alt; return ok(row) }
    if (method === 'DELETE' && row) { if (row.previewUrl.startsWith('blob:')) URL.revokeObjectURL(row.previewUrl); remove(demoState.media, row); return ok({}) }
  }
  if (area === 'forms') {
    const row = find(demoState.forms, 'handle', name)
    if (id === 'submissions') {
      const list = demoState.submissions.filter(s => s.formHandle === name)
      if (read) return action ? (find(list, 'id', action) ? ok(find(list, 'id', action)) : fail('Submission not found', 404)) : ok(list)
      if (method === 'POST' && action === 'delete') { demoState.submissions = demoState.submissions.filter(s => !(s.formHandle === name && body.ids?.includes(s.id))); return ok({}) }
      if (method === 'DELETE' && find(list, 'id', action)) { remove(demoState.submissions, find(list,'id',action)); return ok({}) }
    }
    if (read) return name ? (row ? ok(row) : fail('Form not found', 404)) : ok(demoState.forms.map(f => ({ ...f, submissionCount: demoState.submissions.filter(s => s.formHandle === f.handle).length })))
    if (method === 'POST' && !name) { if (!body.handle || find(demoState.forms,'handle',body.handle)) return fail('Invalid or duplicate handle'); const f = { handle: body.handle, label: body.label, enabled: body.settings?.enabled ?? true, definition: body }; demoState.forms.push(f); return ok(f) }
    if (method === 'PUT' && row) { Object.assign(row, { label: body.label, enabled: body.settings?.enabled ?? true, definition: body }); return ok(row) }
    if (method === 'DELETE' && row) { remove(demoState.forms, row); return ok({}) }
  }
  if (area === 'sets') {
    const row = find(demoState.sets, 'handle', name)
    if (read) return name ? (row ? ok(row) : fail('Set not found', 404)) : ok(demoState.sets)
    if (method === 'POST' && !name && body.handle && !find(demoState.sets,'handle',body.handle)) { demoState.sets.push(body); return ok(body) }
    if (method === 'PATCH' && row) { Object.assign(row, body, { handle: name }); return ok(row) }
    if (method === 'DELETE' && row) { remove(demoState.sets,row); return ok({}) }
  }
  if (area === 'globals') {
    const row = demoState.globals.find(g => g.set.handle === name)
    if (read) return name ? (row ? ok(row) : fail('Global not found', 404)) : ok(demoState.globals.map(g => ({ handle: g.set.handle, label: g.set.label, fieldCount: g.set.fields.length })))
    if (method === 'POST' && !name && body.handle && !demoState.globals.some(g => g.set.handle === body.handle)) { const g = { set: body, value: { content: {} } }; demoState.globals.push(g); return ok(g) }
    if (method === 'PUT' && row) { if (id === 'value') row.value = { content: body }; else row.set = { ...body, handle: name }; return ok(row) }
    if (method === 'DELETE' && row) { remove(demoState.globals, row); return ok({}) }
  }
  if (area === 'users') {
    const row = find(demoState.users, 'id', name)
    if (read) return name ? (row ? ok(row) : fail('User not found', 404)) : ok(demoState.users)
    if (id === 'reset-password') return fail('Password reset is disabled in this public demo', 403)
    if (row && method === 'PATCH') { Object.assign(row, { name: body.name, displayName: body.displayName, role: body.role }); return ok(row) }
    if (row && id === 'role' && method === 'POST') { row.role = body.role; return ok(row) }
    if (row && method === 'DELETE') { remove(demoState.users, row); return ok({}) }
  }
  if (area === 'redirects') {
    const row = find(demoState.redirects,'id',name)
    if (read) return ok(demoState.redirects)
    if (method === 'POST' && !name) { const r = { ...body, id: uid(), hits: 0, lastHitAt: null, createdAt: now(), updatedAt: now() }; demoState.redirects.push(r); return ok(r) }
    if (method === 'PATCH' && row) { Object.assign(row,body,{ id: name, updatedAt: now() }); return ok(row) }
    if (method === 'DELETE' && row) { remove(demoState.redirects,row); return ok({}) }
  }
  return fail('This action is unavailable in the static demo. Use the full Vulse server.', 501)
}

export function installDemoApi() {
  const original = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const req = new Request(input instanceof Request ? input : new URL(input, location.href), init)
    const url = new URL(req.url)
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return original(input, init)
    // Prevent every same-origin API call in the demonstration from reaching a real server.
    if (!url.pathname.startsWith('/api/vulse/')) return fail('Real authentication is disabled in this demo', 403)
    if (req.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    try { return await dispatch(req) } catch (err) { console.error('Demo API error', err); return fail('Demo request failed', 500) }
  }
}
