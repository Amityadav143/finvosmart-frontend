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

// On its own (no dependencies), so plain-TS checks can load it too.

/**
 * The plans bought online as the server starts with them (PlanRules.PLANS), for the sign-up page's "Subscribe now" when
 * the server's own list — the plans kept in the console, GET /public/plans — can't be had. Rupees a month, before GST:
 * billed monthly, and a month when billed yearly. A test keeps these the server's built-in plans (T507).
 */
export const SELF_SERVE_PLANS = [
  { code: 'STARTER', name: 'Starter', monthly: 4999, annualPerMonth: 3999, users: 'Up to 10 users, one branch' },
  { code: 'GROWTH', name: 'Growth', monthly: 12999, annualPerMonth: 10399, users: 'Up to 50 users, any branches' },
] as const

/** A plan bought online, as the sign-up shows it: paise a month before GST — for the company, or for each user on a per-user plan. */
export interface WebPlan { code: string; name: string; monthlyPaise: number; annualPerMonthPaise: number; users: string; perUser: boolean }

/** A plan's code (the console may add plans, so any code the server offers). */
export type SelfServePlan = string
export type BillingCycle = 'MONTHLY' | 'ANNUAL'
export const GST_PERCENT = 18

/** The built-in plans, as WebPlans. */
export const FALLBACK_PLANS: WebPlan[] = SELF_SERVE_PLANS.map(p => ({
  code: p.code, name: p.name, monthlyPaise: p.monthly * 100, annualPerMonthPaise: p.annualPerMonth * 100, users: p.users, perUser: false,
}))

/** Who a plan is for: "Up to 10 users, one branch", "Priced for each user (up to 200), any branches". */
export function usersLine(o: { pricing?: string | null; maxUsers?: number | null; maxBranches?: number | null }): string {
  const users = o.pricing === 'USER' ? `Priced for each user${o.maxUsers != null ? ` (up to ${o.maxUsers})` : ''}`
    : o.maxUsers == null ? 'Any number of users' : `Up to ${o.maxUsers} users`
  if (o.maxBranches === undefined) return users
  return `${users}, ${o.maxBranches == null ? 'any branches' : o.maxBranches === 1 ? 'one branch' : `up to ${o.maxBranches} branches`}`
}

/** The server's plans (GET /public/plans) as the sign-up shows them: those bought online, in the server's order. */
export function webPlans(offers: ReadonlyArray<{ code: string; name: string; selfServe: boolean; monthlyPaise: number; annualPerMonthPaise: number;
                                                 pricing?: string | null; maxUsers?: number | null; maxBranches?: number | null }>): WebPlan[] {
  return offers.filter(o => o.selfServe).map(o => ({
    code: o.code, name: o.name, monthlyPaise: o.monthlyPaise, annualPerMonthPaise: o.annualPerMonthPaise, users: usersLine(o), perUser: o.pricing === 'USER',
  }))
}

/** A plan code from a link (?plan=growth) that is one of the plans, or null. */
export function planFrom(s: string | null | undefined, plans: ReadonlyArray<{ code: string }> = FALLBACK_PLANS): SelfServePlan | null {
  const c = (s ?? '').trim().toUpperCase()
  return plans.find(p => p.code === c)?.code ?? null
}

/** A billing cycle from a link (?cycle=monthly), yearly unless it says monthly. */
export function cycleFrom(s: string | null | undefined): BillingCycle {
  return (s ?? '').trim().toUpperCase() === 'MONTHLY' ? 'MONTHLY' : 'ANNUAL'
}

/** "₹4,999", "₹499.50" — whole rupees without paise. */
export function inr(paise: number): string {
  const r = paise / 100
  return '₹' + (paise % 100 === 0 ? r.toLocaleString('en-IN') : r.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
}

/**
 * "₹10,399 a month, billed yearly (₹1,24,788 a year) + 18% GST"; on a per-user plan "₹399 a user a month, billed yearly
 * (₹4,788 a user a year — ₹23,940 for 5 users) + 18% GST".
 */
export function priceLine(p: WebPlan, cycle: BillingCycle, users = 1): string {
  const each = p.perUser ? ' a user' : ''
  const year = p.annualPerMonthPaise * 12
  const many = p.perUser && users > 1 ? ` — ${inr((cycle === 'ANNUAL' ? year : p.monthlyPaise) * users)} for ${users} users` : ''
  return cycle === 'ANNUAL'
    ? `${inr(p.annualPerMonthPaise)}${each} a month, billed yearly (${inr(year)}${each} a year${many}) + ${GST_PERCENT}% GST`
    : `${inr(p.monthlyPaise)}${each} a month, billed monthly${many} + ${GST_PERCENT}% GST`
}

/**
 * Where a new company pays for the plan it chose at sign-up: Settings → Subscription opens Razorpay for it — with the
 * discount code it was given (checked there by the server) and, on a per-user plan, the users to pay for.
 */
export function checkoutHref(code: SelfServePlan, cycle: BillingCycle, more: { discount?: string | null; users?: number | null } = {}): string {
  const extra = (more.discount ? `&code=${encodeURIComponent(more.discount)}` : '') + (more.users && more.users > 1 ? `&users=${more.users}` : '')
  return `/settings/subscription?plan=${code}&cycle=${cycle}&checkout=1` + extra
}
