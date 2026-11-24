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
 * What brought a visitor — kept in their own browser, never sent anywhere until they sign up or ask for a demo
 * (then it goes with that, to Finvosmart only; the server's AttributionRules clean it). No tracker, no cookie: the
 * campaign's tags (utm_…), an ad's click id, the referring site's name (not its page) and the page landed on. The first
 * visit that brought them stays for 90 days; the latest is replaced by each new one. A visit with nothing to say — a
 * page opened directly, or from Finvosmart's own pages — changes nothing.
 */
export interface Touch {
  source?: string; medium?: string; campaign?: string; term?: string; content?: string
  clickId?: string; clickType?: string; referrer?: string; landing?: string; at: string
}
export interface Attribution { first?: Touch; last?: Touch }

const KEY = 'finvo-attribution'
const KEEP_DAYS = 90
const CLICK_IDS = ['gclid', 'gbraid', 'wbraid', 'msclkid', 'fbclid', 'li_fat_id'] as const

/** The touch a page view makes (null: nothing in it says where the visitor came from). */
export function touchFrom(href: string, referrer: string, now: Date, ownHost = 'finvosmart.com'): Touch | null {
  let url: URL
  try { url = new URL(href) } catch { return null }
  const p = url.searchParams
  const tag = (k: string) => (p.get(k) || '').trim().slice(0, 100) || undefined
  const click = CLICK_IDS.find(k => (p.get(k) || '').trim())
  let ref: string | undefined
  try {
    const host = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, '') : ''
    const own = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host && host !== own && host !== ownHost && !host.endsWith('.' + ownHost)) ref = host
  } catch { /* not an address */ }
  const t: Touch = {
    source: tag('utm_source'), medium: tag('utm_medium'), campaign: tag('utm_campaign'), term: tag('utm_term'), content: tag('utm_content'),
    clickId: click ? (p.get(click) || '').trim().slice(0, 200) : undefined, clickType: click, referrer: ref,
    landing: url.pathname.slice(0, 200), at: now.toISOString(),
  }
  return t.source || t.medium || t.campaign || t.clickId || t.referrer ? t : null
}

/** What is kept after this touch: the first (unless older than 90 days), and this as the latest. */
export function merged(kept: Attribution | null, t: Touch | null, now: Date): Attribution | null {
  const fresh = (x?: Touch) => !!x && now.getTime() - new Date(x.at).getTime() < KEEP_DAYS * 86400000
  const first = fresh(kept?.first) ? kept!.first : undefined
  const last = fresh(kept?.last) ? kept!.last : undefined
  if (!t) return first || last ? { first, last } : null
  return { first: first ?? t, last: t }
}

export function recall(): Attribution | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Attribution : null } catch { return null }
}

/** Notes this page view (call once a page opens). */
export function remember(href: string, referrer: string): void {
  try {
    const now = new Date()
    const next = merged(recall(), touchFrom(href, referrer, now), now)
    if (next) localStorage.setItem(KEY, JSON.stringify(next)); else localStorage.removeItem(KEY)
  } catch { /* storage switched off: nothing is kept */ }
}

/** What to send with a sign-up or a demo request (undefined: nothing kept). */
export function attributionForRequest(): Attribution | undefined {
  const a = merged(recall(), null, new Date())
  return a ?? undefined
}
