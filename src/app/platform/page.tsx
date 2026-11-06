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
import { CheckCircle2, AlertCircle, CircleDashed } from 'lucide-react'
import { platformApi, accessLabel, day, type PlatformSetup } from '@/lib/api/platform'
import { rupeesFromPaise } from '@/lib/api/billing'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { apiError } from '@/lib/apiError'

/** The platform at a glance: companies by plan state, sign-ups, people and plan payments lately, and what is set up. */
export default function PlatformOverviewPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'overview'], queryFn: platformApi.overview })

  if (isLoading) return <div className="space-y-4"><SkeletonCard lines={3} /><SkeletonCard lines={4} /></div>
  if (isError || !data) return <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The platform overview could not be loaded.')}</div>

  const c = data.counts
  const tiles: { label: string; value: string; sub?: string; href: string; id: string }[] = [
    { id: 'companies', label: 'Companies', value: c.companies.toLocaleString('en-IN'), sub: `${c.newLast7Days} new in 7 days · ${c.newLast30Days} in 30`, href: '/platform/companies' },
    { id: 'trial', label: 'On the free trial', value: c.onTrial.toLocaleString('en-IN'), sub: `${c.trialEndingSoon} end within 3 days`, href: '/platform/companies?filter=TRIAL' },
    { id: 'read-only', label: 'Read-only (no plan)', value: c.readOnly.toLocaleString('en-IN'), sub: 'trial over or plan ended', href: '/platform/companies?filter=READ_ONLY' },
    { id: 'paid', label: 'On a paid plan', value: c.paid.toLocaleString('en-IN'), sub: `${c.fullAccess} more with full access`, href: '/platform/companies?filter=PAID' },
    { id: 'suspended', label: 'Suspended', value: c.suspended.toLocaleString('en-IN'), href: '/platform/companies?filter=SUSPENDED' },
    { id: 'people', label: 'People who can sign in', value: c.activeUsers.toLocaleString('en-IN'), href: '/platform/companies' },
    { id: 'payments', label: 'Plan payments, 30 days', value: rupeesFromPaise(c.paidLast30DaysPaise), sub: `${c.paymentsLast30Days} payment${c.paymentsLast30Days === 1 ? '' : 's'} (with GST)`, href: '/platform/companies?filter=PAID' },
  ]

  return (
    <div className="space-y-6" data-testid="platform-overview">
      <div>
        <h1 className="page-title">Platform overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Every company on Finvosmart, and the settings for all of it. Release {data.version}.
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
        {tiles.map(t => (
          <Link key={t.id} href={t.href} className="card block" style={{ textDecoration: 'none', padding: '16px' }} data-tile={t.id}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
            <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--text-primary)' }} data-value>{t.value}</p>
            {t.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SetupCard setup={data.setup} />
        <section className="card space-y-3" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-base font-semibold">Signed up last</h2>
            <Link href="/platform/companies" className="text-link text-sm">All companies</Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No companies yet.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }} data-testid="recent-companies">
              {data.recent.map(r => {
                const a = accessLabel(r)
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/platform/companies/${r.id}`} className="min-w-0" style={{ textDecoration: 'none' }}>
                      <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.companyCode} · signed up {day(r.createdAt)}</span>
                    </Link>
                    <Badge variant={a.tone}>{a.text}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

/** What is set up for all of Finvosmart, each with where to change it. */
function SetupCard({ setup: s }: { setup: PlatformSetup }) {
  const rows: { ok: boolean | null; title: string; text: string; tab: string }[] = [
    { ok: s.emailReady, title: 'Email server', text: s.emailReady ? `Sending through ${s.emailServer} as ${s.emailFrom}` : 'Not set up — sign-in codes, password resets and invoices can\'t be emailed', tab: 'email' },
    { ok: s.paymentsReady, title: 'Payment gateway (plans)', text: s.paymentsReady ? `Razorpay, ${s.paymentsMode === 'LIVE' ? 'live mode' : 'test mode — no real payments'}` : 'Not set up — companies can\'t subscribe online', tab: 'payments' },
    { ok: s.paymentsReady ? s.webhookReady : null, title: 'Razorpay webhook', text: s.webhookReady ? 'Payments are confirmed even if the customer closes the window' : 'No webhook secret — payments are confirmed only when the customer comes back from Checkout', tab: 'payments' },
    { ok: s.googleReady ? true : null, title: 'Google sign-in', text: s.googleReady ? 'On' : 'Off (people sign in with a password)', tab: 'signin' },
    { ok: s.whatsappReady ? true : null, title: 'WhatsApp Business', text: s.whatsappReady ? 'Invoices and reminders can be sent on WhatsApp' : 'Off', tab: 'whatsapp' },
    { ok: s.signupsOpen, title: 'Sign-ups', text: s.signupsOpen ? 'Open' : 'Paused — the sign-up page says so', tab: 'access' },
    { ok: s.noticeShown ? true : null, title: 'Notice to everyone', text: s.noticeShown ? 'Shown at the top of the app' : 'None', tab: 'access' },
    { ok: s.encryptionReady, title: 'Encryption key', text: s.encryptionReady ? 'Secrets saved in the console are kept encrypted' : 'APP_ENCRYPTION_KEY isn\'t set — secrets can only come from the server\'s environment', tab: 'email' },
  ]
  return (
    <section className="card space-y-3" aria-labelledby="setup-heading" data-testid="platform-setup">
      <div className="flex items-center justify-between">
        <h2 id="setup-heading" className="text-base font-semibold">What is set up</h2>
        <Link href="/platform/settings" className="text-link text-sm">Settings</Link>
      </div>
      <ul className="space-y-2">
        {rows.map(r => {
          const Icon = r.ok === true ? CheckCircle2 : r.ok === false ? AlertCircle : CircleDashed
          const color = r.ok === true ? 'var(--ok-text, #15803d)' : r.ok === false ? '#b45309' : 'var(--text-muted)'
          return (
            <li key={r.title} className="flex items-start gap-2 text-sm" data-setup={r.title} data-ok={String(r.ok)}>
              <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color }} aria-label={r.ok === true ? 'Set up' : r.ok === false ? 'Needs attention' : 'Optional'} />
              <span className="min-w-0">
                <Link href={`/platform/settings?tab=${r.tab}`} className="font-medium" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{r.title}</Link>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.text}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
