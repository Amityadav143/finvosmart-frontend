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
import { getAccessToken, getRefreshToken } from '@/lib/store/slices/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL

let refreshPromise: Promise<string | null> | null = null

export function createApiClient(): AxiosInstance {
  const client = axios.create({ baseURL: API_URL, timeout: 30000 })

  // Attach access token from Zustand store (single source of truth)
  client.interceptors.request.use((config: any) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Handle 401 — refresh token then retry
  client.interceptors.response.use(
    (res: any) => res,
    async (err: any) => {
      const original = err.config
      if (err.response?.status === 401 && !original._retry) {
        const refresh = getRefreshToken()
        if (!refresh) { window.location.href = '/login'; return Promise.reject(err) }

        original._retry = true

        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, { refreshToken: refresh })
            .then(r => {
              const newToken = r.data?.data?.accessToken
              if (newToken) {
                // Update store via dynamic import to avoid circular deps
                import('@/lib/store/slices/authStore').then(({ useAuthStore }) => {
                  const store = useAuthStore.getState()
                  if (store.setAuth && r.data?.data) store.setAuth(r.data.data)
                })
                return newToken
              }
              return null
            })
            .catch(() => {
              // Refresh failed — force logout
              import('@/lib/store/slices/authStore').then(({ useAuthStore }) => {
                useAuthStore.getState().logout()
              })
              window.location.href = '/login'
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
