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

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthResponse } from '@/types'

interface UserInfo {
  fullName:         string
  email:            string
  userId:           string
  roles:            string[]
  permissions:      string[]
  companyId:        string
  companyName?:     string
  companyCode?:     string
  subscriptionPlan?: string
}

interface AuthState {
  user:            UserInfo | null
  accessToken:     string | null
  refreshToken:    string | null
  isAuthenticated: boolean
  setAuth:  (auth: AuthResponse) => void
  logout:   () => void
}

/**
 * Zustand auth store with Zustand-persist.
 *
 * FIX (v1.2): Removed manual localStorage.setItem() calls from setAuth/logout.
 * All persistence is now handled solely by Zustand's persist middleware.
 * This eliminates the dual-write bug where two separate localStorage entries
 * were maintained, creating risk of inconsistent state on partial clears.
 *
 * The Axios client reads accessToken / refreshToken directly from localStorage
 * via the keys Zustand persist writes under the 'finvo-auth' key.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set: any) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setAuth: (auth: AuthResponse) => {
        set({
          user: {
            fullName:         auth.fullName,
            email:            auth.email,
            userId:           auth.userId,
            companyId:        auth.companyId,
            companyName:      (auth as any).companyName,
            companyCode:      (auth as any).companyCode,
            subscriptionPlan: (auth as any).subscriptionPlan,
            roles:            auth.roles       ?? [],
            permissions:      auth.permissions ?? [],
          },
          accessToken:     auth.accessToken,
          refreshToken:    auth.refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          user:            null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name:    'finvo-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist everything — the Axios client reads from this store
      partialize: (s: any) => ({
        user:            s.user,
        accessToken:     s.accessToken,
        refreshToken:    s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)

// Helper: read token synchronously (for Axios interceptor)
export const getAccessToken  = () => {
  try {
    const raw = localStorage.getItem('finvo-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.accessToken ?? null
  } catch { return null }
}

export const getRefreshToken = () => {
  try {
    const raw = localStorage.getItem('finvo-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.refreshToken ?? null
  } catch { return null }
}
