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
import { Shield, Smartphone, Key, CheckCircle, Copy, RefreshCw, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api/client'
import toast from 'react-hot-toast'

type MfaStep = 'idle' | 'setup' | 'confirm' | 'done'

interface SetupData {
  secret: string
  qrCodeUrl: string
  otpauthUri: string
  backupCodes: string[]
}

export default function SecurityPage() {
  const [mfaStep, setMfaStep]       = useState<MfaStep>('idle')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [setupData, setSetupData]   = useState<SetupData | null>(null)
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.next) return toast.error('Fill in all password fields')
    if (pwForm.next.length < 8) return toast.error('New password must be at least 8 characters')
    if (pwForm.next !== pwForm.confirm) return toast.error('New passwords do not match')
    setPwSaving(true)
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      toast.success('Password updated successfully')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to update password')
    } finally {
      setPwSaving(false)
    }
  }
  const [code, setCode]             = useState('')
  const [disableCode, setDisable]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [codesRevealed, setReveal]  = useState(false)

  const startSetup = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/mfa/setup')
      setSetupData(res.data.data)
      setMfaStep('setup')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to start MFA setup')
    } finally { setLoading(false) }
  }

  const confirmEnable = async () => {
    if (code.length !== 6) { toast.error('Enter the 6-digit code from your app'); return }
    setLoading(true)
    try {
      await api.post('/auth/mfa/enable', { code })
      setMfaEnabled(true)
      setMfaStep('done')
      setCode('')
      toast.success('Two-factor authentication enabled!')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Invalid code — please try again')
    } finally { setLoading(false) }
  }

  const disableMfa = async () => {
    if (!disableCode) { toast.error('Enter your current 6-digit code to disable 2FA'); return }
    setLoading(true)
    try {
      await api.post('/auth/mfa/disable', { code: disableCode })
      setMfaEnabled(false)
      setMfaStep('idle')
      setDisable('')
      toast.success('Two-factor authentication disabled')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Invalid code')
    } finally { setLoading(false) }
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const inputCls = "input h-12 text-center text-2xl font-mono tracking-[0.5em] max-w-[200px]"
  const card = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 className="page-title">Security Settings</h1>
      <p className="page-subtitle">Manage your account security and two-factor authentication</p>

      {/* ── Two-Factor Authentication Card ──────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: mfaEnabled ? 'rgba(5,150,105,0.12)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={22} style={{ color: mfaEnabled ? '#059669' : 'var(--text-muted)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Two-Factor Authentication</h2>
              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: mfaEnabled ? 'rgba(5,150,105,0.12)' : 'rgba(100,116,139,0.12)', color: mfaEnabled ? '#059669' : 'var(--text-muted)' }}>
                {mfaEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Add an extra layer of security. After signing in with your password, you'll need to enter a code from your authenticator app.
            </p>
          </div>
        </div>

        {/* Idle — not enabled */}
        {mfaStep === 'idle' && !mfaEnabled && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {[
                { icon: Smartphone, label: 'Step 1', desc: 'Install Google Authenticator or Authy on your phone' },
                { icon: Key,        label: 'Step 2', desc: 'Scan the QR code shown after clicking Enable' },
                { icon: CheckCircle,label: 'Step 3', desc: 'Enter the 6-digit code to confirm and activate 2FA' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <Icon size={18} style={{ color: 'var(--gold)', marginBottom: '6px' }} />
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary h-10" onClick={startSetup} disabled={loading} style={{ width: '100%' }}>
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Shield size={15} />}
              Enable Two-Factor Authentication
            </button>
          </div>
        )}

        {/* Setup — show QR code */}
        {mfaStep === 'setup' && setupData && (
          <div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <img src={setupData.qrCodeUrl} alt="QR Code" width={160} height={160} style={{ borderRadius: '12px', border: '4px solid var(--border)' }} />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Scan with your authenticator app</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Can't scan the QR code? Enter this key manually in your authenticator app:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <code style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
                    {setupData.secret}
                  </code>
                  <button className="btn-icon w-8 h-8" onClick={() => copy(setupData.secret, 'Secret key')}>
                    <Copy size={13} />
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Account name: FINVOSMART · Type: Time-based (TOTP)
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Enter the 6-digit code shown in your authenticator app:
              </p>
              <input className={inputCls} placeholder="000000" maxLength={6} value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                onKeyDown={e => e.key === 'Enter' && confirmEnable()} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                <button className="btn-secondary h-10" onClick={() => setMfaStep('idle')}>Cancel</button>
                <button className="btn-primary h-10" onClick={confirmEnable} disabled={loading || code.length !== 6}>
                  {loading ? 'Verifying...' : 'Confirm & Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Done — backup codes */}
        {mfaStep === 'done' && setupData && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', marginBottom: '20px' }}>
              <CheckCircle size={18} style={{ color: '#059669', flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#059669', margin: 0, fontWeight: 500 }}>
                Two-factor authentication is now active on your account.
              </p>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--gold)' }} />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>Save your backup codes</p>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Store these codes somewhere safe. Each code can only be used once to log in if you lose access to your authenticator app.
              </p>
              {codesRevealed ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {setupData.backupCodes.map((bc, i) => (
                    <code key={i} style={{ padding: '6px 10px', background: 'var(--bg-card)', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-primary)', textAlign: 'center', border: '1px solid var(--border)' }}>
                      {bc}
                    </code>
                  ))}
                </div>
              ) : (
                <button className="btn-secondary h-9 text-sm" onClick={() => setReveal(true)} style={{ width: '100%' }}>
                  Reveal backup codes
                </button>
              )}
              {codesRevealed && (
                <button className="btn-ghost text-xs h-8 mt-2" style={{ width: '100%' }}
                  onClick={() => copy(setupData.backupCodes.join('\n'), 'Backup codes')}>
                  <Copy size={13} /> Copy all codes
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enabled — disable option */}
        {mfaEnabled && mfaStep !== 'done' && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              To disable 2FA, enter your current 6-digit authenticator code:
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="input h-10 font-mono text-center text-lg tracking-widest"
                style={{ maxWidth: '160px' }} placeholder="000000" maxLength={6}
                value={disableCode}
                onChange={e => setDisable(e.target.value.replace(/\D/g, '').slice(0,6))} />
              <button className="btn-danger h-10" onClick={disableMfa} disabled={loading}>
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Password section ─────────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Change Password</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Use a strong password with at least 8 characters, including numbers and symbols.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px' }}>
          <div>
            <label className="label">Current password</label>
            <input type="password" className="input h-10" placeholder="••••••••" value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" className="input h-10" placeholder="••••••••" value={pwForm.next}
              onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" className="input h-10" placeholder="••••••••" value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          <button className="btn-primary h-10 mt-2" onClick={changePassword} disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* ── Active sessions ──────────────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Active Sessions</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Devices currently logged in to your account.</p>
        {[
          { device: 'Chrome — Windows', location: 'Mumbai, IN', time: 'Active now', current: true },
          { device: 'Safari — iPhone',  location: 'Mumbai, IN', time: '2 hours ago',current: false },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{s.device}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.location} · {s.time}</p>
            </div>
            {s.current
              ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 700 }}>This device</span>
              : <button className="btn-danger h-8 text-xs">Revoke</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
