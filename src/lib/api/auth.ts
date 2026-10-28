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
  /** Public sign-up: creates a NEW company with you as its admin, and signs you in. */
  register: async (d: {
    companyName: string; fullName: string; email: string; password: string
    phone?: string; gstin?: string; website?: string
    acceptTerms: boolean   // must be true — the server enforces it too
  }): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', d)
    return data.data!
  },

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

  // ── Sign up with Google ──────────────────────────────────────────────────
  /** Who the Google account is, and whether it already opens a login. Changes nothing. */
  googleSignupCheck: async (idToken: string): Promise<GoogleSignupCheck> => {
    const res = await api.post<ApiResponse<GoogleSignupCheck>>('/auth/register/google/check', { idToken })
    return res.data.data!
  },

  /** A NEW company with you as its admin, linked to your Google account; you are signed in straight away. */
  registerWithGoogle: async (d: {
    idToken: string; companyName: string; fullName: string; phone?: string; gstin?: string; website?: string
    acceptTerms: boolean   // must be true — the server enforces it too
  }): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register/google', d)
    return data.data!
  },

  /** Whether the signed-in login has a password (one made with Google has none until it is set). */
  passwordStatus: async (): Promise<{ hasPassword: boolean }> => {
    const res = await api.get<ApiResponse<{ hasPassword: boolean }>>('/auth/password')
    return res.data.data!
  },

  // ── The Google account linked to the signed-in login ─────────────────────
  googleLink: async (): Promise<GoogleLink> => {
    const res = await api.get<ApiResponse<GoogleLink>>('/auth/google')
    return res.data.data!
  },

  linkGoogle: async (idToken: string): Promise<GoogleLink> => {
    const res = await api.post<ApiResponse<GoogleLink>>('/auth/google/link', { idToken })
    return res.data.data!
  },

  unlinkGoogle: async (): Promise<GoogleLink> => {
    const res = await api.post<ApiResponse<GoogleLink>>('/auth/google/unlink')
    return res.data.data!
  },
}

/** Sign-up with Google, first step: the account, and whether it can already sign in. */
export interface GoogleSignupCheck { email: string; name: string | null; hasLogins: boolean }

/** The Google account that opens this login, if any (Settings → Sign-in & security). */
export interface GoogleLink {
  available: boolean          // Google sign-in is set up on this server
  linked: boolean
  email: string | null        // the Google account's address when it was linked
  linkedAt: string | null
  loginIsGmail: boolean       // the login's own address is Gmail: Google sign-in works for it without linking
}
