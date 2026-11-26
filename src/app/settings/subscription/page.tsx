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

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, CreditCard, Lock, Receipt, Sparkles, Tag, UserPlus, X } from 'lucide-react'
import { billingApi, perUser, rupeesFromPaise, type CheckoutOrder, type DiscountCheck, type PlanOffer, type PlanStatus, type UsersQuote } from '@/lib/api/billing'
import { useSubscription, lastDay, dayOf, PLAN_FEATURES } from '@/lib/hooks/useSubscription'
import type { PlanFeature } from '@/lib/api/billing'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { apiError } from '@/lib/apiError'
import { SupportEmail } from '@/components/marketing/PlatformContact'

const CHECKOUT_JS = process.env.NEXT_PUBLIC_RAZORPAY_CHECKOUT_URL || 'https://checkout.razorpay.com/v1/checkout.js'

/** Razorpay's Checkout script, loaded once, when someone pays. */
function loadCheckout(): Promise<any> {
  const w = window as any
  if (w.Razorpay) return Promise.resolve(w.Razorpay)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]')
    const s = existing ?? document.createElement('script')
    s.addEventListener('load', () => w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay did not load')))
    s.addEventListener('error', () => reject(new Error('Razorpay could not be loaded')))
    if (!existing) { s.src = CHECKOUT_JS; s.async = true; s.dataset.razorpayCheckout = '1'; document.body.appendChild(s) }
  })
}

const CYCLE_LABEL = { MONTHLY: 'Monthly', ANNUAL: 'Yearly' } as const

/** A code as the server keeps it: capitals, no spaces (DiscountRules.normalize). */
const normalizeCode = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, '').toUpperCase()

/** "Growth", "Growth and Enterprise", "Starter, Growth and Enterprise". */
const andList = (names: string[]) => names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** What a plan is for: users and branches (a per-user plan's users are those paid for). */
function limitsLine(p: PlanOffer): string {
  const branches = p.maxBranches == null ? 'any branches' : p.maxBranches === 1 ? 'one branch' : `up to ${p.maxBranches} branches`
  if (perUser(p)) return `For each user you pay for${p.maxUsers != null ? ` (up to ${p.maxUsers})` : ''}, ${branches}`
  return `${p.maxUsers == null ? 'Any number of users' : `Up to ${p.maxUsers} users`}, ${branches}`
}

/** GST on an amount, half up to the paisa — as PlanRules.gst on the server. */
const gstOn = (basePaise: number, percent: number) => Math.floor((basePaise * percent + 50) / 100)

/** A discount check's answer for one plan, or why it couldn't be checked (the plan can't be bought with these users, say). */
type Checked = { check?: DiscountCheck; error?: string }

/**
 * Settings → Subscription: the trial (started, last day, days left) or the plan (paid until), the plans with their
 * prices and GST (for the company, or for each user on a plan priced that way), a discount code, paying with Razorpay —
 * the payment is checked on the server with Razorpay before the plan is switched on; a code that takes the whole price
 * off switches it on at once — adding users to a per-user plan for the rest of its period, and the payments made.
 */
export default function SubscriptionPage() {
  return <Suspense fallback={<Loading />}><Subscription /></Suspense>
}

function Loading() {
  return <div className="space-y-5"><h1 className="page-title">Subscription</h1><div className="card">Loading…</div></div>
}

function Subscription() {
  const qc = useQueryClient()
  // from sign-up's "Subscribe now" (or the pricing page): ?plan=GROWTH&cycle=ANNUAL&checkout=1 opens Razorpay for it once;
  // &code=WELCOME20 brings a discount code, &users=5 the users to pay for on a per-user plan
  const search = useSearchParams()
  const askedPlan = (search.get('plan') ?? '').toUpperCase()
  const askedCycle = (search.get('cycle') ?? '').toUpperCase()
  const askedCode = normalizeCode(search.get('code'))
  const askedUsers = Number.parseInt(search.get('users') ?? '', 10)
  const started = useRef(false)
  const { data: s, isLoading } = useSubscription()
  const { can } = usePermissions()
  const admin = can('SETTINGS_COMPANY')
  const [cycle, setCycle] = useState<'MONTHLY' | 'ANNUAL'>(askedCycle === 'MONTHLY' ? 'MONTHLY' : 'ANNUAL')
  const [paying, setPaying] = useState<string | null>(null)
  const [seatsTyped, setSeatsTyped] = useState<number | null>(Number.isFinite(askedUsers) && askedUsers > 0 ? askedUsers : null)
  const [codeTyped, setCodeTyped] = useState(askedCode)
  const [code, setCode] = useState<string | null>(askedCode || null)
  const [addTo, setAddTo] = useState<number | null>(null)
  const [quote, setQuote] = useState<UsersQuote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const { data: payments = [] } = useQuery({ queryKey: ['subscription-payments'], queryFn: billingApi.payments, enabled: admin })

  const activeUsers = s?.limits?.activeUsers ?? 1
  const seats = seatsTyped ?? s?.seats ?? Math.max(1, activeUsers)
  const sellable = (s?.plans ?? []).filter(p => p.selfServe)
  const anyPerUser = sellable.some(p => perUser(p))

  // the code, checked by the server for each plan bought online, for this billing and these users
  const { data: checked, isFetching: checking } = useQuery({
    queryKey: ['discount-check', code, cycle, seats, sellable.map(p => p.code).join(',')],
    enabled: !!code && admin && !!s && s.status !== 'LEGACY' && sellable.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const out: Record<string, Checked> = {}
      for (const p of sellable) {
        try { out[p.code] = { check: await billingApi.checkDiscount({ plan: p.code, billingCycle: cycle, seats: perUser(p) ? seats : null, discountCode: code }) } }
        catch (e: any) { out[p.code] = { error: apiError(e, 'The code could not be checked.') } }
      }
      return out
    },
  })
  const validFor = (p: PlanOffer) => !!code && !!checked?.[p.code]?.check?.valid

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['subscription'] })
    qc.invalidateQueries({ queryKey: ['subscription-payments'] })
    qc.invalidateQueries({ queryKey: ['discount-check'] })
  }

  /** Opens Razorpay Checkout for the server's order; its answer is checked on the server before anything changes. */
  const openCheckout = async (order: CheckoutOrder, thanks: (after: PlanStatus) => string) => {
    try {
      const Razorpay = await loadCheckout()
      const rzp = new Razorpay({
        key: order.keyId, amount: order.amountPaise, currency: order.currency, order_id: order.orderId,
        name: 'Finvosmart', description: order.description,
        prefill: { name: order.prefillName ?? '', email: order.prefillEmail ?? '', contact: order.prefillContact ?? '' },
        notes: { plan: order.plan, cycle: order.billingCycle, company: order.companyName },
        theme: { color: '#1A1B4B' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const after = await billingApi.verify(r)
            qc.setQueryData(['subscription'], after)
            toast.success(thanks(after))
          } catch (e: any) {
            toast.error(apiError(e, 'The payment could not be confirmed yet. It is confirmed automatically within a few minutes.'))
          } finally {
            setPaying(null)
            setQuote(null)
            refresh()
          }
        },
        modal: { ondismiss: () => setPaying(null) },
      })
      rzp.on?.('payment.failed', (r: any) => {
        toast.error(r?.error?.description ? `The payment failed: ${r.error.description}` : 'The payment failed. Please try again.')
        setPaying(null)
      })
      rzp.open()
    } catch (e: any) {
      toast.error('Razorpay could not be opened. Check your connection and try again.')
      setPaying(null)
    }
  }

  /** Pays for a plan: with the code when it takes something off this plan (or the code a link brought — the server judges it). */
  const pay = async (p: PlanOffer, withCode?: string | null) => {
    setPaying(p.code)
    const discountCode = withCode !== undefined ? withCode : validFor(p) ? code : null
    let order: CheckoutOrder
    try {
      order = await billingApi.checkout({ plan: p.code, billingCycle: cycle, seats: perUser(p) ? seats : null, discountCode })
    } catch (e: any) {
      toast.error(apiError(e, 'The payment could not be started.'))
      setPaying(null)
      return
    }
    if (order.activated) {
      // the code took the whole price off: the server switched the plan on, there is nothing to pay
      try {
        const after = await billingApi.status()
        qc.setQueryData(['subscription'], after)
        toast.success(`Done — with ${order.discountCode ?? 'the code'} there was nothing to pay. The ${after.planName ?? p.name} plan is active until ${lastDay(after.paidUntil)}.`)
      } catch {
        toast.success(`Done — with ${order.discountCode ?? 'the code'} there was nothing to pay. The ${p.name} plan is active.`)
      }
      setPaying(null)
      refresh()
      return
    }
    await openCheckout(order, after => `Thank you — the ${after.planName ?? p.name} plan is active until ${lastDay(after.paidUntil)}.`)
  }

  /** More users on a running per-user plan: the price for the rest of the period, then Razorpay. */
  const seeUsersPrice = async (total: number) => {
    setQuoting(true)
    try { setQuote(await billingApi.usersQuote(total)) }
    catch (e: any) { setQuote(null); toast.error(apiError(e, 'The price could not be worked out.')) }
    finally { setQuoting(false) }
  }
  const payUsers = async (total: number) => {
    setPaying('USERS')
    let order: CheckoutOrder
    try { order = await billingApi.usersCheckout(total) }
    catch (e: any) { toast.error(apiError(e, 'The payment could not be started.')); setPaying(null); return }
    await openCheckout(order, after => `Thank you — your plan now has ${after.seats ?? total} users, until ${lastDay(after.paidUntil)}.`)
  }

  useEffect(() => {
    if (started.current || !s || search.get('checkout') !== '1' || !admin || !s.checkoutAvailable) return
    const offer = s.plans.find(p => p.code === askedPlan && p.selfServe)
    if (!offer) return
    started.current = true
    void Promise.resolve().then(() => pay(offer, askedCode || null))     // once the page has drawn: Razorpay opens over it
  }, [s, admin]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !s) return <Loading />

  const onTrial = s.access === 'TRIAL', readOnly = s.access === 'READ_ONLY'
  const ownPerUser = s.status === 'PAID' && s.planPricing === 'USER'
  const canAddUsers = admin && ownPerUser && s.paidDaysLeft != null && s.paidDaysLeft >= 0
  const seatsNow = s.seats ?? Math.max(1, activeUsers)
  const addTotal = addTo ?? seatsNow + 1
  const planName = (code: string) => s.plans.find(p => p.code === code)?.name ?? code
  // the plans on offer that include a feature, for "— on Growth and Enterprise" (an older server sends no features: as before)
  const withFeature = (f: PlanFeature) => s.plans.some(p => p.features)
    ? s.plans.filter(p => p.features?.includes(f)).map(p => p.name) : ['Growth', 'Enterprise']
  const checks = Object.values(checked ?? {})
  const validLabel = checks.find(c => c.check?.valid)?.check?.label
  const validPlans = sellable.filter(validFor).map(p => p.name)
  const refusals = Array.from(new Set(checks.map(c => c.check && !c.check.valid ? c.check.message : c.error).filter((m): m is string => !!m)))

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="page-title">Subscription</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Your plan, the free trial and your payments to Finvosmart.</p>
      </div>

      <div className="card space-y-2" data-testid="plan-status" data-access={s.access}>
        <div className="flex items-center gap-2">
          {readOnly ? <Lock size={18} color="#dc2626" /> : <CheckCircle2 size={18} color={onTrial ? '#d97706' : '#16a34a'} />}
          <h2 className="font-semibold">
            {readOnly ? 'Read-only' : onTrial ? `Free trial — day ${s.trialDay} of ${s.trialDays ?? 7}` : s.status === 'PAID' ? `${s.planName ?? 'Paid'} plan` : 'Full access'}
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }} data-testid="plan-message">{s.message}</p>
        {(onTrial || (readOnly && s.trialStartedAt)) && (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm pt-1">
            <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Trial started</dt><dd>{dayOf(s.trialStartedAt)}</dd></div>
            <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Last day</dt><dd>{lastDay(s.trialEndsAt)}</dd></div>
            <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Days left</dt><dd data-testid="plan-days-left">{readOnly ? 0 : s.trialDaysLeft}</dd></div>
          </dl>
        )}
        {s.status === 'PAID' && s.paidUntil && (
          <p className="text-sm">Billed {s.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}{ownPerUser && s.seats ? ` · ${s.seats} users paid for` : ''} · paid until <strong>{lastDay(s.paidUntil)}</strong>.
            Paying again adds the new period after this one.</p>
        )}
        {onTrial && (
          <p className="text-sm" data-testid="plan-trial-terms">During the trial you can make and see everything; downloading, printing and
            sending documents come with a plan. Subscribing now keeps the trial&apos;s free days — the paid period starts when the trial ends.</p>
        )}
        {s.status === 'LEGACY' && <p className="text-sm">Your company signed up before plans were introduced and keeps full access.</p>}
      </div>

      {s.limits && (
        <div className="card space-y-3" data-testid="plan-limits" data-tier={s.limits.tier}>
          <h2 className="font-semibold">What {s.limits.tier === 'TRIAL' ? 'the free trial' : s.limits.tier === 'LEGACY' ? 'your access' : `the ${s.limits.tierName} plan`} includes</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Users switched on</dt>
              <dd data-testid="plan-users">{s.limits.activeUsers}{s.limits.maxUsers != null ? ` of ${s.limits.maxUsers}${s.limits.perUser ? ' paid for' : ''}` : ' · no limit'}</dd></div>
            <div><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>Branches</dt>
              <dd data-testid="plan-branches">{s.limits.activeBranches}{s.limits.maxBranches != null ? ` of ${s.limits.maxBranches}` : ' · no limit'}</dd></div>
          </dl>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {(Object.keys(PLAN_FEATURES) as PlanFeature[]).map(f => {
              const has = s.limits!.features.includes(f)
              const on = withFeature(f)
              return (
                <li key={f} className="flex items-center gap-2" data-plan-feature={f} data-included={has ? 'yes' : 'no'}>
                  {has ? <CheckCircle2 size={15} color="#16a34a" /> : <Lock size={15} style={{ color: 'var(--text-muted)' }} />}
                  <span>{PLAN_FEATURES[f].title}{has ? '' : on.length ? ` — on ${andList(on)}` : ' — not on the plans offered now'}</span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Everything else — sales, purchases, stock, the counter, the online store, accounts, GST returns, payroll and HR — is on every plan.</p>
        </div>
      )}

      {canAddUsers && (
        <div className="card space-y-3" data-testid="add-users">
          <div className="flex items-center gap-2"><UserPlus size={16} /><h2 className="font-semibold">Add users</h2></div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your {s.planName} plan has {seatsNow} users paid for, until {lastDay(s.paidUntil)}. Users added now are charged for the days left of
            this period; when you renew, you pay for all of them.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="label">Users in all</span>
              <input className="input h-9 mt-1 block w-32" type="number" inputMode="numeric" min={seatsNow + 1} value={addTotal} data-testid="add-users-total"
                onChange={e => { setAddTo(Math.max(1, Number.parseInt(e.target.value || '0', 10) || 0)); setQuote(null) }} />
            </label>
            <button type="button" className="btn-secondary h-9 text-sm" disabled={quoting || addTotal <= seatsNow} data-testid="add-users-quote"
              onClick={() => seeUsersPrice(addTotal)}>{quoting ? 'Working it out…' : 'See the price'}</button>
          </div>
          {quote && quote.seats === addTotal && (
            <div className="space-y-2" data-testid="add-users-price">
              <p className="text-sm">{quote.added} more user{quote.added === 1 ? '' : 's'} until {lastDay(quote.until)}: {rupeesFromPaise(quote.basePaise)} + {s.gstPercent}% GST
                = <strong>{rupeesFromPaise(quote.totalPaise)}</strong>.</p>
              {s.checkoutAvailable ? (
                <button type="button" className="btn-primary h-9 text-sm" disabled={!!paying} data-testid="add-users-pay" onClick={() => payUsers(addTotal)}>
                  <CreditCard size={14} /> {paying === 'USERS' ? 'Opening Razorpay…' : `Pay ${rupeesFromPaise(quote.totalPaise)}`}
                </button>
              ) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online payment isn&apos;t set up on this server yet — please write to <SupportEmail style={{ color: 'var(--gold)' }} /> to add users.</p>}
            </div>
          )}
        </div>
      )}

      {s.status !== 'LEGACY' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Plans</h2>
            <div className="flex rounded-lg overflow-hidden" role="group" aria-label="Billing" style={{ border: '1px solid var(--border)' }}>
              {(['ANNUAL', 'MONTHLY'] as const).map(c => (
                <button key={c} type="button" className="px-3 h-8 text-sm" aria-pressed={cycle === c} data-cycle={c}
                  style={{ background: cycle === c ? 'var(--gold)' : 'transparent', color: cycle === c ? '#1a1208' : 'var(--text-secondary)' }}
                  onClick={() => setCycle(c)}>{CYCLE_LABEL[c]}{c === 'ANNUAL' ? ' (save 20%)' : ''}</button>
              ))}
            </div>
          </div>

          {admin && sellable.length > 0 && (
            <div className="card flex flex-col gap-3 sm:flex-row sm:items-end" data-testid="plan-choices">
              {anyPerUser && (
                <label className="text-sm">
                  <span className="label">Users to pay for</span>
                  <input className="input h-9 mt-1 block w-32" type="number" inputMode="numeric" min={Math.max(1, activeUsers)} value={seats} data-testid="plan-seats"
                    onChange={e => setSeatsTyped(Math.max(1, Number.parseInt(e.target.value || '0', 10) || 0))} />
                  <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>For plans priced per user · {activeUsers} switched on now</span>
                </label>
              )}
              <form className="flex-1" data-testid="discount" onSubmit={e => { e.preventDefault(); const c = normalizeCode(codeTyped); setCode(c || null) }}>
                <span className="label flex items-center gap-1"><Tag size={13} /> Discount code</span>
                <div className="flex gap-2 mt-1">
                  <input className="input h-9 flex-1 font-mono" value={codeTyped} maxLength={24} placeholder="Have a code? Type it here"
                    aria-label="Discount code" data-testid="discount-input" onChange={e => setCodeTyped(e.target.value.toUpperCase())} />
                  <button type="submit" className="btn-secondary h-9 text-sm" disabled={!normalizeCode(codeTyped) || checking} data-testid="discount-apply">
                    {checking ? 'Checking…' : 'Apply'}</button>
                  {code && (
                    <button type="button" className="btn-icon h-9" aria-label="Remove the code" data-testid="discount-remove"
                      onClick={() => { setCode(null); setCodeTyped('') }}><X size={15} /></button>
                  )}
                </div>
                {code && !checking && checked && (
                  <p className="text-xs mt-1" data-testid="discount-message" data-valid={validPlans.length ? 'yes' : 'no'}
                    style={{ color: validPlans.length ? '#16a34a' : '#dc2626' }}>
                    {validPlans.length
                      ? `${code}: ${validLabel} on ${andList(validPlans)} — the prices below include it.`
                      : refusals[0] ?? 'This code can\'t be used here.'}
                  </p>
                )}
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {s.plans.map(p => {
              const per = perUser(p)
              const perMonth = cycle === 'ANNUAL' ? p.annualPerMonthPaise : p.monthlyPaise
              const n = per ? seats : 1
              const listBase = (cycle === 'ANNUAL' ? p.annualPaise : p.monthlyPaise) * n
              const listTotal = listBase + gstOn(listBase, s.gstPercent)
              const c = checked?.[p.code]
              const withCode = validFor(p) ? c!.check! : null
              const total = withCode ? withCode.totalPaise : listTotal
              const free = !!withCode && withCode.totalPaise === 0
              const tooMany = per && p.maxUsers != null && seats > p.maxUsers
              const tooFew = per && seats < activeUsers
              const current = p.current ?? (s.status === 'PAID' && s.plan === p.code)
              return (
                <div key={p.code} className="card flex flex-col gap-2" data-plan={p.code} data-pricing={p.pricing ?? 'COMPANY'}>
                  <p className="font-semibold">{p.name}{current ? ' — your plan' : ''}</p>
                  {p.description && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>}
                  <p><span className="text-2xl font-semibold">{rupeesFromPaise(perMonth).replace('.00', '')}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}> /{per ? 'user/' : ''}month + {s.gstPercent}% GST</span></p>
                  {p.maxUsers !== undefined && <p className="text-xs" data-plan-limits>{limitsLine(p)}</p>}
                  {p.features && p.features.length > 0 && (
                    <ul className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {p.features.filter((f): f is PlanFeature => f in PLAN_FEATURES).map(f => (
                        <li key={f} className="flex items-center gap-1"><CheckCircle2 size={12} color="#16a34a" /> {PLAN_FEATURES[f].title}</li>
                      ))}
                    </ul>
                  )}
                  {p.selfServe ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }} data-plan-total>
                      {per ? `${n} user${n === 1 ? '' : 's'} · ` : ''}{cycle === 'ANNUAL' ? `${rupeesFromPaise(withCode ? withCode.basePaise : listBase)} a year` : 'billed monthly'}
                      {' '}— {withCode && <s className="mr-1">{rupeesFromPaise(listTotal)}</s>}{rupeesFromPaise(total)} with GST
                    </p>
                  ) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Arranged with our team.</p>}
                  {withCode && (
                    <p className="text-xs" style={{ color: '#16a34a' }} data-plan-discount>{withCode.code}: {rupeesFromPaise(withCode.discountPaise)} off before GST</p>
                  )}
                  {code && p.selfServe && c && !withCode && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }} data-plan-discount-refused>{c.check?.message ?? c.error}</p>
                  )}
                  {tooMany && <p className="text-xs" style={{ color: '#dc2626' }}>This plan is for up to {p.maxUsers} users.</p>}
                  {tooFew && <p className="text-xs" style={{ color: '#dc2626' }}>{activeUsers} users are switched on — pay for at least {activeUsers}.</p>}
                  <div className="mt-auto pt-2">
                    {!p.selfServe ? (
                      <Link href="/contact" className="btn-secondary h-9 w-full text-sm" style={{ textDecoration: 'none' }}>Contact sales</Link>
                    ) : !admin ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your administrator can subscribe.</p>
                    ) : !s.checkoutAvailable && !free ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online payment isn&apos;t set up on this server yet — please write to <SupportEmail style={{ color: 'var(--gold)' }} /> to subscribe.</p>
                    ) : (
                      <button className="btn-primary h-9 w-full text-sm" disabled={!!paying || tooMany || tooFew} onClick={() => pay(p)} data-pay={p.code}>
                        <CreditCard size={14} /> {paying === p.code ? (free ? 'Switching it on…' : 'Opening Razorpay…')
                          : free ? 'Activate — nothing to pay' : current ? `Renew — ${rupeesFromPaise(total)}` : `Pay ${rupeesFromPaise(total)}`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={12} className="inline mr-1" />Every plan downloads, prints and sends your documents, and adds template customisation
            (your own invoice designs, logo, colours and layout). Payments are taken by Razorpay (cards, UPI, net banking); the plan switches on as
            soon as the payment is confirmed. Nothing renews by itself: we remind you before a period ends.
            {anyPerUser ? ' On a plan priced per user, the users you pay for are the most who can be switched on; you can add more during the period.' : ''}
          </p>
        </div>
      )}

      {admin && payments.length > 0 && (
        <div className="card p-0 overflow-x-auto" data-testid="payments">
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <Receipt size={16} /><h2 className="font-semibold text-sm">Payments</h2>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ color: 'var(--text-muted)' }} className="text-left text-xs">
              <th className="px-4 py-2">Date</th><th className="px-4 py-2">Plan</th><th className="px-4 py-2">Period</th>
              <th className="px-4 py-2 text-right">Amount (incl. GST)</th><th className="px-4 py-2">Status</th></tr></thead>
            <tbody>
              {payments.map(x => (
                <tr key={x.id} style={{ borderTop: '1px solid var(--border)' }} data-payment-purpose={x.purpose ?? 'PLAN'}>
                  <td className="px-4 py-2">{dayOf(x.paidAt ?? x.createdAt)}</td>
                  <td className="px-4 py-2">{x.purpose === 'USERS'
                    ? `${planName(x.plan)} · more users (${x.seats} in all)`
                    : `${planName(x.plan)} · ${x.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}${x.seats ? ` · ${x.seats} users` : ''}`}</td>
                  <td className="px-4 py-2">{x.periodStart ? `${dayOf(x.periodStart)} – ${lastDay(x.periodEnd)}` : '—'}</td>
                  <td className="px-4 py-2 text-right">{rupeesFromPaise(x.amountPaise)}
                    {(x.discountPaise ?? 0) > 0 && (
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }} data-payment-discount>
                        {rupeesFromPaise(x.discountPaise!)} off{x.discountCode ? ` · ${x.discountCode}` : ''}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{x.status === 'PAID'
                    ? (x.amountPaise === 0 ? 'Nothing to pay — discount code' : `Paid${x.paymentId ? ` · ${x.paymentId}` : ''}`)
                    : x.status === 'FAILED' ? `Failed${x.failureReason ? ` — ${x.failureReason}` : ''}` : 'Not completed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
