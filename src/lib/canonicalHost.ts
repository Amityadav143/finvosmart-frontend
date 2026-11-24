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
 * One address for the website. Search engines should index each page once, at https://finvosmart.com — so a request
 * that arrives under any other name for this server (www.finvosmart.com, an old or borrowed domain pointed at it, a
 * hosting provider's own name for the machine) is sent there for good (301), and that name's pages and links count
 * for finvosmart.com. The app's own sub-domains (app.finvosmart.com) and bare IP addresses are served as they are but
 * marked noindex: the same pages are indexed at finvosmart.com. The machine itself (localhost) is left alone.
 *
 * Set at build time: NEXT_PUBLIC_EXTRA_HOSTS (comma-separated) names other hosts that should serve the site — a staging
 * copy, say — marked noindex rather than sent away; NEXT_PUBLIC_CANONICAL_REDIRECT=off turns the redirect off (other
 * names are then only marked noindex).
 */
export type HostDecision = 'serve' | 'noindex' | 'redirect'

export const CANONICAL_HOST = 'finvosmart.com'

/** The host name alone: lower case, without the port or a trailing dot. */
export function bareHost(raw: string | null | undefined): string {
  let h = (raw || '').trim().toLowerCase()
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1)          // [::1]:3000 → [::1]
  h = h.replace(/:\d+$/, '')
  return h.endsWith('.') ? h.slice(0, -1) : h
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const INTERNAL = /\.(local|internal|lan|home|localdomain|svc|cluster\.local|test|example|invalid)$/

export function hostDecision(raw: string | null | undefined, extraHosts: string = '', redirect: string = 'on'): HostDecision {
  const host = bareHost(raw)
  if (!host || host === CANONICAL_HOST) return 'serve'
  if (host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '[::1]') return 'serve'
  // a name with no dot, or one that only exists inside a network (an upstream's name when a proxy doesn't pass the
  // visitor's Host): never sent away — the redirect would come straight back here
  if (!host.includes('.') || INTERNAL.test(host)) return 'serve'
  const extra = extraHosts.split(',').map(bareHost).filter(Boolean)
  if (host === `www.${CANONICAL_HOST}`) return redirect === 'off' ? 'noindex' : 'redirect'
  if (host.endsWith(`.${CANONICAL_HOST}`) || extra.includes(host) || IPV4.test(host) || host.startsWith('[')) return 'noindex'
  return redirect === 'off' ? 'noindex' : 'redirect'
}
