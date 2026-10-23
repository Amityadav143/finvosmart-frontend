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
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, CalendarClock, Download, FileMinus2, Landmark, Plus, Receipt, ShieldAlert, Wallet } from 'lucide-react'
import { billsApi, payablesApi } from '@/lib/api/purchases'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { useDebounce } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import { inr, todayIST } from '@/lib/money'
import { BILL_TYPE_LABEL, ITC_STATUS, billBadge, billStatusLabel, fyStart } from '@/lib/purchases'
import type { Bill, PayablesSummary } from '@/types/purchases'

type Filter = 'all' | 'unpaid' | 'overdue' | 'drafts' | 'expenses' | 'credit' | 'paid'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'unpaid', label: 'Unpaid' }, { key: 'overdue', label: 'Overdue' }, { key: 'drafts', label: 'Drafts' },
  { key: 'expenses', label: 'Expenses' }, { key: 'credit', label: 'Credit notes' }, { key: 'paid', label: 'Paid' },
]
const params = (f: Filter) => ({
  all: {}, unpaid: { unpaid: true }, overdue: { overdue: true }, drafts: { status: 'DRAFT' },
  expenses: { type: 'EXPENSE' }, credit: { type: 'CREDIT_NOTE' }, paid: { status: 'PAID' },
}[f])

const AGEING: { key: keyof PayablesSummary['ageing']; label: string; color: string }[] = [
  { key: 'NOT_DUE', label: 'Not due', color: '#16a34a' }, { key: 'DAYS_1_30', label: '1–30 days late', color: '#d97706' },
  { key: 'DAYS_31_60', label: '31–60', color: '#ea580c' }, { key: 'DAYS_61_90', label: '61–90', color: '#dc2626' }, { key: 'OVER_90', label: '90+', color: '#991b1b' },
]

function useSummary() { return useQuery({ queryKey: ['payables'], queryFn: payablesApi.summary }) }

export default function PurchasesPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const q = useDebounce(search, 350)
  const today = todayIST()

  const { data: summary } = useSummary()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bills', filter, page, q],
    queryFn: () => billsApi.list({ page, size: 20, q: q || undefined, ...params(filter) }),
  })

  const exportRegister = async () => {
    try { await billsApi.exportCsv(fyStart(today), today) } catch { toast.error('Export failed') }
  }
  const exportMsme = async () => {
    try { await payablesApi.msmeCsv(fyStart(today), today) } catch { toast.error('Export failed') }
  }

  const ageingTotal = summary ? AGEING.reduce((t, a) => t + Number(summary.ageing[a.key] ?? 0), 0) : 0

  const columns = [
    {
      header: 'Reference',
      render: (b: Bill) => (
        <div>
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--gold)' }}>{b.referenceNumber}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{BILL_TYPE_LABEL[b.billType]}</p>
        </div>
      ),
    },
    {
      header: 'Supplier',
      render: (b: Bill) => (
        <div>
          <p className="font-medium text-sm">{b.vendorName}{b.msmeCovered && <span className="ml-2 badge s-amber">MSME</span>}</p>
          {b.billNumber && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>No. {b.billNumber}</p>}
        </div>
      ),
    },
    { header: 'Date', render: (b: Bill) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(b.billDate)}</span> },
    {
      header: 'Pay by',
      render: (b: Bill) => {
        if (b.billType === 'CREDIT_NOTE' || !b.payBy || ['DRAFT', 'CANCELLED', 'PAID'].includes(b.status)) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        const late = (b.daysOverdue ?? 0) > 0
        return (
          <span className="text-xs" style={{ color: b.msmeLate ? '#dc2626' : late ? '#d97706' : 'var(--text-secondary)', fontWeight: late ? 600 : 400 }}>
            {formatDate(b.payBy)}{late ? ` · ${b.daysOverdue}d late` : ''}
          </span>
        )
      },
    },
    { header: 'Total', className: 'text-right', render: (b: Bill) => <span className="font-mono text-sm">{inr(b.totalAmount)}</span> },
    {
      header: 'Balance',
      className: 'text-right',
      render: (b: Bill) => ['DRAFT', 'CANCELLED'].includes(b.status)
        ? <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        : <span className="font-mono text-sm font-semibold" style={{ color: Number(b.outstanding) > 0 ? 'var(--text-primary)' : '#16a34a' }}>{b.billType === 'CREDIT_NOTE' && Number(b.outstanding) > 0 ? '−' : ''}{inr(b.outstanding)}</span>,
    },
    { header: 'Status', render: (b: Bill) => <StatusBadge status={billBadge(b)} label={billStatusLabel(b)} /> },
    {
      header: 'GST credit',
      render: (b: Bill) => {
        const s = ITC_STATUS[b.itcStatus] ?? ITC_STATUS.NOT_CHECKED
        return <span className="text-xs inline-flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }} title={b.itcNote ?? undefined}><span className="w-2 h-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Bills and payables</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Supplier bills and expenses in your books — what you owe, what's due, and micro/small suppliers to pay within 45 days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary h-9" onClick={exportRegister} title="Purchase register for this financial year"><Download size={15} />Purchase register</button>
          <button className="btn-secondary h-9" onClick={exportMsme} title="Payments to micro and small suppliers — for MSME Form I and the tax audit"><Download size={15} />MSME report</button>
          <PermissionGate permission="FINANCE_CREATE">
            <Link href="/import?kind=supplier-dues" className="btn-secondary h-9" title="Supplier bills from before you started, still unpaid">Import unpaid bills</Link>
          </PermissionGate>
          <PermissionGate anyOf={['PROCUREMENT_CREATE', 'FINANCE_CREATE']}>
            <Link href="/purchases/bills/new?type=CREDIT_NOTE" className="btn-secondary h-9"><FileMinus2 size={15} />Credit note</Link>
            <Link href="/purchases/bills/new?type=EXPENSE" className="btn-secondary h-9"><Receipt size={15} />Record expense</Link>
            <Link href="/purchases/bills/new" className="btn-primary h-9"><Plus size={15} />New bill</Link>
          </PermissionGate>
        </div>
      </div>

      {summary && summary.msmeLateCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: '#dc262612', border: '1px solid #dc262650' }}>
          <ShieldAlert size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
          <div className="text-sm">
            <p className="font-semibold">{inr(summary.msmeLate)} owed to micro and small suppliers is past the 45-day limit ({summary.msmeLateCount} bill{summary.msmeLateCount === 1 ? '' : 's'})</p>
            <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>The MSMED Act makes you pay compound interest at three times the RBI bank rate on late payments, and income tax allows the expense only in the year you pay it. Pay these first.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={Wallet} color="var(--gold)" label="You owe suppliers" value={summary ? inr(summary.netPayable) : '—'}
          sub={summary ? `${summary.openBills} open bill${summary.openBills === 1 ? '' : 's'}${Number(summary.unusedCredits) > 0 ? ` · ${inr(summary.unusedCredits)} credit notes unused` : ''}` : ''} />
        <Stat icon={AlertTriangle} color="#dc2626" label="Overdue" value={summary ? inr(summary.overdue) : '—'} sub={summary ? `${summary.overdueCount} bill${summary.overdueCount === 1 ? '' : 's'}` : ''}
          onClick={() => { setFilter('overdue'); setPage(0) }} active={filter === 'overdue'} />
        <Stat icon={CalendarClock} color="#d97706" label="Due in the next 7 days" value={summary ? inr(summary.dueNext7Days) : '—'} sub={summary ? `${summary.dueNext7Count} bill${summary.dueNext7Count === 1 ? '' : 's'}` : ''} />
        <Stat icon={ShieldAlert} color={summary && Number(summary.msmeLate) > 0 ? '#dc2626' : '#16a34a'} label="Owed to MSME suppliers" value={summary ? inr(summary.msmeOutstanding) : '—'}
          sub={summary ? (Number(summary.msmeLate) > 0 ? `${inr(summary.msmeLate)} past the limit` : 'All within the 45-day limit') : ''} />
        <Stat icon={Landmark} color="#7c3aed" label="TDS deducted this month" value={summary ? inr(summary.tdsThisMonth) : '—'}
          sub={summary ? `Deposit by ${formatDate(summary.tdsDepositDue)}` : ''} href="/tds" />
      </div>

      {summary && ageingTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-sm">Ageing of what you owe</h3>
            <div className="flex h-3 rounded-full overflow-hidden mt-3" role="img" aria-label="Ageing">
              {AGEING.map(a => {
                const v = Number(summary.ageing[a.key] ?? 0)
                return v > 0 ? <div key={a.key} style={{ width: `${(v / ageingTotal) * 100}%`, background: a.color }} title={`${a.label}: ${inr(v)}`} /> : null
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
              {AGEING.map(a => (
                <div key={a.key}>
                  <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}><span className="w-2 h-2 rounded-full" style={{ background: a.color }} />{a.label}</p>
                  <p className="font-mono text-sm mt-0.5">{inr(summary.ageing[a.key])}</p>
                </div>
              ))}
            </div>
            {summary.due.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Pay next</h4>
                <div className="space-y-1">
                  {summary.due.slice(0, 8).map(d => (
                    <Link key={d.billId} href={`/purchases/bills/${d.billId}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:opacity-90" style={{ background: 'var(--bg-surface)' }}>
                      <span className="truncate">{d.vendorName} <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{d.billNumber ?? d.referenceNumber}</span>{d.msmeLate && <span className="ml-2 badge s-red">MSME late</span>}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-xs" style={{ color: d.daysOverdue > 0 ? '#dc2626' : 'var(--text-secondary)' }}>{d.payBy ? (d.daysOverdue > 0 ? `${d.daysOverdue}d late` : d.daysOverdue === 0 ? 'today' : formatDate(d.payBy)) : 'no due date'}</span>
                        <span className="font-mono">{inr(d.outstanding)}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <h3 className="font-semibold text-sm mb-2">By supplier</h3>
            <div className="space-y-1.5">
              {summary.vendors.slice(0, 8).map(v => (
                <div key={(v.vendorId ?? '') + v.vendorName} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{v.vendorName}{v.msme && <span className="ml-1.5 badge s-amber">MSME</span>}</span>
                  <span className="font-mono shrink-0" style={{ color: Number(v.msmeLate) > 0 ? '#dc2626' : Number(v.overdue) > 0 ? '#d97706' : undefined }}>{inr(v.outstanding)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Paid this month: {inr(summary.paidThisMonth)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button key={f.key} className={filter === f.key ? 'btn-primary h-8 text-xs' : 'btn-secondary h-8 text-xs'} aria-pressed={filter === f.key}
            onClick={() => { setFilter(f.key); setPage(0) }}>{f.label}</button>
        ))}
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Supplier, bill number or GSTIN…" className="w-72 ml-auto" />
      </div>

      {isError ? (
        <div className="card text-sm" style={{ color: '#dc2626' }}>Bills couldn't be loaded. Check your connection and try again.</div>
      ) : (
        <DataTable columns={columns} data={data?.content ?? []} loading={isLoading} keyExtractor={b => b.id}
          onRowClick={b => router.push(`/purchases/bills/${b.id}`)}
          emptyMessage={filter !== 'all' || search ? 'Nothing matches these filters.' : 'No bills yet. Enter a supplier bill or record an expense — it goes straight into your books.'} />
      )}
      {data && data.totalPages > 1 && (
        <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />
      )}
    </div>
  )
}

function Stat({ icon: Icon, color, label, value, sub, onClick, active, href }: {
  icon: any; color: string; label: string; value: string; sub?: string; onClick?: () => void; active?: boolean; href?: string
}) {
  const body = (
    <>
      <div className="flex items-center gap-2"><Icon size={15} style={{ color }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span></div>
      <p className="font-serif text-2xl mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </>
  )
  if (href) return <Link href={href} className="card text-left block">{body}</Link>
  if (onClick) return <button className="card text-left" style={{ borderColor: active ? color : 'var(--border)' }} aria-pressed={active} onClick={onClick}>{body}</button>
  return <div className="card">{body}</div>
}
