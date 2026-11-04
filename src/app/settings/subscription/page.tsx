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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, CreditCard, Lock, Receipt, Sparkles } from 'lucide-react'
import { billingApi, rupeesFromPaise, type CheckoutOrder, type PlanOffer } from '@/lib/api/billing'
import { useSubscription, lastDay, dayOf } from '@/lib/hooks/useSubscription'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { apiError } from '@/lib/apiError'

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

/**
 * Settings → Subscription: the trial (started, last day, days left) or the plan (paid until), the plans with their
 * prices and GST, paying with Razorpay — the payment is checked on the server with Razorpay before the plan is
 * switched on — and the payments made.
 */
export default function SubscriptionPage() {
  const qc = useQueryClient()
  const { data: s, isLoading } = useSubscription()
  const { can } = usePermissions()
  const admin = can('SETTINGS_COMPANY')
  const [cycle, setCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL')
  const [paying, setPaying] = useState<string | null>(null)
  const { data: payments = [] } = useQuery({ queryKey: ['subscription-payments'], queryFn: billingApi.payments, enabled: admin })

  const pay = async (p: PlanOffer) => {
    setPaying(p.code)
    let order: CheckoutOrder
    try {
      order = await billingApi.checkout(p.code, cycle)
    } catch (e: any) {
      toast.error(apiError(e, 'The payment could not be started.'))
      setPaying(null)
      return
    }
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
            toast.success(`Thank you — the ${after.planName ?? p.name} plan is active until ${dayOf(after.paidUntil)}.`)
          } catch (e: any) {
            toast.error(apiError(e, 'The payment could not be confirmed yet. It is confirmed automatically within a few minutes.'))
          } finally {
            setPaying(null)
            qc.invalidateQueries({ queryKey: ['subscription'] })
            qc.invalidateQueries({ queryKey: ['subscription-payments'] })
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

  if (isLoading || !s) return <div className="space-y-5"><h1 className="page-title">Subscription</h1><div className="card">Loading…</div></div>

  const onTrial = s.access === 'TRIAL', readOnly = s.access === 'READ_ONLY'
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
            {readOnly ? 'Read-only' : onTrial ? `Free trial — day ${s.trialDay} of 7` : s.status === 'PAID' ? `${s.planName ?? 'Paid'} plan` : 'Full access'}
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
          <p className="text-sm">Billed {s.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'} · paid until <strong>{dayOf(s.paidUntil)}</strong>.
            Paying again adds the new period after this one.</p>
        )}
        {s.status === 'LEGACY' && <p className="text-sm">Your company signed up before plans were introduced and keeps full access.</p>}
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {s.plans.map(p => {
              const perMonth = cycle === 'ANNUAL' ? p.annualPerMonthPaise : p.monthlyPaise
              const total = cycle === 'ANNUAL' ? p.annualTotalPaise : p.monthlyTotalPaise
              const current = s.status === 'PAID' && s.plan === p.code
              return (
                <div key={p.code} className="card flex flex-col gap-2" data-plan={p.code}>
                  <p className="font-semibold">{p.name}{current ? ' — your plan' : ''}</p>
                  <p><span className="text-2xl font-semibold">{rupeesFromPaise(perMonth).replace('.00', '')}</span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}> /month + {s.gstPercent}% GST</span></p>
                  {p.selfServe ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }} data-plan-total>
                      {cycle === 'ANNUAL' ? `${rupeesFromPaise(p.annualPaise)} a year` : 'billed monthly'} — {rupeesFromPaise(total)} with GST
                    </p>
                  ) : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Arranged with our team.</p>}
                  <div className="mt-auto pt-2">
                    {!p.selfServe ? (
                      <Link href="/contact" className="btn-secondary h-9 w-full text-sm" style={{ textDecoration: 'none' }}>Contact sales</Link>
                    ) : !admin ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your administrator can subscribe.</p>
                    ) : !s.checkoutAvailable ? (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Online payment isn&apos;t set up on this server yet — please contact Finvosmart to subscribe.</p>
                    ) : (
                      <button className="btn-primary h-9 w-full text-sm" disabled={!!paying} onClick={() => pay(p)} data-pay={p.code}>
                        <CreditCard size={14} /> {paying === p.code ? 'Opening Razorpay…' : current ? 'Renew' : `Pay ${rupeesFromPaise(total)}`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <Sparkles size={12} className="inline mr-1" />Paid plans add template customisation (your own invoice designs, logo, colours and layout).
            Payments are taken by Razorpay (cards, UPI, net banking); the plan switches on as soon as the payment is confirmed.
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
                <tr key={x.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-4 py-2">{dayOf(x.paidAt ?? x.createdAt)}</td>
                  <td className="px-4 py-2">{x.plan} · {x.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}</td>
                  <td className="px-4 py-2">{x.periodStart ? `${dayOf(x.periodStart)} – ${lastDay(x.periodEnd)}` : '—'}</td>
                  <td className="px-4 py-2 text-right">{rupeesFromPaise(x.amountPaise)}</td>
                  <td className="px-4 py-2">{x.status === 'PAID' ? `Paid${x.paymentId ? ` · ${x.paymentId}` : ''}` : x.status === 'FAILED' ? `Failed${x.failureReason ? ` — ${x.failureReason}` : ''}` : 'Not completed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
