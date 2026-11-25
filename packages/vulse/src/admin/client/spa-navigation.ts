import { isAdminPath } from './spa-routes.js'

// The core tsconfig targets Workers rather than DOM. Keep the browser-only
// surface local instead of adding DOM globals to the entire server package.
type AdminBrowser = {
  location: { href: string; origin: string }
  dispatchEvent(event: Event): boolean
}
function browser(): AdminBrowser {
  return globalThis as unknown as AdminBrowser
}

export const ADMIN_NAVIGATION = 'vulse:admin:navigate'

/** Request client navigation when the SPA is mounted; preserve legacy page behavior otherwise. */
export function navigateAdmin(href: string): void {
  const url = new URL(href, browser().location.href)
  if (url.origin === browser().location.origin && isAdminPath(url.pathname)) {
    const event = new CustomEvent(ADMIN_NAVIGATION, { detail: { href: url.href }, cancelable: true })
    if (!browser().dispatchEvent(event)) return
  }
  browser().location.href = url.href
}

/** Current route URL, also supporting the isolated hash-routed static demo. */
export function currentAdminUrl(): URL {
  const url = new URL(browser().location.href)
  if (!isAdminPath(url.pathname) && isAdminPath(url.hash.slice(1).split('?')[0] ?? '')) {
    return new URL(url.hash.slice(1), url.origin)
  }
  return url
}

export function navigateAdminLocale(locale: string): void {
  const url = currentAdminUrl()
  url.searchParams.set('locale', locale)
  navigateAdmin(url.pathname + url.search)
}
