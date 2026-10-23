'use client'
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
import { useEffect } from 'react'

/** The parameters other screens use to open a page in a certain state. */
export const URL_ACTIONS = ['new', 'q', 'open'] as const

const URL_EVENT = 'finvo:url-params'

/**
 * Runs on arrival with the page's query string — "?new=1" from the "+ New" menu, "?q=…" and
 * "?open=<id>" from search and notifications — and again whenever {@link goTo} sends the page
 * new ones while it is already open. The parameters are then taken out of the address, so a
 * refresh doesn't open the form again.
 */
export function useUrlParams(handle: (p: URLSearchParams) => void, extra: readonly string[] = []) {
  useEffect(() => {
    const run = () => {
      const p = new URLSearchParams(window.location.search)
      if (!URL_ACTIONS.some(k => p.has(k))) return
      handle(p)
      const keep = new URLSearchParams(p)
      URL_ACTIONS.forEach(k => keep.delete(k))
      extra.forEach(k => keep.delete(k))      // values that came with the action (e.g. a name to prefill)
      const rest = keep.toString()
      window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash)
    }
    run()
    window.addEventListener(URL_EVENT, run)
    return () => window.removeEventListener(URL_EVENT, run)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Opens a link. When it points at the page already on screen with one of {@link URL_ACTIONS}
 * (say "+ New → Customer" while on Customers), the page is told directly — a client-side
 * navigation to the same page would not run its arrival code again.
 */
export function goTo(router: { push: (href: string) => void }, href: string) {
  try {
    const u = new URL(href, window.location.origin)
    if (u.origin === window.location.origin && u.pathname === window.location.pathname && URL_ACTIONS.some(k => u.searchParams.has(k))) {
      window.history.pushState(window.history.state, '', u.pathname + u.search + u.hash)
      window.dispatchEvent(new Event(URL_EVENT))
      return
    }
  } catch { /* not a URL we can read: let the router handle it */ }
  router.push(href)
}
