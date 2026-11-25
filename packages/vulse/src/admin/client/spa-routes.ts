/** Admin route matching is shared by the browser and the authenticated page-data endpoint. */
export type AdminPage = 'dashboard' | 'login' | 'entries' | 'entry-new' | 'entry-edit' | 'revisions' |
  'users' | 'user-edit' | 'account' | 'settings' | 'auth' | 'status' | 'media' |
  'forms' | 'form-new' | 'form-edit' | 'submissions' | 'submission' |
  'sets' | 'set-new' | 'set-edit' | 'globals' | 'global-new' | 'global-edit' |
  'redirects' | 'schema-new' | 'schema-import' | 'schema-edit'

interface RouteDefinition {
  page: AdminPage
  pattern: string
  title: string
  adminOnly?: boolean
}
export const adminRoutes: RouteDefinition[] = [
  { page: 'dashboard', pattern: '/admin', title: 'Dashboard' },
  { page: 'login', pattern: '/admin/login', title: 'Sign in' },
  { page: 'entries', pattern: '/admin/collections/:name', title: 'Entries' },
  { page: 'entry-new', pattern: '/admin/collections/:name/new', title: 'New entry' },
  { page: 'revisions', pattern: '/admin/collections/:name/:id/revisions', title: 'Revisions' },
  { page: 'entry-edit', pattern: '/admin/collections/:name/:id', title: 'Edit entry' },
  { page: 'users', pattern: '/admin/users', title: 'Users', adminOnly: true },
  { page: 'user-edit', pattern: '/admin/users/:id', title: 'Edit user', adminOnly: true },
  { page: 'account', pattern: '/admin/account', title: 'Account' },
  { page: 'settings', pattern: '/admin/settings', title: 'Settings', adminOnly: true },
  { page: 'auth', pattern: '/admin/settings/auth', title: 'Authentication', adminOnly: true },
  { page: 'status', pattern: '/admin/settings/status', title: 'Status', adminOnly: true },
  { page: 'media', pattern: '/admin/media', title: 'Assets' },
  { page: 'forms', pattern: '/admin/forms', title: 'Forms' },
  { page: 'form-new', pattern: '/admin/forms/new', title: 'New form' },
  { page: 'submissions', pattern: '/admin/forms/:handle/submissions', title: 'Submissions' },
  { page: 'submission', pattern: '/admin/forms/:handle/submissions/:id', title: 'Submission' },
  { page: 'form-edit', pattern: '/admin/forms/:handle', title: 'Edit form' },
  { page: 'sets', pattern: '/admin/settings/sets', title: 'Sets', adminOnly: true },
  { page: 'set-new', pattern: '/admin/settings/sets/new', title: 'New set', adminOnly: true },
  { page: 'set-edit', pattern: '/admin/settings/sets/:handle', title: 'Edit set', adminOnly: true },
  { page: 'globals', pattern: '/admin/settings/globals', title: 'Globals', adminOnly: true },
  { page: 'global-new', pattern: '/admin/settings/globals/new', title: 'New global set', adminOnly: true },
  { page: 'global-edit', pattern: '/admin/settings/globals/:handle', title: 'Edit global set', adminOnly: true },
  { page: 'redirects', pattern: '/admin/settings/redirects', title: 'Redirects', adminOnly: true },
  { page: 'schema-new', pattern: '/admin/schema/new', title: 'New collection', adminOnly: true },
  { page: 'schema-import', pattern: '/admin/schema/import', title: 'Import collections', adminOnly: true },
  { page: 'schema-edit', pattern: '/admin/schema/:handle', title: 'Schema' },
]

export type AdminRoute = RouteDefinition & { params: Record<string, string> }

export function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}

export function matchAdminRoute(pathname: string): AdminRoute | null {
  if (!isAdminPath(pathname)) return null
  const parts = pathname.replace(/\/+$/, '').split('/')
  for (const route of adminRoutes) {
    const pattern = route.pattern.split('/')
    if (parts.length !== pattern.length) continue
    const params: Record<string, string> = {}
    let matches = true
    for (let i = 0; i < pattern.length; i++) {
      const segment = pattern[i]!
      const value = parts[i]!
      if (!segment.startsWith(':')) {
        if (segment !== value) { matches = false; break }
      } else {
        try {
          const decoded = decodeURIComponent(value)
          if (!decoded || /[\/\\\x00-\x1f]/.test(decoded) || decoded === '.' || decoded === '..') {
            matches = false
            break
          }
          params[segment.slice(1)] = decoded
        } catch { matches = false; break }
      }
    }
    if (matches) return { ...route, params }
  }
  return null
}

export function activeAdminPath(route: AdminRoute): string {
  const p = route.params
  switch (route.page) {
    case 'entries': case 'entry-new': case 'entry-edit': case 'revisions':
      return '/admin/collections/' + encodeURIComponent(p.name!)
    case 'form-new': case 'form-edit': case 'submissions': case 'submission': return '/admin/forms'
    case 'user-edit': return '/admin/users'
    case 'set-new': case 'set-edit': return '/admin/settings/sets'
    case 'global-new': case 'global-edit': return '/admin/settings/globals'
    default: return route.pattern.replace(/:([a-z]+)/g, (_, key: string) => encodeURIComponent(p[key] ?? ''))
  }
}
