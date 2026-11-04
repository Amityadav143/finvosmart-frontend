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

import { useQuery } from '@tanstack/react-query'
import { billingApi } from '@/lib/api/billing'
import { useAuthStore } from '@/lib/store/slices/authStore'

/**
 * The company's plan and trial, from the server (the trial's dates are kept there: the browser can't move them). A
 * change refused with 402 (read-only) asks again (lib/api/client.ts), so every banner follows at once.
 */
export function useSubscription() {
  const signedIn = useAuthStore(s => s.isAuthenticated && !!s.accessToken)
  return useQuery({ queryKey: ['subscription'], queryFn: billingApi.status, enabled: signedIn, staleTime: 60_000, retry: 1 })
}

/** "10 Nov 2026" — the last day an end moment covers (midnight starting the 11th is the end of the 10th), India time. */
export function lastDay(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(new Date(iso).getTime() - 1000)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function dayOf(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}
