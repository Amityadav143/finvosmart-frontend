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
  Check, X, ArrowRight, Users, Minus, Plus, Zap,
  LayoutDashboard, DollarSign, FileText, ShoppingCart, Boxes,
  TrendingUp, FolderOpen, BarChart3, Brain, MessageCircle,
  Camera, Heart, RefreshCw, Mic, Building2, CreditCard,
  Globe, Package2, PenLine, Activity, Shield
} from 'lucide-react'
import { STATIC_MODULES, CATEGORY_LABELS } from '@/lib/api/planModules'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, DollarSign, FileText, ShoppingCart, Boxes,
  TrendingUp, FolderOpen, BarChart3, Brain, MessageCircle,
  Camera, Heart, RefreshCw, Mic, Building2, CreditCard,
  Globe, Package2, PenLine, Activity, Shield, Zap,
  Users,
}

function formatINR(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

const POPULAR_BUNDLES = [
  { name: 'Accounting Starter',   desc: 'Small CA firm or solo trader',     icon: '📊', modules: ['FINANCE','INVOICING','TDS','BANK_RECON'] },
  { name: 'HRMS + Payroll',       desc: 'HR team managing 20–200 employees', icon: '👥', modules: ['HRMS','EXPENSE'] },
  { name: 'Sales & Commerce',     desc: 'Sales team + customer management',  icon: '🎯', modules: ['CRM','INVOICING','PORTAL','SUBSCRIPTIONS'] },
  { name: 'Operations Pack',      desc: 'Manufacturing / trading company',   icon: '🏭', modules: ['PROCUREMENT','INVENTORY','FORECAST','FINANCE'] },
  { name: 'Full AI Suite',        desc: 'All 6 AI-powered features',        icon: '🤖', modules: ['AI_CASHFLOW','WHATSAPP','BILL_SCANNER','WELLNESS','GST_RECON','VOICE'] },
  { name: 'Smart Automations',    desc: 'All 8 automation tools',           icon: '⚡', modules: ['BANK_RECON','EXPENSE','PORTAL','SUBSCRIPTIONS','TDS','FORECAST','ESIGN','AUTOMATIONS'] },
]

export default function CustomPlanPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set(['FINANCE','INVOICING','HRMS']))
  const [users, setUsers]       = useState(15)
  const [annual, setAnnual]     = useState(false)
  const [activeTab, setActiveTab] = useState<'ERP'|'AI'|'SMART'>('ERP')

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const applyBundle = (modules: string[]) => {
    setSelected(new Set(modules))
  }

  const modules = STATIC_MODULES
  const selectedModules = modules.filter(m => selected.has(m.module_key) && !m.is_core)

  // Synchronous calculation
  const breakdown = selectedModules.map(m => ({
    ...m,
    lineTotal: m.base_price_month + m.price_per_user * users,
  }))
  const monthlyTotal  = breakdown.reduce((s, b) => s + b.lineTotal, 0)
  const annualMonthly = Math.round(monthlyTotal * 0.80)
  const displayTotal  = annual ? annualMonthly : monthlyTotal
  const savings       = Math.round(monthlyTotal * 12 - annualMonthly * 12)

  const byCategory = (cat: string) => modules.filter(m => m.category === cat)

  const inp: React.CSSProperties = { width:'100%', padding:'8px 12px', borderRadius:'8px', background:'var(--bg-input)', border:'1px solid var(--border-strong)', color:'var(--text-primary)', fontSize:'14px', fontFamily:'inherit', outline:'none' }

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '64px 0 48px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Build Your Own Plan
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,5vw,48px)', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: 1.15 }}>
            Pay Only for What You Use
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            Pick the exact modules your business needs. Start with just Invoicing, add HRMS later, unlock AI features when you're ready — no locked-in bundles.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

          {/* ── LEFT: Module Selector ─────────────────────────────────────── */}
          <div>

            {/* Popular bundles */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Quick-start bundles
              </h2>
              <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {POPULAR_BUNDLES.map(b => (
                  <button key={b.name} onClick={() => applyBundle(b.modules)} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '12px 14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                    onMouseEnter={(e: any) => { const el = e.currentTarget; el.style.borderColor = 'var(--gold)'; el.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={(e: any) => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.transform = 'none' }}
                  >
                    <div style={{ fontSize: '18px', marginBottom: '5px' }}>{b.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{b.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
                    <div style={{ marginTop: '6px', fontSize: '10.5px', color: 'var(--gold)' }}>
                      {b.modules.length} modules →
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
              {(['ERP','AI','SMART'] as const).map(cat => (
                <button key={cat} onClick={() => setActiveTab(cat)} style={{
                  flex: 1, padding: '8px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', fontFamily: 'inherit',
                  background: activeTab === cat ? 'var(--btn-primary-bg)' : 'transparent',
                  color: activeTab === cat ? 'var(--text-on-gold)' : 'var(--text-secondary)',
                }}>
                  {CATEGORY_LABELS[cat]}
                  <span style={{ marginLeft: '6px', fontSize: '10.5px', opacity: 0.75 }}>
                    ({byCategory(cat).filter(m => selected.has(m.module_key)).length}/{byCategory(cat).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Module cards */}
            <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {byCategory(activeTab).map(m => {
                const Icon = ICON_MAP[m.icon_name] || Zap
                const isOn = selected.has(m.module_key)
                const lineTotal = m.base_price_month + m.price_per_user * users
                return (
                  <div key={m.module_key} onClick={() => toggle(m.module_key)} style={{
                    background: isOn ? `${m.accent_color}10` : 'var(--bg-card)',
                    border: `1px solid ${isOn ? m.accent_color : 'var(--border)'}`,
                    borderRadius: '14px', padding: '16px', cursor: 'pointer',
                    transition: 'all 0.2s', position: 'relative',
                    boxShadow: isOn ? `0 0 0 1px ${m.accent_color}30` : 'none',
                  }}>
                    {/* Toggle indicator */}
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '22px', height: '22px', borderRadius: '50%',
                      border: `2px solid ${isOn ? m.accent_color : 'var(--border)'}`,
                      background: isOn ? m.accent_color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isOn && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: `${m.accent_color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: m.accent_color,
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1, paddingRight: '28px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{m.display_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.description}</div>
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '18px', color: isOn ? m.accent_color : 'var(--text-primary)' }}>
                            {formatINR(m.base_price_month)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/mo base</span>
                          {m.price_per_user > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              + {formatINR(m.price_per_user)}/user
                            </span>
                          )}
                        </div>
                        {isOn && lineTotal !== m.base_price_month && (
                          <div style={{ marginTop: '4px', fontSize: '12px', color: m.accent_color, fontWeight: 500 }}>
                            Your price: {formatINR(lineTotal)}/mo ({users} users)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Select all / clear */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setSelected(new Set(byCategory(activeTab).map(m => m.module_key)))} style={{
                padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--border-strong)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit'
              }}>Select all {CATEGORY_LABELS[activeTab]}</button>
              <button onClick={() => setSelected(prev => {
                const next = new Set(prev)
                byCategory(activeTab).forEach(m => next.delete(m.module_key))
                return next
              })} style={{
                padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit'
              }}>Clear {activeTab} selection</button>
            </div>
          </div>

          {/* ── RIGHT: Price Summary ──────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: '88px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>

              {/* Header */}
              <div style={{ padding: '20px 22px 16px', background: 'var(--btn-primary-bg)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Your Custom Plan</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '40px', color: '#FFFFFF', lineHeight: 1 }}>
                    {formatINR(displayTotal)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>/month</span>
                </div>
                {annual && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>Billed annually · Save {formatINR(savings)}/year</div>}
              </div>

              <div style={{ padding: '18px 22px' }}>

                {/* Users slider */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} /> Users
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setUsers(u => Math.max(1, u - 5))} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Minus size={13} /></button>
                      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: 'var(--gold)', minWidth: '36px', textAlign: 'center' }}>{users}</span>
                      <button onClick={() => setUsers(u => Math.min(500, u + 5))} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-strong)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><Plus size={13} /></button>
                    </div>
                  </div>
                  <input type="range" min="1" max="200" step="1" value={users}
                    onChange={e => setUsers(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--gold)', height: '4px', borderRadius: '2px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    <span>1</span><span>50</span><span>100</span><span>200</span>
                  </div>
                </div>

                {/* Annual toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Annual billing</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Save 20% vs monthly</div>
                  </div>
                  <div onClick={() => setAnnual(v => !v)} style={{ width: '44px', height: '24px', borderRadius: '12px', background: annual ? 'var(--gold)' : 'var(--bg-card)', border: '1px solid var(--border-strong)', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: annual ? '23px' : '3px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {/* Module breakdown */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Selected modules ({breakdown.length})
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {breakdown.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>No modules selected. Pick modules on the left.</p>
                    ) : breakdown.map(m => (
                      <div key={m.module_key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.accent_color, flexShrink: 0 }} />
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.display_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{formatINR(m.lineTotal)}</span>
                          <button onClick={(e) => { e.stopPropagation(); toggle(m.module_key) }} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '10px 0 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Total / month</span>
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '20px', color: 'var(--gold)' }}>{formatINR(displayTotal)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>+ 18% GST</div>
                </div>

                {/* CTA */}
                <Link href={`/login?register=1&plan=custom&modules=${[...selected].join(',')}&users=${users}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px', borderRadius: '10px', background: 'var(--btn-primary-bg)',
                  color: 'var(--text-on-gold)', textDecoration: 'none',
                  fontWeight: 600, fontSize: '15px', boxShadow: 'var(--btn-primary-shadow)',
                  marginBottom: '10px', transition: 'opacity 0.2s',
                }}
                  onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
                  onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <Link href="/contact" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px', borderRadius: '10px', border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px',
                }}>Talk to Sales</Link>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                  14-day free trial · No credit card · Cancel anytime
                </p>
              </div>
            </div>

            {/* Core always included */}
            <div style={{ marginTop: '12px', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Zap size={13} style={{ color: 'var(--gold)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Always included free</span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Dashboard · Settings · User Management · Multi-tenant auth · Mobile-responsive UI · Dark & Light themes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison with fixed plans */}
      <section style={{ padding: '56px 0 80px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '28px', color: 'var(--text-primary)', marginBottom: '12px' }}>Not sure what to pick?</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Compare with our fixed plans — Growth plan is the most popular for companies that want everything.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
              View Fixed Plans
            </Link>
            <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Talk to an Expert <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
