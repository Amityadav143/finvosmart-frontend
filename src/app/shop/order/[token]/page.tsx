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

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, MessageCircle, Phone } from 'lucide-react'
import type { PublicOrder } from '@/types/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const rupees = (n: number | string | null | undefined) => '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0))
const at = (iso: string) => new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const STEPS = (way: 'PICKUP' | 'DELIVERY') => way === 'DELIVERY'
  ? [['NEW', 'Placed'], ['CONFIRMED', 'Confirmed'], ['READY', 'Packed'], ['OUT_FOR_DELIVERY', 'On the way'], ['COMPLETED', 'Delivered']]
  : [['NEW', 'Placed'], ['CONFIRMED', 'Confirmed'], ['READY', 'Ready to pick up'], ['COMPLETED', 'Picked up']]

/** A customer's order, by its private link: where it stands, what was ordered, and — once billed — paying online. */
export default function OrderPage(props: { params: Promise<{ token: string }>; searchParams: Promise<{ placed?: string }> }) {
  // the address's values come as promises (Next.js 15 and later): read them with React's use()
  const params = use(props.params), searchParams = use(props.searchParams)
  const [o, setO] = useState<PublicOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const load = async () => {
      try {
        const r = await fetch(`${API}/public/shop/orders/${encodeURIComponent(params.token)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' })
        const body = await r.json().catch(() => null)
        if (!live) return
        if (!r.ok) { setError(r.status === 404 ? 'This order link is not valid.' : body?.message || 'The order could not be loaded.'); return }
        setO(body.data); setError(null)
      } catch {
        if (live) setError('No connection — the page will try again.')
      }
    }
    load()
    const t = setInterval(load, 60_000)
    return () => { live = false; clearInterval(t) }
  }, [params.token])

  if (!o) return (
    <div role="main" className="min-h-screen grid place-items-center p-6" style={{ background: '#f8fafc', color: '#0f172a' }}>
      <p className="text-sm" style={{ color: error ? '#b91c1c' : '#64748b' }} role={error ? 'alert' : 'status'}>{error ?? 'Loading your order…'}</p>
    </div>
  )
  const cancelled = o.status === 'CANCELLED'
  const steps = STEPS(o.fulfilment)
  const reached = steps.findIndex(([k]) => k === o.status)
  const wa = o.whatsapp
  return (
    // (a div with the role, not <main>: the website's phone styles for its own <main> pages would resize this one)
    <div role="main" className="min-h-screen" style={{ background: '#f8fafc', color: '#0f172a' }} data-testid="order-page">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <Link href={`/shop/${o.shopSlug}`} className="text-sm font-semibold">{o.shopName}</Link>
        {searchParams.placed && !cancelled && (
          <div className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: '#dcfce7' }} role="status">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#15803d' }} aria-hidden />
            <div><p className="font-semibold">Order placed — thank you!</p>
              <p className="text-sm">Keep this page: it shows where your order is. {o.shopName} confirms it soon.</p></div>
          </div>
        )}
        <section className="bg-white rounded-2xl p-5 space-y-4" style={{ border: '1px solid #e2e8f0' }}>
          <div className="flex items-start justify-between gap-3">
            <div><h1 className="text-xl font-semibold">Order {o.number}</h1><p className="text-xs" style={{ color: '#64748b' }}>{at(o.createdAt)} · {o.fulfilment === 'DELIVERY' ? 'Delivery' : 'Pickup from the shop'}</p></div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={cancelled ? { background: '#fee2e2', color: '#b91c1c' } : { background: '#e0f2fe', color: '#075985' }} data-testid="order-status">{o.statusLabel}</span>
          </div>
          {!cancelled ? (
            <ol className="space-y-2" aria-label="Where the order is">
              {steps.map(([k, label], i) => {
                const done = i <= reached
                const ev = o.events.find(e => e.status === k)
                return (
                  <li key={k} className="flex items-center gap-3 text-sm">
                    {done ? <CheckCircle2 className="w-5 h-5" style={{ color: '#15803d' }} aria-hidden /> : <Circle className="w-5 h-5" style={{ color: '#cbd5e1' }} aria-hidden />}
                    <span className={done ? 'font-medium' : ''} style={{ color: done ? '#0f172a' : '#94a3b8' }}>{label}</span>
                    {ev && <span className="text-xs ml-auto" style={{ color: '#64748b' }}>{at(ev.at)}</span>}
                  </li>
                )
              })}
            </ol>
          ) : <p className="text-sm" style={{ color: '#b91c1c' }}>This order was cancelled{o.events.find(e => e.status === 'CANCELLED')?.note ? `: ${o.events.find(e => e.status === 'CANCELLED')!.note}` : '.'}</p>}
        </section>
        {o.payUrl && Number(o.due) > 0 && !cancelled && (
          <a href={o.payUrl} className="block text-center rounded-full h-12 leading-[3rem] text-white font-semibold" style={{ background: '#0f766e' }} data-testid="order-pay">Pay {rupees(o.due)} online</a>
        )}
        <section className="bg-white rounded-2xl p-5 space-y-2" style={{ border: '1px solid #e2e8f0' }}>
          <h2 className="font-semibold text-sm">What you ordered</h2>
          <table className="w-full text-sm table-fixed"><colgroup><col /><col className="w-28" /></colgroup><tbody>
            {o.lines.map((l, i) => <tr key={i}><td className="py-1 pr-3 break-words">{l.name} <span className="whitespace-nowrap" style={{ color: '#64748b' }}>× {Number(l.quantity)}</span></td><td className="py-1 text-right whitespace-nowrap align-top">{rupees(l.lineTotal)}</td></tr>)}
            {Number(o.deliveryCharge) > 0 && <tr><td className="py-1">Delivery</td><td className="py-1 text-right whitespace-nowrap">{rupees(o.deliveryCharge)}</td></tr>}
            <tr style={{ borderTop: '1px solid #e2e8f0' }}><td className="pt-2 font-semibold">Total (GST included)</td><td className="pt-2 text-right font-semibold whitespace-nowrap" data-testid="order-total">{rupees(o.total)}</td></tr>
          </tbody></table>
          <p className="text-xs" style={{ color: '#64748b' }}>{o.payment === 'ONLINE' ? 'You chose to pay online: the payment button appears here once the shop sends your bill.' : o.fulfilment === 'DELIVERY' ? 'Pay on delivery.' : 'Pay at the shop when you pick it up.'}</p>
        </section>
        <div className="flex gap-2">
          {o.shopPhone && <a href={`tel:${o.shopPhone}`} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white text-sm" style={{ border: '1px solid #e2e8f0' }}><Phone className="w-4 h-4" aria-hidden />Call the shop</a>}
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full bg-white text-sm" style={{ border: '1px solid #e2e8f0' }}><MessageCircle className="w-4 h-4" aria-hidden />WhatsApp the shop</a>}
        </div>
      </div>
    </div>
  )
}
