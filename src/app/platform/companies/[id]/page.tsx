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
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Ban, CalendarPlus, CreditCard, KeyRound, Unlock, Pencil, RotateCcw, ShieldCheck } from 'lucide-react'
import {
  platformApi, accessLabel, day, lastDayOf, moment, PLAN_NAMES,
  type CompanyDetail, type CompanyDetailsForm, type CompanyUser,
} from '@/lib/api/platform'
import { rupeesFromPaise } from '@/lib/api/billing'
import { GST_STATES } from '@/lib/gstin'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { apiError } from '@/lib/apiError'

type Dialog = null | 'details' | 'suspend' | 'reactivate' | 'trial' | 'plan' | 'full' | { reset: CompanyUser }

const EVENT_LABELS: Record<string, string> = {
  TRIAL_STARTED: 'Free trial started', TRIAL_REFUSED: 'No free trial (one was had before)', TRIAL_REMINDER: 'Trial reminder sent',
  TRIAL_EXTENDED: 'Trial extended by support', PLAN_SET_BY_SUPPORT: 'Plan recorded by support', FULL_ACCESS_BY_SUPPORT: 'Full access given by support',
  PLAN_ACTIVATED: 'Plan paid online', CHECKOUT_STARTED: 'Checkout started', PAYMENT_FAILED: 'Payment failed',
  PAYMENT_SIGNATURE_REFUSED: 'A payment confirmation was refused (signature didn\'t match)',
  SUPPORT_DETAILS_CHANGED: 'Contact details changed by support', SUPPORT_SUSPENDED: 'Suspended by support', SUPPORT_REACTIVATED: 'Reopened by support',
  SUPPORT_TRIAL_EXTENDED: 'Trial extended by support', SUPPORT_PLAN_RECORDED: 'Plan recorded by support', SUPPORT_FULL_ACCESS: 'Full access given by support',
  SUPPORT_RESET_LINK_SENT: 'Password-reset link sent by support', SUPPORT_LOGIN_UNLOCKED: 'Login unlocked by support',
}

/** "{"days":5,"note":"…"}" → "days 5 · note …" (the trail's details, readable). */
function readable(details?: string): string {
  if (!details) return ''
  try {
    const o = JSON.parse(details)
    if (o && typeof o === 'object') return Object.entries(o).filter(([, v]) => v !== null && v !== '').map(([k, v]) => `${k}: ${v}`).join(' · ')
  } catch { /* not JSON */ }
  return details
}

/** One company: where it stands, its contact details, people, usage, payments and history — and what support may do. */
export default function PlatformCompanyPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'company', id], queryFn: () => platformApi.company(id) })

  const done = (d: CompanyDetail, message: string) => {
    qc.setQueryData(['platform', 'company', id], d)
    qc.invalidateQueries({ queryKey: ['platform', 'companies'] })
    qc.invalidateQueries({ queryKey: ['platform', 'overview'] })
    setDialog(null)
    toast.success(message)
  }
  const unlock = useMutation({
    mutationFn: (u: CompanyUser) => platformApi.unlock(id, u.id),
    onSuccess: d => done(d, 'Login unlocked — they can sign in again now'),
    onError: (e: unknown) => toast.error(apiError(e, 'The login could not be unlocked.')),
  })

  if (isLoading) return <div className="space-y-4"><SkeletonCard lines={3} /><SkeletonCard lines={5} /></div>
  if (isError || !data) return (
    <div className="card text-sm space-y-2" role="alert">
      <p style={{ color: '#dc2626' }}>{apiError(error, 'This company could not be loaded.')}</p>
      <Link href="/platform/companies" className="text-link">Back to all companies</Link>
    </div>
  )

  const p = data.profile, s = data.plan
  const a = accessLabel({ access: s.access, status: s.status, active: p.active })
  const onTrial = s.status === 'TRIAL'
  const history = [
    ...data.history.map(h => ({ what: EVENT_LABELS[h.event] ?? h.event, details: readable(h.details), by: h.actorName, at: h.at })),
    ...data.support.filter(x => !['SUPPORT_TRIAL_EXTENDED', 'SUPPORT_PLAN_RECORDED', 'SUPPORT_FULL_ACCESS'].includes(x.action))
      .map(x => ({ what: EVENT_LABELS[x.action] ?? x.action, details: readable(x.details), by: x.byName, at: x.at })),
  ].sort((x, y) => (y.at ?? '').localeCompare(x.at ?? ''))

  return (
    <div className="space-y-5" data-testid="platform-company" data-company={p.companyCode} data-active={String(p.active)} data-access={s.access}>
      <Link href="/platform/companies" className="inline-flex items-center gap-1 text-sm text-link"><ArrowLeft size={14} /> All companies</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{p.name}</h1>
          <p className="text-sm mt-1 flex flex-wrap items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span>{p.companyCode}</span>
            {p.gstin && <span>· GSTIN {p.gstin}</span>}
            <span>· signed up {day(p.createdAt)}</span>
            <Badge variant={a.tone}>{a.text}</Badge>
            {p.platform && <Badge variant="info">Runs Finvosmart</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="company-actions">
          <button type="button" className="btn-secondary h-9 px-3 text-sm" onClick={() => setDialog('details')} data-action="details"><Pencil size={14} /> Contact details</button>
          {!p.platform && onTrial && <button type="button" className="btn-secondary h-9 px-3 text-sm" onClick={() => setDialog('trial')} data-action="trial"><CalendarPlus size={14} /> Extend trial</button>}
          {!p.platform && <button type="button" className="btn-secondary h-9 px-3 text-sm" onClick={() => setDialog('plan')} data-action="plan"><CreditCard size={14} /> Record a plan</button>}
          {!p.platform && s.status !== 'LEGACY' && <button type="button" className="btn-secondary h-9 px-3 text-sm" onClick={() => setDialog('full')} data-action="full"><ShieldCheck size={14} /> Full access</button>}
          {!p.platform && (p.active
            ? <button key="suspend" type="button" className="btn-danger h-9 px-3 text-sm" onClick={() => setDialog('suspend')} data-action="suspend"><Ban size={14} /> Suspend</button>
            : <button key="reactivate" type="button" className="btn-primary h-9 px-3 text-sm" onClick={() => setDialog('reactivate')} data-action="reactivate"><RotateCcw size={14} /> Reopen</button>)}
        </div>
      </div>

      {!p.active && (
        <div role="status" className="rounded-xl px-4 py-3 text-sm" data-testid="suspended-banner"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.35)', color: 'var(--text-primary)' }}>
          <strong>Suspended {moment(p.suspendedAt)}.</strong> No one at this company can sign in; its data is kept. Reason: {p.suspendedReason || '—'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-2" aria-labelledby="plan-h" data-testid="company-plan">
          <h2 id="plan-h" className="text-base font-semibold">Plan and trial</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.message}</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt style={{ color: 'var(--text-muted)' }}>Set up as</dt>
            <dd>{s.status === 'LEGACY' ? 'Full access (no plan needed)' : s.status === 'PAID' ? `${s.planName ?? PLAN_NAMES[s.plan ?? ''] ?? 'Paid'}, ${s.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}` : 'Free trial'}</dd>
            {s.trialStartedAt && <><dt style={{ color: 'var(--text-muted)' }}>Trial</dt><dd>{day(s.trialStartedAt)} – {lastDayOf(s.trialEndsAt)}{onTrial && s.access === 'TRIAL' ? ` (day ${s.trialDay} of ${s.trialDays ?? 7})` : ''}</dd></>}
            {s.paidUntil && <><dt style={{ color: 'var(--text-muted)' }}>Paid until</dt><dd>{lastDayOf(s.paidUntil)}</dd></>}
          </dl>
        </section>

        <section className="card space-y-2" aria-labelledby="contact-h" data-testid="company-contact">
          <h2 id="contact-h" className="text-base font-semibold">Contact details</h2>
          <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-sm">
            <dt style={{ color: 'var(--text-muted)' }}>Legal name</dt><dd className="col-span-2 break-words">{p.legalName || '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd className="col-span-2 break-words">{p.email ? <a className="text-link" href={`mailto:${p.email}`}>{p.email}</a> : '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Phone</dt><dd className="col-span-2">{p.phone || '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Website</dt><dd className="col-span-2 break-words">{p.website || '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Address</dt>
            <dd className="col-span-2 whitespace-pre-line">{[p.address, [p.city, p.state, p.pincode].filter(Boolean).join(', ')].filter(Boolean).join('\n') || '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>PAN · CIN</dt><dd className="col-span-2">{p.pan || '—'} · {p.cin || '—'}</dd>
          </dl>
        </section>

        <section className="card space-y-2" aria-labelledby="usage-h" data-testid="company-usage">
          <h2 id="usage-h" className="text-base font-semibold">Usage</h2>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <dt style={{ color: 'var(--text-muted)' }}>Invoices</dt><dd className="tabular-nums">{data.usage.invoices.toLocaleString('en-IN')}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Customers</dt><dd className="tabular-nums">{data.usage.customers.toLocaleString('en-IN')}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Suppliers</dt><dd className="tabular-nums">{data.usage.suppliers.toLocaleString('en-IN')}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Employees</dt><dd className="tabular-nums">{data.usage.employees.toLocaleString('en-IN')}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Logins</dt><dd className="tabular-nums">{data.users.length}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Last invoice</dt><dd>{moment(data.usage.lastInvoiceAt)}</dd>
          </dl>
        </section>
      </div>

      <section className="card space-y-3" aria-labelledby="users-h">
        <h2 id="users-h" className="text-base font-semibold">Logins</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Support can email a login a link to choose a new password (it goes to the login&apos;s own address — nobody else sees it), and unlock a login locked after wrong passwords.
        </p>
        <div className="table-wrap">
          <table className="w-full border-collapse text-sm" data-testid="company-users">
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="table-header">Name</th><th className="table-header">Roles</th><th className="table-header">Sign-in</th>
              <th className="table-header">Last sign-in</th><th className="table-header text-right">Support</th>
            </tr></thead>
            <tbody>
              {data.users.length === 0 && <tr><td className="table-cell" colSpan={5}>No logins.</td></tr>}
              {data.users.map(u => (
                <tr key={u.id} className="table-row" data-user={u.email}>
                  <td className="table-cell">
                    <span className="block font-medium">{u.fullName || '—'}</span>
                    <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</span>
                  </td>
                  <td className="table-cell text-xs">{u.roles.map(r => r.replace(/_/g, ' ').toLowerCase()).join(', ') || '—'}</td>
                  <td className="table-cell text-xs">
                    {!u.active ? <Badge variant="default">Switched off</Badge>
                      : u.locked ? <Badge variant="danger">Locked until {moment(u.lockedUntil)}</Badge>
                      : <span>{[u.hasPassword ? 'password' : null, u.google ? 'Google' : null, u.twoStep ? 'two-step on' : null].filter(Boolean).join(' · ') || '—'}</span>}
                    {u.active && !u.locked && u.failedAttempts > 0 && <span className="block" style={{ color: '#b45309' }}>{u.failedAttempts} wrong password{u.failedAttempts === 1 ? '' : 's'}</span>}
                  </td>
                  <td className="table-cell text-xs">{moment(u.lastSignIn)}</td>
                  <td className="table-cell text-right whitespace-nowrap">
                    {u.active && u.email && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setDialog({ reset: u })} data-action="reset-link">
                      <KeyRound size={13} /> Reset link</button>}
                    {(u.locked || u.failedAttempts > 0) && <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={unlock.isPending}
                      onClick={() => unlock.mutate(u)} data-action="unlock"><Unlock size={13} /> Unlock</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-3" aria-labelledby="pay-h">
        <h2 id="pay-h" className="text-base font-semibold">Plan payments</h2>
        {data.payments.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No online payments yet.</p> : (
          <div className="table-wrap">
            <table className="w-full border-collapse text-sm" data-testid="company-payments">
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="table-header">When</th><th className="table-header">Plan</th><th className="table-header text-right">Amount</th>
                <th className="table-header">Status</th><th className="table-header">Razorpay</th>
              </tr></thead>
              <tbody>
                {data.payments.map(x => (
                  <tr key={x.id} className="table-row">
                    <td className="table-cell text-xs">{moment(x.paidAt ?? x.createdAt)}</td>
                    <td className="table-cell">{PLAN_NAMES[x.plan] ?? x.plan}, {x.billingCycle === 'ANNUAL' ? 'yearly' : 'monthly'}{x.periodEnd ? <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>until {lastDayOf(x.periodEnd)}</span> : null}</td>
                    <td className="table-cell text-right tabular-nums">{rupeesFromPaise(x.amountPaise)}</td>
                    <td className="table-cell"><Badge variant={x.status === 'PAID' ? 'success' : x.status === 'FAILED' ? 'danger' : 'default'}>{x.status.toLowerCase()}</Badge>
                      {x.failureReason && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{x.failureReason}</span>}</td>
                    <td className="table-cell text-xs">{x.paymentId ?? x.orderId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card space-y-3" aria-labelledby="hist-h">
        <h2 id="hist-h" className="text-base font-semibold">History</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The trial, plans and payments, and everything support did — also in the company&apos;s own audit log.</p>
        {history.length === 0 ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nothing yet.</p> : (
          <ol className="space-y-2" data-testid="company-history">
            {history.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{h.what}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {moment(h.at)}{h.by ? ` · ${h.by}` : ''}</span>
                {h.details && <span className="block text-xs break-words" style={{ color: 'var(--text-secondary)' }}>{h.details}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      {dialog === 'details' && <DetailsDialog detail={data} onClose={() => setDialog(null)} onDone={d => done(d, 'Contact details saved')} />}
      {dialog === 'trial' && <TrialDialog detail={data} onClose={() => setDialog(null)} onDone={d => done(d, 'Trial extended')} />}
      {dialog === 'plan' && <PlanDialog detail={data} onClose={() => setDialog(null)} onDone={d => done(d, 'Plan recorded')} />}
      {dialog === 'full' && <NoteDialog title="Give full access" testId="full-dialog" action="Give full access" label="Why (kept with the company's history)"
        text="The company gets full access with no end date and no plan to pay, like the companies from before plans (a partner, a test company)."
        run={note => platformApi.setPlan(id, { mode: 'FULL', note })} onClose={() => setDialog(null)} onDone={d => done(d, 'Full access given')} />}
      {dialog === 'suspend' && <NoteDialog title={`Suspend ${p.name}`} testId="suspend-dialog" action="Suspend the company" danger label="Reason (kept with the company's history)"
        text="No one at this company can sign in, and everyone signed in now is signed out. Nothing is deleted: reopen it any time."
        run={reason => platformApi.suspend(id, reason)} onClose={() => setDialog(null)} onDone={d => done(d, 'Company suspended')} />}
      {dialog === 'reactivate' && <NoteDialog title={`Reopen ${p.name}`} testId="reactivate-dialog" action="Reopen the company" label="Note (kept with the company's history)"
        text="Its people can sign in again straight away."
        run={note => platformApi.reactivate(id, note)} onClose={() => setDialog(null)} onDone={d => done(d, 'Company reopened')} />}
      {dialog && typeof dialog === 'object' && <ResetDialog companyId={id} user={dialog.reset} onClose={() => setDialog(null)} />}
    </div>
  )
}

// ── the dialogs ───────────────────────────────────────────────────────────────

function Problem({ text }: { text: string }) {
  return text ? <p role="alert" className="text-sm" style={{ color: '#dc2626' }} data-testid="dialog-error">{text}</p> : null
}

/** A note, then the action (suspend, reopen, full access): the server checks the note is 5 to 300 characters. */
function NoteDialog({ title, text, label, action, danger, testId, run, onClose, onDone }: {
  title: string; text: string; label: string; action: string; danger?: boolean; testId: string
  run: (note: string) => Promise<CompanyDetail>; onClose: () => void; onDone: (d: CompanyDetail) => void
}) {
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState('')
  const m = useMutation({ mutationFn: () => run(note), onSuccess: onDone, onError: (e: unknown) => setProblem(apiError(e, 'That could not be done.')) })
  return (
    <Modal open onClose={onClose} title={title} size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className={`${danger ? 'btn-danger' : 'btn-primary'} h-9 px-4`} disabled={m.isPending || note.trim().length < 5}
          onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">{m.isPending ? 'Saving…' : action}</button>
      </div>}>
      <div className="space-y-3" data-testid={testId}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
        <div>
          <label className="label" htmlFor="pf-note">{label}</label>
          <textarea id="pf-note" className="input" rows={3} maxLength={300} value={note} onChange={e => setNote(e.target.value)} data-field="note" />
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function DetailsDialog({ detail, onClose, onDone }: { detail: CompanyDetail; onClose: () => void; onDone: (d: CompanyDetail) => void }) {
  const p = detail.profile
  const [f, setF] = useState<CompanyDetailsForm>({
    name: p.name ?? '', legalName: p.legalName ?? '', email: p.email ?? '', phone: p.phone ?? '', website: p.website ?? '',
    address: p.address ?? '', city: p.city ?? '', state: p.state ?? '', pincode: p.pincode ?? '',
  })
  const [problem, setProblem] = useState('')
  const set = (k: keyof CompanyDetailsForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF(x => ({ ...x, [k]: e.target.value }))
  const m = useMutation({ mutationFn: () => platformApi.saveDetails(p.id, f), onSuccess: onDone, onError: (e: unknown) => setProblem(apiError(e, 'The details could not be saved.')) })
  const states = Object.values(GST_STATES).filter((v, i, all) => all.indexOf(v) === i).sort()
  const field = (k: keyof CompanyDetailsForm, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`pd-${k}`}>{label}</label>
      <input id={`pd-${k}`} className="input" value={f[k]} onChange={set(k)} data-field={k} {...extra} />
    </div>
  )
  return (
    <Modal open onClose={onClose} title="Contact details" subtitle={`${p.name} · ${p.companyCode}`} size="lg" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending} onClick={() => { setProblem(''); m.mutate() }} data-action="save">
          {m.isPending ? 'Saving…' : 'Save'}</button>
      </div>}>
      <div className="space-y-3" data-testid="details-dialog">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>GSTIN, PAN and the company code stay as the company set them. The change is recorded in the company&apos;s audit log.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('name', 'Company name', { maxLength: 200 })}
          {field('legalName', 'Legal name', { maxLength: 200 })}
          {field('email', 'Email', { type: 'email', maxLength: 150 })}
          {field('phone', 'Phone', { type: 'tel', maxLength: 20 })}
          {field('website', 'Website', { maxLength: 200, placeholder: 'https://' })}
          {field('city', 'City', { maxLength: 100 })}
          <div>
            <label className="label" htmlFor="pd-state">State</label>
            <select id="pd-state" className="input" value={f.state} onChange={set('state')} data-field="state">
              <option value="">—</option>
              {f.state && !states.includes(f.state) && <option value={f.state}>{f.state}</option>}
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {field('pincode', 'PIN code', { inputMode: 'numeric', maxLength: 6 })}
        </div>
        <div>
          <label className="label" htmlFor="pd-address">Address</label>
          <textarea id="pd-address" className="input" rows={3} maxLength={500} value={f.address} onChange={set('address')} data-field="address" />
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function TrialDialog({ detail, onClose, onDone }: { detail: CompanyDetail; onClose: () => void; onDone: (d: CompanyDetail) => void }) {
  const [days, setDays] = useState(7)
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState('')
  const s = detail.plan
  const running = s.access === 'TRIAL'
  const m = useMutation({ mutationFn: () => platformApi.extendTrial(detail.profile.id, days, note), onSuccess: onDone,
    onError: (e: unknown) => setProblem(apiError(e, 'The trial could not be extended.')) })
  return (
    <Modal open onClose={onClose} title="Extend the free trial" size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending || note.trim().length < 5 || days < 1 || days > 30}
          onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">{m.isPending ? 'Saving…' : `Give ${days} more day${days === 1 ? '' : 's'}`}</button>
      </div>}>
      <div className="space-y-3" data-testid="trial-dialog">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {running ? `The trial's last day is ${lastDayOf(s.trialEndsAt)}; it moves that many days later.`
            : 'The trial is over (or was never given): it starts again today, today being day 1.'} The company&apos;s administrators are told in the app.
        </p>
        <div>
          <label className="label" htmlFor="pt-days">More days (1 to 30)</label>
          <input id="pt-days" type="number" min={1} max={30} className="input" value={days} onChange={e => setDays(Number(e.target.value))} data-field="days" />
        </div>
        <div>
          <label className="label" htmlFor="pt-note">Why (kept with the company&apos;s history)</label>
          <textarea id="pt-note" className="input" rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} data-field="note" />
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function PlanDialog({ detail, onClose, onDone }: { detail: CompanyDetail; onClose: () => void; onDone: (d: CompanyDetail) => void }) {
  const s = detail.plan
  const [plan, setPlan] = useState(s.plan && PLAN_NAMES[s.plan] ? s.plan : 'GROWTH')
  const [cycle, setCycle] = useState(s.billingCycle ?? 'ANNUAL')
  const [until, setUntil] = useState('')
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState('')
  const m = useMutation({ mutationFn: () => platformApi.setPlan(detail.profile.id, { mode: 'PAID', plan, billingCycle: cycle, paidUntil: until, note }),
    onSuccess: onDone, onError: (e: unknown) => setProblem(apiError(e, 'The plan could not be recorded.')) })
  return (
    <Modal open onClose={onClose} title="Record a plan paid outside the app" size="md" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending || !until || note.trim().length < 5}
          onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">{m.isPending ? 'Saving…' : 'Record the plan'}</button>
      </div>}>
      <div className="space-y-3" data-testid="plan-dialog">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          For a plan paid by bank transfer or agreed with sales (Enterprise): the company has full access until the end of the last day, India time.
          Say in the note how it was paid. Online payments record themselves.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="pp-plan">Plan</label>
            <select id="pp-plan" className="input" value={plan} onChange={e => setPlan(e.target.value)} data-field="plan">
              {Object.entries(PLAN_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pp-cycle">Billing</label>
            <select id="pp-cycle" className="input" value={cycle} onChange={e => setCycle(e.target.value as 'MONTHLY' | 'ANNUAL')} data-field="cycle">
              <option value="MONTHLY">Monthly</option><option value="ANNUAL">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pp-until">Paid until (last day)</label>
            <input id="pp-until" type="date" className="input" value={until} onChange={e => setUntil(e.target.value)} data-field="until" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pp-note">How it was paid (kept with the company&apos;s history)</label>
          <textarea id="pp-note" className="input" rows={2} maxLength={300} value={note} onChange={e => setNote(e.target.value)} data-field="note"
            placeholder="e.g. NEFT on 3 Nov, UTR 123456789012, invoice FS/26-27/014" />
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

function ResetDialog({ companyId, user, onClose }: { companyId: string; user: CompanyUser; onClose: () => void }) {
  const [problem, setProblem] = useState('')
  const [sent, setSent] = useState('')
  const m = useMutation({ mutationFn: () => platformApi.resetLink(companyId, user.id), onSuccess: r => setSent(r),
    onError: (e: unknown) => setProblem(apiError(e, 'The link could not be sent.')) })
  return (
    <Modal open onClose={onClose} title="Send a password-reset link" size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>{sent ? 'Close' : 'Cancel'}</button>
        {!sent && <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending} onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">
          {m.isPending ? 'Sending…' : 'Send the link'}</button>}
      </div>}>
      <div className="space-y-3" data-testid="reset-dialog">
        {sent ? <p role="status" className="text-sm" data-testid="reset-sent">{sent}</p> : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            A link to choose a new password goes to <strong>{user.email}</strong> ({user.fullName}). It works once, for 30 minutes; nobody but them sees it.
          </p>
        )}
        <Problem text={problem} />
      </div>
    </Modal>
  )
}
