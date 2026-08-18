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

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/context/ThemeContext'
import {
  ArrowRight, Play, Zap, Brain, MessageCircle, Camera, Heart,
  RefreshCw, Mic, Building2, CreditCard, Globe, Package2, PenLine,
  Activity, CheckCircle, Check, X, ChevronDown, TrendingUp, Users, DollarSign,
  FileText, ShoppingCart, Boxes, FolderOpen, BarChart3, Settings,
  Shield, Sparkles, Clock, Layers,
} from 'lucide-react'

/* ── Shared style helpers using app CSS vars ─────────────────────────────────*/
const S = {
  section:   (extra?: React.CSSProperties): React.CSSProperties => ({ padding: '112px 0', position: 'relative', ...extra }),
  container: (): React.CSSProperties => ({ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative' }),
  eyebrow:   (): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' as const, marginBottom: '18px' }),
  h2:        (): React.CSSProperties => ({ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '18px', lineHeight: 1.12, letterSpacing: '-0.01em' }),
  sub:       (): React.CSSProperties => ({ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '600px' }),
  card:      (extra?: React.CSSProperties): React.CSSProperties => ({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '30px', transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s', ...extra }),
  tag:       (extra?: React.CSSProperties): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 15px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 500, letterSpacing: '0.02em', border: '1px solid var(--border-strong)', background: 'var(--gold-muted)', color: 'var(--gold)', ...extra }),
  btn:       (): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 30px', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s', cursor: 'pointer', whiteSpace: 'nowrap' as const }),
}

/* ── Scroll reveal hook ──────────────────────────────────────────────────────*/
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]: any) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.12 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)' } as React.CSSProperties }
}

/* ── Animated counter ────────────────────────────────────────────────────────*/
function useCountUp(target: number, run: boolean, dur = 1400) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!run) return
    let raf = 0; const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, target, dur])
  return val
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function LandingPageContent() {
  const { isDark } = useTheme()
  const [annualBilling, setAnnualBilling] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const rev1 = useReveal(); const rev2 = useReveal(); const rev3 = useReveal()
  const rev4 = useReveal(); const rev5 = useReveal(); const rev6 = useReveal()
  const rev7 = useReveal(); const rev8 = useReveal(); const rev9 = useReveal()
  const revCmp = useReveal()

  const goldGrad: React.CSSProperties = { background: 'var(--btn-primary-bg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }

  // Stats counters trigger on reveal
  const statsRef = useRef<HTMLDivElement>(null)
  const [statsRun, setStatsRun] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]: any) => { if (e.isIntersecting) { setStatsRun(true); obs.disconnect() } }, { threshold: 0.4 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])
  const cModules = useCountUp(14, statsRun)
  const cUptime  = useCountUp(99.9, statsRun)
  const cHours   = useCountUp(40, statsRun)
  const cLang    = useCountUp(5, statsRun)

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '128px 0 88px', position: 'relative', overflow: 'hidden' }} id="hero">
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${isDark ? 'rgba(245,158,11,0.045)' : 'rgba(26,27,75,0.04)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(245,158,11,0.045)' : 'rgba(26,27,75,0.04)'} 1px, transparent 1px)`, backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 75% 55% at 50% 45%, black 35%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 55% at 50% 45%, black 35%, transparent 100%)', pointerEvents: 'none' }} />
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-5%', left: '50%', transform: 'translateX(-50%)', width: '820px', height: '460px', background: `radial-gradient(ellipse, ${isDark ? 'rgba(245,158,11,0.12)' : 'rgba(180,83,9,0.07)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '400px', height: '400px', background: `radial-gradient(circle, ${isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)'} 0%, transparent 70%)`, pointerEvents: 'none' }} />

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
                  <Sparkles size={13} style={{ color: 'var(--gold)' }} /> Built for India
                </span>
              </div>
              <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(42px, 5.4vw, 70px)', fontWeight: 400, lineHeight: 1.05, marginBottom: '24px', letterSpacing: '-0.015em' }}>
                Seven business tools.<br />
                <span style={goldGrad}>Now one platform.</span>
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '26px', maxWidth: '510px' }}>
                FINVOSMART replaces Tally, your payroll app, WhatsApp billing and four more — with one connected system. Native <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>GST</strong>, <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>TDS</strong>, <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Aadhaar eSign</strong> and AI, built for Indian business from day one.
              </p>

              {/* Seven-tools-replaced strip — the all-in-one thesis, made concrete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '36px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Replaces</span>
                {['Tally', 'Payroll app', 'WhatsApp billing', 'CRM', 'Inventory tool', 'Excel sheets', 'BI tool'].map((tool, i) => (
                  <span key={tool} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '7px', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'line-through', textDecorationColor: 'var(--gold)', textDecorationThickness: '1.5px' }}>
                    {tool}
                  </span>
                ))}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--gold)', padding: '4px 12px', borderRadius: '7px', background: 'var(--gold-muted)', border: '1px solid var(--gold)' }}>
                  <ArrowRight size={12} /> FINVOSMART
                </span>
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '44px' }}>
                <Link href="/login?register=1" style={{ ...S.btn(), background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', boxShadow: 'var(--btn-primary-shadow)' }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'none' }}>
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <a href="https://demo.finvosmart.com" target="_blank" rel="noreferrer" style={{ ...S.btn(), border: '1px solid var(--border-strong)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}
                  onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'var(--gold)' }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}>
                  <Play size={15} /> Watch Demo
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {['No credit card', '14-day free trial', 'Cancel anytime'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Check size={14} style={{ color: '#22C55E' }} /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="hero-mockup" style={{ position: 'relative' }}>
              {/* Floating badges */}
              <div style={{ position: 'absolute', top: '-18px', left: '-24px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite' }}>
                <span style={{ width: '7px', height: '7px', background: '#22C55E', borderRadius: '50%', display: 'inline-block', marginRight: '7px' }} />GST Auto-reconciled
              </div>
              <div style={{ position: 'absolute', top: '32%', right: '-30px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite', animationDelay: '0.9s' }}>
                <span style={{ width: '7px', height: '7px', background: 'var(--gold)', borderRadius: '50%', display: 'inline-block', marginRight: '7px' }} />₹8.4L sent via WhatsApp
              </div>
              <div style={{ position: 'absolute', bottom: '14px', left: '-22px', zIndex: 3, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)', animation: 'floaty 3.5s ease-in-out infinite', animationDelay: '1.6s' }}>
                <Brain size={13} style={{ color: '#60A5FA', display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />ARIS: Cash up 18%
              </div>

              {/* Browser frame */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', position: 'relative', zIndex: 2 }}>
                <div style={{ height: '40px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
                  {['#EF4444','#F59E0B','#22C55E'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  <div style={{ flex: 1, height: '22px', background: 'var(--bg-input)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 12px', marginLeft: '6px' }}>
                    <Shield size={10} style={{ color: '#22C55E', marginRight: '6px' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'Geist Mono, monospace' }}>app.finvosmart.com</span>
                  </div>
                </div>
                <div style={{ padding: '18px' }}>
                  {/* KPI grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginBottom: '14px' }}>
                    {[['CASH POSITION','₹48.2L','var(--gold)', '+12%'],['EMPLOYEES','247','#60A5FA', '+8'],['OUTSTANDING','₹8.4L','#F87171', '-5%'],['LEADS WON','18','#4ADE80', '+3']].map(([l,v,c,d]) => (
                      <div key={l} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{l}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: c as string }}>{v}</span>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: (d as string).startsWith('-') ? '#F87171' : '#4ADE80' }}>{d}</span>
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
                      {[55,72,48,85,68,102,82,115,96].map((v, i) => (
                        <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', height: `${(v/115)*100}%`, background: i===8 ? 'var(--btn-primary-bg)' : 'var(--gold-muted)', border: i===8 ? 'none' : '1px solid var(--border-strong)', transition: 'height 0.5s' }} />
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
      <section ref={statsRef} style={{ padding: '0 0 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={S.container()}>
          <div className="stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', padding: '40px 0' }}>
            {[
              { v: `${Math.round(cModules)}`, suffix: '', label: 'Integrated modules' },
              { v: cUptime.toFixed(1), suffix: '%', label: 'Uptime SLA' },
              { v: `${Math.round(cHours)}`, suffix: 'hrs', label: 'Saved monthly, avg.' },
              { v: `${Math.round(cLang)}`, suffix: '', label: 'Indian languages' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px' }}>
            {[
              { name: 'Razorpay', icon: <CreditCard size={16} /> },
              { name: 'WhatsApp', icon: <MessageCircle size={16} /> },
              { name: 'GSTN Portal', icon: <Shield size={16} /> },
              { name: 'Aadhaar eSign', icon: <PenLine size={16} /> },
              { name: 'ICICI / HDFC Banks', icon: <Building2 size={16} /> },
              { name: 'Tally Import', icon: <RefreshCw size={16} /> },
              { name: 'Excel / CSV', icon: <FileText size={16} /> },
              { name: 'Open API', icon: <Globe size={16} /> },
            ].map(t => (
              <div key={t.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--gold)' }}>{t.icon}</span>{t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROBLEMS ════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="problems">
        <div style={S.container()}>
          <div ref={rev1.ref} style={{ ...rev1.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>The problem</span>
            <h2 style={S.h2()}>Running a business on 7 disconnected apps</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Most Indian SMEs stitch together Tally, spreadsheets, WhatsApp and a payroll tool. Data lives everywhere, nothing talks, and month-end is chaos.</p>
          </div>
          <div className="prob-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} ref={rev2.ref}>
            {[
              { color: '#EF4444', icon: <FileText size={20} />, title: 'GST filing nightmares', desc: 'Manual reconciliation, missed ITC, last-minute scrambles before deadlines.' },
              { color: '#F59E0B', icon: <RefreshCw size={20} />, title: 'Data re-entry everywhere', desc: 'The same invoice typed into Tally, Excel, and WhatsApp — three times over.' },
              { color: '#EC4899', icon: <Package2 size={20} />, title: 'Inventory stockouts', desc: 'No demand forecasting — over-stocked or out-of-stock at the worst moments.' },
              { color: '#8B5CF6', icon: <Users size={20} />, title: 'Payroll & attendance silos', desc: 'Disconnected HR tools mean errors, delays, and frustrated employees.' },
              { color: '#3B82F6', icon: <DollarSign size={20} />, title: 'No cash flow visibility', desc: 'You find out about a cash crunch when it is already too late to act.' },
              { color: '#14B8A6', icon: <Globe size={20} />, title: 'Tools built for the West', desc: 'No native TDS, e-invoicing, Aadhaar eSign or vernacular support.' },
            ].map((p, i) => (
              <div key={i} style={{ ...rev2.style, transitionDelay: `${i * 60}ms`, ...S.card() }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = p.color + '55'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: p.color + '18', color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{p.icon}</div>
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
          <div ref={rev3.ref} style={{ ...rev3.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>One platform</span>
            <h2 style={S.h2()}>Every module your business needs</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>14 fully-integrated modules sharing one database. Set up a customer once — they flow through invoicing, CRM, projects and accounting automatically.</p>
          </div>
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }} ref={rev4.ref}>
            {[
              { label:'Dashboard',   icon:<BarChart3 size={22} />,   color:'var(--gold)' },
              { label:'HRMS',        icon:<Users size={22} />,        color:'#2563EB' },
              { label:'Finance',     icon:<DollarSign size={22} />,   color:'#16A34A' },
              { label:'Invoicing',   icon:<FileText size={22} />,     color:'var(--gold)' },
              { label:'Procurement', icon:<ShoppingCart size={22} />, color:'#EA580C' },
              { label:'Inventory',   icon:<Boxes size={22} />,        color:'#0D9488' },
              { label:'CRM',         icon:<TrendingUp size={22} />,   color:'#7C3AED' },
              { label:'Projects',    icon:<FolderOpen size={22} />,   color:'#DB2777' },
              { label:'Analytics',   icon:<BarChart3 size={22} />,    color:'#2563EB' },
              { label:'Compliance',  icon:<Shield size={22} />,       color:'#16A34A' },
              { label:'Workflow',    icon:<Layers size={22} />,       color:'#7C3AED' },
              { label:'AI Suite',    icon:<Brain size={22} />,        color:'var(--gold)' },
              { label:'Settings',    icon:<Settings size={22} />,     color:'#64748B' },
              { label:'+ More',      icon:<Sparkles size={22} />,     color:'#EC4899' },
            ].map((m, i) => (
              <div key={m.label} style={{ ...rev4.style, transitionDelay: `${i * 35}ms`, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 12px', textAlign: 'center', cursor: 'default', transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = m.color + '66'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ color: m.color, display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{m.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON ═══════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="compare">
        <div style={S.container()}>
          <div ref={revCmp.ref} style={{ ...revCmp.style, textAlign: 'center', maxWidth: '760px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>Why switch</span>
            <h2 style={S.h2()}>One platform vs. a stack of compromises</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Tally does accounting. Zoho needs ten separate apps. Odoo and Salesforce are built for the West. FINVOSMART does it all — natively, for India.</p>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '20px 24px', fontWeight: 500, color: 'var(--text-muted)', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>Capability</th>
                  {[
                    { n: 'FINVOSMART', hl: true },
                    { n: 'Tally', hl: false },
                    { n: 'Zoho', hl: false },
                    { n: 'Odoo', hl: false },
                    { n: 'Salesforce', hl: false },
                  ].map(col => (
                    <th key={col.n} style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: col.hl ? '1px solid var(--gold)' : 'none', borderRight: col.hl ? '1px solid var(--gold)' : 'none', borderTop: col.hl ? '2px solid var(--gold)' : 'none', background: col.hl ? 'var(--gold-muted)' : 'transparent' }}>
                      <span style={{ fontFamily: col.hl ? "'Instrument Serif', serif" : 'inherit', fontSize: col.hl ? '17px' : '14px', fontWeight: col.hl ? 400 : 600, color: col.hl ? 'var(--gold)' : 'var(--text-secondary)' }}>{col.n}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { cap: 'All-in-one (HR + Finance + CRM + Inventory)', vals: [true, false, 'addon', true, false] },
                  { cap: 'Native GST e-Invoicing & e-Way Bill', vals: [true, true, true, 'addon', false] },
                  { cap: 'TDS & Indian statutory compliance', vals: [true, true, 'partial', false, false] },
                  { cap: 'WhatsApp billing & collections', vals: [true, false, 'addon', false, 'addon'] },
                  { cap: 'AI cash-flow forecasting', vals: [true, false, false, false, 'partial'] },
                  { cap: 'Vernacular & voice (5 Indian languages)', vals: [true, false, false, false, false] },
                  { cap: 'Cloud-native, access anywhere', vals: [true, 'partial', true, true, true] },
                  { cap: 'Affordable for Indian SMEs', vals: [true, true, 'partial', 'partial', false] },
                ].map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: ri < 7 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.cap}</td>
                    {row.vals.map((v, ci) => (
                      <td key={ci} style={{ padding: '16px', textAlign: 'center', borderLeft: ci === 0 ? '1px solid var(--gold)' : 'none', borderRight: ci === 0 ? '1px solid var(--gold)' : 'none', background: ci === 0 ? 'var(--gold-muted)' : 'transparent' }}>
                        {v === true ? <Check size={18} style={{ color: ci === 0 ? 'var(--gold)' : '#22C55E' }} />
                          : v === false ? <X size={16} style={{ color: '#EF4444', opacity: 0.55 }} />
                          : <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{v === 'addon' ? 'paid add-on' : v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>Comparison reflects standard-plan capabilities as of 2026. All competitor names are trademarks of their respective owners.</p>
        </div>
      </section>

      {/* ═══ AI USPs ═════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }} id="ai-features">
        <div style={S.container()}>
          <div ref={rev5.ref} style={{ ...rev5.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}><Sparkles size={13} style={{ verticalAlign: '-2px' }} /> AI, built in</span>
            <h2 style={S.h2()}>Intelligence that works while you sleep</h2>
            <p style={{ ...S.sub(), margin: '0 auto' }}>Six AI features designed for Indian business realities — from cash flow prediction to WhatsApp billing in five languages.</p>
          </div>
          <div className="usp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} ref={rev6.ref}>
            {[
              { icon:<Zap size={22} />,          color:'#8B5CF6', title:'ARIS Cash Flow Oracle', desc:'Predicts payment delays and cash crunches weeks before they happen.' },
              { icon:<MessageCircle size={22} />, color:'#22C55E', title:'WhatsApp Business Hub', desc:'Send GST invoices, collect payments and chat with customers — all in WhatsApp.' },
              { icon:<Camera size={22} />,        color:'#F59E0B', title:'Bill Scanner OCR', desc:'Snap a photo of any bill — it is digitised, categorised and booked instantly.' },
              { icon:<RefreshCw size={22} />,     color:'#14B8A6', title:'GST Auto-Reconciler', desc:'Matches GSTR-2B automatically and recovers every rupee of eligible ITC.' },
              { icon:<Mic size={22} />,           color:'#EC4899', title:'BharatVoice', desc:'Run your business by voice in Hindi, Tamil, Telugu, Marathi and Bengali.' },
              { icon:<Heart size={22} />,         color:'#EF4444', title:'Wellness AI', desc:'Detects employee burnout risk from attendance and workload patterns.' },
            ].map((f, i) => (
              <div key={i} style={{ ...rev6.style, transitionDelay: `${i * 60}ms`, ...S.card({ background: 'var(--bg-card)' }) }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = f.color + '55'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: f.color + '18', color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '9px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ══════════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-base)' }} id="pricing">
        <div style={S.container()}>
          <div ref={rev7.ref} style={{ ...rev7.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px' }}>
            <span style={S.eyebrow()}>Pricing</span>
            <h2 style={S.h2()}>Simple, transparent, India-priced</h2>
            <p style={{ ...S.sub(), margin: '0 auto 28px' }}>One subscription for everything. No per-module fees, no surprises.</p>
            {/* Billing toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '100px' }}>
              <button onClick={() => setAnnualBilling(false)} style={{ padding: '8px 18px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: !annualBilling ? 'var(--btn-primary-bg)' : 'transparent', color: !annualBilling ? 'var(--text-on-gold)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>Monthly</button>
              <button onClick={() => setAnnualBilling(true)} style={{ padding: '8px 18px', borderRadius: '100px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: annualBilling ? 'var(--btn-primary-bg)' : 'transparent', color: annualBilling ? 'var(--text-on-gold)' : 'var(--text-secondary)', transition: 'all 0.2s' }}>
                Annual <span style={{ fontSize: '11px', opacity: 0.85 }}>−20%</span>
              </button>
            </div>
          </div>
          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px', alignItems: 'stretch' }}>
            {[
              { name:'Starter', monthly:'4,999', annual:'3,999', users:'Up to 10 users · 1 branch', featured: false,
                feats:['Core ERP modules','HRMS + Finance','Invoicing + GST','CRM + Procurement','Standard support'] },
              { name:'Growth',  monthly:'12,999', annual:'10,399', users:'Up to 50 users · Multi-branch', featured: true,
                feats:['Everything in Starter','ARIS Cash Flow Oracle (AI)','WhatsApp Business Hub','GST Auto-Reconciler','Bill Scanner OCR','Bank Reconciliation (Auto)','Priority support'] },
              { name:'Enterprise', monthly:'29,999', annual:'23,999', users:'Unlimited users & branches', featured: false,
                feats:['Everything in Growth','All 14 ERP modules','BharatVoice (5 languages)','Custom workflows','White-labelling','Dedicated SLA support','Aadhaar eSign (unlimited)'] },
            ].map(({ name, monthly, annual, users, featured, feats }) => (
              <div key={name} style={{
                position: 'relative',
                background: featured ? 'var(--bg-card)' : 'var(--bg-card)',
                border: featured ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '20px', padding: featured ? '36px 28px' : '32px 28px',
                boxShadow: featured ? 'var(--shadow-gold)' : 'none',
                transform: featured ? 'scale(1.02)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {featured && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', padding: '5px 16px', borderRadius: '100px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Most Popular</div>
                )}
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '24px', color: featured ? 'var(--gold)' : 'var(--text-primary)', marginBottom: '6px' }}>{name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>{users}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '46px', color: featured ? 'var(--gold)' : 'var(--text-primary)', lineHeight: 1 }}>₹{annualBilling ? annual : monthly}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', height: '16px' }}>{annualBilling ? 'billed annually' : 'billed monthly'}</div>
                <Link href={name === 'Enterprise' ? '/contact' : '/login?register=1'} style={{ ...S.btn(), width: '100%', marginBottom: '24px',
                  background: featured ? 'var(--btn-primary-bg)' : 'transparent',
                  color: featured ? 'var(--text-on-gold)' : 'var(--text-primary)',
                  border: featured ? 'none' : '1px solid var(--border-strong)',
                  boxShadow: featured ? 'var(--btn-primary-shadow)' : 'none' }}>
                  {name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {feats.map(ft => (
                    <div key={ft} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <Check size={16} style={{ color: featured ? 'var(--gold)' : '#22C55E', flexShrink: 0, marginTop: '2px' }} />
                      {ft}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Build-your-own / custom plan callout */}
          <div style={{ marginTop: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', padding: '24px 30px', borderRadius: '18px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>Need something tailored? Build your own plan.</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pick only the modules you need and pay for nothing else — no locked-in bundles.</div>
              </div>
            </div>
            <Link href="/custom-plan" style={{ ...S.btn(), background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', flexShrink: 0 }}>
              Build a Custom Plan <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════════ */}
      <section style={{ ...S.section(), background: 'var(--bg-surface)' }}>
        <div style={S.container()}>
          <div ref={rev8.ref} style={{ ...rev8.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <span style={S.eyebrow()}>Built for real operations</span>
            <h2 style={S.h2()}>What running on one platform looks like</h2>
            <p style={{ ...S.sub(), margin: '0 auto', textAlign: 'center' }}>Representative scenarios from the kinds of businesses FINVOSMART is built for — manufacturers, distributors and service firms across India.</p>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '22px' }}>
            {[
              { quote:'Replacing Tally, a separate HRMS and WhatsApp billing with one system turns a two-day month-end bank reconciliation into a 40-minute task.', role:'Auto-parts manufacturer · Pune', sector:'Manufacturing', color:'var(--gold)' },
              { quote:'Automatic GSTR-2B matching surfaces eligible input-tax credit that manual reconciliation routinely misses — often several lakh across a quarter.', role:'Textile distributor · Surat', sector:'Distribution', color:'#60A5FA' },
              { quote:'ARIS flags a likely customer payment delay weeks ahead, so collections follow up early and a cash crunch is avoided before it starts.', role:'IT services firm · Bengaluru', sector:'Services', color:'#4ADE80' },
            ].map((t, i) => (
              <div key={i} style={{ ...S.card(), display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={14} style={{ color: t.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.color }}>{t.sector}</span>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '22px', flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>Illustrative scenarios based on the platform's capabilities, not specific named customers.</p>
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
              <p style={{ fontSize: '17px', color: 'var(--text-on-gold)', opacity: 0.85, marginBottom: '34px', maxWidth: '520px', margin: '0 auto 34px' }}>
                Join Indian businesses replacing seven tools with FINVOSMART. Free for 14 days.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login?register=1" style={{ ...S.btn(), background: 'var(--bg-base)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <Link href="/contact" style={{ ...S.btn(), background: 'rgba(255,255,255,0.15)', color: 'var(--text-on-gold)', border: '1px solid rgba(255,255,255,0.3)' }}>
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
          <div ref={rev9.ref} style={{ ...rev9.style, textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <span style={S.eyebrow()}>Questions</span>
            <h2 style={S.h2()}>Everything you need to know</h2>
          </div>
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { q:'How is FINVOSMART different from Tally?', a:'Tally is desktop accounting software. FINVOSMART is a complete cloud business platform — accounting plus HRMS, CRM, inventory, projects, AI and WhatsApp billing — all integrated and accessible from anywhere.' },
              { q:'Is my data secure and GST-compliant?', a:'Yes. We are fully GST-compliant with e-invoicing and e-way bills built in. Data is encrypted at rest and in transit, with role-based access control and complete audit trails.' },
              { q:'Can I migrate from my existing software?', a:'Absolutely. Our team helps you import customers, items, opening balances and historical data from Tally, Excel or any other system during onboarding.' },
              { q:'Do you support multiple branches and GSTINs?', a:'Yes. Growth and Enterprise plans support multi-branch operations and multiple GSTINs with consolidated reporting across your whole organisation.' },
              { q:'What kind of support do I get?', a:'All plans include support in English and Hindi. Growth gets priority support; Enterprise gets a dedicated account manager with an SLA. Onboarding assistance is included for everyone.' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${openFaq === i ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.25s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.q}</span>
                  <ChevronDown size={18} style={{ color: 'var(--gold)', flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                </button>
                <div style={{ maxHeight: openFaq === i ? '240px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
                  <p style={{ padding: '0 24px 22px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-mockup { display: none !important; }
          .modules-grid { grid-template-columns: repeat(5, 1fr) !important; }
          #hero { min-height: auto !important; padding: 120px 0 72px !important; }
        }
        @media (max-width: 768px) {
          .prob-grid, .usp-grid, .pricing-grid, .testi-grid { grid-template-columns: 1fr !important; }
          .modules-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .stats-bar { grid-template-columns: repeat(2, 1fr) !important; gap: 32px 16px !important; }
          .stats-bar > div { border-left: none !important; }
          section { padding-top: 72px !important; padding-bottom: 72px !important; }
          .pricing-grid > div { transform: none !important; }
        }
        @media (max-width: 480px) {
          .modules-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      ` }} />
    </div>
  )
}
