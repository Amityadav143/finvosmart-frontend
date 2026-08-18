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
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { useTheme } from '@/lib/context/ThemeContext'
import toast from 'react-hot-toast'
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { isDark } = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: any) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Please enter your email'); return }
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      // The API always returns success to avoid account enumeration; show the
      // same confirmation even on error so we never reveal whether the email exists.
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-base)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="var(--text-on-gold)" />
          </div>
          <span className="font-serif" style={{ fontSize: '20px', fontWeight: 700, background: 'var(--btn-primary-bg)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            FINVOSMART <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', WebkitTextFillColor: 'var(--text-muted)' }}>by Navgrow</span>
          </span>
        </Link>

        <div className="card" style={{ borderRadius: '20px', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(34,197,94,0.12)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Check your inbox</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, we've sent a link to reset your password. The link expires in 30 minutes.
              </p>
              <Link href="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                Back to sign in
              </Link>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '16px' }}>
                Didn't get it? Check spam, or{' '}
                <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 500, padding: 0 }}>try again</button>.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Forgot your password?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                Enter the email linked to your account and we'll send you a secure link to reset it.
              </p>
              <form onSubmit={submit}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="label">Email address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{ paddingLeft: '38px' }}
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', marginTop: '20px' }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
