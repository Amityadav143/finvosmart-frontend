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
import { getAccessToken, getRefreshToken, useAuthStore } from '@/lib/store/slices/authStore'
import { isPublicAuth } from '@/lib/auth/publicAuth'

export { isPublicAuth }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

let refreshPromise: Promise<string | null> | null = null

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
    try { useAuthStore.getState().logout() } catch { /* nothing to forget */ }
    return
  }
  // Once: the first reason is the server's verdict (the renewal's answer). A request refused a moment
  // later finds the saved session already gone, and used to send the page off again with its own
  // "EXPIRED" in place of the real reason.
  if (leaving) return
  leaving = true
  try { localStorage.removeItem('finvo-auth') } catch { /* storage unavailable */ }
  // Why the server ended it (EXPIRED, NOT_RECOGNISED…): the sign-in page explains a server set-up problem.
  const why = typeof reason === 'string' && /^[A-Z_]{1,40}$/.test(reason) ? `&reason=${reason}` : ''
  window.location.href = `/login?expired=1${why}&next=${encodeURIComponent(pathname + search)}`
}

// The public sign-in endpoints (PUBLIC_AUTH in lib/auth/publicAuth.ts) never get the saved session, and
// their 401 is the page's to show — never a reason to renew the session or leave the page.

export function createApiClient(): AxiosInstance {
  const client = axios.create({ baseURL: API_URL, timeout: 30000 })

  // Attach access token from Zustand store (single source of truth)
  client.interceptors.request.use((config: any) => {
    const token = getAccessToken()
    if (token && !isPublicAuth(config.url)) config.headers.Authorization = `Bearer ${token}`
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
      if (err.response?.status === 401 && original && !original._retry && !isPublicAuth(original.url)) {
        // "No sign-in came with the request" for a request sent without one is an ordinary ending
        // (signed out in another tab); only when one was sent does it mean the header got lost.
        const said = err.response?.data?.reason
        const sent = !!(original?.headers?.Authorization ?? original?.headers?.get?.('Authorization'))
        const reason = said === 'NO_TOKEN' && !sent ? undefined : said
        const refresh = getRefreshToken()
        if (!refresh) { signInAgain(reason); return Promise.reject(err) }

        original._retry = true

        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, { refreshToken: refresh })
            .then(r => {
              const auth = r.data?.data
              if (!auth?.accessToken) { signInAgain(); return null }
              // The renewed session comes with the full profile (and a renewed refresh token).
              useAuthStore.getState().setAuth(auth)
              return auth.accessToken as string
            })
            // Refused by the server: the session is over. No answer at all (offline, a restart):
            // stay signed in, so the next request can try again. Renewing is public, so a 401 for it is an
            // address the server didn't know (changed on the way): the sign-in page says so.
            .catch((e: any) => {
              if (e?.response) signInAgain(e.response.status === 401 ? 'NOT_AN_API_ADDRESS' : e.response.data?.reason)
              return null
            })
            .finally(() => { refreshPromise = null })
        }

        const newToken = await refreshPromise
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`
          return client(original)
        }
      }
      return Promise.reject(err)
    }
  )

  return client
}

export const api = createApiClient()
