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

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, BookOpen, Download, ExternalLink, FileSpreadsheet, Printer } from 'lucide-react'
import { financeApi, type LedgerLine } from '@/lib/api/finance'
import { periods } from '@/lib/api/statements'
import { inr, todayIST } from '@/lib/money'
import { apiError, formatDate } from '@/lib/utils'
import { PermissionGate } from '@/components/ui/PermissionGate'
import type { Account } from '@/types'

const TYPES: { type: string; label: string }[] = [
  { type: 'ASSET', label: 'Assets' }, { type: 'LIABILITY', label: 'Liabilities' }, { type: 'EQUITY', label: 'Capital and reserves' },
  { type: 'INCOME', label: 'Income' }, { type: 'EXPENSE', label: 'Expenses' },
]
/** Accounts people open most, offered when none is chosen yet. */
const QUICK = ['1010', '1000', '1100', '2000', '4000', '5000']
const KIND: Record<string, string> = { JOURNAL: 'Journal', RECEIPT: 'Receipt', PAYMENT: 'Payment', CONTRA: 'Contra', OPENING: 'Opening' }
const ISO = /^\d{4}-\d{2}-\d{2}$/

const n = (x: unknown) => Number(x ?? 0)
/** "12,345.00 Dr" — or "Nil". */
const bal = (amount: unknown, side: string) => (!side || n(amount) === 0 ? 'Nil' : `${inr(amount as number)} ${side}`)
const docLabel = (link: string) => link.startsWith('/invoicing/') ? 'Open invoice' : link.startsWith('/purchases/bills/') ? 'Open bill'
  : link.startsWith('/hrms/payroll/') ? 'Open payroll' : 'Open document'

export default function LedgerPage() {
  const today = todayIST()
  const options = useMemo(() => periods(today), [today])
  const [accountId, setAccountId] = useState('')
  const [range, setRange] = useState({ from: options[0].from, to: options[0].to, key: 'fy' })
  const [busy, setBusy] = useState<'' | 'pdf' | 'csv'>('')

  // Opened from the chart of accounts or a report: ?account=<id>&from=&to=
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const a = p.get('account'), f = p.get('from'), t = p.get('to')
    if (a) setAccountId(a)
    if (f && t && ISO.test(f) && ISO.test(t) && f <= t) {
      const preset = options.find(o => o.from === f && o.to === t)
      setRange({ from: f, to: t, key: preset?.key ?? 'custom' })
    }
  }, [options])
  // …and the address follows what is on screen, so it can be bookmarked or shared.
  useEffect(() => {
    if (!accountId) return
    const q = new URLSearchParams({ account: accountId, from: range.from, to: range.to })
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${q}`)
  }, [accountId, range.from, range.to])

  const accounts = useQuery({ queryKey: ['accounts'], queryFn: financeApi.accounts.list })
  const valid = ISO.test(range.from) && ISO.test(range.to) && range.from <= range.to
  const q = useQuery({
    queryKey: ['ledger', accountId, range.from, range.to],
    queryFn: () => financeApi.ledger(accountId, range.from, range.to),
    enabled: !!accountId && valid,
  })
  const v = q.data, l = v?.ledger
  const list = (accounts.data ?? []) as Account[]

  const download = async (kind: 'pdf' | 'csv') => {
    if (!v) return
    setBusy(kind)
    try {
      if (kind === 'pdf') await financeApi.ledgerPdf(accountId, range.from, range.to, v.account.code)
      else await financeApi.ledgerCsv(accountId, range.from, range.to, v.account.code)
    } catch (e: any) {
      toast.error(apiError(e, 'The file could not be prepared. Please try again.'))
    } finally { setBusy('') }
  }

  return (
    <PermissionGate anyOf={['FINANCE_VIEW', 'FINANCE_REPORTS']} showDenied>
      <div className="space-y-5" style={{ maxWidth: '1120px' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap print:hidden">
          <div>
            <Link href="/finance/accounts" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Chart of accounts</Link>
            <h1 className="page-title mt-1">Ledger{v ? ` — ${v.account.code} ${v.account.name}` : ''}</h1>
            <p className="page-subtitle">Every entry on an account, with a running balance — the detail behind each figure in your reports.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary h-9" onClick={() => window.print()} disabled={!v}><Printer size={15} />Print</button>
            <button className="btn-secondary h-9" onClick={() => download('csv')} disabled={!v || !!busy}><FileSpreadsheet size={15} />{busy === 'csv' ? 'Preparing…' : 'Excel (CSV)'}</button>
            <button className="btn-secondary h-9" onClick={() => download('pdf')} disabled={!v || !!busy}><Download size={15} />{busy === 'pdf' ? 'Preparing…' : 'PDF'}</button>
          </div>
        </div>

        <div className="card flex items-end gap-3 flex-wrap print:hidden" role="group" aria-label="Account and period">
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <label className="label" htmlFor="lg-account">Account</label>
            <select id="lg-account" className="input h-10" value={accountId} onChange={e => setAccountId(e.target.value)} disabled={accounts.isLoading}>
              <option value="">{accounts.isLoading ? 'Loading accounts…' : 'Choose an account…'}</option>
              {TYPES.map(t => {
                const group = list.filter(a => a.accountType === t.type)
                return group.length ? (
                  <optgroup key={t.type} label={t.label}>
                    {group.map(a => <option key={a.id} value={a.id}>{a.accountCode} · {a.accountName}</option>)}
                  </optgroup>
                ) : null
              })}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lg-period">Period</label>
            <select id="lg-period" className="input h-10" value={range.key}
              onChange={e => { const o = options.find(x => x.key === e.target.value); setRange(o ? { from: o.from, to: o.to, key: o.key } : { ...range, key: 'custom' }) }}>
              {options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              <option value="custom">Choose dates…</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lg-from">From</label>
            <input id="lg-from" type="date" className="input h-10" value={range.from} max={range.to} onChange={e => setRange(r => ({ ...r, from: e.target.value, key: 'custom' }))} />
          </div>
          <div>
            <label className="label" htmlFor="lg-to">To</label>
            <input id="lg-to" type="date" className="input h-10" value={range.to} min={range.from} onChange={e => setRange(r => ({ ...r, to: e.target.value, key: 'custom' }))} />
          </div>
        </div>

        {!accountId && (
          <div className="card" data-testid="ledger-pick">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={20} style={{ color: 'var(--gold)' }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>Choose an account to see its ledger</p>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              You can also open a ledger by clicking an account in the chart of accounts, the trial balance or the reports.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map(code => list.find(a => a.accountCode === code)).filter(Boolean).map(a => (
                <button key={a!.id} className="btn-secondary h-9 text-sm" onClick={() => setAccountId(a!.id)}>{a!.accountName}</button>
              ))}
            </div>
          </div>
        )}

        {!!accountId && !valid && <div className="card text-sm" style={{ color: '#b45309' }}>The period ends before it starts — check the dates.</div>}
        {q.isLoading && !!accountId && <div className="card" style={{ height: '220px', background: 'var(--bg-surface)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
        {q.isError && <div className="card text-sm" style={{ color: 'var(--text-secondary)' }}>{apiError(q.error, 'The ledger could not be prepared.')}</div>}

        {v && l && (
          <>
            <div className="hidden print:block">
              <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Ledger — {v.account.code} {v.account.name}</h1>
              <p style={{ fontSize: '12px' }}>{formatDate(l.from)} to {formatDate(l.to)}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="ledger-summary">
              {[
                { label: `Opening balance on ${formatDate(l.from)}`, value: bal(l.opening, l.openingSide) },
                { label: 'Debits in the period', value: inr(l.totalDebit) },
                { label: 'Credits in the period', value: inr(l.totalCredit) },
                { label: `Closing balance on ${formatDate(l.to)}`, value: bal(l.closing, l.closingSide), strong: true },
              ].map(k => (
                <div key={k.label} className="card" style={k.strong ? { border: '1px solid var(--gold)', background: 'var(--gold-muted)' } : undefined}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{k.label}</p>
                  <p className="font-mono" style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 0' }}>{k.value}</p>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: '860px' }} data-testid="ledger-table">
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                      {['Date', 'Voucher', 'Particulars', 'Debit', 'Credit', 'Balance'].map((h, i) => (
                        <th key={h} className="table-header" style={{ textAlign: i >= 3 ? 'right' : 'left', padding: '10px 14px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{formatDate(l.from)}</td>
                      <td />
                      <td style={{ padding: '9px 14px', fontWeight: 600 }}>Opening balance</td>
                      <td /><td />
                      <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{bal(l.opening, l.openingSide)}</td>
                    </tr>
                    {l.lines.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '22px 14px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nothing was posted to this account between {formatDate(l.from)} and {formatDate(l.to)}.
                      </td></tr>
                    )}
                    {l.lines.map((x: LedgerLine, i: number) => (
                      <tr key={`${x.entryId}-${i}`} style={{ borderBottom: '1px solid var(--border)' }} data-testid="ledger-line">
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{formatDate(x.date)}</td>
                        <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                          {x.voucherLink
                            ? <Link href={x.voucherLink} className="font-mono text-xs" style={{ color: 'var(--gold)', fontWeight: 600 }} title="Open the journal entry">{x.entryNumber}</Link>
                            : <span className="font-mono text-xs">{x.entryNumber}</span>}
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{KIND[x.entryType] ?? x.entryType}</div>
                        </td>
                        <td style={{ padding: '9px 14px', verticalAlign: 'top' }}>
                          <div style={{ color: 'var(--text-primary)' }}>{x.narration || '—'}</div>
                          {x.particulars && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Other side: {x.particulars}</div>}
                          {x.documentLink && (
                            <Link href={x.documentLink} className="text-xs inline-flex items-center gap-1 print:hidden" style={{ color: 'var(--gold)' }}>
                              <ExternalLink size={11} />{docLabel(x.documentLink)}
                            </Link>
                          )}
                        </td>
                        <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{n(x.debit) ? inr(x.debit) : ''}</td>
                        <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{n(x.credit) ? inr(x.credit) : ''}</td>
                        <td className="font-mono" style={{ padding: '9px 14px', textAlign: 'right', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{bal(x.balance, x.side)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                      <td /><td />
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>Totals for the period</td>
                      <td className="font-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{inr(l.totalDebit)}</td>
                      <td className="font-mono" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{inr(l.totalCredit)}</td>
                      <td />
                    </tr>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{formatDate(l.to)}</td>
                      <td />
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>Closing balance</td>
                      <td /><td />
                      <td className="font-mono" data-testid="ledger-closing" style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{bal(l.closing, l.closingSide)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  )
}
