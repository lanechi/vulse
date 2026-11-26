function readUrlLocaleParam(): string | null {
  const loc = (globalThis as { location?: { search?: string; pathname?: string; hash?: string } }).location
  const hash = loc?.hash ?? ''
  const search = !loc?.pathname?.startsWith('/admin') && hash.startsWith('#/admin')
    ? hash.slice(hash.indexOf('?') >= 0 ? hash.indexOf('?') : hash.length)
    : loc?.search
  if (!search) return null
  return new URLSearchParams(search).get('locale')
}

/** Resolve the active locale for admin entry editing. Prefer the URL on the client (source of truth after navigation). */
export function resolveActiveLocale(
  supportedLocales: string[] | undefined,
  entryLocale: string | undefined,
  defaultLocale: string | undefined,
): string {
  const fallback = entryLocale ?? defaultLocale ?? 'default'
  const raw = readUrlLocaleParam()
  if (raw && (supportedLocales ?? []).includes(raw)) return raw
  return fallback
}
