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
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/lib/context/ThemeContext'
import { useGoogleSignIn } from '@/lib/hooks/useGoogleSignIn'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react'
import { apiError } from '@/lib/utils'

/**
 * Where to go after signing in: the page that sent the user here (?next=/invoicing/123), or the
 * dashboard. Only paths on this site are accepted, so the link can't send anyone elsewhere.
 */
function nextPath(): string {
  if (typeof window === 'undefined') return '/dashboard'
  const next = new URLSearchParams(window.location.search).get('next') || ''
  return /^\/(?![\/\\])[^\s]*$/.test(next) && !next.startsWith('/login') ? next : '/dashboard'
}

export default function LoginPage() {
  const router   = useRouter()
  const { setAuth } = useAuthStore()
  const { toggle, isDark } = useTheme()

  const [form, setForm]       = useState({ email: '', password: '', companyCode: '' })
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'login'|'mfa'>('login')
  const [mfaSession, setMfaSession] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [welcomeNew, setWelcomeNew] = useState(false)
  const [expired, setExpired] = useState(false)       // sent here because the session ended
  const [useBackup, setUseBackup] = useState(false)   // second step: a backup code instead of the app

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
    // New visitors arriving from a "Start Free Trial" CTA get a friendly welcome.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('expired') === '1') setExpired(true)
      if (params.get('register') === '1' || params.get('trial') === '1') {
        // Old "start trial" links pointed here; self-service sign-up now has its own page.
        router.replace('/register')
      }
    }
  }, [])

  // Already signed in (e.g. came back via a link): go straight to the page asked for.
  useEffect(() => {
    const go = () => { if (useAuthStore.getState().isAuthenticated) router.replace(nextPath()) }
    if (useAuthStore.persist.hasHydrated()) go()
    return useAuthStore.persist.onFinishHydration(go)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finishLogin = (auth: any) => {
    // Multi-company users get a chooser instead of tokens
    if (auth?.companyChooser?.length) {
      setCompanyChoices(auth.companyChooser)
      toast('Select your company to continue')
      return false
    }
    if (auth?.mfaPending) {
      setMfaSession(auth.mfaSessionToken); setMfaCode(''); setUseBackup(false); setStep('mfa')
      return false
    }
    setAuth(auth)
    toast.success(`Welcome${auth.fullName ? ', ' + auth.fullName.split(' ')[0] : ''}!`)
    router.push(nextPath())
    return true
  }

  // ── Google sign-in (GIS) ───────────────────────────────────────────────
  // When Google returns an ID token, exchange it for a FINVOSMART session.
  const google = useGoogleSignIn(async (idToken: string) => {
    setLoading(true)
    try {
      const auth = await authApi.google(idToken, form.companyCode || undefined)
      finishLogin(auth)
    } catch (err: any) {
      toast.error(apiError(err, 'Google sign-in failed'))
    } finally { setLoading(false) }
  })

  // Show Google's official button in the Social tab once GIS has loaded.
  const googleBtnRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (tab === 'social' && google.ready) google.renderButton(googleBtnRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, google.ready])

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
      toast.error(apiError(err, 'Could not send code'))
    } finally { setLoading(false) }
  }

  const verifyOtp = async () => {
    if (!otpCode) { toast.error('Enter the code'); return }
    setLoading(true)
    try {
      const auth = await authApi.verifyOtp(otpId, otpCode, otpChannel, otpCompany || undefined)
      finishLogin(auth)
    } catch (err: any) {
      toast.error(apiError(err, 'Invalid code'))
    } finally { setLoading(false) }
  }

  // ── Social handlers ────────────────────────────────────────────────────
  const socialLogin = async (provider: 'GOOGLE') => {
    if (provider !== 'GOOGLE' || !google.configured) return
    if (!google.ready) {
      toast('Google sign-in is still loading — please try again in a moment.')
      return
    }
    google.prompt()   // GIS callback (set above) exchanges the token and logs in
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
      toast.error(apiError(err, 'Could not sign in to that company'))
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
      toast.error(apiError(err, 'Invalid credentials. Please try again.'))
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
          <p className="font-serif text-gold-grad" style={{ fontSize: '36px', letterSpacing: '-0.02em' }}>
            FINVOSMART
          </p>
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
                Sign in with the credentials provided to you, or <Link href="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>start your own free trial</Link>.
              </div>
            </div>
          )}
          {expired && step === 'login' && (
            <div role="status" data-testid="session-ended" style={{ marginBottom: '18px', padding: '12px 14px', borderRadius: '12px', background: 'var(--gold-muted)', border: '1px solid var(--border-strong)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your session ended. Sign in again to pick up where you left off.
            </div>
          )}
          <h1 className="font-serif text-xl mb-5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em', fontWeight: 400 }}>
            {welcomeNew ? 'Get started' : 'Sign in to Finvosmart'}
          </h1>

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
            <form className="space-y-4" onSubmit={async e => {
              e.preventDefault()
              const ready = useBackup ? /^\d{4}-?\d{4}$/.test(mfaCode) : mfaCode.length === 6
              if (!ready || loading) return
              setLoading(true)
              try {
                const auth = await authApi.verifyMfa(mfaSession, mfaCode)
                setAuth(auth); toast.success(`Welcome back${auth.fullName ? ', ' + auth.fullName.split(' ')[0] : ''}!`); router.push(nextPath())
              } catch (err: any) {
                const msg = apiError(err, 'That code didn’t match. Try again.')
                toast.error(msg)
                setMfaCode('')
                if (/sign in again/i.test(msg)) { setStep('login'); setForm(f => ({ ...f, password: '' })) }
              } finally { setLoading(false) }
            }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {useBackup ? 'Enter one of your backup codes. Each one works once.' : 'Enter the 6-digit code from your authenticator app.'}
              </p>
              <input className="input" inputMode="numeric" autoComplete="one-time-code" autoFocus aria-label={useBackup ? 'Backup code' : '6-digit code'}
                maxLength={useBackup ? 9 : 6} value={mfaCode}
                onChange={e => setMfaCode(useBackup ? e.target.value.replace(/[^\d-]/g, '').slice(0, 9) : e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={useBackup ? '1234-5678' : '000000'}
                style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '20px' }} />
              <button type="submit" className="btn-primary w-full" style={{ height: '44px' }}
                disabled={loading || !(useBackup ? /^\d{4}-?\d{4}$/.test(mfaCode) : mfaCode.length === 6)}>
                {loading ? 'Checking…' : 'Verify & Sign In'}
              </button>
              <button type="button" onClick={() => { setUseBackup(v => !v); setMfaCode('') }} className="text-xs w-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontFamily: 'inherit' }}>
                {useBackup ? 'Use the code from my app instead' : 'Lost your phone? Use a backup code'}
              </button>
              <button type="button" onClick={() => { setStep('login'); setMfaCode('') }} className="text-xs w-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                ← Back to login
              </button>
            </form>
          ) : (
          <>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--bg-surface)', borderRadius: '12px', marginBottom: '20px' }}>
            {([['password','Password'],['otp','Mobile / Email'],['social','Google']] as const).filter(([id]) => id !== 'social' || google.configured).map(([id,label]) => (
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
                placeholder="e.g. NVGROW001" required autoComplete="organization" />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                It’s in your welcome email. Don’t have it?{' '}
                <button type="button" onClick={() => { setTab('otp'); setOtpSent(false); setDevHint('') }}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--gold)', fontFamily: 'inherit', fontSize: '12px' }}>
                  Sign in with a code sent to your mobile or email
                </button>{' '}— no company code needed.
              </p>
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

          {/* GOOGLE TAB — shown only where Google sign-in is set up (NEXT_PUBLIC_GOOGLE_CLIENT_ID) */}
          {tab === 'social' && (
            <div className="space-y-3">
              <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                Use the Google account with the same email as your Finvosmart login. You must already be added to a company.
              </p>
              {google.ready ? (
                <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }} />
              ) : (
                <button type="button" onClick={() => socialLogin('GOOGLE')} disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5"
                  style={{ height: '44px', borderRadius: '10px', background: '#ffffff', color: '#1f1f1f', border: '1px solid #dadce0',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600 }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>G</span> Continue with Google
                </button>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Google confirms who you are; we then match your verified email to your Finvosmart account.
              </p>
            </div>
          )}
          </>
          )}
        </div>

        {/* New here? */}
        <p className="text-center mt-5" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          New to Finvosmart?{' '}
          <Link href="/register" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Start a free trial</Link>
        </p>

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
