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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicingApi } from '@/lib/api/invoicing'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { useDebounce } from '@/lib/hooks'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types'
import {
  Plus, Download, FileText, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Tag, ChevronDown, ChevronUp, Copy,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const MONTHLY = [
  { m: 'Oct', amt: 1800000 }, { m: 'Nov', amt: 2400000 }, { m: 'Dec', amt: 2100000 },
  { m: 'Jan', amt: 3200000 }, { m: 'Feb', amt: 2800000 }, { m: 'Mar', amt: 3600000 },
]

const STATUS_META: Record<string, { icon: any; color: string; bg: string }> = {
  DRAFT:   { icon: FileText,      color: '#94a3b8', bg: 'rgba(71,85,105,0.12)'   },
  SENT:    { icon: TrendingUp,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  PAID:    { icon: CheckCircle2,  color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
  OVERDUE: { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  PARTIAL: { icon: Clock,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
}

const INVOICE_TYPES = [
  'TAX_INVOICE','PROFORMA','QUOTATION','CREDIT_NOTE','DEBIT_NOTE','DELIVERY_CHALLAN',
]

const REF_FIELDS_BY_TYPE: Record<string, string[]> = {
  TAX_INVOICE:      ['customerPoNumber','workOrderNumber','contractNumber','ewayBillNumber','lrNumber'],
  PROFORMA:         ['rfqNumber','referenceLetterNumber'],
  QUOTATION:        ['rfqNumber','referenceLetterNumber'],
  CREDIT_NOTE:      ['customerPoNumber','contractNumber'],
  DEBIT_NOTE:       ['customerPoNumber','contractNumber'],
  DELIVERY_CHALLAN: ['customerPoNumber','workOrderNumber','ewayBillNumber','lrNumber'],
}

const REF_META: Record<string, { label: string; placeholder: string; badge: string }> = {
  customerPoNumber:      { label: 'Customer PO No.',   placeholder: 'PO/2026/001',    badge: 'PO'  },
  workOrderNumber:       { label: 'Work Order No.',    placeholder: 'WO-2026-0045',   badge: 'WO'  },
  contractNumber:        { label: 'Contract No.',      placeholder: 'CA/AMC/2026/07', badge: 'CA'  },
  referenceLetterNumber: { label: 'Reference Letter',  placeholder: 'REF/2026/1234',  badge: 'RL'  },
  ewayBillNumber:        { label: 'e-Way Bill No.',    placeholder: '451234567890',   badge: 'EWB' },
  lrNumber:              { label: 'LR / Consignment',  placeholder: 'LR-2026-789',    badge: 'LR'  },
  rfqNumber:             { label: 'RFQ / Tender Ref.', placeholder: 'RFQ-2026-099',   badge: 'RFQ' },
}

function RefBadge({ code, value }: { code: string; value?: string }) {
  if (!value) return null

  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginRight:'6px' }}>
      <span style={{ padding:'1px 5px', borderRadius:'3px', fontSize:'9px', fontFamily:'monospace',
        fontWeight:700, letterSpacing:'0.04em', background:'var(--gold-muted)',
        border:'1px solid var(--border-strong)', color:'var(--gold)' }}>{code}</span>
      <span style={{ fontSize:'11px', color:'var(--text-secondary)' }}>{value}</span>
    </span>
  )
}

const BLANK_FORM = {
  invoiceType: 'TAX_INVOICE', customerName: '', customerGstin: '',
  billingAddress: '', notes: '', paymentTerms: '30',
  customerPoNumber: '', workOrderNumber: '', ewayBillNumber: '',
  currency: 'INR',
}

const CURRENCIES = ['INR','USD','EUR','GBP','AED','SGD','CAD','AUD','JPY','CHF']

export default function InvoicingPage() {
  const qc = useQueryClient()

  /* ── Filters ───────────────────────────────────────────────────── */
  const [page, setPage]                   = useState(0)
  const [search, setSearch]               = useState('')          // FIX: now wired to API
  const [statusFilter, setStatusFilter]   = useState('')
  const [showRefPanel, setShowRefPanel]   = useState(false)
  const [refFields, setRefFields]         = useState<Record<string, string>>({})
  const [invoiceType, setInvoiceType]     = useState('TAX_INVOICE')

  /* ── Create invoice modal ──────────────────────────────────────── */
  const [showCreate, setShowCreate]       = useState(false)       // FIX: modal state
  const [form, setForm]                   = useState({ ...BLANK_FORM })
  const [saving, setSaving]               = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  /* ── Queries ───────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter, debouncedSearch],  // FIX: search in queryKey
    queryFn: () => invoicingApi.list({
      page,
      size: 20,
      status: statusFilter || undefined,
      query: debouncedSearch || undefined,                        // FIX: search sent to API
    }),
  })

  const { data: stats } = useQuery({ queryKey: ['inv-stats'], queryFn: invoicingApi.stats })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoicingApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['inv-stats'] })
      toast.success('Invoice updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => invoicingApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', 'inv-stats'] })
      toast.success('Invoice created successfully')
      setShowCreate(false)
      setForm({ ...BLANK_FORM })
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to create invoice'),
  })

  const activeRefKeys = REF_FIELDS_BY_TYPE[invoiceType] || []
  const hasRefs       = activeRefKeys.some(k => refFields[k])

  /* ── Table columns ─────────────────────────────────────────────── */
  const columns = [
    {
      header: 'Invoice',
      render: (inv: Invoice) => (
        <div>
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--gold)' }}>
            {inv.invoiceNumber}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {inv.invoiceType?.replace(/_/g, ' ')}
          </p>
          <div className="mt-1">
            {inv.customerPoNumber && <RefBadge code="PO"  value={inv.customerPoNumber} />}
            {inv.workOrderNumber  && <RefBadge code="WO"  value={inv.workOrderNumber}  />}
            {inv.ewayBillNumber   && <RefBadge code="EWB" value={inv.ewayBillNumber}   />}
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      render: (inv: Invoice) => (
        <div>
          <p className="font-medium text-sm">{inv.customerName}</p>
          {inv.customerGstin && (
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {inv.customerGstin}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      render: (inv: Invoice) => (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(inv.invoiceDate)}
        </span>
      ),
    },
    {
      header: 'Total',
      render: (inv: Invoice) => (
        <span className="font-semibold font-mono text-sm">{formatCurrency(inv.totalAmount)}</span>
      ),
    },
    {
      header: 'Outstanding',
      render: (inv: Invoice) => (
        <span
          className="font-mono text-sm font-bold"
          style={{ color: inv.outstanding > 0 ? '#ef4444' : '#22c55e' }}
        >
          {formatCurrency(inv.outstanding)}
        </span>
      ),
    },
    { header: 'Status', render: (inv: Invoice) => <StatusBadge status={inv.status} /> },
    {
      header: '',
      render: (inv: Invoice) =>
        inv.status === 'DRAFT' ? (
          <button
            onClick={() => statusMutation.mutate({ id: inv.id, status: 'SENT' })}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background:'rgba(59,130,246,0.1)', color:'#93c5fd', border:'1px solid rgba(59,130,246,0.2)' }}
          >
            Send
          </button>
        ) : inv.status === 'SENT' ? (
          <button
            onClick={() => statusMutation.mutate({ id: inv.id, status: 'PAID' })}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background:'rgba(34,197,94,0.1)', color:'#86efac', border:'1px solid rgba(34,197,94,0.2)' }}
          >
            Mark Paid
          </button>
        ) : null,
    },
    {
      header: '',
      render: (inv: Invoice) => (
        <button
          onClick={() => duplicateInvoice(inv)}
          title="Duplicate invoice as new DRAFT"
          className="btn-icon w-7 h-7"
          style={{ opacity: 0.6 }}
        >
          <Copy size={13} />
        </button>
      ),
    },
  ]

  const duplicateInvoice = async (invoice: any) => {
    try {
      const { api } = await import('@/lib/api/client')
      // Fetch full invoice details
      const res = await api.get(`/invoices/${invoice.id}`)
      const src = res.data.data
      // Create a duplicate without the invoice number (auto-assigned) and reset status
      await api.post('/invoices', {
        invoiceType:    src.invoiceType,
        customerId:     src.customerId,
        customerName:   src.customerName,
        customerGstin:  src.customerGstin,
        billingAddress: src.billingAddress,
        currency:       src.currency ?? 'INR',
        notes:          src.notes,
        lineItems:      src.lineItems?.map((li: any) => ({
          description: li.description, hsnSacCode: li.hsnSacCode,
          quantity: li.quantity, unitPrice: li.unitPrice,
          discountPct: li.discountPct ?? 0, gstRate: li.gstRate, isIgst: li.igstAmount > 0,
        })) ?? [],
      })
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice duplicated as new DRAFT')
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Failed to duplicate invoice')
    }
  }

  const exportCsv = async () => {
    try {
      const { api } = await import('@/lib/api/client')
      const res = await api.get('/invoices/export/csv', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Invoices exported')
    } catch {
      toast.error('Export failed')
    }
  }


  return (
    <div className="space-y-5">
      {/* ── Status KPI cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {Object.entries(STATUS_META).map(([status, meta]) => {
          const Icon  = meta.icon
          const count = stats?.[status.toLowerCase() as keyof typeof stats] ?? 0
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(s => s === status ? '' : status)}
              className="card text-left transition-all duration-200"
              style={{
                borderColor: statusFilter === status ? meta.color : 'var(--border)',
                background:  statusFilter === status ? meta.bg : 'var(--bg-card)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div>
                  <p className="font-serif text-xl" style={{ color: meta.color }}>{String(count)}</p>
                  <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                    {status.toLowerCase()}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Revenue mini-chart ────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Monthly Revenue Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Invoice amounts · Last 6 months
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl" style={{ color: 'var(--gold)' }}>
              {formatCurrency(stats?.outstanding ?? 0)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total outstanding</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={MONTHLY}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip
              formatter={(v: any) => formatCurrency(v)}
              contentStyle={{ background:'var(--bg-elevated)', border:'1px solid var(--border)',
                borderRadius:'10px', fontSize:'11px' }}
            />
            <Area type="monotone" dataKey="amt" stroke="#f59e0b" strokeWidth={2} fill="url(#areaGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Reference field lookup panel ──────────────────────────── */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
        <button
          type="button"
          onClick={() => setShowRefPanel(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: hasRefs ? 'var(--gold-muted)' : 'transparent', fontSize:'13px' }}
        >
          <div className="flex items-center gap-2.5">
            <Tag size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontWeight:500, color:'var(--text-primary)' }}>Reference Number Lookup</span>
            <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>
              Filter by PO · WO · Contract · e-Way Bill · LR No.
            </span>
          </div>
          {showRefPanel
            ? <ChevronUp size={15} style={{ color:'var(--text-muted)' }} />
            : <ChevronDown size={15} style={{ color:'var(--text-muted)' }} />}
        </button>

        {showRefPanel && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <label className="label" style={{ whiteSpace:'nowrap', marginBottom:0 }}>
                Document type:
              </label>
              <select
                className="input h-8 text-xs"
                style={{ maxWidth:'200px' }}
                value={invoiceType}
                onChange={e => { setInvoiceType(e.target.value); setRefFields({}) }}
              >
                {INVOICE_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activeRefKeys.map(field => {
                const meta = REF_META[field]
                if (!meta) return null
                return (
                  <div key={field}>
                    <label className="label flex items-center gap-1">
                      <span style={{ padding:'1px 4px', borderRadius:'3px', fontSize:'8px', fontFamily:'monospace',
                        fontWeight:700, background:'var(--gold-muted)', color:'var(--gold)',
                        border:'1px solid var(--border-strong)', letterSpacing:'0.04em' }}>
                        {meta.badge}
                      </span>
                      {meta.label}
                    </label>
                    <input
                      className="input h-8 text-xs"
                      placeholder={meta.placeholder}
                      value={refFields[field] || ''}
                      onChange={e => setRefFields(rf => ({ ...rf, [field]: e.target.value }))}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={v => { setSearch(v); setPage(0) }}
          placeholder="Search customer, invoice number..."
          className="w-72"
        />
        <div className="flex items-center gap-2">
          <PermissionGate permission="INVOICE_CREATE">
            <button aria-label="Download" className="btn-secondary h-9" onClick={exportCsv}><Download size={15} /> Export CSV
            </button>
            <button className="btn-primary h-9" onClick={() => setShowCreate(true)}>
              <Plus size={15} />New Invoice
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── Invoice table ─────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={data?.content ?? []}
        loading={isLoading}
        keyExtractor={inv => inv.id}
        emptyMessage="No invoices found. Create your first invoice to get started."
      />
      {data && (
        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          onPageChange={setPage}
          totalElements={data.totalElements}
          pageSize={20}
        />
      )}

      {/* ── Create Invoice Modal ───────────────────────────────────── */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setForm({ ...BLANK_FORM }) }}
        title="New Invoice"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Document Type</label>
              <select
                className="input h-10"
                value={form.invoiceType}
                onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value }))}
              >
                {INVOICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Terms (days)</label>
              <select
                className="input h-10"
                value={form.paymentTerms}
                onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}
              >
                {['0','7','14','30','45','60','90'].map(d => (
                  <option key={d} value={d}>{d === '0' ? 'Immediate' : `Net ${d}`}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label label-required">Customer Name</label>
            <input
              className="input"
              placeholder="Customer or company name"
              value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Invoice Currency</label>
            <select
              className="input h-10"
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}{c==='INR'?' (Default)':''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">GSTIN</label>
            <input
              className="input"
              placeholder="27AABCN1234A1Z5"
              value={form.customerGstin}
              onChange={e => setForm(f => ({ ...f, customerGstin: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="label">Billing Address</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Full billing address"
              value={form.billingAddress}
              onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))}
            />
          </div>

          {/* Reference fields for this type */}
          {REF_FIELDS_BY_TYPE[form.invoiceType]?.length > 0 && (
            <div>
              <p className="label" style={{ marginBottom:'8px' }}>Reference Numbers</p>
              <div className="grid grid-cols-2 gap-3">
                {REF_FIELDS_BY_TYPE[form.invoiceType].slice(0, 4).map(field => {
                  const meta = REF_META[field]
                  if (!meta) return null
                  return (
                    <div key={field}>
                      <label className="label text-xs">{meta.label}</label>
                      <input
                        className="input h-9 text-sm"
                        placeholder={meta.placeholder}
                        value={(form as any)[field] || ''}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Payment instructions, terms, or notes..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div style={{ padding:'10px 12px', borderRadius:'8px', background:'var(--bg-surface)', fontSize:'12px', color:'var(--text-muted)' }}>
            Line items, taxes and amounts can be added after creating the invoice header.
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={() => { setShowCreate(false); setForm({ ...BLANK_FORM }) }}
              className="btn-secondary h-10"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.customerName || createMutation.isPending}
              className="btn-primary h-10"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
