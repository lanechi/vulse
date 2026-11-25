import { isAdminPath } from './spa-routes.js'

export const ADMIN_NAVIGATION = 'vulse:admin:navigate'

/** Request client navigation when the SPA is mounted; preserve legacy page behavior otherwise. */
export function navigateAdmin(href: string): void {
  const url = new URL(href, window.location.href)
  if (url.origin === window.location.origin && isAdminPath(url.pathname)) {
    const event = new CustomEvent(ADMIN_NAVIGATION, { detail: { href: url.href }, cancelable: true })
    if (!window.dispatchEvent(event)) return
  }
  window.location.href = url.href
}

/** Current route URL, also supporting the isolated hash-routed static demo. */
export function currentAdminUrl(): URL {
  const url = new URL(window.location.href)
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
