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
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight, CheckCircle2, Copy } from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/store/slices/authStore'

type Field = 'companyName' | 'fullName' | 'email' | 'phone' | 'password' | 'gstin' | 'acceptTerms'
type Form = Record<Exclude<Field, 'acceptTerms'> | 'website', string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+0-9][0-9 -]{7,16}$/
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

// Mirrors the backend's validation, so most mistakes are caught before submitting.
function validate(f: Form, accepted: boolean): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {}
  if (f.companyName.trim().length < 2) e.companyName = 'Enter your business name'
  if (f.fullName.trim().length < 2) e.fullName = 'Enter your name'
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address'
  if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = 'Enter a valid phone number'
  if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Use at least 8 characters, with a letter and a number'
  else if (f.password.length > 72) e.password = 'Use 72 characters or fewer'
  if (f.gstin.trim() && !GSTIN_RE.test(f.gstin.trim().toUpperCase())) e.gstin = 'Enter a valid 15-character GSTIN'
  if (!accepted) e.acceptTerms = 'Please accept the Terms of Service to continue'
  return e
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-base)' }}>
      <div className="relative w-full max-w-md slide-up" style={{ padding: '24px 0' }}>
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center rounded-2xl mb-3"
                style={{ width: '52px', height: '52px', background: 'var(--btn-primary-bg)', boxShadow: 'var(--btn-primary-shadow)' }}
                aria-label="Finvosmart home">
            <Zap size={24} style={{ color: 'var(--text-on-gold)' }} />
          </Link>
          <h1 className="font-serif text-gold-grad" style={{ fontSize: '32px', letterSpacing: '-0.02em' }}>FINVOSMART</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

const cardStyle = { borderRadius: '20px', padding: '30px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)' }

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [f, setF] = useState<Form>({ companyName: '', fullName: '', email: '', phone: '', password: '', gstin: '', website: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [serverError, setServerError] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [accepted, setAccepted] = useState(false)   // consent must be an active choice: never pre-ticked
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ code: string; name: string } | null>(null)

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement>) => {
    setF(p => ({ ...p, [k]: e.target.value }))
    if (k in errors) setErrors(p => ({ ...p, [k]: undefined }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    const errs = validate(f, accepted)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      const auth = await authApi.register({
        companyName: f.companyName.trim(), fullName: f.fullName.trim(), email: f.email.trim(),
        password: f.password, phone: f.phone.trim() || undefined,
        gstin: f.gstin.trim().toUpperCase() || undefined, website: f.website, acceptTerms: accepted,
      })
      setAuth(auth)                          // signed in straight away, as the company's admin
      setDone({ code: auth.companyCode ?? '', name: auth.companyName ?? f.companyName.trim() })
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'We could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(done?.code ?? ''); toast.success('Company code copied') }
    catch { toast('Select the code and copy it manually') }
  }

  if (done) {
    return (
      <Shell>
        <div className="card text-center" style={cardStyle}>
          <CheckCircle2 size={44} style={{ color: '#22c55e', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Your account is ready</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
            {done.name} is set up, and you&apos;re signed in as its admin.
          </p>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Your company code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '12px',
                        background: 'var(--gold-muted)', border: '1px solid var(--gold)', marginBottom: '12px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--gold)', fontFamily: 'var(--font-geist-mono), monospace' }}>{done.code}</span>
            <button type="button" onClick={copyCode} className="btn-icon" aria-label="Copy company code"><Copy size={16} /></button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: 1.6 }}>
            Save it somewhere safe — you&apos;ll need it, with your email and password, every time you sign in.
          </p>
          <button type="button" className="btn-primary w-full" style={{ height: '46px' }} onClick={() => router.push('/dashboard')}>
            Go to your dashboard <ArrowRight size={16} />
          </button>
        </div>
      </Shell>
    )
  }

  const field = (k: Exclude<Field, 'acceptTerms'>, label: string, opts: { type?: string; placeholder?: string; hint?: string; optional?: boolean; autoComplete?: string; inputMode?: 'text' | 'email' | 'tel' } = {}) => (
    <div style={{ marginBottom: '14px' }}>
      <label htmlFor={`su-${k}`} style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
        {label}{opts.optional && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> (optional)</span>}
      </label>
      <input id={`su-${k}`} name={k} className="input" type={opts.type ?? 'text'} value={f[k]} onChange={set(k)}
             placeholder={opts.placeholder} autoComplete={opts.autoComplete} inputMode={opts.inputMode}
             aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `su-${k}-err` : opts.hint ? `su-${k}-hint` : undefined} />
      {errors[k]
        ? <p id={`su-${k}-err`} style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>{errors[k]}</p>
        : opts.hint && <p id={`su-${k}-hint`} style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>{opts.hint}</p>}
    </div>
  )

  return (
    <Shell>
      <div className="card" style={cardStyle}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Start your free trial</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '22px' }}>
          14 days free · No credit card · Set up in a minute
        </p>
        <form onSubmit={submit} noValidate>
          {field('companyName', 'Business name', { placeholder: 'e.g. Sharma Traders', autoComplete: 'organization' })}
          {field('fullName', 'Your name', { autoComplete: 'name' })}
          {field('email', 'Work email', { type: 'email', inputMode: 'email', autoComplete: 'email' })}
          {field('phone', 'Mobile number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', optional: true, placeholder: '+91 98765 43210' })}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="su-password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input id="su-password" name="password" className="input" type={showPwd ? 'text' : 'password'} value={f.password} onChange={set('password')}
                     autoComplete="new-password" style={{ paddingRight: '44px' }}
                     aria-invalid={!!errors.password} aria-describedby={errors.password ? 'su-password-err' : 'su-password-hint'} />
              <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password
              ? <p id="su-password-err" style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>{errors.password}</p>
              : <p id="su-password-hint" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>At least 8 characters, with a letter and a number</p>}
          </div>
          {field('gstin', 'GSTIN', { optional: true, placeholder: '27AAPFU0939F1ZV', hint: 'You can add or change this later' })}

          {/* Honeypot: hidden from people and screen readers; bots fill it in and get rejected. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label htmlFor="su-website">Website</label>
            <input id="su-website" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={accepted} style={{ marginTop: '3px', width: '16px', height: '16px', flexShrink: 0, accentColor: 'var(--gold)' }}
                     onChange={e => { setAccepted(e.target.checked); if (e.target.checked) setErrors(p => ({ ...p, acceptTerms: undefined })) }}
                     aria-invalid={!!errors.acceptTerms} aria-describedby={errors.acceptTerms ? 'su-terms-err' : undefined} />
              <span>
                I agree to the <Link href="/terms" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>Terms of Service</Link> and
                have read the <Link href="/privacy" target="_blank" rel="noopener" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
              </span>
            </label>
            {errors.acceptTerms && <p id="su-terms-err" style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px' }}>{errors.acceptTerms}</p>}
          </div>

          {serverError && (
            <div role="alert" style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                                       borderRadius: '10px', padding: '10px 12px', marginBottom: '14px' }}>{serverError}</div>
          )}
          <button type="submit" className="btn-primary w-full" style={{ height: '46px', marginTop: '6px' }} disabled={loading}>
            {loading ? 'Creating your account…' : <>Create my account <ArrowRight size={16} /></>}
          </button>
        </form>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '18px' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px', lineHeight: 1.5 }}>
          Joining your company&apos;s existing account? Ask your admin to invite you instead.
        </p>
      </div>
    </Shell>
  )
}
