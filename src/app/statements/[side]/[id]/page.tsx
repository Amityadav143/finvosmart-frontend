'use client'
/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Mail, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { inr, todayIST } from '@/lib/money'
import { apiError, formatDate } from '@/lib/utils'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { periods, statementsApi, type StatementLine, type StatementSide } from '@/lib/api/statements'

const KIND: Record<string, string> = {
  INVOICE: 'Invoice', DEBIT_NOTE: 'Debit note', CREDIT_NOTE: 'Credit note', OPENING: 'Carried over', PAYMENT: 'Payment',
  TDS: 'TDS', REFUND: 'Refund', BILL: 'Bill', EXPENSE: 'Expense',
}
const n = (v: unknown) => Number(v ?? 0)

export default function StatementPage({ params }: { params: { side: string; id: string } }) {
  const side: StatementSide = params.side === 'supplier' ? 'supplier' : 'customer'
  const today = todayIST()
  const options = useMemo(() => periods(today), [today])
  const [range, setRange] = useState({ from: options[0].from, to: options[0].to, key: 'fy' })
  const [mailing, setMailing] = useState(false)
  const [mail, setMail] = useState({ to: '', cc: '', message: '' })
  const [downloading, setDownloading] = useState(false)
  const { canAny } = usePermissions()

  const q = useQuery({
    queryKey: ['statement', side, params.id, range.from, range.to],
    queryFn: () => statementsApi.get(side, params.id, range.from, range.to),
    enabled: !!range.from && !!range.to && range.from <= range.to,
    retry: false,
  })
  const v = q.data
  const s = v?.statement

  const send = useMutation({
    mutationFn: () => statementsApi.email(params.id, range.from, range.to, { to: mail.to.trim() || undefined, cc: mail.cc.trim() || undefined, message: mail.message.trim() || undefined }),
    onSuccess: r => { setMailing(false); toast.success(`Statement emailed to ${r?.sentTo}`) },
    onError: (e: any) => toast.error(apiError(e, 'The statement could not be emailed')),
  })
  const pdf = async () => {
    if (!v) return
    setDownloading(true)
    try { await statementsApi.pdf(side, params.id, range.from, range.to, v.party.name) }
    catch (e) { toast.error(apiError(e, 'The PDF could not be prepared')) }
    finally { setDownloading(false) }
  }

  const back = side === 'customer' ? { href: '/crm/customers', label: 'Customers' } : { href: '/procurement/vendors', label: 'Suppliers' }
  const closing = n(s?.closing)
  const canMail = side === 'customer' && canAny('INVOICE_SEND', 'INVOICE_CREATE', 'FINANCE_CREATE')
  const describe = (l: StatementLine) => [KIND[l.kind] ?? l.kind, l.number].filter(Boolean).join(' ')

  return (
    <div className="space-y-5 statement-page" style={{ maxWidth: '1040px' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
        <div>
          <Link href={back.href} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />{back.label}</Link>
          <h1 className="page-title mt-1">Statement of account{v ? ` — ${v.party.name}` : ''}</h1>
          <p className="page-subtitle">
            {v ? [v.party.code, v.party.gstin && `GSTIN ${v.party.gstin}`, v.party.email].filter(Boolean).join(' · ') : 'Everything that changed the balance, with a running total.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary h-9" onClick={() => window.print()} disabled={!v}><Printer size={15} />Print</button>
          <button className="btn-secondary h-9" onClick={pdf} disabled={!v || downloading}><Download size={15} />{downloading ? 'Preparing…' : 'PDF'}</button>
          {canMail && (
            <button className="btn-primary h-9" disabled={!v} onClick={() => { setMail({ to: v?.party.email ?? '', cc: '', message: '' }); setMailing(true) }}>
              <Mail size={15} />Email to customer
            </button>
          )}
        </div>
      </div>

      <div className="card flex items-end gap-3 flex-wrap print:hidden" role="group" aria-label="Period">
        <div>
          <label className="label" htmlFor="st-period">Period</label>
          <select id="st-period" className="input h-10" value={range.key}
            onChange={e => { const o = options.find(x => x.key === e.target.value); setRange(o ? { from: o.from, to: o.to, key: o.key } : { ...range, key: 'custom' }) }}>
            {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            <option value="custom">Choose dates…</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="st-from">From</label>
          <input id="st-from" type="date" className="input h-10" value={range.from} max={range.to} onChange={e => setRange(r => ({ ...r, from: e.target.value, key: 'custom' }))} />
        </div>
        <div>
          <label className="label" htmlFor="st-to">To</label>
          <input id="st-to" type="date" className="input h-10" value={range.to} min={range.from} max={today} onChange={e => setRange(r => ({ ...r, to: e.target.value, key: 'custom' }))} />
        </div>
      </div>

      {q.isLoading && <div className="card" style={{ height: '220px', background: 'var(--bg-surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
      {q.isError && <div className="card" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{apiError(q.error, 'The statement could not be prepared.')}</div>}

      {v && s && (
        <>
          <div className="hidden print:block">
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Statement of account — {v.party.name}</h1>
            <p style={{ fontSize: '12px' }}>{formatDate(s.from)} to {formatDate(s.to)}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="statement-summary">
            {[
              { label: `Brought forward on ${formatDate(s.from)}`, value: inr(s.opening) },
              { label: `${v.upLabel} in the period`, value: inr(s.totalUp) },
              { label: `${v.downLabel} in the period`, value: inr(s.totalDown) },
              { label: `Balance on ${formatDate(s.to)}`, value: inr(Math.abs(closing)), note: closing > 0 ? v.balanceNote : closing < 0 ? 'In their favour' : 'Nothing outstanding', strong: true },
            ].map(k => (
              <div key={k.label} className="card" style={k.strong ? { border: '1px solid var(--gold)', background: 'var(--gold-muted)' } : undefined}>
                <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{k.label}</p>
                <p className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{k.value}</p>
                {k.note && <p className="text-xs" style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>{k.note}</p>}
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: '720px' }} data-testid="statement-table">
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Particulars', v.upLabel, v.downLabel, 'Balance'].map((h, i) => (
                      <th key={h} className="table-header" style={{ textAlign: i >= 2 ? 'right' : 'left', padding: '10px 14px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{formatDate(s.from)}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 600 }}>Balance brought forward</td>
                    <td /><td />
                    <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600 }}>{inr(s.opening)}</td>
                  </tr>
                  {s.lines.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '22px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>Nothing changed in this period.</td></tr>
                  )}
                  {s.lines.map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatDate(l.date)}</td>
                      <td style={{ padding: '9px 14px', verticalAlign: 'top' }}>
                        {l.link ? <Link href={l.link} style={{ color: 'var(--text-primary)', fontWeight: 600 }} className="print:no-underline">{describe(l)}</Link>
                                : <span style={{ fontWeight: 600 }}>{describe(l)}</span>}
                        {l.description && <span style={{ color: 'var(--text-muted)' }}> — {l.description}</span>}
                      </td>
                      <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top' }}>{n(l.up) ? inr(l.up) : ''}</td>
                      <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top' }}>{n(l.down) ? inr(l.down) : ''}</td>
                      <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top', color: n(l.balance) < 0 ? '#B91C1C' : undefined }}>
                        {inr(Math.abs(n(l.balance)))}{n(l.balance) < 0 ? ' Cr' : ''}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--bg-surface)' }}>
                    <td />
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>Balance on {formatDate(s.to)}</td>
                    <td className="font-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{inr(s.totalUp)}</td>
                    <td className="font-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{inr(s.totalDown)}</td>
                    <td className="font-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{inr(Math.abs(closing))}{closing < 0 ? ' Cr' : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {Object.values(v.ageing).some(x => n(x) > 0) && (
            <div className="card">
              <p className="text-xs" style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                What is open now, by how late it is
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(v.ageing).map(([k, x]) => (
                  <div key={k} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{k}</p>
                    <p className="font-mono" style={{ fontWeight: 700, margin: '3px 0 0', color: !k.startsWith('Not') && n(x) > 0 ? '#B91C1C' : 'var(--text-primary)' }}>{inr(x)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={mailing} onClose={() => setMailing(false)} title="Email the statement" subtitle={v ? `${v.party.name} · ${formatDate(range.from)} to ${formatDate(range.to)} · PDF attached` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-10" onClick={() => setMailing(false)}>Cancel</button>
            <button className="btn-primary h-10" disabled={send.isPending || !mail.to.trim()} onClick={() => send.mutate()}>{send.isPending ? 'Sending…' : 'Send'}</button>
          </div>
        }>
        <div className="space-y-3">
          <div><label className="label label-required" htmlFor="st-to-addr">To</label>
            <input id="st-to-addr" type="email" className="input h-10" value={mail.to} onChange={e => setMail(m => ({ ...m, to: e.target.value }))} placeholder="accounts@customer.in" /></div>
          <div><label className="label" htmlFor="st-cc">Copy to (optional)</label>
            <input id="st-cc" type="email" className="input h-10" value={mail.cc} onChange={e => setMail(m => ({ ...m, cc: e.target.value }))} /></div>
          <div><label className="label" htmlFor="st-msg">A line from you (optional)</label>
            <textarea id="st-msg" className="input" rows={3} maxLength={1000} value={mail.message} onChange={e => setMail(m => ({ ...m, message: e.target.value }))}
              placeholder="e.g. Please let us know when we can expect payment for the open invoices." /></div>
        </div>
      </Modal>
    </div>
  )
}
