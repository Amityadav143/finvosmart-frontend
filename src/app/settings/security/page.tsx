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
import type { ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  AlertTriangle, Check, Copy, Download, Eye, EyeOff, KeyRound, LogOut, Monitor, RefreshCw, Shield, ShieldCheck, Smartphone,
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { apiError } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/slices/authStore'
import type { AuthResponse } from '@/types'

interface MfaStatus { mfaEnabled: boolean; backupCodesLeft: number }
interface MfaSetup { secret: string; secretGrouped: string; otpauthUri: string; qrCode: string; issuer: string; account: string }

/** Same rule as sign-up and the server: 8+ characters with a letter and a number, at most 72 bytes. */
function passwordProblem(p: string): string | null {
  if (p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Use at least 8 characters, with a letter and a number.'
  if (new TextEncoder().encode(p).length > 72) return 'Use 72 characters or fewer.'
  return null
}

/** Digits and a dash only: a 6-digit app code or an 8-digit backup code ("1234-5678"). */
const codeInput = (v: string) => v.replace(/[^\d-]/g, '').slice(0, 9)
const looksLikeCode = (v: string) => /^\d{6}$/.test(v) || /^\d{4}-?\d{4}$/.test(v)

function Card({ icon, title, badge, children }: { icon: ReactNode; title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="card" style={{ padding: '24px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 }}>{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  )
}

const muted = { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 } as const

export default function SecurityPage() {
  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 className="page-title">Sign-in &amp; security</h1>
      <p className="page-subtitle">Your password, two-step sign-in and the devices signed in to your account.</p>
      <PasswordCard />
      <TwoStepCard />
      <DevicesCard />
    </div>
  )
}

// ── Password ──────────────────────────────────────────────────────────────────

function PasswordCard() {
  const setAuth = useAuthStore(s => s.setAuth)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const problem = pwForm.next ? passwordProblem(pwForm.next) : null
  const mismatch = !!pwForm.confirm && pwForm.confirm !== pwForm.next

  const changePassword = async () => {
    if (!pwForm.current) return toast.error('Enter your current password.')
    const p = passwordProblem(pwForm.next)
    if (p) return toast.error(p)
    if (pwForm.next !== pwForm.confirm) return toast.error('The new passwords don’t match.')
    setSaving(true)
    try {
      const res = await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      const auth = res.data?.data as AuthResponse | undefined
      if (auth?.accessToken) setAuth(auth)        // this device stays signed in with fresh tokens
      toast.success('Password changed. Your other devices have been signed out.')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e: any) {
      toast.error(apiError(e, 'The password could not be changed. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  const rules = [
    { ok: pwForm.next.length >= 8, label: '8 or more characters' },
    { ok: /[A-Za-z]/.test(pwForm.next), label: 'a letter' },
    { ok: /\d/.test(pwForm.next), label: 'a number' },
  ]

  return (
    <Card icon={<KeyRound size={20} style={{ color: 'var(--gold)' }} />} title="Password">
      <p style={{ ...muted, marginBottom: '16px' }}>
        Changing it signs you out on every other device — handy if you think someone else knows it.
      </p>
      <form onSubmit={e => { e.preventDefault(); changePassword() }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '360px' }}>
        <div>
          <label className="label" htmlFor="pw-current">Current password</label>
          <input id="pw-current" type={show ? 'text' : 'password'} className="input h-10" autoComplete="current-password"
            value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="pw-new">New password</label>
          <input id="pw-new" type={show ? 'text' : 'password'} className="input h-10" autoComplete="new-password"
            value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: '8px' }}>
            {rules.map(r => (
              <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: r.ok ? '#059669' : 'var(--text-muted)' }}>
                <Check size={12} style={{ opacity: r.ok ? 1 : 0.35 }} /> {r.label}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pw-confirm">Type the new password again</label>
          <input id="pw-confirm" type={show ? 'text' : 'password'} className="input h-10" autoComplete="new-password"
            value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          {mismatch && <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '6px' }}>The passwords don’t match yet.</p>}
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={() => setShow(v => !v)} style={{ alignSelf: 'flex-start', height: '28px' }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />} {show ? 'Hide passwords' : 'Show passwords'}
        </button>
        <button type="submit" className="btn-primary h-10" disabled={saving || !pwForm.current || !!problem || mismatch || !pwForm.confirm}>
          {saving ? 'Changing…' : 'Change password'}
        </button>
        <p style={{ ...muted, fontSize: '12px', color: 'var(--text-muted)' }}>
          Forgot your current password? Sign out and choose “Forgot password?” on the sign-in page.
        </p>
      </form>
    </Card>
  )
}

// ── Two-step sign-in ──────────────────────────────────────────────────────────

type Step = 'idle' | 'scan' | 'codes' | 'turn-off' | 'renew'

function TwoStepCard() {
  const qc = useQueryClient()
  const { data: status, isLoading, isError, refetch } = useQuery<MfaStatus>({
    queryKey: ['mfa-status'],
    queryFn: () => api.get('/auth/mfa/status').then(r => r.data.data),
  })
  const [step, setStep] = useState<Step>('idle')
  const [setup, setSetup] = useState<MfaSetup | null>(null)
  const [codes, setCodes] = useState<string[]>([])
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const on = !!status?.mfaEnabled

  const reset = () => { setStep('idle'); setCode(''); setSetup(null) }

  const start = async () => {
    setBusy(true)
    try {
      const res = await api.post('/auth/mfa/setup')
      setSetup(res.data.data); setCode(''); setStep('scan')
    } catch (e: any) {
      toast.error(apiError(e, 'Two-step sign-in could not be started. Please try again.'))
    } finally { setBusy(false) }
  }

  const confirmSetup = async () => {
    if (!/^\d{6}$/.test(code)) return toast.error('Enter the 6-digit code your app shows.')
    setBusy(true)
    try {
      const res = await api.post('/auth/mfa/enable', { code })
      setCodes(res.data.data?.backupCodes ?? []); setStep('codes'); setCode(''); setSetup(null)
      qc.invalidateQueries({ queryKey: ['mfa-status'] })
      toast.success('Two-step sign-in is on.')
    } catch (e: any) {
      toast.error(apiError(e, 'That code didn’t match. Enter the code your app shows now.'))
    } finally { setBusy(false) }
  }

  const turnOff = async () => {
    if (!looksLikeCode(code)) return toast.error('Enter the 6-digit code from your app, or a backup code.')
    setBusy(true)
    try {
      await api.post('/auth/mfa/disable', { code })
      qc.invalidateQueries({ queryKey: ['mfa-status'] })
      reset()
      toast.success('Two-step sign-in is off.')
    } catch (e: any) {
      toast.error(apiError(e, 'That code didn’t match.'))
    } finally { setBusy(false) }
  }

  const renew = async () => {
    if (!looksLikeCode(code)) return toast.error('Enter the 6-digit code from your app.')
    setBusy(true)
    try {
      const res = await api.post('/auth/mfa/backup-codes', { code })
      setCodes(res.data.data?.backupCodes ?? []); setStep('codes'); setCode('')
      qc.invalidateQueries({ queryKey: ['mfa-status'] })
      toast.success('New backup codes ready. The old ones no longer work.')
    } catch (e: any) {
      toast.error(apiError(e, 'That code didn’t match.'))
    } finally { setBusy(false) }
  }

  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`) }
    catch { toast('Select the text and copy it yourself.') }
  }

  const badge = isLoading ? null : (
    <span data-testid="mfa-state" className="badge" style={{
      background: on ? 'rgba(5,150,105,0.12)' : 'rgba(100,116,139,0.12)', color: on ? '#059669' : 'var(--text-muted)', fontWeight: 700,
    }}>{on ? 'On' : 'Off'}</span>
  )

  return (
    <Card icon={on ? <ShieldCheck size={20} style={{ color: '#059669' }} /> : <Shield size={20} style={{ color: 'var(--text-muted)' }} />}
      title="Two-step sign-in" badge={badge}>
      <p style={{ ...muted, marginBottom: '16px' }}>
        After your password, Finvosmart also asks for a code from an authenticator app on your phone — so a stolen password alone
        is not enough to get in.
      </p>

      {isLoading ? (
        <div className="skeleton" style={{ height: '44px', borderRadius: '10px' }} />
      ) : isError ? (
        <div style={{ ...muted, color: '#dc2626' }}>
          The setting could not be loaded. <button className="btn-ghost text-xs" onClick={() => refetch()}>Try again</button>
        </div>
      ) : step === 'codes' ? (
        <BackupCodes codes={codes} onCopy={() => copy(codes.join('\n'), 'Backup codes')} onDone={reset} />
      ) : step === 'scan' && setup ? (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: '18px' }}>
            {/* Drawn by the server as an image address: the secret never goes to another website. */}
            <img src={setup.qrCode} alt="QR code to scan with your authenticator app" width={168} height={168}
              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', padding: '6px', flexShrink: 0 }} />
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <ol style={{ ...muted, paddingLeft: '18px', margin: '0 0 12px', listStyle: 'decimal' }}>
                <li>Open Google Authenticator, Microsoft Authenticator or Authy on your phone.</li>
                <li>Add an account and scan this QR code.</li>
                <li>Type the 6-digit code it shows below.</li>
              </ol>
              <p style={{ ...muted, fontSize: '12px', marginBottom: '6px' }}>Can’t scan? Enter this key in the app instead:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <code data-testid="mfa-key" style={{ flex: 1, fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.08em', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {setup.secretGrouped}
                </code>
                <button className="btn-icon w-8 h-8" onClick={() => copy(setup.secret, 'Key')} aria-label="Copy the key"><Copy size={13} /></button>
              </div>
              <p style={{ ...muted, fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                It will be listed as <strong>{setup.issuer}</strong> — {setup.account}. Time-based, 6 digits.
              </p>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); confirmSetup() }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input id="mfa-code" className="input h-10 font-mono text-center" style={{ maxWidth: '150px', fontSize: '18px', letterSpacing: '0.3em' }}
              inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} aria-label="6-digit code"
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            <button type="submit" className="btn-primary h-10" disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Confirm and turn on'}
            </button>
            <button type="button" className="btn-secondary h-10" onClick={reset} disabled={busy}>Cancel</button>
          </form>
        </div>
      ) : !on ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {[
              { icon: Smartphone, text: 'Install an authenticator app on your phone' },
              { icon: KeyRound, text: 'Scan the QR code we show you' },
              { icon: Check, text: 'Type the code to switch it on — and keep the backup codes' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ padding: '12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <Icon size={16} style={{ color: 'var(--gold)', marginBottom: '6px' }} />
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
          <button className="btn-primary h-10" onClick={start} disabled={busy}>
            {busy ? <RefreshCw size={15} className="animate-spin" /> : <Shield size={15} />} Turn on two-step sign-in
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
            background: (status?.backupCodesLeft ?? 0) <= 2 ? 'rgba(217,119,6,0.08)' : 'var(--bg-surface)',
            border: `1px solid ${(status?.backupCodesLeft ?? 0) <= 2 ? 'rgba(217,119,6,0.3)' : 'var(--border)'}` }}>
            {(status?.backupCodesLeft ?? 0) <= 2 && <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0 }} />}
            <span data-testid="backup-left" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {status?.backupCodesLeft === 0
                ? 'You have no backup codes left — get new ones so you can still sign in if you lose your phone.'
                : `${status?.backupCodesLeft} backup code${status?.backupCodesLeft === 1 ? '' : 's'} left for when your phone isn’t to hand.`}
            </span>
          </div>
          {step === 'turn-off' || step === 'renew' ? (
            <form onSubmit={e => { e.preventDefault(); step === 'turn-off' ? turnOff() : renew() }}>
              <label className="label" htmlFor="mfa-check">
                {step === 'turn-off' ? 'To turn it off, enter the code your app shows (or a backup code)' : 'Enter the code your app shows'}
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input id="mfa-check" className="input h-10 font-mono text-center" style={{ maxWidth: '170px', fontSize: '16px', letterSpacing: '0.2em' }}
                  inputMode="numeric" autoComplete="one-time-code" placeholder="000000" value={code}
                  onChange={e => setCode(codeInput(e.target.value))} autoFocus />
                <button type="submit" className={step === 'turn-off' ? 'btn-danger h-10' : 'btn-primary h-10'} disabled={busy || !looksLikeCode(code)}>
                  {busy ? 'Checking…' : step === 'turn-off' ? 'Turn off' : 'Get new backup codes'}
                </button>
                <button type="button" className="btn-secondary h-10" onClick={reset} disabled={busy}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn-secondary h-9 text-sm" onClick={() => { setCode(''); setStep('renew') }}>
                <RefreshCw size={14} /> Get new backup codes
              </button>
              <button className="btn-ghost h-9 text-sm" onClick={() => { setCode(''); setStep('turn-off') }}>Turn off two-step sign-in</button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function BackupCodes({ codes, onCopy, onDone }: { codes: string[]; onCopy: () => void; onDone: () => void }) {
  const [saved, setSaved] = useState(false)
  const download = () => {
    const text = ['Finvosmart backup codes', `Made on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, '',
      ...codes, '', 'Each code works once, in place of a code from your authenticator app.'].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'finvosmart-backup-codes.txt'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div>
      <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.25)', marginBottom: '14px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Save your backup codes</p>
        <p style={{ ...muted, marginBottom: '12px' }}>
          If you lose your phone, each code lets you sign in once. This is the only time they are shown — keep them somewhere safe, away from your phone.
        </p>
        <div data-testid="backup-codes" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '6px' }}>
          {codes.map(c => (
            <code key={c} style={{ padding: '7px 10px', background: 'var(--bg-card)', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-primary)', textAlign: 'center', border: '1px solid var(--border)' }}>{c}</code>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button className="btn-secondary h-9 text-sm" onClick={onCopy}><Copy size={14} /> Copy</button>
          <button className="btn-secondary h-9 text-sm" onClick={download}><Download size={14} /> Download</button>
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} /> I’ve saved these codes
      </label>
      <button className="btn-primary h-10" disabled={!saved} onClick={onDone}>Done</button>
    </div>
  )
}

// ── Signed-in devices ─────────────────────────────────────────────────────────

function DevicesCard() {
  const setAuth = useAuthStore(s => s.setAuth)
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)

  const signOutOthers = async () => {
    setBusy(true)
    try {
      const res = await api.post('/auth/sessions/sign-out-others')
      const auth = res.data?.data as AuthResponse | undefined
      if (auth?.accessToken) setAuth(auth)
      setAsking(false)
      toast.success('Signed out of all other devices.')
    } catch (e: any) {
      toast.error(apiError(e, 'That didn’t work. Please try again.'))
    } finally { setBusy(false) }
  }

  return (
    <Card icon={<Monitor size={20} style={{ color: 'var(--gold)' }} />} title="Signed-in devices">
      <p style={{ ...muted, marginBottom: '14px' }}>
        Signed in on a shared computer, or on a phone you no longer have? Sign out everywhere except here. Those devices will
        need your password (and code, if two-step sign-in is on) to get back in.
      </p>
      {asking ? (
        <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <p style={{ ...muted, marginBottom: '10px' }}>
            Every other browser and phone signed in to your account will be signed out within a minute. You stay signed in here.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn-danger h-9 text-sm" onClick={signOutOthers} disabled={busy}>
              <LogOut size={14} /> {busy ? 'Signing out…' : 'Yes, sign them out'}
            </button>
            <button className="btn-secondary h-9 text-sm" onClick={() => setAsking(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-secondary h-10" onClick={() => setAsking(true)}>
          <LogOut size={15} /> Sign out of all other devices
        </button>
      )}
    </Card>
  )
}
