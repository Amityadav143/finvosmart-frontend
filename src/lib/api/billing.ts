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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/** What the company may do now (billing.calc.PlanRules on the server). */
export type PlanAccess = 'FULL' | 'TRIAL' | 'READ_ONLY'

/** How a plan is priced: one price for the company, or a price for each user (the users paid for are its limit). */
export type PlanPricing = 'COMPANY' | 'USER'

export interface PlanOffer {
  code: string; name: string; selfServe: boolean
  /** a month, billed monthly — before GST and with it (for the company, or for each user on a per-user plan) */
  monthlyPaise: number; monthlyTotalPaise: number
  /** a month when billed yearly; the year before GST and with it */
  annualPerMonthPaise: number; annualPaise: number; annualTotalPaise: number
  /** absent from a server older than the plan catalogue: priced for the company */
  pricing?: PlanPricing
  /** users (on a per-user plan, the most a company may pay for) and branches — null for no limit */
  maxUsers?: number | null; maxBranches?: number | null
  features?: PlanFeature[]
  description?: string | null
  /** the company's own plan */
  current?: boolean
}

/** A per-user plan: priced for each user. */
export const perUser = (p?: { pricing?: PlanPricing } | null) => p?.pricing === 'USER'

/** The plans on the pricing page and at sign-up (GET /public/plans — no sign-in). */
export interface PublicPlans {
  plans: PlanOffer[]; gstPercent: number; trialDays: number
  /** the features a plan may include: code → what the customer reads */
  features: Record<string, string>
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
  /** what the plan includes and what is in use (absent from a server older than plan limits: then nothing is limited) */
  limits?: PlanLimits
  /** whether documents may be downloaded, printed and sent now — on a plan (absent from an older server: nothing held back) */
  documentsAllowed?: boolean
  /** why not, in the server's words */
  documentsMessage?: string | null
  /** whole days of the paid period after today (0: its last day; negative: ended); absent without one */
  paidDaysLeft?: number | null
  /** on a paid plan now or before (not the free trial) */
  everPaid?: boolean
  /** on a plan priced for each user: the users paid for */
  seats?: number | null
  /** how the company's plan is priced (absent on the trial and full access) */
  planPricing?: PlanPricing | null
}

/** The features the plans tell apart: on Growth, Enterprise and the free trial, not on Starter. */
export type PlanFeature = 'WHATSAPP' | 'GSTR2B_CHECK' | 'BANK_MATCHING' | 'TDS_REGISTER'

export interface PlanLimits {
  /** STARTER, GROWTH, ENTERPRISE, TRIAL (the free trial: what Growth has) or LEGACY (no limits) */
  tier: string; tierName: string
  /** users and branches switched on now; a null max is no limit */
  maxUsers: number | null; activeUsers: number
  maxBranches: number | null; activeBranches: number
  features: PlanFeature[]
  /** the users are those paid for, on a plan priced for each user */
  perUser?: boolean
}

/**
 * What Razorpay Checkout opens with (POST /billing/checkout) — or, when a code took the whole price off, that the plan is
 * already active (activated: no order to pay).
 */
export interface CheckoutOrder {
  orderId: string | null; keyId: string | null; amountPaise: number; currency: string; companyName: string; description: string
  prefillName?: string; prefillEmail?: string; prefillContact?: string; plan: string; billingCycle: string
  basePaise: number; gstPaise: number
  /** the price before a code, what it took off, the code and how it reads ("20% off") */
  listPaise?: number; discountPaise?: number; discountCode?: string | null; discountLabel?: string | null
  /** users paid for, on a per-user plan */
  seats?: number | null
  activated?: boolean
  /** what it pays for — a plan's period (PLAN) or more users in the period (USERS) */
  purpose?: 'PLAN' | 'USERS'
}

/** What a discount code does to a plan's price (POST /billing/discount/check). */
export interface DiscountCheck {
  valid: boolean; message: string; code: string | null; label: string | null
  listPaise: number; discountPaise: number; basePaise: number; gstPaise: number; totalPaise: number; seats?: number | null
}

/** What more users cost now on a per-user plan, for the rest of the paid period (POST /billing/users/quote). */
export interface UsersQuote {
  seatsNow: number; seats: number; added: number; basePaise: number; gstPaise: number; totalPaise: number; until: string
}

export interface SubscriptionPayment {
  id: string; plan: string; billingCycle: string; basePaise: number; gstPaise: number; amountPaise: number
  status: 'CREATED' | 'PAID' | 'FAILED'; orderId: string; paymentId?: string
  periodStart?: string; periodEnd?: string; createdAt: string; paidAt?: string; failureReason?: string
  /** the price before a code, what it took off and the code (absent from an older server: none) */
  listPaise?: number; discountPaise?: number; discountCode?: string | null
  seats?: number | null; purpose?: 'PLAN' | 'USERS'
}

export interface CheckoutRequest { plan: string; billingCycle: 'MONTHLY' | 'ANNUAL'; seats?: number | null; discountCode?: string | null }

export const billingApi = {
  status: async (): Promise<PlanStatus> => (await api.get<ApiResponse<PlanStatus>>('/billing/subscription')).data.data!,
  checkout: async (r: CheckoutRequest): Promise<CheckoutOrder> =>
    (await api.post<ApiResponse<CheckoutOrder>>('/billing/checkout', r)).data.data!,
  checkDiscount: async (r: CheckoutRequest): Promise<DiscountCheck> =>
    (await api.post<ApiResponse<DiscountCheck>>('/billing/discount/check', r)).data.data!,
  usersQuote: async (seats: number): Promise<UsersQuote> =>
    (await api.post<ApiResponse<UsersQuote>>('/billing/users/quote', { seats })).data.data!,
  usersCheckout: async (seats: number): Promise<CheckoutOrder> =>
    (await api.post<ApiResponse<CheckoutOrder>>('/billing/users/checkout', { seats })).data.data!,
  /**
   * The plans on offer, for anyone (the pricing page, sign-up) — asked without the session, like Finvosmart's public
   * details (lib/platformInfo.ts): a visitor's old session is neither sent nor renewed by looking at the prices.
   */
  publicPlans: async (): Promise<PublicPlans> => {
    const res = await fetch(`${API_URL}/public/plans`, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const d = (await res.json())?.data
    if (!d || !Array.isArray(d.plans)) throw new Error('The plans could not be read.')
    return d as PublicPlans
  },
  /** Checkout's answer, checked on the server with Razorpay before the plan is switched on. */
  verify: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<PlanStatus> =>
    (await api.post<ApiResponse<PlanStatus>>('/billing/verify', r)).data.data!,
  payments: async (): Promise<SubscriptionPayment[]> => (await api.get<ApiResponse<SubscriptionPayment[]>>('/billing/payments')).data.data ?? [],
}

/** ₹ from paise, Indian grouping, 2 decimals. */
export const rupeesFromPaise = (p: number) =>
  '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
