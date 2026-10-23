'use client'
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

import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { PLANS } from '@/lib/seo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const SALES_EMAIL = 'contact@finvosmart.com'
const SIZES = ['1–10 employees', '11–50 employees', '51–200 employees', '200+ employees']

const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '7px', fontWeight: 600 }
const req = <span aria-hidden="true" style={{ color: 'var(--gold)' }}> *</span>

type Status = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string; offline?: boolean }

/**
 * The demo request form. It really sends: to POST /public/demo-requests, which stores the
 * request and emails the sales inbox. "Sent" is shown only when the server says so; if the
 * server can't be reached, the visitor gets a ready-written email instead.
 */
export function DemoRequestForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', companySize: '', plan: 'Growth', message: '', website: '' })
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const mailto = () => {
    const lines = [`Name: ${form.name}`, `Email: ${form.email}`, form.phone ? `Phone: ${form.phone}` : '', `Company: ${form.company}`,
      form.companySize ? `Company size: ${form.companySize}` : '', form.plan ? `Interested in: ${form.plan}` : ''].filter(Boolean)
    const body = [...lines, '', form.message].join('\n')
    return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Demo request: ${form.company || form.name}`)}&body=${encodeURIComponent(body)}`
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'sending' })
    try {
      const res = await fetch(`${API_URL}/public/demo-requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, page: window.location.pathname }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success !== false) { setStatus({ kind: 'sent' }); return }
      setStatus({ kind: 'error', message: data?.error || 'Your request could not be sent. Please check the form and try again.' })
    } catch {
      setStatus({ kind: 'error', offline: true, message: 'We couldn’t reach our server just now.' })
    }
  }

  if (status.kind === 'sent') {
    return (
      <div role="status" style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle2 size={48} style={{ color: 'var(--ok-text)', marginBottom: '16px' }} aria-hidden />
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '26px', color: 'var(--text-primary)', marginBottom: '10px' }}>Thank you — we have your request</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          We&apos;ll reply to <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong> within 4 business hours to set up your demo.
        </p>
      </div>
    )
  }

  const sending = status.kind === 'sending'
  return (
    <>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '6px' }}>Book a free demo</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Tell us a little about your business and we&apos;ll set up a walkthrough for your team.</p>

      <form onSubmit={submit} noValidate={false}>
        {/* Hidden from people (and from screen readers); only automated form-fillers fill it in. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label htmlFor="dr-website">Website</label>
          <input id="dr-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
        </div>

        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div><label htmlFor="dr-name" style={lbl}>Your name{req}</label>
            <input id="dr-name" style={inp} value={form.name} onChange={set('name')} autoComplete="name" required minLength={2} maxLength={100} /></div>
          <div><label htmlFor="dr-email" style={lbl}>Work email{req}</label>
            <input id="dr-email" type="email" style={inp} value={form.email} onChange={set('email')} autoComplete="email" required maxLength={254} /></div>
        </div>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div><label htmlFor="dr-phone" style={lbl}>Mobile number</label>
            <input id="dr-phone" type="tel" style={inp} value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} /></div>
          <div><label htmlFor="dr-company" style={lbl}>Company name{req}</label>
            <input id="dr-company" style={inp} value={form.company} onChange={set('company')} autoComplete="organization" required minLength={2} maxLength={150} /></div>
        </div>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div><label htmlFor="dr-size" style={lbl}>Company size</label>
            <select id="dr-size" style={inp} value={form.companySize} onChange={set('companySize')}>
              <option value="">Choose…</option>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select></div>
          <div><label htmlFor="dr-plan" style={lbl}>Interested in</label>
            <select id="dr-plan" style={inp} value={form.plan} onChange={set('plan')}>
              {PLANS.map(p => <option key={p.name} value={p.name}>{p.name} — ₹{p.monthly.toLocaleString('en-IN')}/mo</option>)}
              <option value="Not sure yet">Not sure yet</option>
            </select></div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="dr-message" style={lbl}>What would you like to see?</label>
          <textarea id="dr-message" style={{ ...inp, resize: 'vertical' }} rows={3} value={form.message} onChange={set('message')} maxLength={2000}
            placeholder="Your current setup (Tally, Excel…), the number of people, what you want to move first…" />
        </div>

        {status.kind === 'error' && (
          <div role="alert" style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.08)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {status.message}{' '}
            {status.offline && <>Please <a href={mailto()} style={{ color: 'var(--gold)', fontWeight: 600 }}>send it by email instead</a> — it&apos;s written for you.</>}
          </div>
        )}

        <button type="submit" disabled={sending} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', cursor: sending ? 'wait' : 'pointer', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', fontWeight: 600, fontSize: '15px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--btn-primary-shadow)', opacity: sending ? 0.8 : 1 }}>
          {sending ? 'Sending…' : <>Request a demo <ArrowRight size={16} aria-hidden /></>}
        </button>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
          We use these details only to reply to you. See our <a href="/privacy" className="text-link">privacy policy</a>.
        </p>
      </form>
    </>
  )
}
