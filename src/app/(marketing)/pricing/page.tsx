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

import Link from 'next/link'
import { CheckCircle, X, ArrowRight, Clock } from 'lucide-react'
import { SoonBadge } from '@/components/marketing/SoonBadge'

/** A plan feature that is still being built starts with this marker: shown with "Coming soon", never as included. */
const SOON = 'SOON:'

const PLANS = [
  {
    name: 'Starter', monthly: '4,999', annual: '3,999',
    users: 'Up to 10 users', branches: '1 branch', featured: false,
    cta: 'Start Free Trial', ctaHref: '/register?plan=starter',
    feats: [
      'Core ERP modules (Dashboard, Finance, Invoicing)',
      'HRMS — Employees, Attendance, Leave, Payroll',
      'CRM — Leads & Customer management',
      'Procurement — purchase orders, suppliers, supplier bills',
      'Inventory — stock that moves with invoices and bills, low-stock reorders',
      'India GST auto-calculation on all invoices',
      'Standard email support',
      '1 company branch / GST registration',
    ],
  },
  {
    name: 'Growth', monthly: '12,999', annual: '10,399',
    users: 'Up to 50 users', branches: 'Multi-branch', featured: true,
    cta: 'Start Free Trial', ctaHref: '/register?plan=growth',
    feats: [
      'Everything in Starter',
      'WhatsApp — invoices and payment reminders with a pay link',
      'GST credit check — upload GSTR-2B, match it with your bills',
      'Bank payment matching — any bank’s statement',
      'TDS on supplier bills — by section, with a register',
      'Multi-branch support (unlimited branches)',
      'Priority support (4hr response)',
      SOON + 'ARIS — AI cash-flow forecast',
      SOON + 'Smart bill scanner (OCR)',
      SOON + 'Employee wellness insights',
      SOON + 'Client self-service portal',
      SOON + 'Recurring / subscription billing',
      SOON + 'Demand forecasting',
    ],
  },
  {
    name: 'Enterprise', monthly: '29,999', annual: '23,999',
    users: 'Unlimited users', branches: 'Unlimited branches', featured: false,
    cta: 'Contact Sales', ctaHref: '/contact',
    feats: [
      'Everything in Growth',
      'All modules (full suite)',
      'White-labelling & custom domain',
      'Dedicated Account Manager',
      'SLA guarantee (99.9% uptime)',
      'Source code delivery option',
      'On-premise / self-hosted deployment',
      'Custom integration support',
      SOON + 'BharatVoice — commands in Indian languages',
      SOON + 'Aadhaar eSign',
      SOON + 'Automation rules',
      SOON + 'Custom approval workflows',
    ],
  },
]

const COMPARE_ROWS = [
  { feature: 'Users',             starter: '10',          growth: '50',            enterprise: 'Unlimited' },
  { feature: 'Branches',          starter: '1',           growth: 'Unlimited',      enterprise: 'Unlimited' },
  { feature: 'Core ERP modules',  starter: true,          growth: true,             enterprise: true },
  { feature: 'HRMS + Payroll',    starter: true,          growth: true,             enterprise: true },
  { feature: 'India GST native',  starter: true,          growth: true,             enterprise: true },
  { feature: 'WhatsApp invoices & reminders', starter: false, growth: true,       enterprise: true },
  { feature: 'GST credit check (GSTR-2B)', starter: false, growth: true,          enterprise: true },
  { feature: 'Bank payment matching', starter: false,     growth: true,             enterprise: true },
  { feature: 'White-labelling',   starter: false,         growth: false,            enterprise: true },
  { feature: 'AI cash-flow forecast (ARIS)', soon: true, starter: false,  growth: true,  enterprise: true },
  { feature: 'Bill scanner (OCR)', soon: true,            starter: false,  growth: true,  enterprise: true },
  { feature: 'Wellness insights', soon: true,             starter: false,  growth: true,  enterprise: true },
  { feature: 'BharatVoice',       soon: true,             starter: false,  growth: false, enterprise: true },
  { feature: 'Aadhaar eSign',     soon: true,             starter: false,  growth: false, enterprise: true },
  { feature: 'Automation rules',  soon: true,             starter: false,  growth: false, enterprise: true },
  { feature: 'SLA guarantee',     starter: false,         growth: false,            enterprise: true },
  { feature: 'Support',           starter: 'Email',       growth: 'Priority (4hr)', enterprise: 'Dedicated AM' },
]

function Cell({ val }: { val: string | boolean }) {
  if (val === true)  return <CheckCircle size={16} color="var(--ok-text)" role="img" aria-label="Included" />
  if (val === false) return <X size={15} color="var(--text-muted)" role="img" aria-label="Not included" />
  return <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{val}</span>
}

// Server component: both prices are in the HTML; two radio buttons and CSS (globals.css,
// .billing-toggle) switch between them, so the switch works without JavaScript.
export default function PricingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <input type="radio" name="pricing-billing" id="billing-monthly" className="billing-radio" />
      <input type="radio" name="pricing-billing" id="billing-annual" className="billing-radio" defaultChecked />

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Transparent Pricing
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px, 5vw, 52px)', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
            Finvosmart pricing: simple plans, no surprises
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            All plans include full source of truth, unlimited transaction history, and India compliance built in.
          </p>

          {/* Monthly / annual switch (radio buttons above + CSS) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div className="billing-toggle" role="group" aria-label="Show prices billed">
              <label htmlFor="billing-monthly">Monthly</label>
              <label htmlFor="billing-annual">Annual</label>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '12px', color: 'var(--ok-text)', fontWeight: 600 }}>Save 20% with annual billing</span>
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
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '22px', color: p.featured ? 'var(--gold)' : 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{p.users} · {p.branches}</div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '44px', color: p.featured ? 'var(--gold)' : 'var(--text-primary)' }}>
                    <span className="price-annual">₹{p.annual}</span><span className="price-monthly">₹{p.monthly}</span>
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>/month</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  + 18% GST · <span className="price-annual">billed annually (₹{p.monthly} billed monthly)</span><span className="price-monthly">billed monthly (₹{p.annual} billed annually)</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {p.feats.map(f => {
                    const soon = f.startsWith(SOON)
                    return (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', color: soon ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                        {soon ? <Clock size={15} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} aria-hidden />
                              : <CheckCircle size={15} style={{ color: 'var(--ok-text)', flexShrink: 0, marginTop: '2px' }} aria-hidden />}
                        <span>{soon ? f.slice(SOON.length) : f}{soon && <SoonBadge style={{ marginLeft: '6px' }} />}</span>
                      </div>
                    )
                  })}
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
            <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
              {[['Extra Branch','₹1,500/mo','Additional GST branch registration and data isolation'],['Custom Integration','₹5,000/mo','API integration with third-party tools or legacy systems'],['Onboarding + Training','₹15,000 one-time','Data migration, setup & video training for up to 20 users']].map(([n,p,d]) => (
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
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '28px', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '36px' }}>Full feature comparison</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th scope="col" style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card)' }}>Feature</th>
                  {['Starter','Growth','Enterprise'].map((h,i) => (
                    <th key={h} scope="col" style={{ padding: '14px 20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: i===1 ? 'var(--gold)' : 'var(--text-primary)', background: i===1 ? 'var(--gold-muted)' : 'var(--bg-card)', width: '180px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)' }}>
                    <th scope="row" style={{ padding: '11px 20px', fontSize: '13.5px', fontWeight: 400, textAlign: 'left', color: 'var(--text-secondary)' }}>{row.feature}{'soon' in row && row.soon && <SoonBadge style={{ marginLeft: '8px' }} />}</th>
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
