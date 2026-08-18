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

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/lib/context/ThemeContext'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight, Sun, Moon, ChevronDown } from 'lucide-react'

/* ── Test accounts for quick login ────────────────────────────────────── */
const TEST_ACCOUNTS = [
  { label: 'Super Admin',   email: 'admin@nvgrow.in',      role: 'SUPER_ADMIN',   color: '#f59e0b', company: 'NVGROW001' },
  { label: 'Manager',       email: 'manager@nvgrow.in',    role: 'MANAGER',       color: '#8b5cf6', company: 'NVGROW001' },
  { label: 'HR Admin',      email: 'hr@nvgrow.in',         role: 'HR_ADMIN',      color: '#ec4899', company: 'NVGROW001' },
  { label: 'Finance Admin', email: 'finance@nvgrow.in',    role: 'FINANCE_ADMIN', color: '#22c55e', company: 'NVGROW001' },
  { label: 'Accountant',    email: 'accountant@nvgrow.in', role: 'ACCOUNTANT',    color: '#0d9488', company: 'NVGROW001' },
  { label: 'Sales Exec',    email: 'sales@nvgrow.in',      role: 'SALES_EXEC',    color: '#ea580c', company: 'NVGROW001' },
  { label: 'Employee',      email: 'employee@nvgrow.in',   role: 'EMPLOYEE',      color: '#64748b', company: 'NVGROW001' },
  { label: 'Viewer',        email: 'viewer@nvgrow.in',     role: 'VIEWER',        color: '#94a3b8', company: 'NVGROW001' },
  { label: 'Starter Plan',  email: 'admin@testco.in',      role: 'COMPANY_ADMIN', color: '#3b82f6', company: 'TESTCO001' },
  { label: 'Growth Plan',   email: 'admin@demogrow.in',    role: 'COMPANY_ADMIN', color: '#7c3aed', company: 'DEMOGROW'  },
]

export default function LoginPage() {
  const router   = useRouter()
  const { setAuth } = useAuthStore()
  const { toggle, isDark } = useTheme()

  const [form, setForm]       = useState({ email: '', password: 'Admin@123', companyCode: 'NVGROW001' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'login'|'mfa'>('login')
  const [mfaSession, setMfaSession] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [welcomeNew, setWelcomeNew] = useState(false)

  // ── Multi-channel login state ──────────────────────────────────────────
  const [tab, setTab] = useState<'password'|'otp'|'social'>('password')
  const [otpChannel, setOtpChannel] = useState<'SMS'|'EMAIL'>('SMS')
  const [otpId, setOtpId] = useState('')            // phone or email
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCompany, setOtpCompany] = useState('')  // shown only if multiple companies
  const [companyChoices, setCompanyChoices] = useState<{companyCode:string;companyName:string}[]>([])
  const [devHint, setDevHint] = useState('')

  useEffect(() => {
    setMounted(true)
    // New visitors arriving from a "Start Free Trial" CTA get a friendly welcome
    // and the demo accounts expanded so they can try the product instantly.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('register') === '1' || params.get('trial') === '1') {
        setWelcomeNew(true)
        setShowDemo(true)
      }
    }
  }, [])

  const quickLogin = (acc: typeof TEST_ACCOUNTS[0]) => {
    setForm({ email: acc.email, password: 'Test@1234', companyCode: acc.company })
  }

  const finishLogin = (auth: any) => {
    // Multi-company users get a chooser instead of tokens
    if (auth?.companyChooser?.length) {
      setCompanyChoices(auth.companyChooser)
      toast('Select your company to continue')
      return false
    }
    if (auth?.mfaPending) {
      setMfaSession(auth.mfaSessionToken); setStep('mfa')
      return false
    }
    setAuth(auth)
    toast.success(`Welcome${auth.fullName ? ', ' + auth.fullName.split(' ')[0] : ''}!`)
    router.push('/dashboard')
    return true
  }

  // ── OTP handlers ───────────────────────────────────────────────────────
  const sendOtp = async () => {
    if (!otpId) { toast.error(otpChannel === 'SMS' ? 'Enter your mobile number' : 'Enter your email'); return }
    setLoading(true)
    try {
      const res = await authApi.requestOtp(otpId, otpChannel)
      setOtpSent(true)
      if (res?.devCode) setDevHint(`Dev code: ${res.devCode}`)
      toast.success('Verification code sent')
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not send code')
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (!otpCode) { toast.error('Enter the code'); return }
    setLoading(true)
    try {
      const auth = await authApi.verifyOtp(otpId, otpCode, otpChannel, otpCompany || undefined)
      finishLogin(auth)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Invalid code')
    } finally { setLoading(false) }
  }

  // ── Social handlers ────────────────────────────────────────────────────
  const socialLogin = async (provider: string) => {
    setLoading(true)
    try {
      // In production a provider SDK (Google Identity Services, MSAL, etc.) returns a
      // verified token/profile. Here we surface a clear message when not configured.
      if (provider === 'GOOGLE' && (window as any).google?.accounts?.id) {
        toast('Opening Google sign-in…')
        // The GIS callback (configured at app init) will call authApi.google(idToken)
        ;(window as any).google.accounts.id.prompt()
        return
      }
      toast.error(`${provider.charAt(0) + provider.slice(1).toLowerCase()} sign-in isn't configured on this environment yet. Add the provider credentials to enable it.`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Social sign-in failed')
    } finally { setLoading(false) }
  }

  const chooseCompany = async (code: string) => {
    setLoading(true)
    try {
      const auth = tab === 'otp'
        ? await authApi.verifyOtp(otpId, otpCode, otpChannel, code)
        : await authApi.login(form.email, form.password, code)
      setCompanyChoices([])
      finishLogin(auth)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not sign in to that company')
    } finally { setLoading(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.companyCode) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const auth = await authApi.login(form.email, form.password, form.companyCode)
      finishLogin(auth)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(var(--border-strong) 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          opacity: isDark ? 0.5 : 0.4,
        }}
      />
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none" style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(245,158,11,0.07)' : 'rgba(180,83,9,0.05)'} 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none" style={{ background: `radial-gradient(circle, ${isDark ? 'rgba(59,130,246,0.05)' : 'rgba(37,99,235,0.04)'} 0%, transparent 70%)` }} />

      {/* Theme toggle */}
      {mounted && (
        <button className="btn-icon absolute top-4 right-4 z-10" onClick={toggle} aria-label="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      )}

      <div className="relative w-full max-w-md slide-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{ width: '56px', height: '56px', background: 'var(--btn-primary-bg)', boxShadow: 'var(--btn-primary-shadow)', animation: 'float 3s ease-in-out infinite' }}
          >
            <Zap size={26} style={{ color: 'var(--text-on-gold)' }} />
          </div>
          <h1 className="font-serif text-gold-grad" style={{ fontSize: '36px', letterSpacing: '-0.02em' }}>
            FINVOSMART
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            India&apos;s Business Operating System
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            by Navgrow Engineering Service Pvt. Ltd.
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ borderRadius: '20px', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)' }}>
          {welcomeNew && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '12px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)', marginBottom: '3px' }}>👋 Welcome to FINVOSMART!</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Want to explore first? Try a demo account below — no setup needed. To start your own trial, contact our team from the <Link href="/contact" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Contact page</Link>.
              </div>
            </div>
          )}
          <h2 className="font-serif text-xl mb-5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {welcomeNew ? 'Get started' : 'Sign in to continue'}
          </h2>

          {/* Company chooser (multi-company users) */}
          {companyChoices.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your account exists in multiple companies. Choose one:
              </p>
              {companyChoices.map(c => (
                <button key={c.companyCode} onClick={() => chooseCompany(c.companyCode)} disabled={loading}
                  className="w-full flex items-center justify-between"
                  style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)',
                    background: 'var(--bg-surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{c.companyName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.companyCode}</span>
                  </span>
                  <ArrowRight size={16} style={{ color: 'var(--gold)' }} />
                </button>
              ))}
              <button onClick={() => setCompanyChoices([])} className="text-xs"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                ← Back
              </button>
            </div>
          ) : step === 'mfa' ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <input className="input" inputMode="numeric" maxLength={6} value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '20px' }} />
              <button className="btn-primary w-full" style={{ height: '44px' }} disabled={loading || mfaCode.length < 6}
                onClick={async () => {
                  setLoading(true)
                  try {
                    const auth = await authApi.verifyMfa(mfaSession, mfaCode)
                    setAuth(auth); toast.success('Welcome back!'); router.push('/dashboard')
                  } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Invalid code') }
                  finally { setLoading(false) }
                }}>
                Verify & Sign In
              </button>
              <button onClick={() => { setStep('login'); setMfaCode('') }} className="text-xs w-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                ← Back to login
              </button>
            </div>
          ) : (
          <>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--bg-surface)', borderRadius: '12px', marginBottom: '20px' }}>
            {([['password','Password'],['otp','Mobile / Email'],['social','Social']] as const).map(([id,label]) => (
              <button key={id} type="button" onClick={() => { setTab(id); setOtpSent(false); setDevHint('') }}
                style={{ flex: 1, padding: '8px 6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                  borderRadius: '8px', border: 'none', fontFamily: 'inherit',
                  background: tab === id ? 'var(--btn-primary-bg)' : 'transparent',
                  color: tab === id ? 'var(--text-on-gold)' : 'var(--text-muted)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* PASSWORD TAB */}
          {tab === 'password' && (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Company Code</label>
              <input className="input" value={form.companyCode}
                onChange={e => setForm(f => ({ ...f, companyCode: e.target.value.toUpperCase() }))}
                placeholder="e.g. NVGROW001" required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.in" required />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="label">Password</label>
                <Link href="/forgot-password" style={{ fontSize: '12.5px', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500, marginBottom: '6px' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: '44px' }} required />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" style={{ height: '44px', fontSize: '15px' }} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--text-on-gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Signing in...
                </span>
              ) : (<><span>Sign In</span><ArrowRight size={16} /></>)}
            </button>
          </form>
          )}

          {/* OTP TAB */}
          {tab === 'otp' && (
            <div className="space-y-4">
              <div style={{ display: 'flex', gap: '4px', padding: '3px', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                {([['SMS','Mobile OTP'],['EMAIL','Email OTP']] as const).map(([id,label]) => (
                  <button key={id} type="button" onClick={() => { setOtpChannel(id); setOtpSent(false); setOtpId('') }}
                    style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '7px',
                      border: 'none', fontFamily: 'inherit',
                      background: otpChannel === id ? 'var(--gold-muted)' : 'transparent',
                      color: otpChannel === id ? 'var(--gold)' : 'var(--text-muted)' }}>
                    {label}
                  </button>
                ))}
              </div>

              {!otpSent ? (
                <>
                  <div>
                    <label className="label">{otpChannel === 'SMS' ? 'Mobile Number' : 'Email Address'}</label>
                    <input className="input" type={otpChannel === 'SMS' ? 'tel' : 'email'} value={otpId}
                      onChange={e => setOtpId(e.target.value)}
                      placeholder={otpChannel === 'SMS' ? '+91 98765 43210' : 'you@company.in'} />
                  </div>
                  <button type="button" className="btn-primary w-full" style={{ height: '44px' }} disabled={loading} onClick={sendOtp}>
                    {loading ? 'Sending…' : 'Send Code'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Enter 6-digit code</label>
                    <input className="input" inputMode="numeric" maxLength={6} value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="000000"
                      style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '20px' }} />
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Sent to {otpId}. <button type="button" onClick={() => { setOtpSent(false); setOtpCode('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontFamily: 'inherit', fontSize: '12px' }}>Change</button>
                    </p>
                    {devHint && <p className="text-xs mt-1" style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{devHint}</p>}
                  </div>
                  <button type="button" className="btn-primary w-full" style={{ height: '44px' }} disabled={loading || otpCode.length < 6} onClick={verifyOtp}>
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>
                  <button type="button" onClick={sendOtp} disabled={loading} className="text-xs w-full"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                    Resend code
                  </button>
                </>
              )}
            </div>
          )}

          {/* SOCIAL TAB */}
          {tab === 'social' && (
            <div className="space-y-3">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Continue with your existing account. You must already be invited to a company.
              </p>
              {([
                ['GOOGLE','Continue with Google','#ffffff','#1f1f1f','#dadce0'],
                ['MICROSOFT','Continue with Microsoft','#ffffff','#1f1f1f','#dadce0'],
                ['APPLE','Continue with Apple','#000000','#ffffff','#000000'],
                ['LINKEDIN','Continue with LinkedIn','#0a66c2','#ffffff','#0a66c2'],
              ] as const).map(([id,label,bg,fg,bd]) => (
                <button key={id} type="button" onClick={() => socialLogin(id)} disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5"
                  style={{ height: '44px', borderRadius: '10px', background: bg, color: fg,
                    border: `1px solid ${bd}`, cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600 }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>{label.includes('Google') ? 'G' : label.includes('Microsoft') ? '⊞' : label.includes('Apple') ? '' : 'in'}</span>
                  {label}
                </button>
              ))}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Social sign-in verifies your identity with the provider, then matches your verified email to your FINVOSMART account.
              </p>
            </div>
          )}
          </>
          )}

          {/* Demo accounts */}
          {tab === 'password' && step === 'login' && companyChoices.length === 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setShowDemo(v => !v)}
              className="w-full flex items-center justify-between text-sm"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit', padding: '4px 0' }}
            >
              <span>Test accounts for role & plan testing</span>
              <ChevronDown
                size={14}
                style={{ transform: showDemo ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {showDemo && (
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {TEST_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickLogin(acc)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${form.email === acc.email ? acc.color : 'var(--border)'}`,
                      background: form.email === acc.email ? `${acc.color}10` : 'var(--bg-surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e: any) => { (e.currentTarget as HTMLElement).style.borderColor = acc.color }}
                    onMouseLeave={(e: any) => { if (form.email !== acc.email) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: acc.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.label}</span>
                    </div>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                      {acc.company} · Test@1234
                    </p>
                  </button>
                ))}
                <div
                  style={{ gridColumn: '1 / -1', padding: '8px 10px', borderRadius: '8px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}
                >
                  💡 Click any account to pre-fill the form, then click <strong style={{ color: 'var(--gold)' }}>Sign In</strong> to login.
                  <br />Super Admin password: <code style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>Admin@123</code> · All others: <code style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>Test@1234</code>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-5" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to website
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>·</span>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            © 2026 Navgrow Engineering Service Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  )
}
