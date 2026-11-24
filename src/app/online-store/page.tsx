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

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy, ExternalLink, FileText, MessageCircle, Settings2, Store } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { shopApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { ORDER_TONE, STEP_LABEL } from '@/lib/storeHelpers'
import type { OrderStatus } from '@/types/store'

const at = (iso: string) => new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const TABS: { key: string; label: string }[] = [
  { key: 'NEW', label: 'New' }, { key: 'CONFIRMED', label: 'Confirmed' }, { key: 'READY', label: 'Ready' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' }, { key: 'COMPLETED', label: 'Completed' }, { key: 'CANCELLED', label: 'Cancelled' }, { key: '', label: 'All' },
]

export default function Page() {
  return <Suspense fallback={null}><OnlineOrdersPage /></Suspense>
}

function Tone({ status, label }: { status: OrderStatus; label: string }) {
  const t = ORDER_TONE[status]
  return <span className="badge" style={{ color: t?.color, background: t?.bg }}>{label}</span>
}

/** Orders placed on the online store: confirm them, get them ready, deliver or hand over, and bill them. */
function OnlineOrdersPage() {
  const { canAny, can } = usePermissions()
  const allowed = canAny('SHOP_VIEW', 'SHOP_MANAGE')
  const params = useSearchParams()
  const [status, setStatus] = useState('NEW')
  const [q, setQ] = useState('')
  const dq = useDebounce(q.trim(), 300)
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(params.get('open'))
  const { data: settings } = useQuery({ queryKey: ['shop-settings'], queryFn: shopApi.settings, enabled: allowed })
  const { data, isLoading } = useQuery({ queryKey: ['shop-orders', status, dq, page], queryFn: () => shopApi.orders({ status: status || undefined, q: dq || undefined, page, size: 20 }), enabled: allowed, refetchInterval: 60_000 })
  if (!allowed) return <PermissionGate anyOf={['SHOP_VIEW', 'SHOP_MANAGE']} showDenied><span /></PermissionGate>
  const rows = data?.rows ?? []
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Online orders</h1>
          <p className="page-subtitle">Orders from your online store. Confirm each one, get it ready, hand it over or deliver it — the customer follows every step on their order page.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {settings?.published && <a className="btn-secondary h-10" href={settings.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" aria-hidden />Open the store</a>}
          {can('SHOP_MANAGE') && <Link href="/online-store/settings" className="btn-primary h-10"><Settings2 className="w-4 h-4" aria-hidden />Store set-up</Link>}
        </div>
      </div>
      {settings && !settings.published && (
        <div className="card p-5 flex items-start gap-3" data-testid="shop-not-live">
          <Store className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--gold)' }} aria-hidden />
          <div className="space-y-1"><p className="font-semibold">Your online store isn&apos;t open yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose the items to sell, add photos, and publish it — you get a link and a QR code to share on WhatsApp, Instagram or at the counter.</p>
            {can('SHOP_MANAGE') && <Link href="/online-store/settings" className="btn-primary h-9 mt-2 inline-flex">Set up the store</Link>}</div>
        </div>
      )}
      {settings?.readOnlyReason && <p className="text-sm rounded-xl px-4 py-3" role="alert" style={{ background: 'rgba(245,158,11,0.12)' }}>{settings.readOnlyReason}</p>}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl flex-wrap" role="tablist" style={{ border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key || 'all'} role="tab" aria-selected={status === t.key} onClick={() => { setStatus(t.key); setPage(0) }} className="px-3 h-8 rounded-lg text-sm"
              style={{ background: status === t.key ? 'var(--gold-muted)' : 'transparent', fontWeight: status === t.key ? 600 : 400 }}>
              {t.label}{t.key === 'NEW' && (data?.newOrders ?? 0) > 0 ? ` (${data!.newOrders})` : ''}</button>
          ))}
        </div>
        <input className="input h-9 w-64" placeholder="Order number, name or mobile" aria-label="Find an order" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
      </div>
      <div className="table-wrap">
        <table className="w-full text-sm" data-testid="shop-orders">
          <thead><tr>{['Order', 'Placed', 'Customer', 'Way', 'Items', 'Total', 'Bill', 'Status'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={8}>Loading…</td></tr>
              : rows.length === 0 ? <tr><td className="table-cell" colSpan={8} style={{ color: 'var(--text-muted)' }}>No orders here.</td></tr>
              : rows.map(o => (
                <tr key={o.id} className="table-row cursor-pointer" onClick={() => setOpen(o.id)}>
                  <td className="table-cell font-mono">{o.number}</td><td className="table-cell">{at(o.createdAt)}</td>
                  <td className="table-cell">{o.customerName}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{o.phone}</span></td>
                  <td className="table-cell">{o.fulfilment === 'DELIVERY' ? 'Delivery' : 'Pickup'}</td><td className="table-cell">{o.lines}</td>
                  <td className="table-cell font-mono">{inr(o.total)}</td><td className="table-cell font-mono text-xs">{o.invoiceNumber ?? '—'}</td>
                  <td className="table-cell"><Tone status={o.status} label={o.statusLabel} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm">
          <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Newer</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {data?.totalPages}</span>
          <button className="btn-secondary h-9" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Older</button>
        </div>
      )}
      {open && <OrderView id={open} manage={can('SHOP_MANAGE')} onClose={() => setOpen(null)} />}
    </div>
  )
}

function OrderView({ id, manage, onClose }: { id: string; manage: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: o, isLoading, error } = useQuery({ queryKey: ['shop-order', id], queryFn: () => shopApi.order(id) })
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const changed = () => { qc.invalidateQueries({ queryKey: ['shop-orders'] }); qc.invalidateQueries({ queryKey: ['shop-settings'] }) }
  const step = useMutation({
    mutationFn: ({ action, note }: { action: string; note?: string }) => shopApi.step(id, action, note),
    onSuccess: n => { qc.setQueryData(['shop-order', id], n); changed(); setCancelling(false); toast.success(n.statusLabel) },
    onError: (e: any) => toast.error(apiError(e, 'The order could not be moved on')),
  })
  const bill = useMutation({
    mutationFn: () => shopApi.invoice(id),
    onSuccess: n => { qc.setQueryData(['shop-order', id], n); changed(); toast.success(`Bill ${n.invoiceNumber} made`) },
    onError: (e: any) => toast.error(apiError(e, 'The bill could not be made')),
  })
  const billed = !!o?.invoiceId && o.invoiceStatus !== 'CANCELLED'
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`) } catch { toast.error('Copying is blocked in this browser') } }
  return (
    <Modal open onClose={onClose} title={o ? `Order ${o.number}` : 'Order'} subtitle={o ? `${at(o.createdAt)} · ${o.fulfilment === 'DELIVERY' ? 'Delivery' : 'Pickup from the shop'} · ${o.payment === 'ONLINE' ? 'pays online' : o.fulfilment === 'DELIVERY' ? 'pays on delivery' : 'pays at pickup'}` : undefined} size="xl">
      {error ? <p className="text-sm" role="alert" style={{ color: '#b91c1c' }}>{apiError(error, 'The order could not be opened')}</p>
        : isLoading || !o ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : (
        <div className="space-y-4" data-testid="shop-order">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 text-sm">
              <Tone status={o.status} label={o.statusLabel} />
              <p className="font-semibold pt-1">{o.customerName}</p>
              <p><a className="underline" href={`tel:${o.phone}`}>{o.phone}</a>{o.email ? ` · ${o.email}` : ''}</p>
              {o.fulfilment === 'DELIVERY' && <p style={{ color: 'var(--text-muted)' }}>{[o.address, o.city, o.state, o.pincode].filter(Boolean).join(', ')}</p>}
              {o.note && <p className="rounded-lg px-3 py-2 mt-1" style={{ background: 'var(--gold-muted)' }}>“{o.note}”</p>}
              {o.cancelReason && <p style={{ color: '#b91c1c' }}>Cancelled: {o.cancelReason}</p>}
            </div>
            <ol className="text-xs space-y-1.5 md:border-l md:pl-4" style={{ borderColor: 'var(--border)' }} aria-label="What happened">
              {o.events.map((e, i) => <li key={i}><b>{e.label}</b> <span style={{ color: 'var(--text-muted)' }}>· {at(e.at)}{e.by ? ` · ${e.by}` : ''}</span>{e.note ? <div>{e.note}</div> : null}</li>)}
            </ol>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr>{['Item', 'Quantity', 'Price', 'Amount', ...(o.status === 'NEW' || o.status === 'CONFIRMED' ? ['In stock'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
              <tbody>
                {o.lines.map((l, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell">{l.name}</td><td className="table-cell font-mono">{qty(l.quantity)} {l.unit ?? ''}</td>
                    <td className="table-cell font-mono">{inr(Number(l.unitPrice) * (1 + Number(l.gstRate) / 100))}</td><td className="table-cell font-mono">{inr(l.lineTotal)}</td>
                    {(o.status === 'NEW' || o.status === 'CONFIRMED') && <td className="table-cell font-mono" style={{ color: l.stock != null && Number(l.stock) < Number(l.quantity) ? '#b91c1c' : undefined }}>{l.stock != null ? qty(l.stock) : '—'}</td>}
                  </tr>
                ))}
                {Number(o.deliveryCharge) > 0 && <tr><td className="table-cell" colSpan={3}>Delivery</td><td className="table-cell font-mono">{inr(o.deliveryCharge)}</td></tr>}
                <tr><td className="table-cell font-semibold" colSpan={3}>Total (with GST)</td><td className="table-cell font-mono font-semibold">{inr(o.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {o.invoiceId ? (
              <>
                <Link href={`/invoicing/${o.invoiceId}`} className="btn-secondary h-9"><FileText className="w-4 h-4" aria-hidden />Bill {o.invoiceNumber}</Link>
                {o.invoiceDue != null && Number(o.invoiceDue) > 0 && <span style={{ color: '#b45309' }}>{inr(o.invoiceDue)} still to pay</span>}
                {o.payUrl && <button className="btn-ghost h-9" onClick={() => copy(o.payUrl!, 'Payment link')}><Copy className="w-4 h-4" aria-hidden />Payment link</button>}
              </>
            ) : manage && o.status !== 'CANCELLED' && (
              <button className="btn-secondary h-9" disabled={bill.isPending} onClick={() => bill.mutate()} data-testid="shop-order-bill"><FileText className="w-4 h-4" aria-hidden />{bill.isPending ? 'Making the bill…' : 'Make the bill'}</button>
            )}
            {o.whatsapp && <a className="btn-ghost h-9" href={o.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" aria-hidden />WhatsApp the customer</a>}
            <button className="btn-ghost h-9" onClick={() => copy(o.trackUrl, 'Order page link')}><Copy className="w-4 h-4" aria-hidden />Order page link</button>
          </div>
          {manage && o.next.length > 0 && (cancelling ? (
            <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #fca5a5' }}>
              <input className="input h-10" maxLength={300} autoFocus placeholder="Why — the customer sees this" aria-label="Why the order is cancelled" value={reason} onChange={e => setReason(e.target.value)} />
              {billed && <p className="text-xs" style={{ color: '#b91c1c' }}>This order has bill {o.invoiceNumber}: cancel the bill first (<Link href={`/invoicing/${o.invoiceId}`} className="underline">open it</Link>), then the order.</p>}
              <div className="flex justify-end gap-2"><button className="btn-secondary h-9" onClick={() => setCancelling(false)}>Keep the order</button>
                <button className="btn-danger h-9" disabled={!reason.trim() || billed || step.isPending} onClick={() => step.mutate({ action: 'cancel', note: reason.trim() })}>Cancel the order</button></div>
            </div>
          ) : (
            <div className="flex justify-between gap-2 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              {o.next.includes('cancel') ? <button className="btn-ghost h-10" onClick={() => setCancelling(true)}>Cancel order</button> : <span />}
              <div className="flex gap-2">
                {o.next.filter(a => a !== 'cancel').map((a, i, all) => (
                  <button key={a} className={i === all.length - 1 ? 'btn-primary h-10' : 'btn-secondary h-10'} disabled={step.isPending} onClick={() => step.mutate({ action: a })} data-testid={`shop-step-${a}`}>
                    {STEP_LABEL[a] ?? a}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
