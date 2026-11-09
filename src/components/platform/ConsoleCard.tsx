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

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, Globe } from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { platformApi } from '@/lib/api/platform'
import { rupeesFromPaise } from '@/lib/api/billing'
import { apiError } from '@/lib/apiError'
import { PLATFORM_COLOR } from './theme'

/**
 * On the dashboard of Finvosmart's own administrators: the platform console at a glance (companies, trials,
 * website enquiries waiting, locked logins, plan payments this month, what isn't set up) and the way in. Nobody
 * else sees it, and nothing is asked of the console's API for them.
 */
export function ConsoleCard() {
  const { isPlatformAdmin } = usePermissions()
  const { data, isError, error } = useQuery({
    queryKey: ['platform', 'overview'], queryFn: platformApi.overview, enabled: isPlatformAdmin, staleTime: 60_000,
  })
  if (!isPlatformAdmin) return null

  const tiles = data ? [
    { id: 'companies', label: 'Companies', value: data.counts.companies, sub: `${data.counts.newLast7Days} new in 7 days`, href: '/platform/companies' },
    { id: 'trial', label: 'On the free trial', value: data.counts.onTrial, sub: `${data.counts.trialEndingSoon} end within 3 days`, href: '/platform/companies?filter=TRIAL' },
    { id: 'enquiries', label: 'Enquiries waiting', value: data.enquiries?.waiting ?? 0, sub: `${data.enquiries?.last7Days ?? 0} in 7 days`, href: '/platform/leads?filter=NEW' },
    { id: 'locked', label: 'Logins locked now', value: data.logins?.locked ?? 0, sub: `${data.logins?.switchedOff ?? 0} switched off`, href: '/platform/users?filter=LOCKED' },
    { id: 'month', label: 'Plan payments this month', value: rupeesFromPaise(data.payments?.monthPaise ?? 0), sub: `${data.payments?.monthCount ?? 0} paid`, href: '/platform/payments?filter=PAID' },
  ] : []
  const s = data?.setup
  const todo = s ? [
    !s.emailReady && { text: 'Email server not set up', tab: 'email' },
    !s.paymentsReady && { text: 'Payment gateway not set up', tab: 'payments' },
    s.paymentsReady && !s.webhookReady && { text: 'Razorpay webhook secret missing', tab: 'payments' },
    !s.signupsOpen && { text: 'Sign-ups are paused', tab: 'access' },
  ].filter(Boolean) as { text: string; tab: string }[] : []

  return (
    <section className="rounded-2xl p-4 md:p-5 space-y-4" data-testid="console-card"
      style={{ background: `${PLATFORM_COLOR}0d`, border: `1px solid ${PLATFORM_COLOR}40` }} aria-labelledby="console-card-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 36, height: 36, background: PLATFORM_COLOR }}>
            <Globe size={18} color="#fff" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 id="console-card-heading" className="text-base font-semibold" style={{ color: PLATFORM_COLOR }}>Finvosmart platform console</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You&apos;re one of Finvosmart&apos;s administrators: every registered company, their logins and plan payments, website
              enquiries, and the settings for all of Finvosmart — contact details, email server, payment gateway, sign-in.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/platform" className="h-9 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold no-underline"
            style={{ background: PLATFORM_COLOR, color: '#fff' }} data-action="open-console">
            Open the console <ArrowRight size={14} aria-hidden />
          </Link>
          <Link href="/platform/settings" className="btn-secondary h-9 px-4 inline-flex" style={{ textDecoration: 'none' }}>Platform settings</Link>
        </div>
      </div>

      {isError && (
        <p className="text-sm" role="alert" style={{ color: '#b45309' }}>
          The console&apos;s numbers couldn&apos;t be loaded: {apiError(error, 'no answer from the server.')}
        </p>
      )}

      {tiles.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          {tiles.map(t => (
            <Link key={t.id} href={t.href} className="rounded-xl block no-underline" data-console-tile={t.id}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px 12px' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }} data-value>
                {typeof t.value === 'number' ? t.value.toLocaleString('en-IN') : t.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.sub}</p>
            </Link>
          ))}
        </div>
      )}

      {todo.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" data-testid="console-todo">
          <span className="text-xs font-semibold" style={{ color: '#b45309' }}>Needs attention:</span>
          {todo.map(t => (
            <Link key={t.text} href={`/platform/settings?tab=${t.tab}`} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs no-underline"
              style={{ background: 'rgba(180,83,9,0.08)', color: '#b45309', border: '1px solid rgba(180,83,9,0.25)' }}>
              <AlertCircle size={12} aria-hidden /> {t.text}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
