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

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [noToken, setNoToken] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('token')
      if (t) setToken(t)
      else setNoToken(true)
    }
  }, [])

  // Simple password strength signal
  const strength = (() => {
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++
    if (/\d/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['#EF4444', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E'][strength]

  const submit = async (e: any) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'This reset link is invalid or has expired. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--text-on-gold)" />
          </div>
          <span className="font-serif" style={{ fontSize: '20px', fontWeight: 700, background: 'var(--btn-primary-bg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            FINVOSMART <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>by Navgrow</span>
          </span>
        </Link>

        <div className="card" style={{ borderRadius: '20px', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34,197,94,0.12)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Password reset!</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                Sign in now
              </Link>
            </div>
          ) : noToken ? (
            <div style={{ textAlign: 'center' }}>
              <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Invalid reset link</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                This link is missing its security token. Please request a new password reset link.
              </p>
              <Link href="/forgot-password" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--gold)' }} />
                <h2 className="font-serif text-xl" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Set a new password</h2>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Choose a strong password you haven't used before.
              </p>
              <form onSubmit={submit}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">New password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="input"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      style={{ paddingLeft: '38px', paddingRight: '42px' }}
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '100px', background: 'var(--bg-input)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, background: strengthColor, transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="input"
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e: any) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      style={{ paddingLeft: '38px' }}
                    />
                  </div>
                  {confirm && confirm !== password && (
                    <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>Passwords don't match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
