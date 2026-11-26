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

/** What the server sends (NotificationController.NotificationDto). */
export interface AppNotification {
  id: string
  type: 'APPROVAL' | 'PAYMENT' | 'OVERDUE' | 'DUE_SOON' | 'LOW_STOCK' | 'PAYROLL' | 'LEAVE' | 'REVIEW' | 'SALES' | 'SYSTEM' | string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message?: string | null
  link?: string | null
  read: boolean
  createdAt: string
}

/** Query keys — the bell and the page share them, so reading in one place updates the other. */
export const NOTIFICATION_KEYS = {
  list: ['notifications'] as const,
  count: ['notif-count'] as const,
  emailPrefs: ['notification-email-prefs'] as const,
}

/** What the signed-in person gets by email beyond sign-in and plan emails. */
export interface EmailPrefs {
  /** important alerts at once (a bank account changed, urgent approvals, customers' orders, MSME dates) */
  alerts: boolean
  /** the morning summary of what is due (statutory dates, what came in and is unread) */
  summary: boolean
}

export const notificationsApi = {
  list: async (page = 0, size = 20) => data<AppNotification[]>(await api.get('/notifications', { params: { page, size } })) ?? [],
  unreadCount: async () => (data<{ count: number }>(await api.get('/notifications/unread-count'))?.count ?? 0),
  markRead: async (id: string) => { await api.patch(`/notifications/${id}/read`) },
  markAllRead: async () => (data<{ marked: number }>(await api.post('/notifications/mark-all-read'))?.marked ?? 0),
  emailPrefs: async () => data<EmailPrefs>(await api.get('/notifications/email-preferences')),
  saveEmailPrefs: async (p: Partial<EmailPrefs>) => data<EmailPrefs>(await api.put('/notifications/email-preferences', p)),
}

/** The one-click links at the foot of alert and summary emails: no sign-in, the token is the key. */
export const emailLinksApi = {
  unsubscribe: async (token: string) => data<{ kind: 'ALERTS' | 'SUMMARY'; on: boolean }>(
    await api.post('/public/email-preferences/unsubscribe', null, { params: { token } })),
  resubscribe: async (token: string) => data<{ kind: 'ALERTS' | 'SUMMARY'; on: boolean }>(
    await api.post('/public/email-preferences/resubscribe', null, { params: { token } })),
}
