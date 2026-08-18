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

import { api } from './client'
import type { ApiResponse, AuthResponse } from '@/types'

/**
 * Auth API — thin wrappers around the auth endpoints.
 *
 * BUG FIX (v1.2): Removed duplicate localStorage writes.
 * Token storage is now ONLY done by the Zustand authStore (setAuth).
 * This file purely calls the API and returns the response.
 */
export const authApi = {
  login: async (email: string, password: string, companyCode: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
      companyCode: companyCode.trim().toUpperCase(),
    })
    return res.data.data!
    // NOTE: caller (login page) must call authStore.setAuth(result)
    // which handles all localStorage persistence via Zustand persist middleware
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken })
    return res.data.data!
  },

  verifyMfa: async (mfaSessionToken: string, code: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/mfa/verify', { mfaSessionToken, code })
    return res.data.data!
  },

  me: async (): Promise<AuthResponse> => {
    const res = await api.get<ApiResponse<AuthResponse>>('/auth/me')
    return res.data.data!
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post('/auth/change-password', { currentPassword, newPassword })
    return res.data
  },

  // ── Self-service password reset ─────────────────────────────────────────
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email: email.trim() })
    return res.data
  },

  resetPassword: async (token: string, password: string) => {
    const res = await api.post('/auth/reset-password', { token, password })
    return res.data
  },

  // ── Mobile / Email OTP ──────────────────────────────────────────────────
  requestOtp: async (identifier: string, channel: 'SMS' | 'EMAIL' = 'SMS') => {
    const res = await api.post<ApiResponse<any>>('/auth/otp/request', { identifier: identifier.trim(), channel })
    return res.data.data
  },

  verifyOtp: async (identifier: string, code: string, channel: 'SMS' | 'EMAIL' = 'SMS', companyCode?: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/otp/verify', {
      identifier: identifier.trim(), code: code.trim(), channel,
      companyCode: companyCode?.trim().toUpperCase() || undefined,
    })
    return res.data.data!
  },

  // ── Social login ────────────────────────────────────────────────────────
  google: async (idToken: string, companyCode?: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/social/google', {
      idToken, companyCode: companyCode?.trim().toUpperCase() || undefined,
    })
    return res.data.data!
  },

  social: async (provider: string, profile: { providerId?: string; email: string; name?: string; avatarUrl?: string }, companyCode?: string): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/social/login', {
      provider, ...profile, companyCode: companyCode?.trim().toUpperCase() || undefined,
    })
    return res.data.data!
  },
}
