/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

/**
 * Where the website's own server finds the API when it renders a page (the online stores, the sitemap). The browser
 * uses NEXT_PUBLIC_API_URL, which in production is usually "/api/v1" on the same site — a path the server can't call
 * by itself. In order: FINVO_API_INTERNAL (Docker: http://api:8080/api/v1), an absolute NEXT_PUBLIC_API_URL, else the
 * backend on this machine (a VPS without Docker: http://127.0.0.1:8080/api/v1).
 */
export function serverApiBase(): string {
  const internal = (process.env.FINVO_API_INTERNAL || '').trim().replace(/\/+$/, '')
  if (internal) return internal
  const pub = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(pub)) return pub
  return 'http://127.0.0.1:8080' + (pub.startsWith('/') ? pub : '/api/v1')
}

/** The API couldn't answer — down, timed out, or failing on its side. Not the same as "there is no such page". */
export class ApiUnavailable extends Error {
  constructor(path: string, why: string) {
    super(`The API did not answer ${path} (${why})`)
    this.name = 'ApiUnavailable'
  }
}

/**
 * A public API call from the server: the answer's data, or null when there is no such thing (404, or 400 for an
 * address the API won't take). Anything else — the API down, slow or failing — throws ApiUnavailable, written to the
 * server's log, so a page never turns into "not found" while the backend restarts. With revalidate 0 nothing is cached
 * by Next.js (the store pages keep their own answers: serverGetKept).
 */
export async function serverGet<T>(path: string, revalidate = 60): Promise<T | null> {
  const url = serverApiBase() + path
  let r: Response
  try {
    r = await fetch(url, { ...(revalidate > 0 ? { next: { revalidate } } : { cache: 'no-store' as const }),
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
  } catch (e) {
    if (e && typeof e === 'object' && 'digest' in e) throw e          // Next.js's own signals, not the network
    const why = e instanceof Error ? e.message : String(e)
    console.error(`[finvo] ${url} did not answer: ${why}`)
    throw new ApiUnavailable(path, why)
  }
  if (r.status === 404 || r.status === 400) return null
  if (!r.ok) {
    console.error(`[finvo] ${url} answered ${r.status}`)
    throw new ApiUnavailable(path, `status ${r.status}`)
  }
  const body = await r.json()
  return (body?.data ?? null) as T | null
}

/*
 * The store pages' answers, kept in this server: used for 30 seconds, and for up to a day when the API can't be
 * reached — while the backend restarts, a store's page is made from its last answer (the log says so) rather than
 * failing. After a failure the API isn't asked again for that page for 10 seconds, so a slow or hung API doesn't hold
 * up every visit. Kept here, not in Next.js's fetch cache: in Next 14 a stale cached fetch whose refresh fails breaks
 * the page's response (it never finishes).
 */
const kept = new Map<string, { at: number; data: unknown }>()
const failed = new Map<string, number>()
const FRESH_MS = 30_000, RETRY_MS = 10_000, KEEP_MS = 24 * 3_600_000, MAX_KEPT = 200

function remember<V>(map: Map<string, V>, key: string, value: V) {
  map.delete(key); map.set(key, value)                                    // newest last: the oldest goes first
  if (map.size > MAX_KEPT) map.delete(map.keys().next().value as string)
}

export async function serverGetKept<T>(path: string): Promise<T | null> {
  const hit = kept.get(path), now = Date.now()
  const usable = hit !== undefined && now - hit.at <= KEEP_MS
  if (hit && now - hit.at < FRESH_MS) return hit.data as T | null
  const lastFailure = failed.get(path)
  if (lastFailure !== undefined && now - lastFailure < RETRY_MS) {        // it failed a moment ago: not asked again yet
    if (usable) return hit.data as T | null
    throw new ApiUnavailable(path, 'it failed a moment ago')
  }
  try {
    const data = await serverGet<T>(path, 0)
    failed.delete(path); remember(kept, path, { at: Date.now(), data })
    return data
  } catch (e) {
    if (!(e instanceof ApiUnavailable)) throw e
    remember(failed, path, Date.now())
    if (!usable) throw e
    console.error(`[finvo] ${path}: made from the API's answer of ${Math.round((now - hit.at) / 1000)} s ago`)
    return hit.data as T | null
  }
}
