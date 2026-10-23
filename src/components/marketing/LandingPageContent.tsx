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

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { HOME_FAQ, PAGES, PLANS } from '@/lib/seo'
import { SOLUTIONS_MENU, TOOLS_MENU, link } from '@/lib/siteNav'
import { SoonBadge } from '@/components/marketing/SoonBadge'
import {
  ArrowRight, Play, Zap, Brain, MessageCircle, Camera, RefreshCw, Building2,
  CreditCard, Globe, Package2, CheckCircle, Check, X, ChevronDown, TrendingUp,
  Users, DollarSign, FileText, ShoppingCart, Boxes, FolderOpen, BarChart3,
  Settings, Shield, Sparkles, Clock, Layers, Calculator, BookOpen,
} from 'lucide-react'

/*
 * The homepage. A server component: every word, link and price is in the HTML the server
 * sends, and the page needs no JavaScript to read or use — hover effects, the scroll fade-in,
 * the monthly/annual price switch and the FAQ are all CSS and HTML (see globals.css,
 * "Marketing site"). That keeps the page fast on a mid-range phone, which search engines
 * measure and reward.
 */

/** Competitor comparison. FINVOSMART's column claims only what works today. */
const COMPARE_ROWS: { cap: string; vals: (boolean | string)[] }[] = [
  { cap: 'All-in-one (HR + Finance + CRM + Inventory)', vals: [true, false, 'addon', true, false] },
  { cap: 'GST returns (GSTR-1, GSTR-3B) and GSTR-2B check', vals: [true, true, true, 'addon', false] },
  { cap: 'TDS & Indian statutory compliance', vals: [true, true, 'partial', false, false] },
  { cap: 'Payroll with PF, ESI and payslips', vals: [true, true, 'addon', 'addon', false] },
  { cap: 'WhatsApp billing & collections', vals: [true, false, 'addon', false, 'addon'] },
  { cap: 'Cloud-native, access anywhere', vals: [true, 'partial', true, true, true] },
  { cap: 'Affordable for Indian SMEs', vals: [true, true, 'partial', 'partial', false] },
]

/* ── Shared style helpers using app CSS vars ─────────────────────────────────*/
const S = {
  section:   (extra?: CSSProperties): CSSProperties => ({ padding: '112px 0', position: 'relative', ...extra }),
  container: (): CSSProperties => ({ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative' }),
  eyebrow:   (): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '18px' }),
  h2:        (): CSSProperties => ({ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '18px', lineHeight: 1.12, letterSpacing: '-0.01em' }),
  sub:       (): CSSProperties => ({ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '600px' }),
  card:      (extra?: CSSProperties): CSSProperties => ({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '30px', ...extra }),
  tag:       (extra?: CSSProperties): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 15px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.02em', border: '1px solid var(--border-strong)', background: 'var(--gold-muted)', color: 'var(--gold)', ...extra }),
  btn:       (): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 30px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }),
}

/** A card's accent colour, for its hover border (globals.css: .lp-card, .lp-tile). */
const accent = (color: string) => ({ '--accent': color } as CSSProperties)
const inr = (n: number) => n.toLocaleString('en-IN')

/** Module tiles: each opens the page that explains it. */
const MODULE_TILES = [
  { label: 'Dashboard',   icon: <BarChart3 size={22} />,    color: 'var(--gold)', href: '/features' },
  { label: 'HRMS',        icon: <Users size={22} />,        color: '#2563EB', href: '/hrms-software' },
  { label: 'Accounting',  icon: <DollarSign size={22} />,   color: '#16A34A', href: '/accounting-software' },
  { label: 'Invoicing',   icon: <FileText size={22} />,     color: 'var(--gold)', href: '/gst-billing-software' },
  { label: 'Procurement', icon: <ShoppingCart size={22} />, color: '#EA580C', href: '/features' },
  { label: 'Inventory',   icon: <Boxes size={22} />,        color: '#0D9488', href: '/features' },
  { label: 'CRM',         icon: <TrendingUp size={22} />,   color: '#7C3AED', href: '/features' },
  { label: 'Projects',    icon: <FolderOpen size={22} />,   color: '#DB2777', href: '/features' },
  { label: 'Analytics',   icon: <BarChart3 size={22} />,    color: '#2563EB', href: '/features' },
  { label: 'Compliance',  icon: <Shield size={22} />,       color: '#16A34A', href: '/features#compliance' },
  { label: 'Payroll',     icon: <Clock size={22} />,        color: '#7C3AED', href: '/payroll-software' },
  { label: 'GST returns', icon: <CheckCircle size={22} />,  color: 'var(--gold)', href: '/gst-billing-software' },
  { label: 'Ledgers',     icon: <BookOpen size={22} />,     color: '#64748B', href: '/accounting-software' },
  { label: 'All features', icon: <Sparkles size={22} />,    color: '#EC4899', href: '/features' },
]

/* ══════════════════════════════════════════════════════════════════════════ */
export default function LandingPageContent() {
  const goldGrad: CSSProperties = { background: 'var(--btn-primary-bg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
  const starter = PLANS[0]

  return (
    <div id="lp" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '128px 0 88px', position: 'relative', overflow: 'hidden' }} id="hero">
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--hero-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hero-grid) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 75% 55% at 50% 45%, black 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 45%, black 35%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '820px', height: '460px', background: 'radial-gradient(ellipse, var(--hero-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--hero-glow-2) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={S.container()}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '56px', alignItems: 'center' }}>

            {/* Left */}
            <div>
              <div style={{ marginBottom: '26px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={S.tag()}>
                  <span style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #22C55E' }} />
                  Version 1.0 — Live
                </span>
                <span style={S.tag({ background: 'var(--bg-card)', color: 'var(--text-secondary)' })}>
                  <Sparkles size={13} style={{ color: 'var(--gold)' }} aria-hidden /> Built for India
                </span>
              </div>
              {/* One heading: what the product is (the words people search for), then the promise. */}
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, marginBottom: '24px' }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-geist), system-ui, sans-serif', fontSize: '14px', fontWeight: 600, letterSpacing: '0.03em', lineHeight: 1.5, color: 'var(--gold)', marginBottom: '14px' }}>
                  GST billing, accounting, payroll &amp; HR software for Indian businesses
                </span>
                <span style={{ display: 'block', fontSize: 'clamp(38px, 5.4vw, 70px)', lineHeight: 1.05, letterSpacing: '-0.015em' }}>
                  Seven business tools.<br />
                  <span style={goldGrad}>Now one platform.</span>
                </span>
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '26px', maxWidth: '510px' }}>
                FINVOSMART replaces Tally, your payroll app, WhatsApp billing and four more — with one connected system. Native <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>GST</strong>, <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>TDS</strong> and <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>payroll</strong>, built for Indian business from day one.
              </p>

              {/* Seven-tools-replaced strip — the all-in-one thesis, made concrete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Replaces</span>
                {['Tally', 'Payroll app', 'WhatsApp billing', 'CRM', 'Inventory tool', 'Excel sheets', 'BI tool'].map(tool => (
                  <span key={tool} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '7px', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'line-through', textDecorationColor: 'var(--gold)', textDecorationThickness: '1.5px' }}>
                    {tool}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--gold)', padding: '4px 12px', borderRadius: '7px', background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
                  <ArrowRight size={12} aria-hidden /> FINVOSMART
                </span>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '44px' }}>
                <Link href="/register" className="lp-lift" style={{ ...S.btn(), background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', boxShadow: 'var(--btn-primary-shadow)' }}>
                  Start Free Trial <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/contact" className="lp-outline" style={{ ...S.btn(), border: '1px solid var(--border-strong)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
                  <Play size={15} aria-hidden /> Book a Demo
                </Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {['No credit card', '14-day free trial', 'Cancel anytime'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Check size={14} style={{ color: '#22C55E' }} aria-hidden /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup (decorative) */}
            <div className="hero-mockup" style={{ position: 'relative' }} aria-hidden="true">
              {/* Floating badges */}
              <div style={{ position: 'absolute', top: '-18px', left: '-24px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite' }}>
                <span style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', display: 'inline-block', marginRight: '7px' }} />GSTR-2B checked
              </div>
              <div style={{ position: 'absolute', top: '32%', right: '-30px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite', animationDelay: '0.9s' }}>
                <span style={{ width: '7px', height: '7px', background: 'var(--gold)', borderRadius: '50%', display: 'inline-block', marginRight: '7px' }} />₹8.4L sent via WhatsApp
              </div>
              <div style={{ position: 'absolute', bottom: '14px', left: '-22px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite', animationDelay: '1.6s' }}>
                <CheckCircle size={13} style={{ color: '#60A5FA', display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />GSTR-1 ready to upload
              </div>

              {/* Browser frame */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', zIndex: 2 }}>
                <div style={{ height: '40px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
                  {['#EF4444', '#F59E0B', '#22C55E'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  <div style={{ flex: 1, height: '22px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 12px', marginLeft: '6px' }}>
                    <Shield size={10} style={{ color: '#22C55E', marginRight: '6px' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>app.finvosmart.com</span>
                  </div>
                </div>
                <div style={{ padding: '18px' }}>
                  {/* KPI grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[['CASH POSITION', '₹48.2L', 'var(--gold)', '+12%'], ['EMPLOYEES', '247', '#60A5FA', '+8'], ['OUTSTANDING', '₹8.4L', '#F87171', '-5%'], ['LEADS WON', '18', '#4ADE80', '+3']].map(([l, v, c, d]) => (
                      <div key={l} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{l}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: c }}>{v}</span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: d.startsWith('-') ? '#F87171' : '#4ADE80' }}>{d}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chart */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Revenue vs Expenses</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Last 9 months</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '64px' }}>
                      {[55, 72, 48, 85, 68, 102, 82, 115, 96].map((v, i) => (
                        <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${(v / 115) * 100}%`, background: i === 8 ? 'var(--btn-primary-bg)' : 'var(--gold-muted)', border: i === 8 ? 'none' : '1px solid var(--border-strong)' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow under mockup */}
              <div style={{ position: 'absolute', inset: '20% 10% -10% 10%', background: 'radial-gradient(ellipse, rgba(245,158,11,0.18) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 1, pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST / STATS BAR ═══════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={S.container()}>
          <div className="stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '40px 0' }}>
            {[
              { v: '14', suffix: '', label: 'Integrated modules' },
              { v: `₹${inr(starter.annual)}`, suffix: '/mo', label: `${starter.name} plan, billed annually` },
              { v: '40', suffix: 'hrs', label: 'Saved a month (our estimate)' },
              { v: '4', suffix: '', label: 'Statutory files, ready to upload' },
            ].map((s, i) => (
              <div key={s.label} style={{ textAlign: 'center', borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 4vw, 46px)', color: 'var(--gold)', lineHeight: 1 }}>
                  {s.v}<span style={{ fontSize: '0.6em' }}>{s.suffix}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATIONS STRIP ══════════════════════════════════════════════ */}
      <section style={{ padding: '44px 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={S.container()}>
          <p style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '26px' }}>Works with the tools you already use</p>
          <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', listStyle: 'none' }}>
            {[
              { name: 'Razorpay', icon: <CreditCard size={16} aria-hidden /> },
              { name: 'WhatsApp', icon: <MessageCircle size={16} aria-hidden /> },
              { name: 'GST portal (file upload)', icon: <Shield size={16} aria-hidden /> },
              { name: 'UPI', icon: <Zap size={16} aria-hidden /> },
              { name: 'Any bank statement', icon: <Building2 size={16} aria-hidden /> },
              { name: 'Tally (via Excel)', icon: <RefreshCw size={16} aria-hidden /> },
              { name: 'Excel / CSV', icon: <FileText size={16} aria-hidden /> },
              { name: 'Open API', icon: <Globe size={16} aria-hidden /> },
            ].map(t => (
              <li key={t.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--gold)', display: 'inline-flex' }}>{t.icon}</span>{t.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ PROBLEMS ════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="problems">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>The problem</span>
            <h2 style={S.h2()}>Running a business on 7 disconnected apps</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Most Indian SMEs stitch together Tally, spreadsheets, WhatsApp and a payroll tool. Data lives everywhere, nothing talks, and month-end is chaos.</p>
          </div>
          <div className="prob-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { color: '#EF4444', icon: <FileText size={20} />, title: 'GST filing nightmares', desc: 'Manual reconciliation, missed ITC, last-minute scrambles before deadlines.' },
              { color: '#F59E0B', icon: <RefreshCw size={20} />, title: 'Data re-entry everywhere', desc: 'The same invoice typed into Tally, Excel, and WhatsApp — three times over.' },
              { color: '#EC4899', icon: <Package2 size={20} />, title: 'Inventory stockouts', desc: 'No reorder alerts — over-stocked or out-of-stock at the worst moments.' },
              { color: '#8B5CF6', icon: <Users size={20} />, title: 'Payroll & attendance silos', desc: 'Disconnected HR tools mean errors, delays, and frustrated employees.' },
              { color: '#3B82F6', icon: <DollarSign size={20} />, title: 'No cash flow visibility', desc: 'You find out about a cash crunch when it is already too late to act.' },
              { color: '#14B8A6', icon: <Globe size={20} />, title: 'Tools built for the West', desc: 'No native TDS, MSME payment rules or Indian payroll.' },
            ].map(p => (
              <div key={p.title} className="lp-card reveal" style={{ ...S.card(), ...accent(p.color) }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: p.color + '18', color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }} aria-hidden="true">{p.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{p.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 14 MODULES ══════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }} id="features">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>One platform</span>
            <h2 style={S.h2()}>Every module your business needs</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Integrated modules sharing one database. Set up a customer once — they flow through invoicing, CRM, projects and accounting automatically. <Link href="/features" className="text-link" style={{ fontWeight: 600 }}>See every feature →</Link></p>
          </div>
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
            {MODULE_TILES.map(m => (
              <Link key={m.label} href={m.href} className="lp-tile reveal" style={{ ...accent(m.color), display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 12px', textAlign: 'center', textDecoration: 'none', transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s' }}>
                <div style={{ color: m.color, display: 'flex', justifyContent: 'center', marginBottom: '10px' }} aria-hidden="true">{m.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{m.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="compare">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>Why switch</span>
            <h2 style={S.h2()}>One platform vs. a stack of compromises</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Tally does accounting. Zoho needs ten separate apps. Odoo and Salesforce are built for the West. FINVOSMART does it all — natively, for India.</p>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '14px' }}>
              <caption style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Finvosmart compared with Tally, Zoho, Odoo and Salesforce</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: 'left', padding: '20px 24px', fontWeight: 500, color: 'var(--text-muted)', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>Capability</th>
                  {[
                    { n: 'FINVOSMART', hl: true },
                    { n: 'Tally', hl: false },
                    { n: 'Zoho', hl: false },
                    { n: 'Odoo', hl: false },
                    { n: 'Salesforce', hl: false },
                  ].map(col => (
                    <th key={col.n} scope="col" style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: col.hl ? '1px solid var(--gold)' : 'none', borderRight: col.hl ? '1px solid var(--gold)' : 'none', borderTop: col.hl ? '2px solid var(--gold)' : 'none', background: col.hl ? 'var(--gold-muted)' : 'transparent' }}>
                      <span style={{ fontFamily: col.hl ? "'Instrument Serif', serif" : 'inherit', fontSize: col.hl ? '17px' : '14px', fontWeight: col.hl ? 400 : 600, color: col.hl ? 'var(--gold)' : 'var(--text-secondary)' }}>{col.n}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, ri) => (
                  <tr key={row.cap} style={{ borderBottom: ri < COMPARE_ROWS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <th scope="row" style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'left' }}>{row.cap}</th>
                    {row.vals.map((v, ci) => (
                      <td key={ci} style={{ padding: '16px', textAlign: 'center', borderLeft: ci === 0 ? '1px solid var(--gold)' : 'none', borderRight: ci === 0 ? '1px solid var(--gold)' : 'none', background: ci === 0 ? 'var(--gold-muted)' : 'transparent' }}>
                        {v === true ? <Check size={18} style={{ color: ci === 0 ? 'var(--gold)' : '#22C55E' }} role="img" aria-label="Yes" />
                          : v === false ? <X size={16} style={{ color: '#EF4444', opacity: 0.55 }} role="img" aria-label="No" />
                          : <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{v === 'addon' ? 'paid add-on' : v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>Comparison reflects standard-plan capabilities as of 2026. All competitor names are trademarks of their respective owners. Moving from Tally? <Link href="/tally-alternative" className="text-link">See how Finvosmart compares</Link>.</p>
        </div>
      </section>

      {/* ═══ BUILT-IN AUTOMATION ═════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }} id="ai-features">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}><Sparkles size={13} style={{ verticalAlign: '-2px' }} aria-hidden /> Built in</span>
            <h2 style={S.h2()}>The routine work, done for you</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Reminders, matching and returns run on your own data. AI features are on the way — marked below.</p>
          </div>
          <div className="usp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { icon: <MessageCircle size={22} />, color: '#22C55E', title: 'WhatsApp & email reminders', desc: 'Invoices go out with a pay link; reminders follow on WhatsApp and email until they are paid.' },
              { icon: <Building2 size={22} />,     color: '#2563EB', title: 'Bank payment matching', desc: 'Upload any bank statement and payments are matched to invoices and bills by number and amount.' },
              { icon: <RefreshCw size={22} />,     color: '#14B8A6', title: 'GSTR-2B credit check', desc: 'Every supplier invoice on your GSTR-2B is matched with your bills, so eligible credit isn’t missed.' },
              { icon: <CheckCircle size={22} />,   color: '#16A34A', title: 'GST returns', desc: 'GSTR-1 and GSTR-3B worked out from your books, as files ready to upload on the GST portal.' },
              { icon: <Brain size={22} />, color: '#8B5CF6', title: 'ARIS cash-flow forecast', desc: 'Spots payment delays and cash crunches weeks ahead.', soon: true },
              { icon: <Camera size={22} />, color: '#F59E0B', title: 'Bill scanner (OCR)', desc: 'Snap a supplier bill and get a draft bill to check.', soon: true },
            ].map(f => (
              <div key={f.title} className="lp-card reveal" style={{ ...S.card({ background: 'var(--bg-card)' }), ...accent(f.color) }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: f.color + '18', color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }} aria-hidden="true">{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '9px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{f.title}{f.soon && <SoonBadge />}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ══════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="pricing">
        <div style={S.container()}>
          {/* Billing switch: radio buttons + CSS (globals.css, .billing-toggle) — no JavaScript. */}
          <input type="radio" name="landing-billing" id="billing-monthly" className="billing-radio" />
          <input type="radio" name="landing-billing" id="billing-annual" className="billing-radio" defaultChecked />
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <span style={S.eyebrow()}>Pricing</span>
            <h2 style={S.h2()}>Simple, transparent, India-priced</h2>
            <p style={{ ...S.sub(), margin: '0 auto 28px' }}>One subscription for everything. No per-module fees, no surprises.</p>
            <div className="billing-toggle" role="group" aria-label="Show prices billed">
              <label htmlFor="billing-monthly">Monthly</label>
              <label htmlFor="billing-annual">Annual <span style={{ fontSize: '11px', opacity: 0.85 }}>−20%</span></label>
            </div>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px', alignItems: 'stretch' }}>
            {[
              { name:'Starter', monthly:'4,999', annual:'3,999', users:'Up to 10 users · 1 branch', featured: false,
                feats:['Core ERP modules','HRMS + Finance','Invoicing + GST','CRM + Procurement','Standard support'] },
              { name:'Growth', monthly:'12,999', annual:'10,399', users:'Up to 50 users · Multi-branch', featured: true,
                feats:['Everything in Starter','WhatsApp invoices & reminders','GST credit check (GSTR-2B)','Bank payment matching','TDS on supplier bills','Priority support'] },
              { name:'Enterprise', monthly:'29,999', annual:'23,999', users:'Unlimited users & branches', featured: false,
                feats:['Everything in Growth','All modules, unlimited users','White-labelling','Dedicated SLA support','On-premise option'] },
            ].map(({ name, monthly, annual, users, featured, feats }) => (
              <div key={name} style={{
                position: 'relative',
                background: 'var(--bg-card)',
                border: featured ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '20px', padding: featured ? '36px 28px' : '32px 28px',
                boxShadow: featured ? 'var(--shadow-gold)' : 'none',
                transform: featured ? 'scale(1.02)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {featured && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', padding: '5px 16px', borderRadius: '100px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Most Popular</div>
                )}
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', fontWeight: 400, color: featured ? 'var(--gold)' : 'var(--text-primary)', marginBottom: '6px' }}>{name}</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>{users}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '46px', color: featured ? 'var(--gold)' : 'var(--text-primary)', lineHeight: 1 }}>
                    <span className="price-annual">₹{annual}</span><span className="price-monthly">₹{monthly}</span>
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', height: '16px' }}>
                  <span className="price-annual">billed annually</span><span className="price-monthly">billed monthly</span>
                </div>
                <Link href={name === 'Enterprise' ? '/contact' : '/register'} className="lp-lift" style={{ ...S.btn(), width: '100%', marginBottom: '24px',
                  background: featured ? 'var(--btn-primary-bg)' : 'transparent',
                  color: featured ? 'var(--text-on-gold)' : 'var(--text-primary)',
                  border: featured ? 'none' : '1px solid var(--border-strong)',
                  boxShadow: featured ? 'var(--btn-primary-shadow)' : 'none' }}>
                  {name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none' }}>
                  {feats.map(ft => (
                    <li key={ft} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <Check size={16} style={{ color: featured ? 'var(--gold)' : 'var(--ok-text)', flexShrink: 0, marginTop: '2px' }} aria-hidden />
                      {ft}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Build-your-own / custom plan callout */}
          <div style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '24px 30px', borderRadius: '18px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>Need something tailored? Build your own plan.</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pick only the modules you need and pay for nothing else — no locked-in bundles.</div>
              </div>
            </div>
            <Link href="/custom-plan" className="lp-lift" style={{ ...S.btn(), background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', flexShrink: 0 }}>
              Build a Custom Plan <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '18px' }}>
            Compare every plan on the <Link href="/pricing" className="text-link">pricing page</Link>.
          </p>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }} id="scenarios">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>Built for real operations</span>
            <h2 style={S.h2()}>What running on one platform looks like</h2>
            <p style={{ ...S.sub(), margin: '0 auto', textAlign: 'center' }}>Representative scenarios from the kinds of businesses FINVOSMART is built for — manufacturers, distributors and service firms across India.</p>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' }}>
            {[
              { quote: 'Replacing Tally, a separate HRMS and WhatsApp billing with one system turns a two-day month-end bank reconciliation into a 40-minute task.', role: 'Auto-parts manufacturer · Pune', sector: 'Manufacturing', color: 'var(--gold)' },
              { quote: 'Automatic GSTR-2B matching surfaces eligible input-tax credit that manual reconciliation routinely misses — often several lakh across a quarter.', role: 'Textile distributor · Surat', sector: 'Distribution', color: '#60A5FA' },
              { quote: 'Every invoice carries a pay link and reminders go out on WhatsApp by themselves — collections now call only the few customers who still haven’t paid.', role: 'IT services firm · Bengaluru', sector: 'Services', color: '#4ADE80' },
            ].map(t => (
              <figure key={t.role} className="reveal" style={{ ...S.card(), display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={14} style={{ color: t.color }} aria-hidden />
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t.sector}</span>
                </div>
                <blockquote style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '22px', flex: 1 }}>{t.quote}</blockquote>
                <figcaption style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>Illustrative scenarios based on the platform's capabilities, not specific named customers.</p>
        </div>
      </section>

      {/* ═══ EXPLORE — every main page, one click from the homepage ═══════════ */}
      <section style={{ ...S.section({ padding: '96px 0' }), background: 'var(--bg-base)' }} id="explore">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <span style={S.eyebrow()}>Explore</span>
            <h2 style={S.h2()}>Find what your business needs</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Software for each part of the business, free GST tools that need no sign-up, and everything about plans and the team.</p>
          </div>
          <div className="explore-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' }}>
            {[
              { title: 'Software', icon: <FileText size={18} />, items: SOLUTIONS_MENU.map(i => ({ ...link(i.key), blurb: i.blurb })) },
              { title: 'Free GST tools', icon: <Calculator size={18} />, items: [...TOOLS_MENU.map(i => ({ ...link(i.key), blurb: i.blurb })), { ...link('freeTools', 'All free GST tools'), blurb: 'Everything free in one place' }] },
              { title: 'Plans & company', icon: <Building2 size={18} />, items: [
                { ...link('features'), blurb: 'What each module does today' },
                { ...link('pricing'), blurb: `Plans from ₹${inr(starter.annual)} a month` },
                { ...link('customPlan', 'Custom plan'), blurb: 'Pay only for the modules you use' },
                { ...link('about'), blurb: 'Who builds Finvosmart, and how' },
                { ...link('contact'), blurb: 'Book a free demo' },
                { ...link('developers', 'API documentation'), blurb: 'Connect your own systems' },
              ] },
            ].map(col => (
              <nav key={col.title} aria-label={col.title} className="reveal" style={{ ...S.card({ padding: '26px 24px' }) }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--gold)', display: 'inline-flex' }} aria-hidden="true">{col.icon}</span>{col.title}
                </h3>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {col.items.map(it => (
                    <li key={it.href}>
                      <Link href={it.href} className="mk-dd-item" style={{ padding: '9px 10px' }}>
                        <span className="mk-dd-label">{it.label}</span>
                        <span className="mk-dd-blurb">{it.blurb}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <p lang="hi" style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '28px' }}>
            Finvosmart के बारे में <Link href="/hi" hrefLang="hi" className="text-link">हिंदी में पढ़ें</Link>
          </p>
        </div>
      </section>

      {/* ═══ CTA BANNER ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '20px 0' }}>
        <div style={S.container()}>
          <div style={{ position: 'relative', borderRadius: '28px', overflow: 'hidden', background: 'var(--btn-primary-bg)', padding: 'clamp(48px, 7vw, 84px) 40px', textAlign: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black, transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 4.5vw, 50px)', fontWeight: 400, color: 'var(--text-on-gold)', marginBottom: '18px', lineHeight: 1.1 }}>
                Ready to run your business<br />from one platform?
              </h2>
              <p style={{ fontSize: '17px', color: 'var(--text-on-gold)', maxWidth: '520px', margin: '0 auto 34px' }}>
                Join Indian businesses replacing seven tools with FINVOSMART. Free for 14 days.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="lp-lift" style={{ ...S.btn(), background: 'var(--bg-base)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                  Start Free Trial <ArrowRight size={16} aria-hidden />
                </Link>
                <Link href="/contact" className="lp-lift" style={{ ...S.btn(), background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-gold)', border: '1px solid rgba(255,255,255,0.45)' }}>
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }} id="faq">
        <div style={S.container()}>
          <div className="reveal" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <span style={S.eyebrow()}>Questions</span>
            <h2 style={S.h2()}>Everything you need to know</h2>
          </div>
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {HOME_FAQ.map((f, i) => (
              <details key={f.q} className="faq-item" open={i === 0} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.25s' }}>
                <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.q}</h3>
                  <ChevronDown size={18} className="faq-chevron" style={{ color: 'var(--gold)', flexShrink: 0 }} aria-hidden />
                </summary>
                <p style={{ padding: '0 24px 22px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.a}</p>
              </details>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '28px' }}>
            More questions? <Link href="/contact" className="text-link" style={{ fontWeight: 600 }}>Talk to our team</Link> — in English or Hindi.
          </p>
        </div>
      </section>

      {/* #lp outranks the shared phone rules in globals.css ("main section [style*=grid-template-columns]"),
          which would otherwise squeeze every grid on this page into one column. */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          #lp .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          #lp .hero-mockup { display: none !important; }
          #lp .modules-grid { grid-template-columns: repeat(5, 1fr) !important; }
          #lp .explore-grid { grid-template-columns: repeat(2, 1fr) !important; }
          #lp #hero { min-height: auto !important; padding: 120px 0 72px !important; }
        }
        @media (max-width: 768px) {
          #lp .prob-grid, #lp .usp-grid, #lp .pricing-grid, #lp .testi-grid, #lp .explore-grid { grid-template-columns: 1fr !important; }
          #lp .modules-grid { grid-template-columns: repeat(4, 1fr) !important; }
          #lp .stats-bar { grid-template-columns: repeat(2, 1fr) !important; gap: 32px 16px !important; }
          #lp .stats-bar > div { border-left: none !important; }
          #lp section { padding-top: 72px !important; padding-bottom: 72px !important; }
          #lp .pricing-grid > div { transform: none !important; }
        }
        @media (max-width: 480px) {
          #lp .modules-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      ` }} />
    </div>
  )
}
