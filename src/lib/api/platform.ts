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
import type { PlanStatus } from './billing'
import type { ApiResponse } from '@/types'

/** The platform console's API (platform/controller/PlatformController): for Finvosmart's own administrators only. */

export type CompanyAccess = 'FULL' | 'TRIAL' | 'READ_ONLY'
export type CompanyFilter = 'TRIAL' | 'ENDING' | 'READ_ONLY' | 'PAID' | 'LEGACY' | 'SUSPENDED'

export interface CompanyRow {
  id: string; name: string; legalName?: string; companyCode?: string; gstin?: string; city?: string; state?: string
  email?: string; phone?: string; createdAt?: string
  /** how the company is set up: TRIAL, PAID or LEGACY (full access) */
  status: string
  /** what it may do now */
  access: CompanyAccess
  plan?: string; billingCycle?: string; trialEndsAt?: string; trialDaysLeft?: number; paidUntil?: string
  active: boolean; suspendedAt?: string
  users: number; invoices: number; lastSignIn?: string
  /** the company that runs Finvosmart */
  platform: boolean
}

export interface CompanyPage { items: CompanyRow[]; total: number; page: number; size: number; filter?: string; search?: string }

export interface PlatformCounts {
  companies: number; onTrial: number; trialEndingSoon: number; readOnly: number; paid: number; fullAccess: number; suspended: number
  newLast7Days: number; newLast30Days: number; activeUsers: number; paymentsLast30Days: number; paidLast30DaysPaise: number
}

export interface PlatformSetup {
  emailReady: boolean; emailServer?: string; emailFrom?: string
  paymentsReady: boolean; paymentsMode?: 'LIVE' | 'TEST'; webhookReady: boolean
  googleReady: boolean; whatsappReady: boolean; signupsOpen: boolean; noticeShown: boolean; encryptionReady: boolean
}

/** A login of the platform company. console: it can open the console; you: the person signed in. */
export interface ConsoleLogin { id: string; fullName?: string; email: string; active: boolean; lastSignIn?: string; console: boolean; you: boolean }
/** The platform company and its logins: who can open the console, and who could be given access. */
export interface ConsoleAdmins { companyId?: string; companyName?: string; companyFound: boolean; admins: ConsoleLogin[]; others: ConsoleLogin[] }

export interface LoginCounts { all: number; locked: number; switchedOff: number; neverSignedIn: number }
export interface LeadCounts { waiting: number; last7Days: number; all: number }
export interface PaymentTotals {
  paidCount: number; paidPaise: number; monthCount: number; monthPaise: number; last30Count: number; last30Paise: number; failedLast30: number
}

export interface PlatformOverview {
  counts: PlatformCounts; recent: CompanyRow[]; setup: PlatformSetup; version: string
  /** the logins that can open the console */
  consoleAdmins: ConsoleLogin[]
  logins: LoginCounts; enquiries: LeadCounts; payments: PaymentTotals
}

export type LoginFilter = 'LOCKED' | 'OFF' | 'NEVER' | 'ADMINS'
/** A login of some company — never its password or codes. console: it can open the platform console. */
export interface LoginRow {
  id: string; fullName?: string; email: string; phone?: string; roles: string[]; active: boolean; locked: boolean; lockedUntil?: string
  failedAttempts: number; twoStep: boolean; google: boolean; lastSignIn?: string; createdAt?: string
  companyId: string; companyName: string; companyCode?: string; companyActive: boolean; console: boolean
}
export interface LoginPage { items: LoginRow[]; total: number; page: number; size: number; filter?: string; search?: string; counts: LoginCounts }

export type PaymentFilter = 'PAID' | 'FAILED' | 'CREATED'
export interface PaymentRow {
  id: string; companyId: string; companyName: string; companyCode?: string; plan: string; billingCycle: string
  basePaise: number; gstPaise: number; amountPaise: number; status: string; orderId?: string; paymentId?: string
  periodStart?: string; periodEnd?: string; createdAt?: string; paidAt?: string; failureReason?: string
}
export interface PaymentPage { items: PaymentRow[]; total: number; page: number; size: number; filter?: string; search?: string; totals: PaymentTotals }

export type LeadFilter = 'NEW' | 'HANDLED'
/** An enquiry from the website's contact form. */
export interface LeadRow {
  id: string; name: string; email: string; phone?: string; company: string; companySize?: string; plan?: string; message?: string
  sourcePage?: string; receivedAt?: string; handledAt?: string; handledBy?: string; handledNote?: string
}
export interface LeadPage { items: LeadRow[]; total: number; page: number; size: number; filter?: string; search?: string; counts: LeadCounts }

export type ActivityKind = 'SUPPORT' | 'SETTINGS' | 'ADMINS' | 'LEADS'
/** One thing support or the console did. what: in words; details: the audit entry's JSON. */
export interface ActivityRow { action: string; what: string; details?: string; at?: string; byName?: string; byEmail?: string; companyId?: string; companyName?: string }
export interface ActivityPage { items: ActivityRow[]; total: number; page: number; size: number; kind?: string }

export interface CompanyProfile {
  id: string; name: string; legalName?: string; companyCode?: string; gstin?: string; pan?: string; cin?: string
  email?: string; phone?: string; website?: string; address?: string; city?: string; state?: string; pincode?: string
  businessSectors?: string; createdAt?: string
  active: boolean; suspendedAt?: string; suspendedReason?: string; platform: boolean
}

export interface CompanyUser {
  id: string; fullName?: string; email?: string; phone?: string; roles: string[]
  active: boolean; locked: boolean; lockedUntil?: string; failedAttempts: number
  twoStep: boolean; hasPassword: boolean; google: boolean; lastSignIn?: string; createdAt?: string
  /** it can open the platform console (a Super Admin of the platform company) */
  console: boolean
}

export interface PlanPayment {
  id: string; plan: string; billingCycle: string; basePaise: number; gstPaise: number; amountPaise: number; status: string
  orderId?: string; paymentId?: string; periodStart?: string; periodEnd?: string; createdAt?: string; paidAt?: string; failureReason?: string
}

export interface PlanEvent { event: string; details?: string; actorName?: string; at?: string }
export interface SupportEntry { action: string; details?: string; byName?: string; at?: string }
export interface CompanyUsage { invoices: number; customers: number; suppliers: number; employees: number; lastInvoiceAt?: string }

export interface CompanyDetail {
  profile: CompanyProfile
  plan: PlanStatus
  payments: PlanPayment[]
  history: PlanEvent[]
  users: CompanyUser[]
  usage: CompanyUsage
  support: SupportEntry[]
}

export interface CompanyDetailsForm {
  name: string; legalName: string; email: string; phone: string; website: string
  address: string; city: string; state: string; pincode: string
}

export type SettingKind = 'TEXT' | 'LONG_TEXT' | 'EMAIL' | 'PHONE' | 'HOST' | 'PORT' | 'CHOICE' | 'SECRET' | 'SWITCH' | 'DATE'
export type SettingSource = 'SAVED' | 'ENVIRONMENT' | 'DEFAULT' | 'NOT_SET'

/** A setting as the console shows it — a secret only ever as "••••1234" or "••••••••". */
export interface PlatformSetting {
  key: string; label: string; kind: SettingKind; max: number; choices: string[]; hint?: string
  secret: boolean
  /** shown on the website and in emails (contact details, sign-ups, the notice) */
  shownOnWebsite: boolean
  /** what is saved here (masked for a secret) */
  saved?: string; savedHere: boolean
  /** a secret saved with another APP_ENCRYPTION_KEY: the environment's value applies until it is entered again */
  unreadable: boolean
  /** the server environment's value (masked for a secret), and the variable it comes from */
  environment?: string; envVar?: string
  defaultValue?: string
  /** the value in force (masked for a secret), and where it comes from */
  value?: string; source: SettingSource
  updatedAt?: string; updatedBy?: string
}

export interface PlatformGroup { id: string; label: string; description: string; settings: PlatformSetting[] }
export interface PlatformSettingsView { groups: PlatformGroup[]; setup: PlatformSetup; webhookUrl: string; baseUrl: string }

/** The answer's data — every call here answers with it (an error answer throws first). */
function need<T>(r: { data: ApiResponse<T> }): T {
  if (r.data.data === undefined || r.data.data === null) throw new Error(r.data.message || 'The server sent no answer.')
  return r.data.data
}

export interface ActionResult { result: string }

export const platformApi = {
  overview: async () => need(await api.get<ApiResponse<PlatformOverview>>('/platform/overview')),
  companies: async (q: string, filter: string, page: number) =>
    need(await api.get<ApiResponse<CompanyPage>>('/platform/companies', { params: { q: q || undefined, filter: filter || undefined, page } })),
  company: async (id: string) => need(await api.get<ApiResponse<CompanyDetail>>(`/platform/companies/${id}`)),
  saveDetails: async (id: string, body: CompanyDetailsForm) =>
    need(await api.put<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/details`, body)),
  suspend: async (id: string, reason: string) => need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/suspend`, { reason })),
  reactivate: async (id: string, note: string) => need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/reactivate`, { note })),
  extendTrial: async (id: string, days: number, note: string) =>
    need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/extend-trial`, { days, note })),
  setPlan: async (id: string, body: { mode: 'PAID' | 'FULL'; plan?: string; billingCycle?: string; paidUntil?: string; note: string }) =>
    need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/plan`, body)),
  resetLink: async (id: string, userId: string) =>
    need(await api.post<ApiResponse<ActionResult>>(`/platform/companies/${id}/users/${userId}/reset-link`)).result,
  unlock: async (id: string, userId: string) => need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/users/${userId}/unlock`)),
  switchOff: async (id: string, userId: string, note: string) =>
    need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/users/${userId}/switch-off`, { note })),
  switchOn: async (id: string, userId: string, note: string) =>
    need(await api.post<ApiResponse<CompanyDetail>>(`/platform/companies/${id}/users/${userId}/switch-on`, { note })),
  logins: async (q: string, filter: string, page: number) =>
    need(await api.get<ApiResponse<LoginPage>>('/platform/users', { params: { q: q || undefined, filter: filter || undefined, page } })),
  payments: async (q: string, filter: string, page: number) =>
    need(await api.get<ApiResponse<PaymentPage>>('/platform/payments', { params: { q: q || undefined, filter: filter || undefined, page } })),
  leads: async (q: string, filter: string, page: number) =>
    need(await api.get<ApiResponse<LeadPage>>('/platform/leads', { params: { q: q || undefined, filter: filter || undefined, page } })),
  leadHandled: async (id: string, note: string) => need(await api.post<ApiResponse<ActionResult>>(`/platform/leads/${id}/handled`, { note })).result,
  leadReopen: async (id: string) => need(await api.post<ApiResponse<ActionResult>>(`/platform/leads/${id}/reopen`)).result,
  activity: async (kind: string, page: number) =>
    need(await api.get<ApiResponse<ActivityPage>>('/platform/activity', { params: { kind: kind || undefined, page } })),
  admins: async () => need(await api.get<ApiResponse<ConsoleAdmins>>('/platform/admins')),
  addAdmin: async (userId: string) => need(await api.post<ApiResponse<ConsoleAdmins>>('/platform/admins', { userId })),
  removeAdmin: async (userId: string) => need(await api.post<ApiResponse<ConsoleAdmins>>(`/platform/admins/${userId}/remove`)),
  settings: async () => need(await api.get<ApiResponse<PlatformSettingsView>>('/platform/settings')),
  saveSettings: async (values: Record<string, string>, clear: string[]) =>
    need(await api.put<ApiResponse<PlatformSettingsView>>('/platform/settings', { values, clear })),
  testEmail: async (to: string, values: Record<string, string>) =>
    need(await api.post<ApiResponse<ActionResult>>('/platform/settings/test-email', { to, values })).result,
  testRazorpay: async (values: Record<string, string>) =>
    need(await api.post<ApiResponse<ActionResult>>('/platform/settings/test-razorpay', { values })).result,
  testWhatsApp: async (values: Record<string, string>) =>
    need(await api.post<ApiResponse<ActionResult>>('/platform/settings/test-whatsapp', { values })).result,
}

/** What "access" means, in words. */
export function accessLabel(row: { access: CompanyAccess; status: string; active: boolean }): { text: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'default' } {
  if (!row.active) return { text: 'Suspended', tone: 'danger' }
  if (row.access === 'TRIAL') return { text: 'On trial', tone: 'info' }
  if (row.access === 'READ_ONLY') return { text: 'Read-only', tone: 'warning' }
  return row.status === 'LEGACY' ? { text: 'Full access', tone: 'default' } : { text: 'Paid', tone: 'success' }
}

export const FILTERS: { value: '' | CompanyFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'TRIAL', label: 'On trial' },
  { value: 'ENDING', label: 'Trial ends in 3 days' },
  { value: 'READ_ONLY', label: 'Read-only' },
  { value: 'PAID', label: 'Paid' },
  { value: 'LEGACY', label: 'Full access' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

export const PLAN_NAMES: Record<string, string> = { STARTER: 'Starter', GROWTH: 'Growth', ENTERPRISE: 'Enterprise' }

/** "Asia/Kolkata" dates for the console: "4 Nov 2026" and "4 Nov 2026, 7:02 pm". */
export function day(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function moment(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

/** The last day an end moment covers ("10 Nov 2026" for midnight starting 11 November, India time). */
export function lastDayOf(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : day(new Date(d.getTime() - 1000).toISOString())
}

/** "{"days":5,"note":"…"}" → "days 5 · note …": an audit entry's details, readable. */
export function readableDetails(details?: string | null): string {
  if (!details) return ''
  try {
    const o = JSON.parse(details)
    if (o && typeof o === 'object') return Object.entries(o).filter(([, v]) => v !== null && v !== '').map(([k, v]) => `${k} ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ')
  } catch { /* not JSON: as it is */ }
  return details
}

/** A role's code in words ("COMPANY_ADMIN" → "Company admin"). */
export function roleWords(role: string): string {
  const s = role.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}
