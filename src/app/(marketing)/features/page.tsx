'use client'
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

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Users, DollarSign, FileText, ShoppingCart, Boxes,
  TrendingUp, FolderOpen, BarChart3, Settings, Shield, Activity,
  Brain, Zap, MessageCircle, Camera, Heart, RefreshCw, Mic,
  Building2, CreditCard, Globe, Package2, PenLine, ArrowRight
} from 'lucide-react'

const MODULES = [
  { icon: LayoutDashboard, color: '#E9C46A', name: 'Dashboard & Analytics',   desc: 'Live KPI cards, 9-month revenue vs expenses chart, CRM pipeline donut, pending approvals feed, low-stock alerts and AI summary from ARIS — all auto-refreshing every 30 seconds.' },
  { icon: Users,           color: '#2563EB', name: 'HRMS',                    desc: 'Employee directory with list/grid toggle, hashed-colour avatars. Attendance calendar heatmap (biometric/manual/WFH). Leave application workflow with auto balance deduction. Monthly payroll with payslip generation.' },
  { icon: DollarSign,      color: '#16A34A', name: 'Finance & Accounting',    desc: 'Full double-entry chart of accounts. Journal entries, payment vouchers, receipt vouchers, contra entries (debit = credit enforced). P&L, Balance Sheet and Trial Balance for any date range.' },
  { icon: FileText,        color: '#E9C46A', name: 'Invoicing & Quotations',  desc: 'TAX_INVOICE, PROFORMA, QUOTATION, CREDIT_NOTE, DEBIT_NOTE. GST auto-calculated per line (CGST+SGST or IGST based on customer state). WhatsApp delivery with UPI payment link. PDF download.' },
  { icon: ShoppingCart,    color: '#EA580C', name: 'Procurement',             desc: 'Purchase orders with multi-step approval workflow. Vendor management with GSTIN, PAN, credit terms. Goods Receipt Notes (full + partial). TDS auto-deduction on vendor payments.' },
  { icon: Boxes,           color: '#0D9488', name: 'Inventory Management',   desc: 'Item master with HSN, reorder level and pricing. Every IN/OUT/ADJUSTMENT tracked with running balance. Low-stock alerts on dashboard. Fixed assets register with depreciation.' },
  { icon: TrendingUp,      color: '#7C3AED', name: 'CRM — Leads & Customers', desc: '7-stage Kanban pipeline (NEW → WON/LOST). Drag or dropdown to advance stage — instant PATCH to backend. Customer directory with credit limits, GSTIN, outstanding balance and customer type.' },
  { icon: FolderOpen,      color: '#DB2777', name: 'Projects & Tasks',       desc: 'Project cards with client, start/end date, budget, progress and team members. Task assignment with due dates and status. Budget tracking integrated with Finance module.' },
  { icon: BarChart3,       color: '#2563EB', name: 'Reports & Analytics',    desc: 'Revenue by month (bar chart), top customers, expense breakdown by category, GST output/input summary, TDS liability, payroll cost trend. Download any report as Excel.' },
  { icon: Settings,        color: '#64748B', name: 'Settings & Administration', desc: 'Company profile, logo, GST details, financial year configuration. User management with 6 RBAC roles. Module enable/disable per plan. Branch management. Billing and subscription.' },
  { icon: Shield,          color: '#E9C46A', name: 'India Compliance Centre', desc: 'GST: all rates (0–28%), HSN/SAC, CGST/SGST/IGST auto-split, GSTR-1/3B data export. TDS: 194C/J/I/H sections, threshold checks, Form 26Q export. PAN/GSTIN validation on all parties.' },
  { icon: Activity,        color: '#EA580C', name: 'Workflow & Approvals',   desc: 'Configurable multi-step approval routing for leaves, POs, invoices and expense claims. Approval by role or individual. Email notification at each step. Full audit trail.' },
]

const AI_USPS = [
  { icon: Brain,          color: '#8B5CF6', num:'01', name:'ARIS — AI Cash Flow Oracle',   api:'/api/v1/ai/cashflow/forecast',    desc:'12-week rolling cash position forecast. Customer payment risk scoring (0–100). What-if scenario engine. 3–5 natural language AI recommendations per session. 91%+ accuracy.' },
  { icon: MessageCircle,  color: '#16A34A', num:'02', name:'WhatsApp Business Hub',        api:'/api/v1/whatsapp/invoices/send',   desc:'Send invoice + UPI deep-link to customer WhatsApp. Track SENT → DELIVERED → READ → PAID status. Full conversation thread. Employee expense claim submission via photo.' },
  { icon: Camera,         color: '#7C3AED', num:'03', name:'Smart Bill Scanner (OCR)',     api:'/api/v1/ai/scanner/scan',          desc:'Upload any receipt (JPG/PNG/PDF or WhatsApp forward). Extracts vendor, GSTIN, invoice #, date, line items, HSN, amounts with confidence scores. Duplicate detection. One-click post to books.' },
  { icon: Heart,          color: '#DB2777', num:'04', name:'Employee Wellness Monitor',   api:'/api/v1/ai/wellness/scores',       desc:'Weekly burnout risk score per employee from attendance, overtime, weekend work, leave rejection and pulse survey data. Department heat map. Anonymous WhatsApp survey.' },
  { icon: RefreshCw,      color: '#0D9488', num:'05', name:'GST Auto-Reconciler',         api:'/api/v1/gst/reconcile',            desc:'Fetch GSTR-2A from GSTN portal. Match against purchase register (amount ±1% tolerance, date ±45 days). Quantify ITC at risk. Generate mismatch report. Save 40+ hours/quarter.' },
  { icon: Mic,            color: '#EA580C', num:'06', name:'BharatVoice — Vernacular',    api:'/api/v1/voice/command',            desc:'5 Indian languages: Hindi, Tamil, Telugu, Kannada, Marathi. Whisper ASR + NLP intent parser. Commands: create invoice, check balance, mark attendance, send reminder, generate report.' },
]

const SMART_FEATURES = [
  { icon: Building2, color:'#2563EB', name:'Bank Reconciliation',    time:'14 hrs/month', desc:'Fuzzy-match 95%+ of bank transactions. Exact match (amount + date ±2 days), then Levenshtein similarity match. Supports SBI, HDFC, ICICI, Axis, Kotak, Yes Bank.' },
  { icon: CreditCard,color:'#16A34A', name:'Expense Claims',         time:'8 hrs/HR',     desc:'Employee WhatsApp photo → AWS Textract OCR → policy engine → auto-approve within 10 seconds. Configurable limits per category. Out-of-policy routes to manager.' },
  { icon: Globe,     color:'#7C3AED', name:'Client Self-Service Portal',time:'20 calls/mo',desc:'White-labelled portal at your subdomain. OTP login for customers. View/download invoices, pay via UPI, download statement, raise support tickets.' },
  { icon: RefreshCw, color:'#0D9488', name:'Recurring Billing',      time:'4 hrs/month',  desc:'MONTHLY / QUARTERLY / HALF_YEARLY / ANNUALLY / CUSTOM schedules. Auto-generate invoices at 6 AM on billing date. Pro-ration for mid-period starts/stops.' },
  { icon: DollarSign,color:'#B45309', name:'TDS Auto-Calculator',    time:'6 hrs/quarter',desc:'Section detection from vendor category. Threshold check (194C: ₹30K/₹1L, 194J: ₹30K). Challan due-date reminders. Form 26Q data export for filing.' },
  { icon: Package2,  color:'#DB2777', name:'Demand Forecasting AI',  time:'3 stockouts',  desc:'Per-SKU exponential smoothing on 12-month velocity. Seasonality index. Supplier lead time factored in. CRITICAL / WARNING / MODERATE / HEALTHY risk levels. Auto-generate draft POs.' },
  { icon: PenLine,   color:'#EA580C', name:'Aadhaar Digital Signing',time:'2 days/contract',desc:'IT Act 2000 / eSign Act 2015 compliant. Aadhaar OTP via empanelled ASP (eMudhra/Digio/SignDesk). Multi-party signing. Full timestamp + IP + masked Aadhaar audit trail.' },
  { icon: Activity,  color:'#64748B', name:'Smart Automation Rules', time:'28 hrs/month', desc:'No-code if-then engine. Triggers: INVOICE_OVERDUE, STOCK_BELOW_REORDER, LEAVE_SUBMITTED, PO_APPROVED. Actions: SEND_WHATSAPP, SEND_EMAIL, CREDIT_HOLD, CREATE_TASK. 30-min run cycle.' },
]

export default function FeaturesPage() {
  const [tab, setTab] = useState<'modules'|'ai'|'smart'>('modules')

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Complete Feature Set
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px,5vw,52px)', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
            14 Modules. 6 AI USPs. 8 Smart Tools.
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Every feature purpose-built for Indian businesses — not retrofitted from a Western product.
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
            {([['modules','14 Core Modules'],['ai','6 AI USPs'],['smart','8 Smart Tools']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '9px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 500, transition: 'all 0.2s', fontFamily: 'inherit',
                background: tab === key ? 'var(--btn-primary-bg)' : 'transparent',
                color: tab === key ? 'var(--text-on-gold)' : 'var(--text-secondary)',
              }}>{label}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

          {/* 14 Modules */}
          {tab === 'modules' && (
            <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {MODULES.map(m => (
                <div key={m.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', borderTop: `3px solid ${m.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                      <m.icon size={18} />
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</h3>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{m.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* 6 AI USPs */}
          {tab === 'ai' && (
            <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px' }}>
              {AI_USPS.map(u => (
                <div key={u.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '20px', right: '20px', fontFamily: "'Instrument Serif', serif", fontSize: '48px', color: `${u.color}10`, lineHeight: 1 }}>{u.num}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${u.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.color }}>
                      <u.icon size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '14px' }}>{u.desc}</p>
                  <div style={{ padding: '7px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Geist Mono, monospace', fontSize: '12px', color: 'var(--gold)' }}>
                    {u.api}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 8 Smart Tools */}
          {tab === 'smart' && (
            <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }}>
              {SMART_FEATURES.map(s => (
                <div key={s.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</h3>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', fontSize: '11px', color: 'var(--gold)', fontWeight: 500, whiteSpace: 'nowrap' }}>⚡ Saves ~{s.time}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '10px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '16px', boxShadow: 'var(--btn-primary-shadow)' }}>
              Start Free Trial — All Features Included <ArrowRight size={16} />
            </Link>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>14-day trial · No credit card · Full Growth plan access</p>
          </div>
        </div>
      </section>
    </div>
  )
}
