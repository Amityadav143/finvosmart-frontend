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

import axios from 'axios'
import { restoreLegacyRefreshToken, takeLegacyRefreshToken, useAuthStore } from '@/lib/store/slices/authStore'
import { queryClientRef } from '@/lib/queryClientRef'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * The session of this browser. The refresh token is in an HttpOnly cookie the server sets (scripts can't read it);
 * the access token is in each tab's memory. A tab renews by asking the server with the cookie — one renewal at a
 * time across all tabs (Web Locks), each refresh token working once (the server ends a session whose old token
 * comes back) — and the tabs tell each other when someone signs in or out (BroadcastChannel), so no tab keeps
 * showing the last person's data.
 */

/** The header that makes the server answer with the cookie instead of a refresh token in the body. */
export const SESSION_HEADERS = { 'X-Finvo-Session': 'cookie' }

export type Renewal = { ok: true; auth: any } | { ok: false; ended: boolean; reason?: string }

let renewing: Promise<Renewal> | null = null

/** Runs fn while holding the browser-wide renewal lock (every tab of this site shares it); without Web Locks, at once. */
async function oneTabAtATime<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined
  if (locks?.request) return locks.request('finvo-session-renewal', fn)
  return fn()
}

/**
 * Renews the session with the cookie (or, once, with a refresh token an older version saved in the browser's
 * storage — it moves into the cookie). ended: the server refused (signed out, run out, switched off) — with its
 * reason; not ended: no answer (offline, a restart), so the session is kept and tried again later.
 */
export function renewSession(): Promise<Renewal> {
  if (!renewing) {
    renewing = oneTabAtATime(async (): Promise<Renewal> => {
      const legacy = takeLegacyRefreshToken()
      try {
        const r = await axios.post(`${API_URL}/auth/refresh`, legacy ? { refreshToken: legacy } : {},
          { headers: SESSION_HEADERS, withCredentials: true, timeout: 15000 })
        const auth = r.data?.data
        if (!auth?.accessToken) return { ok: false, ended: true }
        // a session that may only choose a new password is not kept (the sign-in page asks for one)
        if (auth.passwordChangeRequired) {
          await endSession()
          return { ok: false, ended: true, reason: 'PASSWORD_CHANGE_REQUIRED' }
        }
        takeAuth(auth)
        return { ok: true, auth }
      } catch (e: any) {
        if (!e?.response) {
          if (legacy) restoreLegacyRefreshToken(legacy)      // no answer (offline): the one-time move to the cookie is tried again
          return { ok: false, ended: false }
        }
        // renewing is public, so a 401 for it is an address the server didn't know (changed on the way)
        const reason = e.response.status === 401 ? 'NOT_AN_API_ADDRESS' : e.response.data?.reason
        return { ok: false, ended: true, reason: typeof reason === 'string' ? reason : undefined }
      }
    }).finally(() => { renewing = null })
  }
  return renewing
}

/**
 * Keeps a new session (signed in, renewed): the profile and the access token. A different person or company than
 * before in this tab means nothing cached may be shown again: the cache is emptied first.
 */
export function takeAuth(auth: any) {
  const before = useAuthStore.getState().user
  if (before && (before.userId !== auth.userId || before.companyId !== auth.companyId)) queryClientRef.current?.clear()
  useAuthStore.getState().setAuth(auth)
}

/** Ends the session on the server (and the cookie), leaving this tab's state as it is. */
async function endSession() {
  try {
    const token = useAuthStore.getState().accessToken
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: { ...SESSION_HEADERS, ...(token ? { Authorization: `Bearer ${token}` } : {}) }, withCredentials: true, timeout: 10000 })
  } catch { /* offline: the cookie is still removed by the next answer that ends the session */ }
}

/**
 * Signs out: the server ends the session at once (no copy of its tokens works again) and removes the cookie; this
 * tab forgets the person and everything cached; the other tabs are told and go to the sign-in page too.
 */
export async function signOut(): Promise<void> {
  await endSession()
  forgetHere()
  tell({ type: 'signed-out' })
}

/** Forgets the person in this tab: profile, access token and every cached answer. */
export function forgetHere() {
  queryClientRef.current?.clear()
  useAuthStore.getState().logout()
}

// ── the other tabs ─────────────────────────────────────────────────────────────────────

type Message = { type: 'signed-out' } | { type: 'signed-in'; userId: string; companyId: string }

let channel: BroadcastChannel | null | undefined
function bus(): BroadcastChannel | null {
  if (channel === undefined) channel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('finvo-session') : null
  return channel
}

function tell(m: Message) {
  try { bus()?.postMessage(m) } catch { /* closed */ }
}

/** Tells the other tabs who just signed in (they reload if they show someone else). */
export function announceSignIn(auth: { userId: string; companyId: string }) {
  tell({ type: 'signed-in', userId: auth.userId, companyId: auth.companyId })
}

/**
 * Follows what the other tabs do: someone signed out → this tab forgets them and onSignedOut runs; someone else (or
 * another company) signed in → onOtherPerson runs (the app reloads, so nothing of the last person stays on screen).
 * Without BroadcastChannel, the change of the saved profile tells the same. Returns the unsubscribe.
 */
export function followOtherTabs(onSignedOut: () => void, onOtherPerson: () => void): () => void {
  const mine = () => useAuthStore.getState().user
  const handle = (m: Message) => {
    if (m.type === 'signed-out') {
      if (mine()) { forgetHere(); onSignedOut() }
    } else if (m.type === 'signed-in') {
      const u = mine()
      if (!u || u.userId !== m.userId || u.companyId !== m.companyId) onOtherPerson()
    }
  }
  const b = bus()
  const onMessage = (e: MessageEvent) => { if (e?.data && typeof e.data.type === 'string') handle(e.data as Message) }
  b?.addEventListener('message', onMessage)
  const onStorage = (e: StorageEvent) => {
    if (b || e.key !== 'finvo-auth') return
    try {
      const next = e.newValue ? JSON.parse(e.newValue)?.state : null
      if (!next?.isAuthenticated || !next?.user) handle({ type: 'signed-out' })
      else handle({ type: 'signed-in', userId: next.user.userId, companyId: next.user.companyId })
    } catch { /* not ours */ }
  }
  window.addEventListener('storage', onStorage)
  return () => { b?.removeEventListener('message', onMessage); window.removeEventListener('storage', onStorage) }
}
