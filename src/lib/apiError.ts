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
 * The message to show for a failed API call: the server's own explanation when it gave one
 * (ApiResponse.error), else a plain sentence for the usual cases, else the fallback.
 */
export function apiError(e: any, fallback = 'Something went wrong. Please try again.'): string {
  const d = e?.response?.data
  const said = typeof d?.error === 'string' && d.error ? d.error : typeof d?.message === 'string' && d.message ? d.message : null
  if (said) return said
  const status = e?.response?.status
  if (!e?.response && e?.request) return 'Can’t reach the server. Check your connection and try again.'
  if (status === 403) return 'You don’t have permission to do that. Ask an administrator for access.'
  if (status === 404) return 'That record no longer exists — it may have been removed.'
  if (status === 429) return 'Too many requests just now. Wait a moment and try again.'
  if (status >= 500) return 'The server ran into a problem. Please try again in a minute.'
  return fallback
}
