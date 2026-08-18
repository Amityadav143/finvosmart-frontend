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

import { api } from '@/lib/api/client'
import type { ApiResponse } from '@/types'

export interface EmailEventConfig {
  event: string
  label: string
  defaultSubject: string
  enabled: boolean
  subjectOverride?: string | null
  customIntro?: string | null
  ccRecipients?: string | null
  replyTo?: string | null
  customised: boolean
}

export const emailSettingsApi = {
  list: async (): Promise<EmailEventConfig[]> =>
    (await api.get<ApiResponse<EmailEventConfig[]>>('/admin/email-settings')).data.data ?? [],

  update: async (event: string, patch: Partial<EmailEventConfig>) =>
    (await api.put<ApiResponse<any>>(`/admin/email-settings/${event}`, patch)).data,

  sendTest: async (event: string, email: string) =>
    (await api.post<ApiResponse<void>>(`/admin/email-settings/${event}/test`, { email })).data,
}
