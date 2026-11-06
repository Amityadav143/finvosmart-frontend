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
import { Clock, Lock, Sparkles } from 'lucide-react'
import { useSubscription, lastDay, dayOf } from '@/lib/hooks/useSubscription'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { rupeesFromPaise } from '@/lib/api/billing'

/**
 * Above every page: the free trial's countdown ("Day 3 of 7 · 4 days left — the last day is 10 Nov"), louder on the
 * last day, and once the trial is over the read-only notice. The administrator gets the button to choose a plan;
 * everyone else is told who can.
 */
export function TrialBanner() {
  const { data: s } = useSubscription()
  const { can } = usePermissions()
  if (!s || s.access === 'FULL') return null
  const admin = can('SETTINGS_COMPANY')
  const readOnly = s.access === 'READ_ONLY'
  const urgent = readOnly || (s.trialDaysLeft ?? 9) <= 1
  const tone = readOnly ? { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.35)', ink: '#b91c1c' }
    : urgent ? { bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.40)', ink: '#b45309' }
    : { bg: 'var(--gold-muted)', border: 'var(--border-strong)', ink: 'var(--text-secondary)' }
  return (
    <div role="status" data-testid="trial-banner" data-access={s.access}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 text-sm"
      style={{ background: tone.bg, borderBottom: `1px solid ${tone.border}`, color: tone.ink }}>
      {readOnly ? <Lock size={15} aria-hidden /> : <Clock size={15} aria-hidden />}
      {readOnly ? (
        <span className="flex-1 min-w-0">
          <strong>Your free trial has ended — Finvosmart is read-only.</strong> You can see and export everything; choose a plan to add
          and change records again. All your data is kept.
        </span>
      ) : (
        <span className="flex-1 min-w-0">
          <strong>Free trial · day {s.trialDay} of {s.trialDays ?? 7}</strong> — {s.trialDaysLeft === 0 ? 'it ends today' : `${s.trialDaysLeft} day${s.trialDaysLeft === 1 ? '' : 's'} left`}
          {s.trialEndsAt ? ` (started ${dayOf(s.trialStartedAt)}, last day ${lastDay(s.trialEndsAt)})` : ''}.
        </span>
      )}
      {admin ? (
        <Link href="/settings/subscription" className="btn-primary h-8 px-3 text-xs" style={{ textDecoration: 'none' }} data-testid="trial-upgrade">
          <Sparkles size={13} /> {readOnly ? 'Choose a plan' : 'Upgrade'}
        </Link>
      ) : (
        <span className="text-xs">Your company&apos;s administrator can choose a plan under Settings → Subscription.</span>
      )}
    </div>
  )
}

/** The dashboard's trial card: when it started and ends, the days left, and the plans' starting price. */
export function TrialCard() {
  const { data: s } = useSubscription()
  const { can } = usePermissions()
  if (!s || s.access === 'FULL') return null
  const readOnly = s.access === 'READ_ONLY'
  const left = s.trialDaysLeft ?? 0
  const pct = readOnly ? 100 : Math.min(100, Math.max(0, ((s.trialDay ?? 1) / (s.trialDays ?? 7)) * 100))
  const cheapest = s.plans.filter(p => p.selfServe).map(p => p.annualPerMonthPaise).sort((a, b) => a - b)[0]
  return (
    <div className="card space-y-3" data-testid="trial-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Your free trial</p>
          <p className="text-lg font-semibold mt-0.5" data-testid="trial-left">
            {readOnly ? 'Ended — read-only' : left === 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} left`}
          </p>
        </div>
        {can('SETTINGS_COMPANY') && (
          <Link href="/settings/subscription" className="btn-primary h-9 px-4 text-sm" style={{ textDecoration: 'none' }}>
            <Sparkles size={14} /> {readOnly ? 'Choose a plan' : 'Upgrade now'}
          </Link>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }} aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: readOnly || left <= 1 ? '#dc2626' : 'var(--gold)' }} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Started</dt><dd data-testid="trial-started">{dayOf(s.trialStartedAt)}</dd></div>
        <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Last day</dt><dd data-testid="trial-ends">{lastDay(s.trialEndsAt)}</dd></div>
        <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Day</dt><dd>{readOnly ? '—' : `${s.trialDay} of ${s.trialDays ?? 7}`}</dd></div>
      </dl>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {readOnly ? 'Nothing has been deleted: subscribe and carry on where you left off.'
          : `After the trial, Finvosmart stays open read-only until you subscribe. Plans from ${cheapest ? rupeesFromPaise(cheapest) : ''} a month + ${s.gstPercent}% GST, billed yearly.`}
      </p>
    </div>
  )
}
