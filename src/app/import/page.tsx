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

import { Suspense, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  AlertOctagon, AlertTriangle, ArrowLeft, Building2, CheckCircle2, ChevronDown, ChevronRight, Download, FileSpreadsheet,
  FileUp, Info, Lock, MinusCircle, Package, Receipt, Scale, Truck, UserCheck, Users,
} from 'lucide-react'
import { importsApi } from '@/lib/api/imports'
import { errText } from '@/lib/purchases'
import { inr, todayIST } from '@/lib/money'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Modal } from '@/components/ui/Modal'
import type { ImportKind, ImportKindInfo, ImportPreview, ImportResult, ImportRow, ImportRowStatus } from '@/types/imports'

type Card = { kind: ImportKind; icon: any; blurb: string; after: { href: string; label: string } }

const GROUPS: { title: string; note?: string; cards: Card[] }[] = [
  {
    title: 'Lists',
    cards: [
      { kind: 'customers', icon: UserCheck, blurb: 'Names, GSTINs, contacts, addresses and payment terms.', after: { href: '/crm/customers', label: 'Open customers' } },
      { kind: 'suppliers', icon: Truck, blurb: 'With bank details, MSME (Udyam) status and TDS type.', after: { href: '/procurement/vendors', label: 'Open suppliers' } },
      { kind: 'items', icon: Package, blurb: 'Codes, HSN/SAC, GST rates, prices and the stock you hold today.', after: { href: '/inventory/items', label: 'Open inventory' } },
      { kind: 'employees', icon: Users, blurb: 'Joining dates, departments, PAN, bank and ESI details.', after: { href: '/hrms/employees', label: 'Open employees' } },
    ],
  },
  {
    title: 'Opening balances',
    note: 'Moving your books here? Import your customers and suppliers first, then these three.',
    cards: [
      { kind: 'opening-balances', icon: Scale, blurb: 'Bank, cash, capital, loans and assets — from your trial balance.', after: { href: '/finance/accounts', label: 'Open accounts' } },
      { kind: 'customer-dues', icon: Receipt, blurb: 'Invoices customers still owe you, to collect and remind here.', after: { href: '/invoicing', label: 'Open invoices' } },
      { kind: 'supplier-dues', icon: Building2, blurb: 'Bills you still have to pay, with MSME pay-by dates.', after: { href: '/purchases', label: 'Open bills' } },
    ],
  },
]
const CARD = Object.fromEntries(GROUPS.flatMap(g => g.cards).map(c => [c.kind, c])) as Record<ImportKind, Card>

const STATUS: Record<ImportRowStatus, { label: string; icon: any; color: string }> = {
  NEW:     { label: 'Will be added', icon: CheckCircle2, color: '#16a34a' },
  UPDATE:  { label: 'Will be set',   icon: CheckCircle2, color: '#16a34a' },
  EXISTS:  { label: 'Already there', icon: MinusCircle,  color: 'var(--text-muted)' },
  SKIPPED: { label: 'Left out',      icon: MinusCircle,  color: 'var(--text-muted)' },
  ERROR:   { label: 'Problem',       icon: AlertOctagon, color: '#dc2626' },
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
      <ImportHome />
    </Suspense>
  )
}

function ImportHome() {
  const params = useSearchParams()
  const chosen = params.get('kind') as ImportKind | null
  const { data: kinds, isLoading, isError } = useQuery({ queryKey: ['import-kinds'], queryFn: importsApi.kinds, staleTime: 5 * 60_000 })
  const info = kinds?.find(k => k.kind === chosen)

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="page-title">Import from Excel</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Bring in customers, suppliers, items, employees and opening balances from Excel or CSV — your own sheets, or exports from Tally, Zoho Books or Vyapar.
        </p>
      </div>
      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The import options couldn't be loaded. Check your connection and try again.</div>}
      {kinds && (info ? <ImportPanel key={info.kind} info={info} /> : <Chooser kinds={kinds} />)}
    </div>
  )
}

function Chooser({ kinds }: { kinds: ImportKindInfo[] }) {
  const byKind = Object.fromEntries(kinds.map(k => [k.kind, k])) as Record<ImportKind, ImportKindInfo>
  const { can } = usePermissions()
  const { data: diff } = useQuery({ queryKey: ['opening-difference'], queryFn: importsApi.openingDifference, enabled: can('FINANCE_VIEW') || can('FINANCE_CREATE') })
  return (
    <div className="space-y-6">
      {GROUPS.map(g => (
        <section key={g.title} aria-label={g.title}>
          <div className="flex items-end justify-between gap-3 flex-wrap mb-2">
            <div>
              <h2 className="section-title">{g.title}</h2>
              {g.note && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.note}</p>}
            </div>
            {g.title === 'Opening balances' && diff && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: diff.balanced ? '#16a34a' : 'var(--text-secondary)' }}>
                {diff.balanced ? <CheckCircle2 size={13} aria-hidden /> : <Info size={13} aria-hidden />}
                {diff.balanced ? 'Opening balances add up' : `${inr(Math.abs(Number(diff.amount)))} of the opening balances not yet explained (Opening Balance Difference)`}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {g.cards.map(c => {
              const k = byKind[c.kind]
              const allowed = !!k?.allowed
              const body = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gold-muted)' }}>
                      <c.icon size={17} style={{ color: 'var(--gold)' }} aria-hidden />
                    </span>
                    {allowed ? <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
                      : <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Lock size={12} aria-hidden />No access</span>}
                  </div>
                  <p className="font-semibold text-sm mt-3" style={{ color: 'var(--text-primary)' }}>{k?.label ?? c.kind}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{c.blurb}</p>
                </>
              )
              return allowed
                ? <Link key={c.kind} href={`/import?kind=${c.kind}`} className="card block hover:shadow-md transition-shadow" style={{ textDecoration: 'none' }}>{body}</Link>
                : <div key={c.kind} className="card opacity-60" aria-disabled title="Ask an administrator for access">{body}</div>
            })}
          </div>
        </section>
      ))}
      <div className="card text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>How it works</p>
        <p>1. Download the template, or use your own sheet — headings like “GST No.”, “Party’s Name” or “Opening Balance” from Tally, Zoho Books and Vyapar are recognised.</p>
        <p>2. Upload it. You see what each row will do before anything is saved; rows already in Finvosmart are left alone.</p>
        <p>3. Import. All ready rows are saved together — if anything fails, nothing is saved, so you can fix the file and try again.</p>
      </div>
    </div>
  )
}

function ImportPanel({ info }: { info: ImportKindInfo }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const card = CARD[info.kind]
  const dues = info.kind === 'customer-dues' || info.kind === 'supplier-dues'
  const books = dues || info.kind === 'opening-balances'
  const [file, setFile] = useState<File | null>(null)
  const [asOf, setAsOf] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [done, setDone] = useState<ImportResult | null>(null)
  const [skip, setSkip] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'READY' | 'OTHER'>('ALL')
  const [confirm, setConfirm] = useState(false)
  const [showColumns, setShowColumns] = useState(false)

  const check = useMutation({
    mutationFn: (args: { f: File; asOf: string }) => importsApi.preview(info.kind, args.f, args.asOf || undefined),
    onSuccess: p => { setPreview(p); setSkip(false); setFilter(p.summary.errors ? 'ERROR' : 'ALL') },
    onError: (e: any) => { setPreview(null); toast.error(errText(e, 'The file could not be read')) },
  })
  const run = useMutation({
    mutationFn: () => importsApi.run(info.kind, file as File, { asOf: asOf || undefined, skipProblems: skip }),
    onSuccess: r => {
      setDone(r); setPreview(null); setFile(null); setConfirm(false)
      qc.invalidateQueries()
      toast.success(`${r.imported} imported`)
    },
    onError: (e: any) => { setConfirm(false); toast.error(errText(e, 'Nothing was imported')) },
  })

  const choose = (f?: File | null) => {
    if (!f) return
    if (!/\.(xlsx|xls|csv|tsv|txt)$/i.test(f.name)) { toast.error('Choose an Excel workbook (.xlsx, .xls) or a CSV file'); return }
    setFile(f); setDone(null); setPreview(null)
    check.mutate({ f, asOf })
  }
  const changeAsOf = (v: string) => { setAsOf(v); if (file) check.mutate({ f: file, asOf: v }) }

  const s = preview?.summary
  const rows = useMemo(() => (preview?.rows ?? []).filter(r =>
    filter === 'ALL' ? true
    : filter === 'ERROR' ? r.status === 'ERROR'
    : filter === 'WARN' ? r.status !== 'ERROR' && r.notes.some(n => !n.error) && (r.status === 'NEW' || r.status === 'UPDATE')
    : filter === 'READY' ? r.status === 'NEW' || r.status === 'UPDATE'
    : r.status === 'EXISTS' || r.status === 'SKIPPED'), [preview, filter])
  const blocked = !preview || !s || preview.missing.length > 0 || s.ready === 0 || (s.errors > 0 && !skip)
  const noun = info.kind === 'opening-balances' ? 'balance' : info.kind === 'customer-dues' ? 'unpaid invoice' : info.kind === 'supplier-dues' ? 'unpaid bill' : 'row'
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

  return (
    <div className="space-y-4">
      <Link href="/import" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--gold)' }}><ArrowLeft size={14} />All imports</Link>

      <div className="card">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <h2 className="section-title flex items-center gap-2"><card.icon size={16} style={{ color: 'var(--gold)' }} aria-hidden />{info.label}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{card.blurb}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button className="btn-secondary h-9 text-sm" onClick={() => importsApi.template(info.kind, info.templateFile).catch(() => toast.error('The template could not be downloaded'))}>
                <Download size={14} />Download template
              </button>
              <button className="btn-ghost h-9 text-sm" onClick={() => setShowColumns(v => !v)} aria-expanded={showColumns}>
                {showColumns ? <ChevronDown size={14} /> : <ChevronRight size={14} />}What goes in the file
              </button>
            </div>
            {dues && (
              <label className="block mt-3 max-w-xs">
                <span className="label">Balances as on (for rows without a date)</span>
                <input type="date" className="input h-9" value={asOf} max={todayIST()} onChange={e => changeAsOf(e.target.value)} />
              </label>
            )}
          </div>
          <div className="w-full md:w-80 rounded-xl flex flex-col items-center justify-center gap-2 p-5 text-center cursor-pointer"
            style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-surface)' }}
            onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files?.[0]) }}
            role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }} aria-label="Choose the file to import">
            {file ? <FileSpreadsheet size={22} style={{ color: 'var(--gold)' }} aria-hidden /> : <FileUp size={22} style={{ color: 'var(--gold)' }} aria-hidden />}
            <p className="text-sm font-medium break-all">{check.isPending ? 'Checking the file…' : file ? file.name : 'Choose or drop the file'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{file ? 'Choose another file to replace it' : 'Excel (.xlsx, .xls) or CSV, up to 10 MB'}</p>
            <input ref={fileRef} type="file" hidden accept=".xlsx,.xls,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }} />
          </div>
        </div>
        {showColumns && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-left" style={{ color: 'var(--text-muted)' }}><th className="py-1.5 pr-3 font-semibold">Column</th><th className="py-1.5 pr-3 font-semibold">What to write</th><th className="py-1.5 font-semibold">Example</th></tr></thead>
              <tbody>
                {info.columns.map(c => (
                  <tr key={c.key} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-1.5 pr-3 whitespace-nowrap font-medium">{c.label}{c.required && <span style={{ color: '#dc2626' }}> *</span>}</td>
                    <td className="py-1.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{c.hint || '—'}</td>
                    <td className="py-1.5 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{c.example?.startsWith('e.g.') ? c.example.slice(5) : c.example || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}><span style={{ color: '#dc2626' }}>*</span> needed. Other headings are matched loosely; columns we don't use are ignored. The template's example row (starting “e.g.”) is never imported.</p>
          </div>
        )}
      </div>

      {done && (
        <div className="card flex items-start gap-3" role="status">
          <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} aria-hidden />
          <div className="flex-1">
            <p className="font-semibold text-sm">{plural(done.imported, noun === 'row' ? 'record' : noun)} imported</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{done.message}</p>
            <div className="flex gap-3 mt-2 text-sm">
              <Link href={card.after.href} style={{ color: 'var(--gold)' }}>{card.after.label}</Link>
              <button className="underline" style={{ color: 'var(--text-secondary)' }} onClick={() => { setDone(null); fileRef.current?.click() }}>Import another file</button>
            </div>
          </div>
        </div>
      )}

      {preview && s && (
        <div className="space-y-4">
          {preview.missing.length > 0 ? (
            <Banner tone="red" icon={AlertOctagon}>
              The file has no <strong>{preview.missing.join(', ')}</strong> column{preview.missing.length === 1 ? '' : 's'}.
              {preview.headerLine > 0 ? ` The headings were read from row ${preview.headerLine}.` : ' No heading row was found in the first rows.'} Add the column (see “What goes in the file”) and choose the file again.
            </Banner>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Figure label="Ready to import" value={s.ready} tone="#16a34a" />
                <Figure label="Already in Finvosmart" value={s.exists} />
                <Figure label="Left out" value={s.skipped} sub={preview.examples ? `${plural(preview.examples, 'example row')} not counted` : undefined} />
                <Figure label="With problems" value={s.errors} tone={s.errors ? '#dc2626' : undefined} sub={s.warnings ? `${plural(s.warnings, 'row')} with notes to check` : undefined} />
              </div>
              {info.kind === 'opening-balances' && s.debit != null && s.credit != null && (
                <div className="card text-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Debits</p><p className="font-mono font-semibold">{inr(s.debit)}</p></div>
                  <div><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Credits</p><p className="font-mono font-semibold">{inr(s.credit)}</p></div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Difference</p>
                    <p className="font-mono font-semibold">{inr(Math.abs(Number(s.difference ?? 0)))}{Number(s.difference) > 0 ? ' more debits' : Number(s.difference) < 0 ? ' more credits' : ''}</p>
                    {Number(s.difference) !== 0 && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Goes to Opening Balance Difference — usually what customers owe and what you owe suppliers, which come in with their unpaid invoices and bills.</p>}
                  </div>
                </div>
              )}
              {dues && s.amount != null && s.ready > 0 && (
                <Banner tone="blue" icon={Info}>
                  {plural(s.ready, noun)} for <strong>{inr(s.amount)}</strong>. They go into your books as opening balances — not as {info.kind === 'customer-dues' ? 'sales' : 'purchases'}, with no GST{info.kind === 'supplier-dues' ? ' or TDS' : ''} — and {info.kind === 'customer-dues' ? 'can be collected, reminded and aged like your invoices. Automatic reminders aren\'t sent for them; send one from the invoice when you choose.' : 'can be paid and tracked like your bills, with MSME pay-by dates.'}
                </Banner>
              )}
              {(preview.newDepartments.length > 0 || preview.newDesignations.length > 0) && (
                <Banner tone="blue" icon={Info}>
                  {preview.newDepartments.length > 0 && <>New departments will be added: {preview.newDepartments.join(', ')}. </>}
                  {preview.newDesignations.length > 0 && <>New designations: {preview.newDesignations.join(', ')}.</>}
                </Banner>
              )}
              {preview.newAccounts.length > 0 && <Banner tone="blue" icon={Info}>New accounts will be added: {preview.newAccounts.join(', ')}.</Banner>}
              {preview.ignored.length > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Columns not read: {preview.ignored.join(', ')}.</p>
              )}
              {preview.truncated && <Banner tone="amber" icon={AlertTriangle}>Only the first 10,000 rows are taken in one import. Split the file to bring in the rest.</Banner>}

              <section className="card" aria-label="Rows">
                <div className="flex items-center gap-2 flex-wrap">
                  {([['ALL', `All (${s.rows})`], ['ERROR', `Problems (${s.errors})`], ['WARN', 'Notes to check'], ['READY', `Ready (${s.ready})`], ['OTHER', `Left alone (${s.exists + s.skipped})`]] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: filter === k ? 'var(--gold-muted)' : 'var(--bg-hover)', color: filter === k ? 'var(--gold)' : 'var(--text-muted)', border: `1px solid ${filter === k ? 'rgba(245,158,11,.2)' : 'var(--border)'}` }}>
                      {label}
                    </button>
                  ))}
                </div>
                {preview.rowsShown < s.rows && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Showing {preview.rowsShown} of {s.rows} rows — problems first.</p>}
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-left" style={{ color: 'var(--text-muted)' }}>
                        <th className="py-1.5 pr-3 font-semibold w-14">Row</th><th className="py-1.5 pr-3 font-semibold w-36">What happens</th><th className="py-1.5 font-semibold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No rows here.</td></tr>}
                      {rows.map(r => <RowView key={r.line} r={r} />)}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="card flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {s.errors > 0 ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} />
                      Leave out the {plural(s.errors, 'row')} with problems and import the rest
                    </label>
                  ) : s.ready > 0 ? 'Everything ready is saved together — or, if anything fails, nothing is.' : 'Nothing in this file needs importing.'}
                </div>
                <button className="btn-primary h-10" disabled={blocked || run.isPending} onClick={() => books ? setConfirm(true) : run.mutate()}>
                  {run.isPending ? 'Importing…' : `Import ${plural(s.ready, noun === 'row' ? (info.kind === 'items' ? 'item' : info.kind.replace(/s$/, '')) : noun)}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Bring these into your books?"
        subtitle={info.kind === 'opening-balances' ? 'Opening balances' : info.kind === 'customer-dues' ? 'Customers\' unpaid invoices' : 'Unpaid supplier bills'}>
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {info.kind === 'opening-balances' ? (
            <p>The opening balances of {plural(s?.ready ?? 0, 'account')} will be set{preview?.newAccounts.length ? `, ${preview.newAccounts.length} of them new` : ''}. A balance you set earlier on the same account is replaced. Whatever doesn't add up goes to Opening Balance Difference.</p>
          ) : (
            <p>{plural(s?.ready ?? 0, noun)} for {inr(s?.amount ?? 0)} will be added as opening balances: {info.kind === 'customer-dues' ? 'what customers owe you' : 'what you owe suppliers'} goes up by that amount. To undo one, cancel it.</p>
          )}
          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={() => setConfirm(false)}>Not now</button>
            <button className="btn-primary" disabled={run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'Importing…' : 'Import'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function RowView({ r }: { r: ImportRow }) {
  const st = STATUS[r.status]
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }} className="align-top">
      <td className="py-2 pr-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{r.line}</td>
      <td className="py-2 pr-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: st.color }}>
          <st.icon size={13} aria-hidden />{st.label}
        </span>
      </td>
      <td className="py-2">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.label || '—'}</p>
        {r.detail && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{r.detail}</p>}
        {r.notes.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {r.notes.map((n, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: n.error ? '#dc2626' : r.status === 'EXISTS' || r.status === 'SKIPPED' ? 'var(--text-secondary)' : '#b45309' }}>
                {n.error ? <AlertOctagon size={12} className="mt-0.5 shrink-0" aria-label="Problem" /> : r.status === 'EXISTS' || r.status === 'SKIPPED'
                  ? <Info size={12} className="mt-0.5 shrink-0" aria-hidden /> : <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-label="Check" />}
                <span><strong className="font-semibold">{n.column}:</strong> {n.text}</span>
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  )
}

function Figure({ label, value, tone, sub }: { label: string; value: number; tone?: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-semibold mt-1" style={{ color: tone ?? 'var(--text-primary)', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  )
}

function Banner({ tone, icon: Icon, children }: { tone: 'red' | 'amber' | 'blue'; icon: any; children: React.ReactNode }) {
  const c = tone === 'red' ? '#dc2626' : tone === 'blue' ? '#2563eb' : '#d97706'
  return (
    <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2.5" style={{ background: `${c}14`, border: `1px solid ${c}40`, color: 'var(--text-primary)' }}>
      <Icon size={15} style={{ color: c, flexShrink: 0, marginTop: 2 }} aria-hidden />
      <div>{children}</div>
    </div>
  )
}
