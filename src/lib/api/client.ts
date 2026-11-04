/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import axios, { AxiosInstance } from 'axios'
import { getAccessToken, useAuthStore } from '@/lib/store/slices/authStore'
import { isPublicAuth } from '@/lib/auth/publicAuth'
import { renewSession, forgetHere, SESSION_HEADERS } from '@/lib/auth/session'
import { queryClientRef } from '@/lib/queryClientRef'

export { isPublicAuth }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * The backend process that answered last (its X-Finvo-Instance header): seeing two tells a server
 * set-up problem. '' — it answered without one (a backend from before this header); null — no answer yet.
 */
let server: string | null = null
export const lastServer = () => server

/**
 * The session has ended (signed out elsewhere, password changed, or simply too long ago): forget it
 * and go to sign-in, which says so and brings the person back to this page afterwards. Only the saved
 * copy is cleared before leaving — clearing the live store would make the app shell start its own
 * redirect (without the note) in a race with this one.
 */
let leaving = false
function signInAgain(reason?: unknown) {
  if (typeof window === 'undefined') return
  const { pathname, search } = window.location
  if (pathname.startsWith('/login')) {
    try { forgetHere() } catch { /* nothing to forget */ }
    return
  }
  // Once: the first reason is the server's verdict (the renewal's answer). A request refused a moment
  // later finds the saved session already gone, and used to send the page off again with its own
  // "EXPIRED" in place of the real reason.
  if (leaving) return
  leaving = true
  try { localStorage.removeItem('finvo-auth') } catch { /* storage unavailable */ }
  try { useAuthStore.getState().setAccessToken(null) } catch { /* nothing held */ }
  // Why the server ended it (EXPIRED, NOT_RECOGNISED…): the sign-in page explains a server set-up problem.
  const why = typeof reason === 'string' && /^[A-Z_]{1,40}$/.test(reason) ? `&reason=${reason}` : ''
  window.location.href = `/login?expired=1${why}&next=${encodeURIComponent(pathname + search)}`
}

// The public sign-in endpoints (PUBLIC_AUTH in lib/auth/publicAuth.ts) never get the saved session, and
// their 401 is the page's to show — never a reason to renew the session or leave the page.

export function createApiClient(): AxiosInstance {
  // withCredentials: the refresh cookie travels with the sign-in calls when the API is on another port (development);
  // X-Finvo-Session: the server keeps the refresh token in that HttpOnly cookie, never in an answer a script could read
  const client = axios.create({ baseURL: API_URL, timeout: 30000, withCredentials: true, headers: { ...SESSION_HEADERS } })

  // The access token is in this tab's memory. After a reload there is none yet: the session is renewed first (once,
  // for all the page's requests together), instead of every request being refused and renewing on its own.
  client.interceptors.request.use(async (config: any) => {
    if (isPublicAuth(config.url)) return config
    let token = getAccessToken()
    if (!token && useAuthStore.getState().isAuthenticated) {
      const r = await renewSession()
      if (r.ok) token = r.auth.accessToken
    }
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Handle 401 — refresh token then retry
  client.interceptors.response.use(
    (res: any) => {
      const id = res?.headers?.['x-finvo-instance']
      server = id ? String(id) : ''
      return res
    },
    async (err: any) => {
      const original = err.config
      // read-only (the trial is over) or a paid-only feature: the plan banners ask the server again
      if (err.response?.status === 402) {
        try { queryClientRef.current?.invalidateQueries({ queryKey: ['subscription'] }) } catch { /* no cache yet */ }
      }
      if (err.response?.status === 401 && original && !original._retry && !isPublicAuth(original.url)) {
        // "No sign-in came with the request" for a request sent without one is an ordinary ending
        // (signed out in another tab); only when one was sent does it mean the header got lost.
        const said = err.response?.data?.reason
        const sent = !!(original?.headers?.Authorization ?? original?.headers?.get?.('Authorization'))
        const reason = said === 'NO_TOKEN' && !sent ? undefined : said
        if (!useAuthStore.getState().isAuthenticated) { signInAgain(reason); return Promise.reject(err) }

        original._retry = true
        // One renewal for every refused request (and every tab): the access token had run out, or the session
        // was renewed elsewhere. Refused by the server: the session is over. No answer at all (offline, a restart):
        // stay signed in, so the next request can try again.
        const r = await renewSession()
        if (r.ok) {
          original.headers.Authorization = `Bearer ${r.auth.accessToken}`
          return client(original)
        }
        if (r.ended) signInAgain(r.reason ?? reason)
      }
      return Promise.reject(err)
    }
  )

  return client
}

export const api = createApiClient()
