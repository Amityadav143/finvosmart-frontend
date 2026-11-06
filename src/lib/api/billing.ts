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

/** What the company may do now (billing.calc.PlanRules on the server). */
export type PlanAccess = 'FULL' | 'TRIAL' | 'READ_ONLY'

export interface PlanOffer {
  code: string; name: string; selfServe: boolean
  /** a month, billed monthly — before GST and with it */
  monthlyPaise: number; monthlyTotalPaise: number
  /** a month when billed yearly; the year before GST and with it */
  annualPerMonthPaise: number; annualPaise: number; annualTotalPaise: number
}

/** The company's plan and trial (GET /billing/subscription). */
export interface PlanStatus {
  /** how the company is set up: TRIAL, PAID, or LEGACY (signed up before plans: full access) */
  status: 'TRIAL' | 'PAID' | 'LEGACY'
  access: PlanAccess
  plan?: string; planName?: string; billingCycle?: 'MONTHLY' | 'ANNUAL'
  trialStartedAt?: string; trialEndsAt?: string
  /** the day of the trial (1 on the first); how long it is in all (7, or more once Finvosmart's support gave it more days);
   *  days left after today (0: ends today) */
  trialDay?: number; trialDays?: number; trialDaysLeft?: number; countdown?: string
  paidUntil?: string
  /** template customisation and other paid-only features */
  paidFeatures: boolean
  /** online subscribing is set up (Razorpay) */
  checkoutAvailable: boolean; keyId?: string
  message?: string
  gstPercent: number
  plans: PlanOffer[]
}

/** What Razorpay Checkout opens with (POST /billing/checkout). */
export interface CheckoutOrder {
  orderId: string; keyId: string; amountPaise: number; currency: string; companyName: string; description: string
  prefillName?: string; prefillEmail?: string; prefillContact?: string; plan: string; billingCycle: string
  basePaise: number; gstPaise: number
}

export interface SubscriptionPayment {
  id: string; plan: string; billingCycle: string; basePaise: number; gstPaise: number; amountPaise: number
  status: 'CREATED' | 'PAID' | 'FAILED'; orderId: string; paymentId?: string
  periodStart?: string; periodEnd?: string; createdAt: string; paidAt?: string; failureReason?: string
}

export const billingApi = {
  status: async (): Promise<PlanStatus> => (await api.get<ApiResponse<PlanStatus>>('/billing/subscription')).data.data!,
  checkout: async (plan: string, billingCycle: 'MONTHLY' | 'ANNUAL'): Promise<CheckoutOrder> =>
    (await api.post<ApiResponse<CheckoutOrder>>('/billing/checkout', { plan, billingCycle })).data.data!,
  /** Checkout's answer, checked on the server with Razorpay before the plan is switched on. */
  verify: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<PlanStatus> =>
    (await api.post<ApiResponse<PlanStatus>>('/billing/verify', r)).data.data!,
  payments: async (): Promise<SubscriptionPayment[]> => (await api.get<ApiResponse<SubscriptionPayment[]>>('/billing/payments')).data.data ?? [],
}

/** ₹ from paise, Indian grouping, 2 decimals. */
export const rupeesFromPaise = (p: number) =>
  '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
