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

import { api } from './client'
import type { PlanModule, CustomQuote } from '@/types'

// ── Synchronous quote calculation (primary path) ──────────────────────────────
export function calculateQuote(selectedKeys: string[], users: number): CustomQuote {
  const selected = STATIC_MODULES.filter(m => selectedKeys.includes(m.module_key) && !m.is_core)
  const breakdown = selected.map(m => {
    const lineTotal = m.base_price_month + m.price_per_user * users
    return {
      moduleKey: m.module_key,
      displayName: m.display_name,
      basePrice: m.base_price_month,
      perUserPrice: m.price_per_user,
      lineTotal,
    }
  })
  const monthlyTotal = breakdown.reduce((s, b) => s + b.lineTotal, 0)
  const annualTotal  = Math.round(monthlyTotal * 12 * 0.80)
  return {
    monthlyTotal: Math.round(monthlyTotal),
    annualTotal,
    annualMonthly: Math.round(annualTotal / 12),
    users,
    savingsIfAnnual: Math.round(monthlyTotal * 12 - annualTotal),
    breakdown,
  }
}

// ── Async API calls (for future server-side validation) ───────────────────────
export const planModulesApi = {
  getAll: async (): Promise<PlanModule[]> => {
    try {
      const res = await api.get<{ data: PlanModule[] }>('/plan-modules')
      return res.data.data
    } catch {
      return STATIC_MODULES
    }
  },

  getQuote: async (modules: string[], users: number): Promise<CustomQuote> => {
    try {
      const res = await api.post<{ data: CustomQuote }>('/plan-modules/quote', { modules, users })
      return res.data.data
    } catch {
      return calculateQuote(modules, users)
    }
  },
}

// ── Static module catalog (mirrors DB seed, used for synchronous calculation) ─
export const STATIC_MODULES: PlanModule[] = [
  { module_key:'CORE',         display_name:'Core Platform',          description:'Dashboard, Settings, User Management, Multi-tenant auth',                   category:'CORE',  base_price_month:0,    price_per_user:0,   min_users:1, is_core:true,  sort_order:1,  icon_name:'LayoutDashboard', accent_color:'#E9C46A' },
  { module_key:'HRMS',         display_name:'HRMS',                   description:'Employees, Attendance, Leave Management, Payroll Processing',               category:'ERP',   base_price_month:2499, price_per_user:99,  min_users:1, is_core:false, sort_order:2,  icon_name:'Users',           accent_color:'#2563EB' },
  { module_key:'FINANCE',      display_name:'Finance & Accounting',   description:'Double-entry, P&L, Balance Sheet, Trial Balance, Journal Entries',          category:'ERP',   base_price_month:1999, price_per_user:0,   min_users:1, is_core:false, sort_order:3,  icon_name:'DollarSign',      accent_color:'#16A34A' },
  { module_key:'INVOICING',    display_name:'Invoicing & GST',        description:'Tax Invoices, Quotations, Credit Notes, GST auto-calculation',              category:'ERP',   base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:4,  icon_name:'FileText',        accent_color:'#E9C46A' },
  { module_key:'PROCUREMENT',  display_name:'Procurement',            description:'Purchase Orders, GRN, Vendor Management, TDS deduction',                    category:'ERP',   base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:5,  icon_name:'ShoppingCart',    accent_color:'#EA580C' },
  { module_key:'INVENTORY',    display_name:'Inventory',              description:'Item master, Stock tracking, Low-stock alerts, Fixed assets',               category:'ERP',   base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:6,  icon_name:'Boxes',           accent_color:'#0D9488' },
  { module_key:'CRM',          display_name:'CRM',                    description:'Kanban pipeline, Customer directory, Win-rate analytics',                   category:'ERP',   base_price_month:1499, price_per_user:49,  min_users:1, is_core:false, sort_order:7,  icon_name:'TrendingUp',      accent_color:'#7C3AED' },
  { module_key:'PROJECTS',     display_name:'Projects',               description:'Project cards, Task management, Budget tracking',                           category:'ERP',   base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:8,  icon_name:'FolderOpen',      accent_color:'#DB2777' },
  { module_key:'REPORTS',      display_name:'Analytics',              description:'Advanced reports, 5 chart types, custom dashboards',                        category:'ERP',   base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:9,  icon_name:'BarChart3',       accent_color:'#2563EB' },
  { module_key:'AI_CASHFLOW',  display_name:'ARIS — Cash Flow AI',    description:'90-day ML cash forecast, customer risk scoring, AI insights',               category:'AI',    base_price_month:2999, price_per_user:0,   min_users:1, is_core:false, sort_order:10, icon_name:'Brain',           accent_color:'#8B5CF6' },
  { module_key:'WHATSAPP',     display_name:'WhatsApp Hub',           description:'Invoice delivery + UPI link, read receipts, employee expense claims',       category:'AI',    base_price_month:1999, price_per_user:0,   min_users:1, is_core:false, sort_order:11, icon_name:'MessageCircle',   accent_color:'#16A34A' },
  { module_key:'BILL_SCANNER', display_name:'Smart Bill Scanner',     description:'OCR receipt processing, auto journal entry, duplicate detection',           category:'AI',    base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:12, icon_name:'Camera',          accent_color:'#7C3AED' },
  { module_key:'WELLNESS',     display_name:'Wellness AI',            description:'Employee burnout risk, department heat map, pulse surveys',                 category:'AI',    base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:13, icon_name:'Heart',           accent_color:'#DB2777' },
  { module_key:'GST_RECON',    display_name:'GST Reconciler',         description:'1-click GSTR-2A fetch+match, ITC optimisation, mismatch report',           category:'AI',    base_price_month:1999, price_per_user:0,   min_users:1, is_core:false, sort_order:14, icon_name:'RefreshCw',       accent_color:'#0D9488' },
  { module_key:'VOICE',        display_name:'BharatVoice',            description:'Vernacular voice commands in 5 Indian languages via Whisper AI',            category:'AI',    base_price_month:2000, price_per_user:0,   min_users:1, is_core:false, sort_order:15, icon_name:'Mic',             accent_color:'#EA580C' },
  { module_key:'BANK_RECON',   display_name:'Bank Reconciliation',    description:'Auto-match 95%+ bank transactions, 8 major Indian banks supported',        category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:16, icon_name:'Building2',       accent_color:'#2563EB' },
  { module_key:'EXPENSE',      display_name:'Expense Claims',         description:'WhatsApp OCR expense submission, policy engine, auto-approval',             category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:17, icon_name:'CreditCard',      accent_color:'#16A34A' },
  { module_key:'PORTAL',       display_name:'Client Portal',          description:'Self-service portal: invoices, UPI pay, disputes, statements',              category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:18, icon_name:'Globe',           accent_color:'#7C3AED' },
  { module_key:'SUBSCRIPTIONS',display_name:'Recurring Billing',      description:'Auto-generate invoices on schedule, WhatsApp delivery',                    category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:19, icon_name:'RefreshCw',       accent_color:'#0D9488' },
  { module_key:'TDS',          display_name:'TDS Tracker',            description:'Section detection (194C/J/I), Form 26Q export, challan due-date alerts',   category:'SMART', base_price_month:799,  price_per_user:0,   min_users:1, is_core:false, sort_order:20, icon_name:'DollarSign',      accent_color:'#B45309' },
  { module_key:'FORECAST',     display_name:'Demand Forecasting',     description:'AI stockout prediction, auto-generate draft purchase orders',              category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:21, icon_name:'Package2',        accent_color:'#DB2777' },
  { module_key:'ESIGN',        display_name:'Aadhaar eSign',          description:'IT Act 2000 compliant digital signing, multi-party, audit trail',          category:'SMART', base_price_month:1499, price_per_user:0,   min_users:1, is_core:false, sort_order:22, icon_name:'PenLine',         accent_color:'#EA580C' },
  { module_key:'AUTOMATIONS',  display_name:'Smart Automations',      description:'No-code if-then rules engine, 30-minute execution cycle',                  category:'SMART', base_price_month:999,  price_per_user:0,   min_users:1, is_core:false, sort_order:23, icon_name:'Activity',        accent_color:'#64748B' },
]

export const CATEGORY_LABELS: Record<string, string> = {
  CORE:  'Core (Always Free)',
  ERP:   'ERP Modules',
  AI:    'AI Features',
  SMART: 'Smart Tools',
}
