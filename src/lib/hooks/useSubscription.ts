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
import { billingApi, type PlanFeature } from '@/lib/api/billing'
import { useAuthStore } from '@/lib/store/slices/authStore'

/** What each plan feature is, for the panel shown where a plan doesn't include it. */
export const PLAN_FEATURES: Record<PlanFeature, { title: string; what: string }> = {
  WHATSAPP: { title: 'WhatsApp invoices and reminders', what: 'Send invoices and payment reminders on WhatsApp from your WhatsApp Business account, each with a link to view and pay.' },
  GSTR2B_CHECK: { title: 'GST credit check (GSTR-2B)', what: 'Match your supplier bills against GSTR-2B, so input credit is neither claimed wrongly nor lost.' },
  BANK_MATCHING: { title: 'Bank reconciliation', what: 'Upload any bank’s statement — CSV, Excel or OFX — and match it to invoices and bills by number and amount.' },
  TDS_REGISTER: { title: 'TDS register', what: 'Every TDS deducted on supplier bills, by section and deductee, ready for your returns.' },
}

/**
 * Whether the company's plan includes a feature. The server is the judge (it refuses with 402, PLAN_UPGRADE); this
 * only spares people a page that can't work for them. A server older than plan limits sends none: nothing is held back.
 */
export function usePlanFeature(feature: PlanFeature) {
  const sub = useSubscription()
  const limits = sub.data?.limits
  return { allowed: !limits || limits.features.includes(feature), loading: sub.isLoading, tierName: limits?.tierName, limits }
}

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
