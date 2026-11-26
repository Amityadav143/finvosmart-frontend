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

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BellOff, BellRing, MailX } from 'lucide-react'
import { emailLinksApi } from '@/lib/api/notifications'
import { apiError } from '@/lib/utils'

const KIND: Record<string, string> = {
  ALERTS: 'important alerts',
  SUMMARY: 'the morning summary',
}

/**
 * Where an email's "Turn them off" link lands (no sign-in: the signed token is the key). It turns that kind of email
 * off as it opens, says so, and offers to turn it back on.
 */
export default function EmailPreferencesPage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'working' | 'off' | 'on' | 'failed' | 'none'>('working')
  const [kind, setKind] = useState('')
  const [error, setError] = useState('')
  const asked = useRef(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    if (!t) { setState('none'); return }
    setToken(t)
    if (asked.current) return
    asked.current = true
    emailLinksApi.unsubscribe(t)
      .then(r => { setKind(KIND[r.kind] ?? 'these emails'); setState('off') })
      .catch(e => { setError(apiError(e, 'This link isn’t valid.')); setState('failed') })
  }, [])

  const again = async () => {
    if (!token) return
    setState('working')
    try { const r = await emailLinksApi.resubscribe(token); setKind(KIND[r.kind] ?? 'these emails'); setState('on') }
    catch (e) { setError(apiError(e, 'That didn’t work. Choose what you get on the Notifications page in Finvosmart.')); setState('failed') }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-base)' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '32px 28px' }} data-testid="email-prefs-page">
        {state === 'working' && <p style={{ color: 'var(--text-secondary)' }} role="status">One moment…</p>}
        {state === 'off' && (
          <>
            <BellOff size={40} style={{ color: 'var(--gold)', margin: '0 auto 12px' }} aria-hidden />
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }} data-testid="email-prefs-off">You won’t get {kind} any more</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              Sign-in, password and plan emails still come. Everything stays on the Notifications page in Finvosmart.
            </p>
            <button type="button" className="btn-secondary h-10" onClick={again} data-testid="email-prefs-again">Turn them back on</button>
          </>
        )}
        {state === 'on' && (
          <>
            <BellRing size={40} style={{ color: 'var(--gold)', margin: '0 auto 12px' }} aria-hidden />
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }} data-testid="email-prefs-on">{kind.charAt(0).toUpperCase() + kind.slice(1)}: on again</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>You can change this any time on the Notifications page.</p>
          </>
        )}
        {(state === 'failed' || state === 'none') && (
          <>
            <MailX size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} aria-hidden />
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>This link isn’t valid</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }} data-testid="email-prefs-failed">
              {state === 'none' ? 'Open the link from the email again, or choose what you get on the Notifications page in Finvosmart.' : error}
            </p>
          </>
        )}
        <p style={{ fontSize: '13px', marginTop: '20px' }}><Link href="/login" className="text-link">Sign in to Finvosmart</Link></p>
      </div>
    </main>
  )
}
