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
import { CheckCircle, X, ArrowRight } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter', monthly: '4,999', annual: '3,999',
    users: 'Up to 10 users', branches: '1 branch', featured: false,
    cta: 'Start Free Trial', ctaHref: '/register&plan=starter',
    feats: [
      'Core ERP modules (Dashboard, Finance, Invoicing)',
      'HRMS — Employees, Attendance, Leave, Payroll',
      'CRM — Leads & Customer management',
      'Procurement — PO, GRN, Vendor management',
      'Inventory — Stock tracking, Low-stock alerts',
      'India GST auto-calculation on all invoices',
      'Standard email support',
      '1 company branch / GST registration',
    ],
  },
  {
    name: 'Growth', monthly: '12,999', annual: '10,399',
    users: 'Up to 50 users', branches: 'Multi-branch', featured: true,
    cta: 'Start Free Trial', ctaHref: '/register&plan=growth',
    feats: [
      'Everything in Starter',
      'ARIS — AI Cash Flow Oracle (90-day forecast)',
      'WhatsApp Business Hub — invoice delivery + UPI',
      'GST Auto-Reconciler — 1-click GSTR-2A match',
      'Smart Bill Scanner — OCR receipt processing',
      'Bank Reconciliation — 95%+ auto-match',
      'Employee Wellness AI — burnout risk scoring',
      'Multi-branch support (unlimited branches)',
      'Client Self-Service Portal',
      'Recurring / Subscription Billing',
      'TDS Auto-Calculator (194C/J/I)',
      'Demand Forecasting AI',
      'Priority support (4hr response)',
    ],
  },
  {
    name: 'Enterprise', monthly: '29,999', annual: '23,999',
    users: 'Unlimited users', branches: 'Unlimited branches', featured: false,
    cta: 'Contact Sales', ctaHref: '/contact',
    feats: [
      'Everything in Growth',
      'All 14 ERP modules (full suite)',
      'BharatVoice — 5 Indian language commands',
      'Aadhaar Digital Signing (IT Act 2000)',
      'Smart Automation Rules Engine',
      'Custom workflow configurations',
      'White-labelling & custom domain',
      'Dedicated Account Manager',
      'SLA guarantee (99.9% uptime)',
      'Source code delivery option',
      'On-premise / self-hosted deployment',
      'Custom integration support',
    ],
  },
]

const COMPARE_ROWS = [
  { feature: 'Users',             starter: '10',          growth: '50',            enterprise: 'Unlimited' },
  { feature: 'Branches',          starter: '1',           growth: 'Unlimited',      enterprise: 'Unlimited' },
  { feature: 'Core ERP modules',  starter: true,          growth: true,             enterprise: true },
  { feature: 'HRMS + Payroll',    starter: true,          growth: true,             enterprise: true },
  { feature: 'India GST native',  starter: true,          growth: true,             enterprise: true },
  { feature: 'AI Cash Flow (ARIS)',starter: false,         growth: true,             enterprise: true },
  { feature: 'WhatsApp Hub',      starter: false,         growth: true,             enterprise: true },
  { feature: 'GST Reconciler',    starter: false,         growth: true,             enterprise: true },
  { feature: 'Bill Scanner OCR',  starter: false,         growth: true,             enterprise: true },
  { feature: 'Bank Reconciliation',starter: false,        growth: true,             enterprise: true },
  { feature: 'Wellness AI',       starter: false,         growth: true,             enterprise: true },
  { feature: 'BharatVoice',       starter: false,         growth: false,            enterprise: true },
  { feature: 'Aadhaar eSign',     starter: false,         growth: false,            enterprise: true },
  { feature: 'Automations Engine',starter: false,         growth: false,            enterprise: true },
  { feature: 'White-labelling',   starter: false,         growth: false,            enterprise: true },
  { feature: 'SLA guarantee',     starter: false,         growth: false,            enterprise: true },
  { feature: 'Support',           starter: 'Email',       growth: 'Priority (4hr)', enterprise: 'Dedicated AM' },
]

function Cell({ val }: { val: string | boolean }) {
  if (val === true)  return <CheckCircle size={16} color="#22C55E" />
  if (val === false) return <X size={15} color="var(--text-muted)" />
  return <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{val}</span>
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Transparent Pricing
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 5vw, 52px)', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
            Simple Plans. No Surprises.
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            All plans include full source of truth, unlimited transaction history, and India compliance built in.
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: !annual ? 500 : 400, color: !annual ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Monthly</span>
            <div onClick={() => setAnnual(v => !v)} style={{ width: '48px', height: '26px', borderRadius: '13px', background: annual ? 'var(--gold)' : 'var(--bg-card)', border: '1px solid var(--border-strong)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: annual ? '25px' : '3px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontWeight: annual ? 500 : 400, color: annual ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Annual</span>
            <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '12px', color: '#22C55E', fontWeight: 500 }}>Save 20%</span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: '64px 0', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', alignItems: 'start' }}>
            {PLANS.map(p => (
              <div key={p.name} style={{
                background: 'var(--bg-card)', border: p.featured ? '2px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '20px', padding: '32px', position: 'relative',
                transform: p.featured ? 'scale(1.02)' : 'none',
                boxShadow: p.featured ? 'var(--shadow-gold)' : 'var(--shadow-card)',
              }}>
                {p.featured && (
                  <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', padding: '5px 20px', borderRadius: '20px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>MOST POPULAR</div>
                )}
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '22px', color: p.featured ? 'var(--gold)' : 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{p.users} · {p.branches}</div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '44px', color: p.featured ? 'var(--gold)' : 'var(--text-primary)' }}>₹{annual ? p.annual : p.monthly}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>/month</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>+ 18% GST</div>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {p.feats.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={15} style={{ color: '#22C55E', flexShrink: 0, marginTop: '2px' }} />{f}
                    </div>
                  ))}
                </div>
                <Link href={p.ctaHref} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px', borderRadius: '10px', textDecoration: 'none',
                  fontWeight: 600, fontSize: '15px', transition: 'opacity 0.2s',
                  background: p.featured ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                  color: p.featured ? 'var(--text-on-gold)' : 'var(--text-primary)',
                  border: p.featured ? 'none' : '1px solid var(--border-strong)',
                }}>{p.cta} <ArrowRight size={15} /></Link>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          <div style={{ marginTop: '56px', padding: '28px 32px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Add-ons — Available on All Plans</div>
            <div className="auto-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
              {[['BharatVoice (live)','₹2,000/mo','Vernacular voice commands in 5 Indian languages'],['Extra Branch','₹1,500/mo','Additional GST branch registration and data isolation'],['Custom Integration','₹5,000/mo','API integration with third-party tools or legacy systems'],['Onboarding + Training','₹15,000 one-time','Data migration, setup & video training for up to 20 users']].map(([n,p,d]) => (
                <div key={n} style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{n}</div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: 'var(--gold)', marginBottom: '6px' }}>{p}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ padding: '0 0 80px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '36px' }}>Full Feature Comparison</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>Feature</th>
                  {['Starter','Growth','Enterprise'].map((h,i) => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: i===1 ? 'var(--gold)' : 'var(--text-primary)', background: i===1 ? 'var(--gold-muted)' : 'var(--bg-card)', width: '180px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)' }}>
                    <td style={{ padding: '11px 20px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>{row.feature}</td>
                    {(['starter','growth','enterprise'] as const).map(k => (
                      <td key={k} style={{ padding: '11px 20px', textAlign: 'center', background: k==='growth' ? 'rgba(233,196,106,0.03)' : undefined }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}><Cell val={row[k]} /></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
