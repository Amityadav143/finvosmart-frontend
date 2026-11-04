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

import { addressRefused, corsRefused, corsRefusedMessage, isPublicAuth } from './auth/publicAuth'

/**
 * The message to show for a failed API call: the server's own explanation when it gave one
 * (ApiResponse.error), else a plain sentence for the usual cases, else the fallback. Two server set-up
 * problems are named instead of the server's words: a public sign-in endpoint refused as signed out (its
 * address changed on the way — the server said "Your session has ended. Please sign in again.") and a
 * request refused as coming from another website (CORS).
 */
export function apiError(e: any, fallback = 'Something went wrong. Please try again.'): string {
  if (e?.response?.status === 401 && isPublicAuth(e?.config?.url) && typeof e.response.data?.error === 'string') return addressRefused()
  if (corsRefused(e)) return corsRefusedMessage()
  const d = e?.response?.data
  const said = typeof d?.error === 'string' && d.error ? d.error : typeof d?.message === 'string' && d.message ? d.message : null
  if (said) return said
  const status = e?.response?.status
  if (!e?.response && e?.request) return 'Can’t reach the server. Check your connection and try again.'
  if (status === 403) return 'You don’t have permission to do that. Ask an administrator for access.'
  if (status === 404) return 'That record no longer exists — it may have been removed.'
  if (status === 429) return 'Too many requests just now. Wait a moment and try again.'
  if (status === 402) return 'This needs an active subscription. Upgrade under Settings → Subscription to continue.'
  if (status === 409) return 'Someone else changed this at the same moment. Refresh and try again.'
  if (status === 503) return 'The server is busy or restarting — nothing was saved. Please try again in a moment.'
  if (status >= 500) {
    // the backend's reference for this request (RequestIdFilter), to quote to support
    const ref = e?.response?.headers?.['x-request-id']
    return 'The server ran into a problem and nothing was saved. Please try again in a minute.' + (ref ? ` (Reference ${ref})` : '')
  }
  return fallback
}
