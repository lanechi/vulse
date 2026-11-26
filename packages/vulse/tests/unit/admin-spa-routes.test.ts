import { describe, expect, it } from 'vitest'
import { activeAdminPath, isAdminPath, matchAdminRoute } from '../../src/admin/client/spa-routes.js'

describe('admin SPA route matching', () => {
  it('matches all legacy route patterns, including deep links', () => {
    const cases = {
      '/admin': 'dashboard', '/admin/': 'dashboard', '/admin/login': 'login',
      '/admin/collections/pages': 'entries', '/admin/collections/pages/new': 'entry-new',
      '/admin/collections/pages/abc': 'entry-edit', '/admin/collections/pages/abc/revisions': 'revisions',
      '/admin/users': 'users', '/admin/users/1': 'user-edit', '/admin/account': 'account',
      '/admin/settings': 'settings', '/admin/settings/auth': 'auth', '/admin/settings/status': 'status',
      '/admin/media': 'media', '/admin/forms': 'forms', '/admin/forms/new': 'form-new',
      '/admin/forms/contact': 'form-edit', '/admin/forms/contact/submissions': 'submissions',
      '/admin/forms/contact/submissions/1': 'submission', '/admin/settings/sets': 'sets',
      '/admin/settings/sets/new': 'set-new', '/admin/settings/sets/hero': 'set-edit',
      '/admin/settings/globals': 'globals', '/admin/settings/globals/new': 'global-new',
      '/admin/settings/globals/site': 'global-edit', '/admin/settings/redirects': 'redirects',
      '/admin/schema/new': 'schema-new', '/admin/schema/import': 'schema-import',
      '/admin/schema/pages': 'schema-edit',
    }
    for (const [path, page] of Object.entries(cases)) expect(matchAdminRoute(path)?.page, path).toBe(page)
  })
  it('rejects malformed and non-admin paths', () => {
    for (const path of ['/administrator', '/api/vulse/admin/page', '/admin/missing', '/admin/collections/%ZZ', '/admin/collections/a%2Fb', '/admin/collections/%2e%2e']) {
      expect(matchAdminRoute(path), path).toBeNull()
    }
    expect(isAdminPath('/administrator')).toBe(false)
    expect(isAdminPath('/admin/forms')).toBe(true)
  })
  it('keeps privileged routes explicitly marked', () => {
    expect(matchAdminRoute('/admin/users')?.adminOnly).toBe(true)
    expect(matchAdminRoute('/admin/settings/globals/site')?.adminOnly).toBe(true)
    expect(matchAdminRoute('/admin/schema/new')?.adminOnly).toBe(true)
    expect(matchAdminRoute('/admin/collections/pages')?.adminOnly).toBeUndefined()
  })
  it('extracts params and maps editor routes to sidebar paths', () => {
    const route = matchAdminRoute('/admin/collections/pages/abc/revisions')!
    expect(route.params).toEqual({ name: 'pages', id: 'abc' })
    expect(activeAdminPath(route)).toBe('/admin/collections/pages')
  })
})
