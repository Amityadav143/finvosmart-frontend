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

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle2, FileSpreadsheet, RefreshCw, Upload } from 'lucide-react'
import { bankingApi, type ParsedStatement, type StatementLine, type ConfirmResult } from '@/lib/api/banking'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { formatDate, apiError } from '@/lib/utils'
import { inr } from '@/lib/money'

type Tab = 'suggested' | 'unmatched' | 'recorded' | 'out'
const amountOf = (l: StatementLine) => Number(l.credit ?? l.debit ?? 0)

export default function BankReconPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<ParsedStatement | null>(null)
  const [choice, setChoice] = useState<Record<string, number>>({})      // line key → chosen suggestion index (-1 = skip)
  const [tab, setTab] = useState<Tab>('suggested')
  const [result, setResult] = useState<ConfirmResult | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const show = (d: ParsedStatement) => {
    setData(d)
    const c: Record<string, number> = {}
    for (const l of d.lines) if (!l.alreadyRecorded && l.suggestions[0]?.autoSelect) c[l.key] = 0
    setChoice(c)
  }

  const parse = useMutation({
    mutationFn: (f: File) => bankingApi.parse(f),
    onSuccess: d => {
      show(d); setResult(null)
      setTab(d.lines.some(l => !l.alreadyRecorded && l.suggestions.length) ? 'suggested' : 'unmatched')
    },
    onError: (e: any) => toast.error(apiError(e, 'The statement could not be read')),
  })

  const groups = useMemo(() => {
    const g: Record<Tab, StatementLine[]> = { suggested: [], unmatched: [], recorded: [], out: [] }
    for (const l of data?.lines ?? []) {
      if (l.alreadyRecorded) g.recorded.push(l)
      else if (l.suggestions.length) g.suggested.push(l)
      else if (!l.credit) g.out.push(l)
      else g.unmatched.push(l)
    }
    return g
  }, [data])

  const selected = (data?.lines ?? []).filter(l => choice[l.key] !== undefined && choice[l.key] >= 0 && l.suggestions[choice[l.key]])
  const selectedIn = selected.filter(l => l.credit).reduce((s, l) => s + Number(l.credit ?? 0), 0)
  const selectedOut = selected.filter(l => !l.credit).reduce((s, l) => s + Number(l.debit ?? 0), 0)

  const confirm = useMutation({
    mutationFn: () => bankingApi.confirm(selected.map(l => {
      const s = l.suggestions[choice[l.key]]
      return { key: l.key, date: l.date, amount: amountOf(l), description: l.description, reference: l.reference,
               allocations: s.allocations.map(a => ({ invoiceId: a.invoiceId, amount: Number(a.amount), tds: Number(a.tds ?? 0), kind: a.kind ?? 'INVOICE' })) }
    })),
    onSuccess: r => {
      setResult(r)
      qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['inv-stats'] })
      qc.invalidateQueries({ queryKey: ['bills'] }); qc.invalidateQueries({ queryKey: ['payables'] })
      if (r.recorded) toast.success(`${r.recorded} payment${r.recorded === 1 ? '' : 's'} recorded`)
      if (r.errors.length) toast.error(`${r.errors.length} line${r.errors.length === 1 ? '' : 's'} not recorded`)
      // read the statement again: recorded lines now show as recorded, suggestions reflect the new balances
      if (file) bankingApi.parse(file).then(show).catch(() => setChoice({}))
    },
    onError: (e: any) => toast.error(apiError(e, 'The payments could not be recorded')),
  })

  const onFile = (f?: File | null) => { if (f) { setFile(f); parse.mutate(f) } }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Match bank payments</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Upload your bank statement — money received is matched to the invoice it pays, money paid out to the supplier bill it settles, and recorded once you confirm.</p>
        </div>
        {data && <button className="btn-secondary h-9" onClick={() => { setData(null); setResult(null); setChoice({}) }}><RefreshCw size={15} />Another statement</button>}
      </div>

      {!data && (
        <div className="card">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]) }}
            className="rounded-2xl flex flex-col items-center justify-center text-center gap-3 py-12 px-4 cursor-pointer"
            style={{ border: '2px dashed var(--border-strong)' }}
            onClick={() => fileRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--gold-muted)' }}>
              {parse.isPending ? <RefreshCw className="animate-spin" style={{ color: 'var(--gold)' }} /> : <Upload style={{ color: 'var(--gold)' }} />}
            </div>
            <p className="font-semibold">{parse.isPending ? 'Reading the statement…' : 'Drop the statement here, or click to choose'}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>CSV, Excel (.xlsx / .xls) or OFX, as downloaded from net banking — any bank (SBI, HDFC, ICICI, Axis, Kotak…). No need to choose the format.</p>
            <input ref={fileRef} type="file" className="hidden" accept=".csv,.txt,.xlsx,.xls,.ofx,.qfx" onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          <ul className="text-xs mt-4 space-y-1" style={{ color: 'var(--text-muted)' }}>
            <li>• Lines already recorded are recognised, so uploading the same statement again never records anything twice.</li>
            <li>• Payments where the customer deducted TDS are spotted (balance due less 1%, 2%, 5% or 10% of the taxable value).</li>
            <li>• Payments to suppliers are matched to their unpaid bills by bill number, amount and name.</li>
            <li>• Nothing is recorded until you confirm. Matches you confirm go into the books as receipts and payments.</li>
          </ul>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Statement" value={`${formatDate(data.from)} – ${formatDate(data.to)}`} sub={`${data.transactions} transactions · ${data.fileName}`} />
            <Stat label="Money in" value={inr(data.totalIn)} sub={`${data.moneyIn} credits`} />
            <Stat label="Matched" value={String(groups.suggested.length)} sub="to invoices or bills" color="#16a34a" />
            <Stat label="Already recorded" value={String(groups.recorded.length)} sub="from earlier uploads" />
          </div>
          {(data.skippedRows > 0 || data.warnings.length > 0) && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{data.skippedRows > 0 && `${data.skippedRows} row(s) were not transactions and were skipped. `}{data.warnings.join(' ')}</p>
          )}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}><FileSpreadsheet className="inline w-3.5 h-3.5 mr-1" />Columns found: {data.layout}</p>

          {result && (
            <div className="card text-sm space-y-1" style={{ borderColor: result.errors.length ? '#d97706' : '#16a34a' }}>
              <p className="font-semibold"><CheckCircle2 className="inline w-4 h-4 mr-1" style={{ color: '#16a34a' }} />{result.recorded} payment{result.recorded === 1 ? '' : 's'} recorded ({inr(result.amount)}){result.skippedAlreadyRecorded ? ` · ${result.skippedAlreadyRecorded} already recorded` : ''}</p>
              {result.errors.map((e, i) => <p key={i} style={{ color: '#d97706' }}>{e}</p>)}
            </div>
          )}

          <div className="flex gap-1 p-1 rounded-xl w-fit flex-wrap" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            {([['suggested', 'Matched'], ['unmatched', 'Money in, no match'], ['out', 'Money out, no match'], ['recorded', 'Already recorded']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--gold)' : 'var(--text-muted)' }}>
                {label} <span className="text-xs opacity-70">{groups[t].length}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {groups[tab].length === 0 && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Nothing here.</div>}
            {groups[tab].map(l => (
              <div key={l.key} className="card py-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(l.date)}{l.reference ? ` · ref ${l.reference}` : ''}</p>
                    <p className="text-sm font-mono break-all">{l.description || '—'}</p>
                  </div>
                  <p className="font-mono font-semibold" style={{ color: l.credit ? '#16a34a' : 'var(--text-primary)' }}>{l.credit ? '+' + inr(l.credit) : '−' + inr(l.debit)}</p>
                </div>
                {tab === 'suggested' && (
                  <div className="mt-2 space-y-1.5">
                    {l.suggestions.map((s, i) => (
                      <label key={i} className="flex items-start gap-2 rounded-lg px-2.5 py-2 cursor-pointer text-sm"
                        style={{ background: choice[l.key] === i ? 'var(--gold-muted)' : 'var(--bg-surface)', border: `1px solid ${choice[l.key] === i ? 'var(--gold)' : 'transparent'}` }}>
                        <input type="radio" name={`m-${l.key}`} className="mt-1" checked={choice[l.key] === i} onChange={() => setChoice(c => ({ ...c, [l.key]: i }))} />
                        <span className="flex-1">
                          {s.allocations[0]?.kind === 'BILL' && <span className="badge s-blue mr-1.5">Bill</span>}
                          <span className="font-medium">{s.allocations.map(a => a.invoiceNumber).join(' + ')}</span>
                          <span style={{ color: 'var(--text-muted)' }}> · {s.allocations[0]?.customerName}</span>
                          {s.allocations.some(a => Number(a.tds) > 0) && <span style={{ color: 'var(--text-muted)' }}> · TDS {inr(s.allocations.reduce((x, a) => x + Number(a.tds ?? 0), 0))}</span>}
                          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{s.reason}</span>
                        </span>
                        <span className="text-xs font-semibold" style={{ color: s.confidence >= 70 ? '#16a34a' : '#d97706' }}>{s.confidence}%</span>
                      </label>
                    ))}
                    <label className="flex items-center gap-2 px-2.5 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      <input type="radio" name={`m-${l.key}`} checked={choice[l.key] === undefined || choice[l.key] < 0} onChange={() => setChoice(c => ({ ...c, [l.key]: -1 }))} />
                      None of these — leave it for now
                    </label>
                  </div>
                )}
                {tab === 'unmatched' && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No invoice fits. If it is a customer payment, open the invoice and use “Record payment”.</p>}
                {tab === 'out' && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No unpaid bill fits. If it is a supplier payment, record the bill (or an expense) and its payment in Bills and payables.</p>}
                {tab === 'recorded' && <p className="text-xs mt-1" style={{ color: '#16a34a' }}>Recorded against {l.credit ? 'an invoice' : 'a bill'}.</p>}
              </div>
            ))}
          </div>

          <PermissionGate permission="BANK_RECON_RUN">
            <div className="sticky bottom-0 z-20 -mx-5 md:-mx-6 -mb-5 md:-mb-6 px-5 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
              style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.length
                ? `${selected.length} selected${selectedIn ? ` · ${inr(selectedIn)} received` : ''}${selectedOut ? ` · ${inr(selectedOut)} paid out` : ''}`
                : 'Select the matches to record.'}</p>
              <div className="flex gap-2">
                <Link href="/invoicing" className="btn-secondary h-10">Invoices</Link>
                <Link href="/purchases" className="btn-secondary h-10">Bills</Link>
                <button className="btn-primary h-10" disabled={!selected.length || confirm.isPending} onClick={() => confirm.mutate()}>
                  {confirm.isPending ? 'Recording…' : `Record ${selected.length || ''} payment${selected.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </PermissionGate>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="card">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
