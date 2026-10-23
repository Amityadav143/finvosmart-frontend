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
import { api } from './client'
import type { ApiResponse } from '@/types'

const data = <T,>(r: { data: ApiResponse<T> }) => r.data.data as T

/** WebhookDto.Response — the full secret is only present right after registering or rotating. */
export interface WebhookEndpoint {
  id: string
  url: string
  eventType: string
  eventLabel: string
  description?: string | null
  active: boolean
  lastFiredAt?: string | null
  lastStatus?: 'OK' | 'FAILED' | 'OFF' | null
  lastError?: string | null
  failureCount: number
  secretHint: string
  secret?: string | null
}

export interface WebhookEvent { type: string; description: string }
export interface WebhookTestResult { ok: boolean; httpStatus?: number | null; message: string }

export const webhooksApi = {
  list: async () => data<WebhookEndpoint[]>(await api.get('/webhooks')) ?? [],
  events: async () => data<WebhookEvent[]>(await api.get('/webhooks/events')) ?? [],
  register: async (b: { url: string; eventType: string; description?: string }) => data<WebhookEndpoint>(await api.post('/webhooks', b)),
  test: async (id: string) => data<WebhookTestResult>(await api.post(`/webhooks/${id}/test`)),
  rotateSecret: async (id: string) => data<WebhookEndpoint>(await api.post(`/webhooks/${id}/rotate-secret`)),
  setActive: async (id: string, active: boolean) => data<WebhookEndpoint>(await api.patch(`/webhooks/${id}/active`, null, { params: { active } })),
  remove: async (id: string) => { await api.delete(`/webhooks/${id}`) },
}

/** The same address checks the server makes, so mistakes show before saving. Null when fine. */
export function webhookUrlProblem(raw: string): string | null {
  const url = raw.trim()
  if (!url) return 'Enter the address of your endpoint.'
  let u: URL
  try { u = new URL(url) } catch { return 'That isn’t a complete web address (it should start with https://).' }
  if (u.protocol !== 'https:') return 'Use an https:// address — deliveries carry business data.'
  if (u.username || u.password) return 'Leave the user name and password out of the address.'
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.'))
    return 'Use a public address — local and internal names can’t be reached from Finvosmart.'
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split('.').map(Number)
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127))
      return 'That is a private network address; use a public one.'
  }
  if (url.length > 500) return 'The address is too long (500 characters at most).'
  return null
}
