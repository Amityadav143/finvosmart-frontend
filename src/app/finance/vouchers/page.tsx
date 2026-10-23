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

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, ChevronDown, ChevronRight, Cog, PenLine, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { financeApi } from '@/lib/api/finance'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { addMoney, subMoney } from '@/lib/invoiceMath'
import { inr, todayIST } from '@/lib/money'
import { errText } from '@/lib/purchases'
import { formatDate } from '@/lib/utils'
import type { JournalEntry, JournalEntryType } from '@/types'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import { DocumentReview } from '@/components/ca/DocumentReview'

const TYPES: { value: '' | JournalEntryType; label: string }[] = [
  { value: '', label: 'All' }, { value: 'JOURNAL', label: 'Journal' }, { value: 'RECEIPT', label: 'Receipts' },
  { value: 'PAYMENT', label: 'Payments' }, { value: 'CONTRA', label: 'Contra' }, { value: 'OPENING', label: 'Opening' },
]
const TYPE_LABEL: Record<JournalEntryType, string> = { JOURNAL: 'Journal', RECEIPT: 'Receipt', PAYMENT: 'Payment', CONTRA: 'Contra', OPENING: 'Opening' }

interface DraftLine { accountId: string; debit: string; credit: string; narration: string }
const blankLine = (): DraftLine => ({ accountId: '', debit: '', credit: '', narration: '' })
const amount = (x: string) => /^\d+(\.\d{1,2})?$/.test(x.trim()) ? x.trim() : ''

export default function JournalEntriesPage() {
  const qc = useQueryClient()
  const { can } = usePermissions()
  const [type, setType] = useState<'' | JournalEntryType>('')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [reversing, setReversing] = useState<JournalEntry | null>(null)
  const [reason, setReason] = useState('')
  const [focus, setFocus] = useState<string | null>(null)
  useUrlParams(p => {
    if (p.get('new') === '1' && can('FINANCE_CREATE')) setCreating(true)
    const o = p.get('open')
    if (o) { setType(''); setPage(0); setOpen(o); setFocus(o) }
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['journal-entries', type, page],
    queryFn: () => financeApi.journalEntries.list({ type: type || undefined, page, size: 25 }),
  })
  const entries = data?.content ?? []
  // An entry opened from a link (a review, a notification) that isn't on this page of the list
  const onPage = !!focus && entries.some(e => e.id === focus)
  const { data: focused } = useQuery({
    queryKey: ['journal-entry', focus],
    queryFn: () => financeApi.journalEntries.get(focus!),
    enabled: !!focus && !!data && !onPage,
    retry: false,
  })

  const reverse = useMutation({
    mutationFn: () => financeApi.journalEntries.reverse(reversing!.id, reason),
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['journal-entries'] })
      toast.success(`${reversing!.entryNumber} reversed by ${r.entryNumber}`)
      setReversing(null); setReason('')
    },
    onError: (e: any) => toast.error(errText(e, 'The entry could not be reversed')),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Journal entries</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Every entry in your books, newest first — posted automatically from invoices, bills, payments and payroll, or entered by hand.
          </p>
        </div>
        {can('FINANCE_CREATE') && (
          <button onClick={() => setCreating(true)} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4" />New entry</button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Kind of entry">
        {TYPES.map(t => (
          <button key={t.value || 'all'} onClick={() => { setType(t.value); setPage(0); setOpen(null) }} aria-pressed={type === t.value}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: type === t.value ? 'var(--gold-muted)' : 'var(--bg-hover)', color: type === t.value ? 'var(--gold)' : 'var(--text-muted)',
                     border: `1px solid ${type === t.value ? 'rgba(245,158,11,.2)' : 'var(--border)'}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The journal couldn't be loaded.</div>}
      {focused && !onPage && (
        <div className="card" data-testid="focused-entry">
          <div className="flex items-center justify-between gap-3 flex-wrap" style={{ marginBottom: '10px' }}>
            <div>
              <span className="font-mono text-sm" style={{ color: 'var(--gold)' }}>{focused.entryNumber}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {formatDate(focused.entryDate)} · {focused.source}</span>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', margin: '2px 0 0' }}>{focused.narration || '—'} · {inr(focused.totalDebit)}</p>
            </div>
            <button className="btn-ghost text-xs" onClick={() => { setFocus(null); setOpen(null) }}>Close</button>
          </div>
          <EntryDetail e={focused} canReverse={focused.reversible && can('FINANCE_CREATE')} onReverse={() => setReversing(focused)} />
        </div>
      )}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="table-header w-8" aria-label="Show lines" />
            {['Entry', 'Date', 'Source', 'Narration'].map(h => <th key={h} className="table-header">{h}</th>)}
            <th className="table-header text-right">Amount</th>
          </tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="table-cell text-center" style={{ color: 'var(--text-muted)' }}>Loading…</td></tr>}
            {!isLoading && entries.length === 0 && (
              <tr><td colSpan={6} className="table-cell text-center py-10" style={{ color: 'var(--text-muted)' }}>
                {type ? 'No entries of this kind yet.' : 'No entries yet. They appear as you issue invoices, record bills and payments, and run payroll.'}
              </td></tr>
            )}
            {entries.map(e => {
              const isOpen = open === e.id
              return (
                <Fragment key={e.id}>
                  <tr className="table-row cursor-pointer" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                    <td className="table-cell" style={{ color: 'var(--text-muted)' }}>{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                    <td className="table-cell whitespace-nowrap">
                      <span className="font-mono text-xs" style={{ color: 'var(--gold)' }}>{e.entryNumber}</span>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{TYPE_LABEL[e.entryType] ?? e.entryType}</p>
                    </td>
                    <td className="table-cell text-xs whitespace-nowrap">{formatDate(e.entryDate)}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: e.automatic ? '#2563eb' : 'var(--text-secondary)' }}>
                        {e.automatic ? <Cog size={13} aria-hidden /> : <PenLine size={13} aria-hidden />}{e.source}
                      </span>
                      {e.reversedBy && <p className="text-xs mt-0.5 whitespace-nowrap" style={{ color: '#b45309' }}>Reversed by {e.reversedBy}</p>}
                    </td>
                    <td className="table-cell text-xs" style={{ color: 'var(--text-secondary)', minWidth: 220 }}>{e.narration || '—'}</td>
                    <td className="table-cell text-right font-mono font-semibold whitespace-nowrap">{inr(e.totalDebit)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td />
                      <td colSpan={5} className="pb-4 pt-1 pr-4">
                        <EntryDetail e={e} canReverse={e.reversible && can('FINANCE_CREATE')} onReverse={() => setReversing(e)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {data && data.totalPages > 1 && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={p => { setPage(p); setOpen(null) }} totalElements={data.totalElements} pageSize={25} />}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Balances by account are under <Link href="/finance/accounts" className="underline">Accounts</Link>; the trial balance, profit and loss and balance sheet under <Link href="/finance/reports" className="underline">Reports</Link>.
      </p>

      {creating && <NewEntry onClose={() => setCreating(false)} onPosted={() => { setCreating(false); setType(''); setPage(0); qc.invalidateQueries({ queryKey: ['journal-entries'] }) }} />}

      <Modal open={!!reversing} onClose={() => { setReversing(null); setReason('') }} title={`Reverse ${reversing?.entryNumber ?? ''}`}
        subtitle="Posts the same entry with debits and credits swapped, dated today. The original stays in the books, marked as reversed.">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="rev-reason">Reason (optional)</label>
            <input id="rev-reason" className="input h-10" value={reason} maxLength={300} onChange={e => setReason(e.target.value)} placeholder="e.g. Posted to the wrong account" />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => { setReversing(null); setReason('') }}>Cancel</button>
            <button className="btn-primary" disabled={reverse.isPending} onClick={() => reverse.mutate()}>{reverse.isPending ? 'Reversing…' : 'Reverse the entry'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/** A manual journal entry: two or more lines, each a debit or a credit, adding up to the same total. */
function NewEntry({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [entryType, setEntryType] = useState<JournalEntryType>('JOURNAL')
  const [entryDate, setEntryDate] = useState(todayIST())
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([blankLine(), blankLine()])
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: financeApi.accounts.list })

  const set = (i: number, patch: Partial<DraftLine>) => setLines(ls => ls.map((l, j) => j === i ? { ...l, ...patch } : l))
  const filled = lines.filter(l => l.accountId || l.debit || l.credit)
  const bad = filled.some(l => !l.accountId || (!!amount(l.debit) === !!amount(l.credit)) || (l.debit && !amount(l.debit)) || (l.credit && !amount(l.credit)))
  const totalDr = addMoney(...filled.map(l => amount(l.debit) || '0'))
  const totalCr = addMoney(...filled.map(l => amount(l.credit) || '0'))
  const diff = subMoney(totalDr, totalCr)
  const ok = filled.length >= 2 && !bad && Number(diff) === 0 && Number(totalDr) > 0

  const post = useMutation({
    mutationFn: () => financeApi.journalEntries.create({
      entryType, entryDate, narration: narration.trim(),
      lines: filled.map(l => ({ accountId: l.accountId, debitAmount: amount(l.debit) || '0', creditAmount: amount(l.credit) || '0', narration: l.narration.trim() || undefined })),
    }),
    onSuccess: r => { toast.success(`Entry ${r.entryNumber} posted`); onPosted() },
    onError: (e: any) => toast.error(errText(e, 'The entry could not be posted')),
  })

  return (
    <Modal open onClose={onClose} title="New journal entry" subtitle="Each line is a debit or a credit; the debits must add up to the credits." size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="label" htmlFor="je-type">Kind</label>
            <select id="je-type" className="input h-10" value={entryType} onChange={e => setEntryType(e.target.value as JournalEntryType)}>
              {(Object.keys(TYPE_LABEL) as JournalEntryType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select></div>
          <div><label className="label" htmlFor="je-date">Date</label>
            <input id="je-date" className="input h-10" type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} /></div>
          <div><label className="label" htmlFor="je-narr">Narration</label>
            <input id="je-narr" className="input h-10" value={narration} onChange={e => setNarration(e.target.value)} placeholder="What this entry is for" /></div>
        </div>

        <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm" style={{ minWidth: 560 }}>
            <thead><tr style={{ background: 'var(--bg-hover)' }}>
              <th className="text-left text-xs font-semibold px-3 py-2" style={{ color: 'var(--text-muted)' }}>Account</th>
              <th className="text-right text-xs font-semibold px-3 py-2 w-32" style={{ color: 'var(--text-muted)' }}>Debit (₹)</th>
              <th className="text-right text-xs font-semibold px-3 py-2 w-32" style={{ color: 'var(--text-muted)' }}>Credit (₹)</th>
              <th className="w-10" aria-label="Remove" />
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="px-2 py-1.5">
                    <select className="input h-9 text-xs" value={l.accountId} aria-label={`Account, line ${i + 1}`} onChange={e => set(i, { accountId: e.target.value })}>
                      <option value="">Choose an account…</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><input className="input h-9 text-xs text-right font-mono" inputMode="decimal" placeholder="0.00" aria-label={`Debit, line ${i + 1}`}
                    value={l.debit} onChange={e => set(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} /></td>
                  <td className="px-2 py-1.5"><input className="input h-9 text-xs text-right font-mono" inputMode="decimal" placeholder="0.00" aria-label={`Credit, line ${i + 1}`}
                    value={l.credit} onChange={e => set(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} /></td>
                  <td className="px-1 py-1.5 text-center">
                    {lines.length > 2 && <button className="btn-icon w-7 h-7" aria-label={`Remove line ${i + 1}`} onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}><Trash2 size={13} /></button>}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                <td className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Total</td>
                <td className="px-3 py-2 text-right font-mono text-sm font-semibold">{inr(totalDr)}</td>
                <td className="px-3 py-2 text-right font-mono text-sm font-semibold">{inr(totalCr)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {filled.length > 0 && !ok && (
          <p className="flex items-start gap-2 text-xs" style={{ color: '#b45309' }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" aria-hidden />
            {bad ? 'Each line needs an account and either a debit or a credit (in rupees, up to 2 decimals).'
              : filled.length < 2 ? 'An entry needs at least two lines.'
              : Number(diff) !== 0 ? `Debits and credits differ by ${inr(diff.replace('-', ''))}.` : 'Enter the amounts.'}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button className="btn-ghost text-xs" onClick={() => setLines(ls => [...ls, blankLine()])}><Plus size={14} />Add a line</button>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={!ok || post.isPending} onClick={() => post.mutate()}>{post.isPending ? 'Posting…' : 'Post the entry'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** The lines of one entry, what can be done with it, and its review by the accountant. */
function EntryDetail({ e, canReverse, onReverse }: { e: JournalEntry; canReverse: boolean; onReverse: () => void }) {
  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead><tr style={{ background: 'var(--bg-hover)' }}>
            <th className="text-left text-xs font-semibold px-3 py-2" style={{ color: 'var(--text-muted)' }}>Account</th>
            <th className="text-right text-xs font-semibold px-3 py-2" style={{ color: 'var(--text-muted)' }}>Debit</th>
            <th className="text-right text-xs font-semibold px-3 py-2" style={{ color: 'var(--text-muted)' }}>Credit</th>
          </tr></thead>
          <tbody>
            {e.lines.map((l, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="px-3 py-2 text-xs">
                  <span className="font-mono mr-2" style={{ color: 'var(--text-muted)' }}>{l.accountCode}</span>{l.accountName ?? 'Account'}
                  {l.narration && <span style={{ color: 'var(--text-muted)' }}> — {l.narration}</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">{Number(l.debitAmount) ? inr(l.debitAmount) : ''}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{Number(l.creditAmount) ? inr(l.creditAmount) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {e.automatic ? 'Posted automatically. To change it, correct or cancel the document it came from — the books follow.'
            : e.reversedBy ? `Reversed by ${e.reversedBy}.` : 'Entered by hand. A mistake is corrected by reversing the entry and posting a new one.'}
        </p>
        {canReverse && (
          <button className="btn-secondary h-8 text-xs" onClick={ev => { ev.stopPropagation(); onReverse() }}><RotateCcw size={13} />Reverse</button>
        )}
      </div>
      <div className="mt-2" onClick={ev => ev.stopPropagation()}>
        <DocumentReview type="JOURNAL" id={e.id} />
      </div>
    </>
  )
}
