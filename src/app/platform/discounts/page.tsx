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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  platformApi, day, moment, rupees, type DiscountCode, type DiscountCodeForm, type DiscountKind, type DiscountUse,
} from '@/lib/api/platform'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ConsoleHeading, Problem } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

/** Today in India, "2026-11-26" (a code's days are India's). */
const todayIst = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/** Where a code stands today. */
function standing(c: DiscountCode, today: string): { text: string; tone: 'success' | 'info' | 'warning' | 'default' } {
  if (!c.active) return { text: 'Switched off', tone: 'default' }
  if (c.validFrom && today < c.validFrom) return { text: `From ${day(c.validFrom)}`, tone: 'info' }
  if (c.validUntil && today > c.validUntil) return { text: 'Expired', tone: 'warning' }
  if (c.maxUses != null && c.timesUsed >= c.maxUses) return { text: 'Used up', tone: 'warning' }
  return { text: 'Can be used', tone: 'success' }
}

/** Letters that can't be mistaken for one another (no O/0, I/1). */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function suggestion(): string {
  const a = new Uint32Array(8)
  crypto.getRandomValues(a)
  return Array.from(a, n => LETTERS[n % LETTERS.length]).join('')
}

/** Rupees typed → paise (NaN when it isn't an amount). */
function paiseOf(typed: string): number {
  const t = typed.replace(/[₹,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN
  const [r, p = ''] = t.split('.')
  return Number(r) * 100 + Number((p + '00').slice(0, 2))
}

/**
 * Discount codes and coupons: a percentage or an amount off a plan's price before GST, for any company or one (a
 * coupon), for some plans and billing, between two days, a number of uses — typed at checkout or brought by a link.
 * How often each was used and what it took off; a used code is switched off rather than removed.
 */
export default function PlatformDiscountsPage() {
  return <Suspense fallback={<SkeletonCard lines={4} />}><Discounts /></Suspense>
}

function Discounts() {
  const qc = useQueryClient()
  const search = useSearchParams()
  const forCompany = (search.get('company') ?? '').trim().toUpperCase()
  const opened = useRef(false)
  const [editing, setEditing] = useState<null | { code?: DiscountCode; company?: string }>(null)
  const [uses, setUses] = useState<DiscountCode | null>(null)
  const [removing, setRemoving] = useState<DiscountCode | null>(null)
  const { data: codes, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'discount-codes'], queryFn: platformApi.discountCodes })
  const { data: view } = useQuery({ queryKey: ['platform', 'plans'], queryFn: platformApi.plans, staleTime: 30_000 })
  const names: Record<string, string> = Object.fromEntries((view?.plans ?? []).map(p => [p.code, p.name]))
  const today = todayIst()

  // from a company's page: "Make a coupon" opens the form for that company
  useEffect(() => {
    if (opened.current || !forCompany) return
    opened.current = true
    setEditing({ company: forCompany })
  }, [forCompany])

  const changed = (message: string) => {
    qc.invalidateQueries({ queryKey: ['platform', 'discount-codes'] })
    qc.invalidateQueries({ queryKey: ['platform', 'activity'] })
    setEditing(null)
    setRemoving(null)
    toast.success(message)
  }
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`) }
    catch { toast.error('Copying isn\'t allowed here — select the text and copy it.') }
  }
  const origin = typeof window === 'undefined' ? '' : window.location.origin

  return (
    <div className="space-y-4" data-testid="platform-discounts">
      <ConsoleHeading title="Discount codes"
        line={codes ? `${codes.length} code${codes.length === 1 ? '' : 's'} · ${codes.filter(c => standing(c, today).tone === 'success').length} can be used now`
          : 'Codes and coupons taken off a plan’s price'}>
        <button type="button" className="btn-primary h-9 px-3 text-sm" onClick={() => setEditing({})} data-action="add-code"><Plus size={14} /> Make a code</button>
      </ConsoleHeading>

      <div role="note" className="rounded-xl px-4 py-3 text-sm space-y-1" data-testid="discounts-note"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <p>A code takes a percentage or an amount off a plan&apos;s price before GST; GST is on what is paid. The customer types it under
          Settings → Subscription or at sign-up — or opens a link that brings it. A code that takes the whole price off switches the plan on with
          nothing to pay. A coupon is a code for one company only.</p>
        <p>Adding users to a plan priced per user is at the plan&apos;s price: codes are for a plan&apos;s period.</p>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : isError || !codes ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The discount codes could not be loaded.')}</div>
      ) : codes.length === 0 ? (
        <div className="card text-sm" style={{ color: 'var(--text-muted)' }} data-testid="discounts-empty">No discount codes yet. Make one for a campaign, a partner or one company.</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full border-collapse text-sm" data-testid="discounts-table">
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="table-header">Code</th><th className="table-header">Takes off</th><th className="table-header">For</th>
              <th className="table-header">Days</th><th className="table-header text-right">Used</th><th className="table-header">Now</th><th className="table-header text-right" />
            </tr></thead>
            <tbody>
              {codes.map(c => {
                const st = standing(c, today)
                return (
                  <tr key={c.id} className="table-row" data-code={c.code}>
                    <td className="table-cell">
                      <span className="block font-mono font-semibold">{c.code}</span>
                      {c.description && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{c.description}</span>}
                    </td>
                    <td className="table-cell" data-label>{c.label}</td>
                    <td className="table-cell text-xs">
                      {c.companyName ? <span className="block">Only <Link href={`/platform/companies/${c.companyId}`} className="text-link">{c.companyName}</Link> ({c.companyCode})</span> : <span className="block">Any company</span>}
                      <span className="block">{c.plans.length ? c.plans.map(p => names[p] ?? p).join(', ') : 'Any plan'} · {c.cycles.length === 1 ? (c.cycles[0] === 'ANNUAL' ? 'yearly' : 'monthly') : 'any billing'}</span>
                      {(c.oncePerCompany || c.firstPlanOnly) && <span className="block" style={{ color: 'var(--text-muted)' }}>
                        {[c.oncePerCompany ? 'once per company' : null, c.firstPlanOnly ? 'a company’s first plan only' : null].filter(Boolean).join(' · ')}</span>}
                    </td>
                    <td className="table-cell text-xs">{c.validFrom || c.validUntil ? `${c.validFrom ? day(c.validFrom) : 'Now'} – ${c.validUntil ? day(c.validUntil) : 'no end'}` : 'Any day'}</td>
                    <td className="table-cell text-right text-xs tabular-nums" data-used={c.timesUsed}>{c.timesUsed}{c.maxUses != null ? ` of ${c.maxUses}` : ''}
                      {c.discountGivenPaise > 0 && <span className="block" style={{ color: 'var(--text-muted)' }}>{rupees(c.discountGivenPaise)} off in all</span>}</td>
                    <td className="table-cell" data-standing={st.text}><Badge variant={st.tone}>{st.text}</Badge></td>
                    <td className="table-cell text-right whitespace-nowrap">
                      <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setEditing({ code: c })} data-action="edit-code"><Pencil size={13} /> Change</button>
                      <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => copy(`${origin}/register?start=pay&code=${encodeURIComponent(c.code)}${c.plans.length === 1 ? `&plan=${c.plans[0].toLowerCase()}` : ''}`, 'Sign-up link')}
                        data-action="copy-signup" title="A link to sign up and pay, with the code"><Copy size={13} /> Sign-up link</button>
                      <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => copy(`${origin}/settings/subscription?code=${encodeURIComponent(c.code)}`, 'Link for customers')}
                        data-action="copy-customer" title="A link for a company already on Finvosmart: its plans, with the code"><Copy size={13} /> Customer link</button>
                      {c.timesUsed > 0 && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setUses(c)} data-action="uses"><ListChecks size={13} /> Uses</button>}
                      {c.timesUsed === 0 && <button type="button" className="btn-ghost h-8 px-2 text-xs" style={{ color: '#b91c1c' }} onClick={() => setRemoving(c)} data-action="remove-code">
                        <Trash2 size={13} /> Remove</button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CodeEditor code={editing.code} company={editing.company} plans={view?.plans ?? []} onClose={() => setEditing(null)}
        onDone={created => changed(created ? 'Code made' : 'Code saved')} />}
      {uses && <UsesDialog code={uses} names={names} onClose={() => setUses(null)} />}
      {removing && <RemoveDialog code={removing} onClose={() => setRemoving(null)} onDone={() => changed('Code removed')} />}
    </div>
  )
}

function CodeEditor({ code, company, plans, onClose, onDone }: {
  code?: DiscountCode; company?: string; plans: { code: string; name: string; active: boolean }[]; onClose: () => void; onDone: (created: boolean) => void
}) {
  const create = !code
  const [f, setF] = useState<DiscountCodeForm>(code ? {
    code: code.code, description: code.description ?? '', kind: code.kind, value: code.value, plans: code.plans, cycles: code.cycles,
    companyCode: code.companyCode ?? '', validFrom: code.validFrom ?? '', validUntil: code.validUntil ?? '', maxUses: code.maxUses ?? null,
    oncePerCompany: code.oncePerCompany, firstPlanOnly: code.firstPlanOnly, active: code.active,
  } : {
    code: '', description: '', kind: 'PERCENT', value: 10, plans: [], cycles: [], companyCode: company ?? '', validFrom: '', validUntil: '',
    maxUses: company ? 1 : null, oncePerCompany: true, firstPlanOnly: false, active: true,
  })
  const [amount, setAmount] = useState(code && code.kind === 'AMOUNT' ? String(code.value / 100) : '')
  const [problem, setProblem] = useState('')
  const set = <K extends keyof DiscountCodeForm>(k: K, v: DiscountCodeForm[K]) => setF(x => ({ ...x, [k]: v }))
  const value = f.kind === 'AMOUNT' ? paiseOf(amount) : f.value
  const m = useMutation({
    mutationFn: () => {
      const form: DiscountCodeForm = { ...f, code: f.code.trim().toUpperCase(), value, description: f.description?.trim() || null,
        companyCode: f.companyCode?.trim().toUpperCase() || null, validFrom: f.validFrom || null, validUntil: f.validUntil || null }
      return create ? platformApi.addDiscountCode(form) : platformApi.changeDiscountCode(code!.id, form)
    },
    onSuccess: () => onDone(create),
    onError: (e: unknown) => setProblem(apiError(e, 'The code could not be saved.')),
  })
  const used = !!code && code.timesUsed > 0
  const cycle = f.cycles.length === 1 ? f.cycles[0] : ''
  const shown = plans.filter(p => p.active || f.plans.includes(p.code))
  const whole = (f.kind === 'PERCENT' && f.value === 100)
  return (
    <Modal open onClose={onClose} title={create ? (company ? `A coupon for ${company}` : 'Make a discount code') : `Change ${code!.code}`} size="lg" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending || f.code.trim().length < 3 || !Number.isFinite(value) || value < 1}
          onClick={() => { setProblem(''); m.mutate() }} data-action="save">{m.isPending ? 'Saving…' : create ? 'Make the code' : 'Save'}</button>
      </div>}>
      <div className="space-y-4" data-testid="code-editor">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="dc-code">Code</label>
            <div className="flex gap-2">
              <input id="dc-code" className="input font-mono flex-1" value={f.code} maxLength={24} disabled={used} data-field="code"
                onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="e.g. DIWALI20" />
              {!used && <button type="button" className="btn-secondary h-10 px-3 text-xs" onClick={() => set('code', suggestion())} data-action="suggest">Make one up</button>}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{used ? 'Used already, so its letters stay.' : '3 to 24 capital letters, digits, - or _.'}</p>
          </div>
          <div>
            <label className="label" htmlFor="dc-desc">Note (only the console shows it)</label>
            <input id="dc-desc" className="input" value={f.description ?? ''} maxLength={200} onChange={e => set('description', e.target.value)} data-field="description"
              placeholder="e.g. Diwali campaign, partner CA firm" />
          </div>
        </div>
        <fieldset>
          <legend className="label">Takes off, before GST</legend>
          <div className="flex flex-wrap items-center gap-4 mt-1">
            {([['PERCENT', 'A percentage'], ['AMOUNT', 'An amount']] as [DiscountKind, string][]).map(([k, t]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="radio" name="dc-kind" checked={f.kind === k} onChange={() => set('kind', k)} data-field={`kind-${k}`} /> {t}
              </label>
            ))}
            {f.kind === 'PERCENT' ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="number" min={1} max={100} className="input h-9 w-24" value={f.value} aria-label="Percent off" data-field="percent"
                  onChange={e => set('value', Math.max(0, Math.min(100, Number.parseInt(e.target.value || '0', 10) || 0)))} /> % off
              </label>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                ₹ <input className="input h-9 w-32" inputMode="decimal" value={amount} aria-label="Amount off in rupees" data-field="amount"
                  onChange={e => setAmount(e.target.value)} placeholder="1000" /> off
              </label>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {whole ? 'The whole price: the plan switches on with nothing to pay.' : f.kind === 'AMOUNT' ? 'Off the price for the period (never more than the price).' : 'A share of the price for the period, rounded to the paisa.'}
          </p>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="label">Plans (none ticked: any plan)</legend>
            <div className="space-y-1 mt-1">
              {shown.map(p => (
                <label key={p.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={f.plans.includes(p.code)} data-plan={p.code}
                    onChange={e => set('plans', e.target.checked ? [...f.plans, p.code] : f.plans.filter(x => x !== p.code))} /> {p.name}{p.active ? '' : ' (retired)'}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="dc-cycle">Billing</label>
              <select id="dc-cycle" className="input" value={cycle} onChange={e => set('cycles', e.target.value ? [e.target.value] : [])} data-field="cycle">
                <option value="">Monthly or yearly</option><option value="MONTHLY">Monthly only</option><option value="ANNUAL">Yearly only</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="dc-company">For one company only (its company code)</label>
              <input id="dc-company" className="input font-mono" value={f.companyCode ?? ''} maxLength={20} data-field="companyCode"
                onChange={e => set('companyCode', e.target.value.toUpperCase())} placeholder="Blank: any company" />
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="dc-from">First day (optional)</label>
            <input id="dc-from" type="date" className="input" value={f.validFrom ?? ''} onChange={e => set('validFrom', e.target.value)} data-field="validFrom" />
          </div>
          <div>
            <label className="label" htmlFor="dc-until">Last day (optional)</label>
            <input id="dc-until" type="date" className="input" value={f.validUntil ?? ''} onChange={e => set('validUntil', e.target.value)} data-field="validUntil" />
          </div>
          <div>
            <span className="label">Uses in all</span>
            <div className="flex items-center gap-2 mt-1">
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.maxUses == null} onChange={e => set('maxUses', e.target.checked ? null : 1)} data-field="maxUses-none" /> No limit</label>
              {f.maxUses != null && <input type="number" min={1} className="input h-9 w-24" value={f.maxUses} aria-label="Uses in all" data-field="maxUses"
                onChange={e => set('maxUses', Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0))} />}
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.oncePerCompany} onChange={e => set('oncePerCompany', e.target.checked)} data-field="oncePerCompany" className="mt-1" />
            <span>Once per company</span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.firstPlanOnly} onChange={e => set('firstPlanOnly', e.target.checked)} data-field="firstPlanOnly" className="mt-1" />
            <span>A company&apos;s first plan only<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>For new customers: not once they have paid.</span></span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} data-field="active" className="mt-1" />
            <span>Switched on</span></label>
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function UsesDialog({ code, names, onClose }: { code: DiscountCode; names: Record<string, string>; onClose: () => void }) {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'discount-uses', code.id], queryFn: () => platformApi.discountCodeUses(code.id) })
  return (
    <Modal open onClose={onClose} title={`Where ${code.code} was used`} subtitle={`${code.label} · ${code.timesUsed} use${code.timesUsed === 1 ? '' : 's'}`} size="lg"
      footer={<div className="flex justify-end"><button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Close</button></div>}>
      <div data-testid="code-uses">
        {isLoading ? <SkeletonCard lines={3} /> : isError || !data ? <Problem text={apiError(error, 'The uses could not be loaded.')} /> : data.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Not used yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full border-collapse text-sm">
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="table-header">When</th><th className="table-header">Company</th><th className="table-header">Plan</th>
                <th className="table-header text-right">Price</th><th className="table-header text-right">Off</th><th className="table-header text-right">Paid (with GST)</th>
              </tr></thead>
              <tbody>
                {data.map((u: DiscountUse, i: number) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell text-xs">{moment(u.at)}</td>
                    <td className="table-cell"><Link href={`/platform/companies/${u.companyId}`} className="text-link">{u.companyName}</Link>
                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{u.companyCode}</span></td>
                    <td className="table-cell text-xs">{u.plan ? names[u.plan] ?? u.plan : '—'}{u.billingCycle ? `, ${u.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}` : ''}</td>
                    <td className="table-cell text-right tabular-nums">{rupees(u.listPaise)}</td>
                    <td className="table-cell text-right tabular-nums">{rupees(u.discountPaise)}</td>
                    <td className="table-cell text-right tabular-nums">{u.paidPaise == null ? '—' : rupees(u.paidPaise)}
                      {u.paymentId && <span className="block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.paymentId}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  )
}

function RemoveDialog({ code, onClose, onDone }: { code: DiscountCode; onClose: () => void; onDone: () => void }) {
  const [problem, setProblem] = useState('')
  const m = useMutation({ mutationFn: () => platformApi.removeDiscountCode(code.id), onSuccess: onDone,
    onError: (e: unknown) => setProblem(apiError(e, 'The code could not be removed.')) })
  return (
    <Modal open onClose={onClose} title={`Remove ${code.code}`} size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-danger h-9 px-4" disabled={m.isPending} onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">
          {m.isPending ? 'Removing…' : 'Remove the code'}</button>
      </div>}>
      <div className="space-y-3" data-testid="remove-code-dialog">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>For a code given out by mistake: it was never used. Anyone typing it afterwards is told it isn&apos;t valid.
          A code that has been used is switched off instead, so its uses stay readable.</p>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}
