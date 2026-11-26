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

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { billingApi, perUser, type PlanOffer, type PublicPlans } from '@/lib/api/billing'
import { inr, usersLine } from '@/lib/billing/plans'

/*
 * The pricing page and the landing page are drawn on the server with the standard plans, so they read the same without
 * JavaScript. Once in the browser these ask the server for the plans kept in the console (GET /public/plans, once per
 * page) and show its prices, users and branches — and the plans added there. While it can't say, the standard ones stand.
 */

let asked: Promise<PublicPlans | null> | null = null

function load(): Promise<PublicPlans | null> {
  if (!asked) asked = billingApi.publicPlans().then(p => (p?.plans?.length ? p : null), () => null)
  return asked
}

/** The plans on offer as the server keeps them; null until known (or when the server can't say). */
export function usePublicPlans(): PublicPlans | null {
  const [plans, setPlans] = useState<PublicPlans | null>(null)
  useEffect(() => {
    let on = true
    void load().then(p => { if (on) setPlans(p) })
    return () => { on = false }
  }, [])
  return plans
}

function useLive(code: string): PlanOffer | undefined {
  return usePublicPlans()?.plans.find(p => p.code === code)
}

/** A plan's price a month, yearly and monthly — the page's switch shows one (.price-annual, .price-monthly). */
export function LivePrice({ code, annual, monthly }: { code: string; annual: string; monthly: string }) {
  const live = useLive(code)
  return (
    <>
      <span className="price-annual">{live ? inr(live.annualPerMonthPaise) : `₹${annual}`}</span>
      <span className="price-monthly">{live ? inr(live.monthlyPaise) : `₹${monthly}`}</span>
    </>
  )
}

/** "/month", or for each user on a plan priced that way. */
export function LivePer({ code, text }: { code: string; text: string }) {
  const live = useLive(code)
  return <>{live && perUser(live) ? text.replace('/', '/user/') : text}</>
}

/** Who the plan is for. */
export function LiveUsers({ code, fallback }: { code: string; fallback: string }) {
  const live = useLive(code)
  return <>{live ? usersLine(live) : fallback}</>
}

/** Users or branches for the comparison table. */
export function LiveLimit({ code, kind, fallback }: { code: string; kind: 'users' | 'branches'; fallback: string }) {
  const live = useLive(code)
  if (!live || live.maxUsers === undefined) return <>{fallback}</>
  if (kind === 'branches') return <>{live.maxBranches == null ? 'Unlimited' : String(live.maxBranches)}</>
  return <>{perUser(live) ? `Per user${live.maxUsers != null ? `, up to ${live.maxUsers}` : ''}` : live.maxUsers == null ? 'Unlimited' : String(live.maxUsers)}</>
}

/** A standard plan's card — left out once the server says the plan isn't on the pricing page any more. */
export function LiveShown({ code, children }: { code: string; children: ReactNode }) {
  const plans = usePublicPlans()
  if (plans && !plans.plans.some(p => p.code === code)) return null
  return <>{children}</>
}

/** The plans added in the console for the pricing page, after the standard ones (inside the same grid). */
export function MorePlans({ known }: { known: string[] }) {
  const plans = usePublicPlans()
  const more = (plans?.plans ?? []).filter(p => !known.includes(p.code))
  if (!more.length) return null
  return (
    <>
      {more.map(p => {
        const href = `/register?plan=${p.code.toLowerCase()}`
        return (
          <div key={p.code} data-testid="more-plan" data-plan={p.code} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px',
                                                                              padding: '32px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: '22px', color: 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: p.description ? '6px' : '20px' }}>{usersLine(p)}</div>
            {p.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{p.description}</div>}
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '44px', color: 'var(--text-primary)' }}>
                <span className="price-annual">{inr(p.annualPerMonthPaise)}</span><span className="price-monthly">{inr(p.monthlyPaise)}</span>
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>{perUser(p) ? '/user/month' : '/month'}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              + {plans!.gstPercent}% GST · <span className="price-annual">billed annually</span><span className="price-monthly">billed monthly</span>
            </div>
            {(p.features ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '24px' }}>
                {(p.features ?? []).map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={15} style={{ color: 'var(--ok-text)', flexShrink: 0, marginTop: '2px' }} aria-hidden />
                    <span>{plans!.features[f] ?? f}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 'auto' }}>
              <Link href={p.selfServe ? href : '/contact'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px',
                    borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '15px', background: 'var(--bg-surface)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-strong)' }}>
                {p.selfServe ? 'Start Free Trial' : 'Contact Sales'} <ArrowRight size={15} />
              </Link>
              {p.selfServe && (
                <p style={{ textAlign: 'center', fontSize: '13px', margin: '10px 0 0' }}>
                  <span className="price-annual"><Link href={`${href}&cycle=annual&start=pay`} className="text-link">or subscribe now, billed yearly</Link></span>
                  <span className="price-monthly"><Link href={`${href}&cycle=monthly&start=pay`} className="text-link">or subscribe now, billed monthly</Link></span>
                </p>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
