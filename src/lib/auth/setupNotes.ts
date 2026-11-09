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

import { useEffect, useState } from 'react'

/**
 * A problem in how the server is set up — the API at a changed address, nginx sending sign-in to one backend and
 * the rest to another, a backend or web app not rebuilt after an update, a secret or a clock that changed — is for
 * whoever runs the server, not for the people signing in. The sign-in pages tell people in plain words (Finvosmart
 * isn't available just now, try again) and keep the diagnosis for the server's administrator:
 *  - always in the browser's developer console (F12 → Console), marked [Finvosmart set-up];
 *  - on the page itself when its address ends in ?check (https://your-site/login?check);
 *  - and on the server, scripts/check-sign-in.sh finds the same problems from outside.
 */

/** People signing in, when the server can't be reached at all. */
export const NO_CONNECTION = 'Can’t connect to Finvosmart. Check your internet connection and try again.'
/** People signing in, when the server has a problem of its own. */
export const NOT_AVAILABLE = 'Finvosmart isn’t available just now. Please try again in a few minutes — if it keeps happening, contact Finvosmart support.'

/** This page shows the server's set-up diagnosis: its address has ?check (for whoever runs the server). */
export function diagnosing(): boolean {
  if (typeof window === 'undefined') return false
  try { return new URLSearchParams(window.location.search).has('check') } catch { return false }
}

/** The same, for what a component draws (read after the page has loaded, so the server's render and the browser's agree). */
export function useDiagnosing(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => { setOn(diagnosing()) }, [])
  return on
}

const told = new Set<string>()
/** The diagnosis, in the browser's developer console — once per page, whatever the page shows. */
export function logForAdmin(diagnosis: string) {
  if (typeof window === 'undefined' || !diagnosis || told.has(diagnosis)) return
  told.add(diagnosis)
  try { console.warn(`[Finvosmart set-up] ${diagnosis} — open this page with ?check at the end of its address to see it on the page.`) } catch { /* no console */ }
}

/** What a page says about a set-up problem: plain words for people, the diagnosis for the administrator (?check). */
export function forPeople(diagnosis: string, plain: string = NOT_AVAILABLE): string {
  logForAdmin(diagnosis)
  return diagnosing() ? diagnosis : plain
}
