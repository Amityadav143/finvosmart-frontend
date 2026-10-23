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

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Clock, Download, FileText, Plus, Send } from 'lucide-react'
import { invoicingApi } from '@/lib/api/invoicing'
import { api } from '@/lib/api/client'
import { DataTable } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import { DOC_LABEL, STATUS_LABEL, inr, todayIST } from '@/lib/money'
import type { Invoice } from '@/types'

const FILTERS: { status: string; label: string; icon: any; color: string; count: (s: any) => number }[] = [
  { status: 'OVERDUE', label: 'Overdue',   icon: AlertTriangle, color: '#dc2626', count: s => s?.overdue ?? 0 },
  { status: 'SENT',    label: 'Sent',      icon: Send,          color: '#2563eb', count: s => s?.sent ?? 0 },
  { status: 'PARTIAL', label: 'Part paid', icon: Clock,         color: '#d97706', count: s => s?.partial ?? 0 },
  { status: 'PAID',    label: 'Paid',      icon: CheckCircle2,  color: '#16a34a', count: s => s?.paid ?? 0 },
  { status: 'DRAFT',   label: 'Drafts',    icon: FileText,      color: '#64748b', count: s => s?.draft ?? 0 },
]

/** 1 April of the current Indian financial year. */
const fyStart = (today: string) => {
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7))
  return `${m >= 4 ? y : y - 1}-04-01`
}

const monthLabel = (ym: string) => new Date(ym + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })

export default function InvoicingPage() {
  const { can } = usePermissions()
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const query = useDebounce(search, 350)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoices', page, status, type, query],
    queryFn: () => invoicingApi.list({ page, size: 20, status: status || undefined, invoiceType: type || undefined, query: query || undefined }),
  })
  const { data: stats } = useQuery({ queryKey: ['inv-stats'], queryFn: invoicingApi.stats })
  const monthly = (stats?.monthly ?? []).map(m => ({ month: monthLabel(m.month), amount: Number(m.amount) }))
  const hasMonthly = monthly.some(m => m.amount !== 0)

  const exportCsv = async () => {
    try {
      const res = await api.get('/invoices/export/csv', { params: { from: fyStart(todayIST()), to: todayIST() }, responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `invoices_${todayIST()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const today = todayIST()
  const columns = [
    {
      header: 'Number',
      render: (inv: Invoice) => (
        <div>
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--gold)' }}>{inv.invoiceNumber}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{DOC_LABEL[inv.invoiceType] ?? inv.invoiceType}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (inv: Invoice) => (
        <div>
          <p className="font-medium text-sm">{inv.customerName}</p>
          {inv.customerGstin && <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{inv.customerGstin}</p>}
        </div>
      ),
    },
    { header: 'Date', render: (inv: Invoice) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(inv.invoiceDate)}</span> },
    {
      header: 'Due',
      render: (inv: Invoice) => {
        const late = inv.dueDate && inv.dueDate < today && Number(inv.outstanding) > 0 && !['DRAFT', 'CANCELLED', 'PAID'].includes(inv.status)
        return <span className="text-xs" style={{ color: late ? '#dc2626' : 'var(--text-secondary)', fontWeight: late ? 600 : 400 }}>{formatDate(inv.dueDate)}</span>
      },
    },
    { header: 'Total', className: 'text-right', render: (inv: Invoice) => <span className="font-mono text-sm">{inr(inv.totalAmount)}</span> },
    {
      header: 'Balance',
      className: 'text-right',
      render: (inv: Invoice) => inv.status === 'DRAFT' || inv.status === 'CANCELLED'
        ? <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
        : <span className="font-mono text-sm font-semibold" style={{ color: Number(inv.outstanding) > 0 ? 'var(--text-primary)' : '#16a34a' }}>{inr(inv.outstanding)}</span>,
    },
    { header: 'Status', render: (inv: Invoice) => <StatusBadge status={inv.status} label={STATUS_LABEL[inv.status]} /> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>GST invoices, quotations and notes — send them, track who has paid, and remind who hasn't</p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="INVOICE_EXPORT">
            <button className="btn-secondary h-9" onClick={exportCsv}><Download size={15} />Export CSV</button>
          </PermissionGate>
          <PermissionGate permission="FINANCE_CREATE">
            <Link href="/import?kind=customer-dues" className="btn-secondary h-9" title="Invoices from before you started, still unpaid">Import unpaid invoices</Link>
          </PermissionGate>
          <PermissionGate permission="INVOICE_CREATE">
            <Link href="/invoicing/new" className="btn-primary h-9"><Plus size={15} />New invoice</Link>
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="card col-span-2">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>To be collected</p>
          <p className="font-serif text-3xl mt-1" style={{ color: 'var(--gold)' }}>{stats ? inr(stats.outstanding) : '—'}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Balance due on issued invoices</p>
        </div>
        {FILTERS.slice(0, 4).map(f => {
          const Icon = f.icon
          const active = status === f.status
          return (
            <button key={f.status} className="card text-left transition-all" onClick={() => { setStatus(active ? '' : f.status); setPage(0) }}
              style={{ borderColor: active ? f.color : 'var(--border)' }} aria-pressed={active}>
              <div className="flex items-center gap-2">
                <Icon size={15} style={{ color: f.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</span>
              </div>
              <p className="font-serif text-2xl mt-1" style={{ color: f.color }}>{f.count(stats)}</p>
            </button>
          )
        })}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Invoiced each month</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Issued invoices and debit notes, less credit notes · last 6 months</p>
          </div>
          <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>{stats ? inr(stats.totalRevenue) : ''}</p>
        </div>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={monthly} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis hide />
              <Tooltip formatter={(v: any) => inr(v)} cursor={{ fill: 'var(--bg-hover)' }}
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="amount" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>Nothing invoiced in the last six months yet.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0) }} placeholder="Customer or invoice number…" className="w-72" />
        <select className="input h-9 text-sm" style={{ maxWidth: 200 }} value={type} onChange={e => { setType(e.target.value); setPage(0) }} aria-label="Document type">
          <option value="">All documents</option>
          {Object.entries(DOC_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input h-9 text-sm" style={{ maxWidth: 170 }} value={status} onChange={e => { setStatus(e.target.value); setPage(0) }} aria-label="Status">
          <option value="">Any status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(status || type || search) && (
          <button className="btn-ghost h-9 text-sm" onClick={() => { setStatus(''); setType(''); setSearch(''); setPage(0) }}>Clear</button>
        )}
      </div>

      {isError ? (
        <div className="card text-sm" style={{ color: '#dc2626' }}>Invoices couldn't be loaded. Check your connection and try again.</div>
      ) : (
        <DataTable columns={columns} data={data?.content ?? []} loading={isLoading} keyExtractor={inv => inv.id}
          onRowClick={inv => router.push(`/invoicing/${inv.id}`)}
          emptyMessage="No invoices match these filters."
          empty={status || type || search ? undefined : (
            <EmptyState compact icon={FileText} title="No invoices yet"
              description="A GST invoice takes a minute: the tax splits itself into CGST and SGST or IGST, and your customer gets a pay-online link and a UPI QR code."
              action={can('INVOICE_CREATE') ? { label: 'Create your first invoice', href: '/invoicing/new' } : undefined}
              secondary={can('FINANCE_CREATE') ? { label: 'Bring in unpaid invoices from before', href: '/import?kind=customer-dues' } : undefined} />
          )} />
      )}
      {data && data.totalPages > 1 && (
        <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />
      )}
    </div>
  )
}
