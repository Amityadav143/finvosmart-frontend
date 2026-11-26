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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { platformApi, rupees, type CataloguePlan, type CataloguePlanForm, type CataloguePricing, type PlansView } from '@/lib/api/platform'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ConsoleHeading, Problem } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

/** Rupees typed ("4999", "4,999.50") → paise; NaN when it isn't an amount. */
function paiseOf(typed: string): number {
  const t = typed.replace(/[₹,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN
  const [r, p = ''] = t.split('.')
  return Number(r) * 100 + Number((p + '00').slice(0, 2))
}
const typedOf = (paise: number) => (paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2))

const BLANK: CataloguePlanForm = {
  code: '', name: '', description: '', pricing: 'COMPANY', monthlyPaise: 0, annualMonthlyPaise: 0, maxUsers: null, maxBranches: null,
  features: [], selfServe: true, onPricingPage: true, active: true, sortOrder: 100,
}

/**
 * The plans on offer: what each costs (for the company, or for each user), who it is for (users, branches), what it
 * includes, whether it is bought online and shown on the pricing page, or retired — and the companies on each. Kept on
 * the server (plan_catalogue); every change is in the console's activity.
 */
export default function PlatformPlansPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<null | { plan?: CataloguePlan }>(null)
  const [removing, setRemoving] = useState<CataloguePlan | null>(null)
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'plans'], queryFn: platformApi.plans })

  const saved = (v: PlansView, message: string) => {
    qc.setQueryData(['platform', 'plans'], v)
    qc.invalidateQueries({ queryKey: ['platform', 'activity'] })
    setEditing(null)
    setRemoving(null)
    toast.success(message)
  }

  return (
    <div className="space-y-4" data-testid="platform-plans">
      <ConsoleHeading title="Plans"
        line={data ? `${data.plans.filter(p => p.active).length} on offer${data.plans.some(p => !p.active) ? `, ${data.plans.filter(p => !p.active).length} retired` : ''}`
          : 'The plans on offer, their prices and what each includes'}>
        <button type="button" className="btn-primary h-9 px-3 text-sm" onClick={() => setEditing({})} data-action="add-plan" disabled={!data}>
          <Plus size={14} /> Add a plan</button>
      </ConsoleHeading>

      <div role="note" className="rounded-xl px-4 py-3 text-sm space-y-1" data-testid="plans-note"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <p>A new price applies to what is bought from then on — periods already paid keep what was paid. Users, branches and features
          apply to the plan&apos;s companies at once. Prices are before {data?.gstPercent ?? 18}% GST. The Terms promise customers notice before
          a price change applies to them: tell a plan&apos;s companies before you raise its price.</p>
        <p>Settings → Subscription, the sign-up, the pricing page and the home page show these plans — their prices, users and branches, and
          plans added here — within five minutes (browsers keep the list that long). The lists of what Starter, Growth and Enterprise include on the website, the website&apos;s other texts (questions
          and answers, search descriptions) and the AI assistant&apos;s answers about plans are written for the standard plans and stay as written.</p>
        <p>To set one company&apos;s plan — a plan paid by bank transfer, one given at no charge, a new trial, or ending a plan — open the company
          under <Link href="/platform/companies" className="text-link">Companies</Link>. Discounts are made under <Link href="/platform/discounts" className="text-link">Discount codes</Link>.</p>
      </div>

      {isLoading ? <SkeletonCard lines={5} /> : isError || !data ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The plans could not be loaded.')}</div>
      ) : (
        <div className="table-wrap">
          <table className="w-full border-collapse text-sm" data-testid="plans-table">
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="table-header">Plan</th><th className="table-header text-right">Monthly</th><th className="table-header text-right">Yearly, a month</th>
              <th className="table-header">Users · branches</th><th className="table-header">Includes</th><th className="table-header">Sold</th>
              <th className="table-header text-right">Companies</th><th className="table-header text-right" />
            </tr></thead>
            <tbody>
              {data.plans.map(p => (
                <tr key={p.code} className="table-row" data-plan={p.code} data-active={String(p.active)}>
                  <td className="table-cell">
                    <span className="block font-medium">{p.name} {!p.active && <Badge variant="default">Retired</Badge>}</span>
                    <span className="block text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.code}{p.builtIn ? ' · standard' : ''}</span>
                    {p.description && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{p.description}</span>}
                  </td>
                  <td className="table-cell text-right tabular-nums">{rupees(p.monthlyPaise)}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{p.pricing === 'USER' ? 'a user' : 'the company'}</span></td>
                  <td className="table-cell text-right tabular-nums">{rupees(p.annualMonthlyPaise)}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{rupees(p.annualMonthlyPaise * 12)} a year</span></td>
                  <td className="table-cell text-xs">{p.pricing === 'USER' ? `Per user${p.maxUsers != null ? `, up to ${p.maxUsers}` : ''}` : p.maxUsers == null ? 'Any number of users' : `Up to ${p.maxUsers} users`}
                    <span className="block">{p.maxBranches == null ? 'Any branches' : p.maxBranches === 1 ? 'One branch' : `Up to ${p.maxBranches} branches`}</span></td>
                  <td className="table-cell text-xs">{p.features.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>The core of Finvosmart</span>
                    : p.features.map(f => data.features[f] ?? f).join(', ')}</td>
                  <td className="table-cell text-xs">{p.selfServe ? 'Online' : 'Contact sales'}<span className="block" style={{ color: 'var(--text-muted)' }}>{p.onPricingPage ? 'on the pricing page' : 'not on the pricing page'}</span></td>
                  <td className="table-cell text-right tabular-nums text-xs" data-companies>{p.companiesRunning} paid now<span className="block" style={{ color: 'var(--text-muted)' }}>{p.companiesOnIt} in all</span></td>
                  <td className="table-cell text-right whitespace-nowrap">
                    <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setEditing({ plan: p })} data-action="edit-plan"><Pencil size={13} /> Change</button>
                    {!p.builtIn && p.companiesOnIt === 0 && (
                      <button type="button" className="btn-ghost h-8 px-2 text-xs" style={{ color: '#b91c1c' }} onClick={() => setRemoving(p)} data-action="remove-plan">
                        <Trash2 size={13} /> Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && data && <PlanEditor view={data} plan={editing.plan} onClose={() => setEditing(null)}
        onDone={(v, created) => saved(v, created ? 'Plan added' : 'Plan saved')} />}
      {removing && <RemoveDialog plan={removing} onClose={() => setRemoving(null)} onDone={v => saved(v, 'Plan removed')} />}
    </div>
  )
}

function PlanEditor({ view, plan, onClose, onDone }: { view: PlansView; plan?: CataloguePlan; onClose: () => void; onDone: (v: PlansView, created: boolean) => void }) {
  const create = !plan
  const start: CataloguePlanForm = plan ? {
    code: plan.code, name: plan.name, description: plan.description ?? '', pricing: plan.pricing, monthlyPaise: plan.monthlyPaise,
    annualMonthlyPaise: plan.annualMonthlyPaise, maxUsers: plan.maxUsers, maxBranches: plan.maxBranches, features: plan.features,
    selfServe: plan.selfServe, onPricingPage: plan.onPricingPage, active: plan.active, sortOrder: plan.sortOrder,
  } : BLANK
  const [f, setF] = useState<CataloguePlanForm>(start)
  const [monthly, setMonthly] = useState(plan ? typedOf(plan.monthlyPaise) : '')
  const [yearly, setYearly] = useState(plan ? typedOf(plan.annualMonthlyPaise) : '')
  const [problem, setProblem] = useState('')
  const set = <K extends keyof CataloguePlanForm>(k: K, v: CataloguePlanForm[K]) => setF(x => ({ ...x, [k]: v }))
  const m = useMutation({
    mutationFn: () => {
      const form: CataloguePlanForm = { ...f, code: f.code.trim().toUpperCase(), name: f.name.trim(), description: f.description?.trim() || null,
        monthlyPaise: paiseOf(monthly), annualMonthlyPaise: paiseOf(yearly) }
      return create ? platformApi.addPlan(form) : platformApi.changePlan(plan!.code, form)
    },
    onSuccess: v => onDone(v, create),
    onError: (e: unknown) => setProblem(apiError(e, 'The plan could not be saved.')),
  })
  const mp = paiseOf(monthly), yp = paiseOf(yearly)
  const pricesOk = Number.isFinite(mp) && Number.isFinite(yp)
  const saving = pricesOk && mp > 0 && yp < mp ? Math.round((1 - yp / mp) * 100) : 0
  const each = f.pricing === 'USER' ? ' a user' : ''
  const limit = (k: 'maxUsers' | 'maxBranches', label: string, hint: string) => (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={f[k] == null} onChange={e => set(k, e.target.checked ? null : 1)} data-field={`${k}-none`} /> No limit
        </label>
        {f[k] != null && <input type="number" min={1} className="input h-9 w-28" value={f[k] ?? ''} aria-label={label} data-field={k}
          onChange={e => set(k, Math.max(0, Number.parseInt(e.target.value || '0', 10) || 0))} />}
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>
    </div>
  )
  return (
    <Modal open onClose={onClose} title={create ? 'Add a plan' : `Change ${plan!.name}`} subtitle={create ? undefined : plan!.code} size="lg" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending || !f.name.trim() || !pricesOk || (create && !f.code.trim())}
          onClick={() => { setProblem(''); m.mutate() }} data-action="save">{m.isPending ? 'Saving…' : create ? 'Add the plan' : 'Save'}</button>
      </div>}>
      <div className="space-y-4" data-testid="plan-editor">
        {!create && plan!.companiesOnIt > 0 && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.3)', color: 'var(--text-primary)' }}>
            {plan!.companiesOnIt} compan{plan!.companiesOnIt === 1 ? 'y is' : 'ies are'} on this plan ({plan!.companiesRunning} paid now): users, branches and
            features change for them at once; a new price applies from their next payment.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pl-code">Code</label>
            <input id="pl-code" className="input font-mono" value={f.code} maxLength={20} disabled={!create} data-field="code"
              onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} placeholder="e.g. PROFESSIONAL" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{create ? 'Capital letters, digits or _; used in links (?plan=…) and kept on payments, so it can\'t be changed later.' : 'A plan keeps its code.'}</p>
          </div>
          <div>
            <label className="label" htmlFor="pl-name">Name</label>
            <input id="pl-name" className="input" value={f.name} maxLength={40} onChange={e => set('name', e.target.value)} data-field="name" placeholder="e.g. Professional" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pl-desc">Who it is for (optional)</label>
          <input id="pl-desc" className="input" value={f.description ?? ''} maxLength={300} onChange={e => set('description', e.target.value)} data-field="description"
            placeholder="e.g. For firms of chartered accountants" />
        </div>
        <fieldset>
          <legend className="label">Priced</legend>
          <div className="flex flex-wrap gap-4 mt-1">
            {([['COMPANY', 'For the company — one price, whatever the users'], ['USER', 'For each user — the company pays for its users, and that is its limit']] as [CataloguePricing, string][]).map(([v, t]) => (
              <label key={v} className="flex items-start gap-2 text-sm">
                <input type="radio" name="pl-pricing" checked={f.pricing === v} onChange={() => set('pricing', v)} data-field={`pricing-${v}`} className="mt-1" /> <span>{t}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pl-monthly">Billed monthly: ₹{each} a month, before GST</label>
            <input id="pl-monthly" className="input" inputMode="decimal" value={monthly} onChange={e => setMonthly(e.target.value)} data-field="monthly" placeholder="4999" />
          </div>
          <div>
            <label className="label" htmlFor="pl-yearly">Billed yearly: ₹{each} a month, before GST</label>
            <input id="pl-yearly" className="input" inputMode="decimal" value={yearly} onChange={e => setYearly(e.target.value)} data-field="yearly" placeholder="3999" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }} data-testid="plan-editor-year">
              {pricesOk ? `${rupees(yp * 12)}${each} a year${saving > 0 ? ` — ${saving}% less than monthly` : ''}` : 'Type an amount in rupees, e.g. 3999 or 3999.50'}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {limit('maxUsers', f.pricing === 'USER' ? 'Most users a company can pay for' : 'Users switched on at once',
            f.pricing === 'USER' ? 'Each company chooses its users up to this.' : 'Users beyond this can\'t be switched on.')}
          {limit('maxBranches', 'Branches', 'Branches beyond this can\'t be added.')}
        </div>
        <fieldset>
          <legend className="label">Includes, beyond the core of Finvosmart</legend>
          <div className="grid gap-1.5 sm:grid-cols-2 mt-1">
            {Object.entries(view.features).map(([code, label]) => (
              <label key={code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.features.includes(code)} data-feature={code}
                  onChange={e => set('features', e.target.checked ? [...f.features, code] : f.features.filter(x => x !== code))} /> {label}
              </label>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Sales, purchases, stock, the counter, the online store, accounts, GST returns, payroll and HR are on every plan.</p>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.selfServe} onChange={e => set('selfServe', e.target.checked)} data-field="selfServe" className="mt-1" />
            <span>Bought online with Razorpay<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Off: “Contact sales”, and you record it for the company.</span></span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.onPricingPage} onChange={e => set('onPricingPage', e.target.checked)} data-field="onPricingPage" className="mt-1" />
            <span>On the pricing page and at sign-up<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Off: kept for the companies on it (they can still renew).</span></span></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={e => set('active', e.target.checked)} data-field="active" className="mt-1" />
            <span>Still offered<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Off: retired — not sold any more; its companies keep it until their paid period ends.</span></span></label>
          <div>
            <label className="label" htmlFor="pl-order">Place (lower first)</label>
            <input id="pl-order" type="number" min={0} max={1000} className="input h-9 w-28" value={f.sortOrder} data-field="sortOrder"
              onChange={e => set('sortOrder', Math.max(0, Math.min(1000, Number.parseInt(e.target.value || '0', 10) || 0)))} />
          </div>
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function RemoveDialog({ plan, onClose, onDone }: { plan: CataloguePlan; onClose: () => void; onDone: (v: PlansView) => void }) {
  const [problem, setProblem] = useState('')
  const m = useMutation({ mutationFn: () => platformApi.removePlan(plan.code), onSuccess: onDone,
    onError: (e: unknown) => setProblem(apiError(e, 'The plan could not be removed.')) })
  return (
    <Modal open onClose={onClose} title={`Remove ${plan.name}`} size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-danger h-9 px-4" disabled={m.isPending} onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">
          {m.isPending ? 'Removing…' : 'Remove the plan'}</button>
      </div>}>
      <div className="space-y-3" data-testid="remove-plan-dialog">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          For a plan made by mistake: no company, payment or discount code names it. A plan that has been used is retired instead
          (switch off “Still offered”), so its history stays readable.
        </p>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}
