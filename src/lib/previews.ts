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

/**
 * Features that still run on demo data (the AI pages, expense claims, client portal, recurring
 * billing, demand forecast, e-signing, automations, timesheets, goods receipts, fixed assets, module and
 * approval-workflow settings, marketplace and API keys) are
 * switched off unless NEXT_PUBLIC_PREVIEW_FEATURES=true — for a sales demo only, together with
 * PREVIEW_FEATURES=true on the server. Off, they are out of the menu, the search and the API.
 */
export const PREVIEWS_ON = process.env.NEXT_PUBLIC_PREVIEW_FEATURES === 'true'

export type PreviewFeature =
  | 'ai-cfo' | 'health-score' | 'fraud' | 'cashflow' | 'wellness' | 'bill-scanner'
  | 'expense-claims' | 'client-portal' | 'recurring-billing' | 'esign' | 'automations' | 'timesheets'
  | 'integrations' | 'fixed-assets' | 'module-settings' | 'approval-workflows'

/** Route prefixes (without the leading slash) of preview features: the route and everything under it. */
const PREVIEW_ROUTES = ['ai', 'expense-claims', 'client-portal', 'subscriptions', 'esign', 'automations', 'timesheet', 'marketplace',
  'inventory/assets', 'assets', 'settings/modules', 'settings/workflow']

export function isPreviewRoute(href: string): boolean {
  const path = href.split(/[?#]/)[0]
  return PREVIEW_ROUTES.some(r => path === `/${r}` || path.startsWith(`/${r}/`))
}

/** Whether a link should be shown: real features always, preview ones only when previews are on. */
export function shown(href: string): boolean {
  return PREVIEWS_ON || !isPreviewRoute(href)
}

/** What each preview is called, and where the real thing lives meanwhile. */
export const PREVIEW_INFO: Record<PreviewFeature, { name: string; instead?: { label: string; href: string; why: string } }> = {
  'ai-cfo': { name: 'AI CFO', instead: { label: 'Open the dashboard', href: '/dashboard', why: 'The dashboard shows what customers owe you, what you owe, cash, GST due and payroll — from your own books.' } },
  'health-score': { name: 'Health Score', instead: { label: 'Open the dashboard', href: '/dashboard', why: 'The dashboard shows receivables, payables, cash and GST from your own books.' } },
  'fraud': { name: 'Fraud Detection', instead: { label: 'Open the audit log', href: '/settings/audit-log', why: 'The audit log records every change to invoices, bills, payments and payroll, with who made it.' } },
  'cashflow': { name: 'Cash Flow Oracle', instead: { label: 'Open the cash-flow forecast', href: '/cash-flow', why: 'The 13-week forecast works out cash week by week from your books — open invoices as late as each customer usually pays, supplier bills, salaries and taxes — and names the week it would run short.' } },
  'wellness': { name: 'Wellness AI' },
  'bill-scanner': { name: 'Bill Scanner', instead: { label: 'Record an expense', href: '/purchases/bills/new?type=EXPENSE', why: 'Bills and receipts are read as you record them: under Record expense or New bill, upload the PDF or a photo, and the number, date, supplier, GST and total are filled in for you to check.' } },
  'expense-claims': { name: 'Expense Claims', instead: { label: 'Record an expense', href: '/purchases/bills/new?type=EXPENSE', why: 'Spends paid on the spot can be recorded as expenses, with GST and TDS worked out.' } },
  'client-portal': { name: 'Client Portal', instead: { label: 'Go to invoices', href: '/invoicing', why: 'Every issued invoice already has a view-and-pay link your customer can open without logging in.' } },
  'recurring-billing': { name: 'Recurring Billing', instead: { label: 'Go to invoices', href: '/invoicing', why: 'To bill a customer again, open an invoice and use Duplicate.' } },
  'esign': { name: 'Digital Signing' },
  'automations': { name: 'Automations', instead: { label: 'Email alert settings', href: '/settings/email', why: 'Payment reminders and alerts are set up under Email Alerts.' } },
  'timesheets': { name: 'Timesheets', instead: { label: 'Open attendance', href: '/hrms/attendance', why: 'Attendance records who worked on which day, and feeds payroll.' } },
  'fixed-assets': { name: 'Fixed Assets', instead: { label: 'Open journal entries', href: '/finance/vouchers', why: 'Until the asset register posts to your books, record asset purchases and depreciation as journal entries.' } },
  'module-settings': { name: 'Module Settings', instead: { label: 'Roles and permissions', href: '/settings/roles', why: 'What each person sees in the app is decided by their role.' } },
  'approval-workflows': { name: 'Approval Workflows', instead: { label: 'Roles and permissions', href: '/settings/roles', why: 'Approvals happen where the document is — purchase orders, leave and payroll runs each have their own approve permission, given through roles.' } },
  'integrations': { name: 'Marketplace and API keys', instead: { label: 'Read the API reference', href: '/developers', why: 'Your own software can already use the API: sign in with a user account to get an access token. Every endpoint is listed in the API reference.' } },
}
