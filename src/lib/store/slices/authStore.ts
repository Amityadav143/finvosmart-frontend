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
  /** The access token: in this tab's memory only — never written to the browser's storage. */
  accessToken:     string | null
  /**
   * A session is believed to be open in this browser (its refresh token is in an HttpOnly cookie that scripts
   * can't read). Kept with the profile, so a reload knows to renew the session before showing the app.
   */
  isAuthenticated: boolean
  setAuth:  (auth: AuthResponse) => void
  setAccessToken: (token: string | null) => void
  logout:   () => void
}

/**
 * A refresh token saved by a version from before the cookie (it kept both tokens in localStorage): taken once
 * by the API client, which moves the session into the cookie and forgets it (lib/api/client.ts).
 */
let legacyRefreshToken: string | null = null
export const takeLegacyRefreshToken = () => { const t = legacyRefreshToken; legacyRefreshToken = null; return t }
/** Puts it back when the server couldn't be reached (kept in memory only, never written to storage again). */
export const restoreLegacyRefreshToken = (t: string) => { if (!legacyRefreshToken) legacyRefreshToken = t }

/**
 * Who is signed in. Only the profile (name, company, roles — what the screens show) is kept in the browser's
 * storage; the tokens are not: the access token lives in memory and the refresh token in an HttpOnly cookie set
 * by the server (SessionCookies), out of reach of any script on the page.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set): AuthState => ({
      user:            null,
      accessToken:     null,
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
          accessToken:     auth.accessToken ?? null,
          isAuthenticated: true,
        })
      },

      setAccessToken: (token: string | null) => set({ accessToken: token }),

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
    }),
    {
      name:    'finvo-auth',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // the profile only — never a token
      partialize: (s: AuthState) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) as any,
      // version 0 kept both tokens here: the refresh token moves into the cookie (once), the access token is dropped
      migrate: (persisted: any, version: number) => {
        if (version < 1 && persisted && typeof persisted.refreshToken === 'string' && persisted.refreshToken) {
          legacyRefreshToken = persisted.refreshToken
        }
        return { user: persisted?.user ?? null, isAuthenticated: !!persisted?.isAuthenticated } as any
      },
      // a copy restored from storage never carries a token into memory
      merge: (persisted: any, current: AuthState) => ({ ...current, user: persisted?.user ?? null, isAuthenticated: !!persisted?.isAuthenticated }),
    }
  )
)

/** The access token, for the API client (memory only). */
export const getAccessToken = () => useAuthStore.getState().accessToken
