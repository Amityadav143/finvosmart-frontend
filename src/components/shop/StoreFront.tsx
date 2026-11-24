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
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, MessageCircle, Minus, Phone, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { PLACES_OF_SUPPLY } from '@/lib/money'
import type { PlacedOrder, PublicItem, PublicStore } from '@/types/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const rupees = (n: number) => '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n)
const round2 = (n: number) => Math.round(n * 100) / 100
export const pictureUrl = (slug: string, id: string, thumb = false) => `${API}/public/shop/${encodeURIComponent(slug)}/pictures/${id}${thumb ? '?size=thumb' : ''}`
const cartKey = (slug: string) => `finvo.shop.${slug}.cart`

/** The cart, kept in this browser for this store: item and how many. */
function useCart(slug: string) {
  const [cart, setCart] = useState<Record<string, number>>({})
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(cartKey(slug)) || '{}'); if (v && typeof v === 'object') setCart(v) } catch { /* storage off: an empty cart */ }
    setReady(true)
  }, [slug])
  useEffect(() => {
    if (!ready) return
    try { if (Object.keys(cart).length) localStorage.setItem(cartKey(slug), JSON.stringify(cart)); else localStorage.removeItem(cartKey(slug)) } catch { /* storage off */ }
  }, [cart, ready, slug])
  const set = (id: string, n: number) => setCart(c => { const x = { ...c }; if (n > 0) x[id] = Math.min(n, 999); else delete x[id]; return x })
  return { cart, set, clear: () => setCart({}) }
}

/** A published store as its customers see it: the items, a cart, and the order form. */
export function StoreFront({ store, productId }: { store: PublicStore; productId?: string }) {
  const accent = store.accent || '#0f766e'
  const { cart, set, clear } = useCart(store.slug)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [open, setOpen] = useState(false)
  const items = store.items
  const byId = useMemo(() => new Map(items.map(i => [i.id, i])), [items])
  const shown = items.filter(i => (!cat || i.category === cat) && (!q.trim() || `${i.name} ${i.category ?? ''} ${i.description ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())))
  const lines = Object.entries(cart).map(([id, n]) => ({ item: byId.get(id), n })).filter((l): l is { item: PublicItem; n: number } => !!l.item)
  const count = lines.reduce((t, l) => t + l.n, 0)
  const itemsTotal = round2(lines.reduce((t, l) => t + Number(l.item.priceWithGst) * l.n, 0))
  const product = productId ? byId.get(productId) : undefined
  const wa = store.whatsapp ? `https://wa.me/91${store.whatsapp.replace(/\D/g, '').slice(-10)}` : null

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', color: '#0f172a' }} data-testid="storefront">
      <header className="sticky top-0 z-20 bg-white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/shop/${store.slug}`} className="flex items-center gap-3 min-w-0">
            {store.hasLogo
              ? <img src={`${API}/public/shop/${encodeURIComponent(store.slug)}/logo`} alt={`${store.name} logo`} className="w-10 h-10 rounded-lg object-contain" />
              : <span className="w-10 h-10 rounded-lg grid place-items-center text-white font-bold" style={{ background: accent }} aria-hidden>{store.name.slice(0, 1).toUpperCase()}</span>}
            <span className="min-w-0"><span className="block font-semibold leading-tight truncate">{store.name}</span>
              {store.tagline && <span className="block text-xs truncate" style={{ color: '#64748b' }}>{store.tagline}</span>}</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {store.phone && <a href={`tel:${store.phone}`} className="hidden sm:inline-flex items-center gap-1 text-sm px-3 h-9 rounded-full" style={{ border: '1px solid #e2e8f0' }}><Phone className="w-4 h-4" aria-hidden />Call</a>}
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1 text-sm px-3 h-9 rounded-full" style={{ border: '1px solid #e2e8f0' }}><MessageCircle className="w-4 h-4" aria-hidden />WhatsApp</a>}
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-4 h-10 rounded-full text-white" style={{ background: accent }} data-testid="store-cart-open">
              <ShoppingBag className="w-4 h-4" aria-hidden />{count ? <>{count}<span className="hidden sm:inline"> · {rupees(itemsTotal)}</span></> : 'Cart'}
            </button>
          </div>
        </div>
      </header>

      {!store.accepting && (
        <div className="max-w-6xl mx-auto px-4 pt-4"><p className="rounded-xl px-4 py-3 text-sm" role="status" style={{ background: '#fef3c7', color: '#92400e' }}>{store.closedReason ?? 'The store is not taking orders just now.'}</p></div>
      )}

      {/* (a div with the role, not <main>: the website's phone styles for its own <main> pages would resize this one) */}
      <div role="main" className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {product ? (
          <ProductDetail store={store} item={product} accent={accent} inCart={cart[product.id] ?? 0} onSet={n => set(product.id, n)} />
        ) : (
          <>
            {(store.about || store.address) && (
              <section className="space-y-1">
                {store.about && <p className="text-sm max-w-3xl" style={{ color: '#334155' }}>{store.about}</p>}
                <p className="text-xs flex flex-wrap gap-x-4 gap-y-1" style={{ color: '#64748b' }}>
                  {store.address && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden />{store.address}</span>}
                  <span>{[store.pickup && 'Pickup from the shop', store.delivery && (store.deliveryNote ? `Delivery: ${store.deliveryNote}` : 'Delivery')].filter(Boolean).join(' · ')}</span>
                  {store.delivery && Number(store.freeDeliveryAbove) > 0 && <span>Free delivery above {rupees(Number(store.freeDeliveryAbove))}</span>}
                  {Number(store.minOrder) > 0 && <span>Smallest order {rupees(Number(store.minOrder))}</span>}
                </p>
              </section>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} aria-hidden />
                <input className="w-full h-11 rounded-xl pl-9 pr-3 bg-white text-sm" style={{ border: '1px solid #e2e8f0' }} placeholder={`Search ${store.name}`} aria-label="Search the store" value={q} onChange={e => setQ(e.target.value)} /></div>
            </div>
            {store.categories.length > 1 && (
              <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Categories">
                {['', ...store.categories].map(c => (
                  <button key={c || 'all'} onClick={() => setCat(c)} className="whitespace-nowrap px-3 h-8 rounded-full text-sm"
                    style={cat === c ? { background: accent, color: '#fff' } : { background: '#fff', border: '1px solid #e2e8f0' }}>{c || 'All'}</button>
                ))}
              </nav>
            )}
            {shown.length === 0 ? <p className="text-sm py-10 text-center" style={{ color: '#64748b' }}>{items.length ? 'Nothing matches.' : 'The store has no items yet.'}</p> : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="store-items">
                {shown.map(i => (
                  <li key={i.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: '1px solid #e2e8f0' }}>
                    <Link href={`/shop/${store.slug}/p/${i.id}`} className="block">
                      <div className="aspect-square bg-slate-50 grid place-items-center">
                        {i.images[0] ? <img src={pictureUrl(store.slug, i.images[0], true)} alt={i.name} loading="lazy" className="w-full h-full object-cover" />
                          : <ShoppingBag className="w-8 h-8" style={{ color: '#cbd5e1' }} aria-hidden />}
                      </div>
                      <div className="px-3 pt-2"><h2 className="text-sm font-medium leading-snug line-clamp-2">{i.name}</h2></div>
                    </Link>
                    <div className="px-3 pb-3 pt-1 mt-auto flex flex-wrap items-end justify-between gap-2">
                      <div><p className="font-semibold">{rupees(Number(i.priceWithGst))}</p>
                        <p className="text-[11px]" style={{ color: i.inStock ? '#64748b' : '#b91c1c' }}>{!i.inStock ? 'Out of stock' : i.left != null ? `Only ${Number(i.left)} left` : `incl. GST${i.unit ? ` · per ${i.unit.toLowerCase()}` : ''}`}</p></div>
                      <Stepper n={cart[i.id] ?? 0} onSet={n => set(i.id, n)} accent={accent} disabled={!i.inStock || !store.accepting} name={i.name} max={i.left ?? 999} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs space-y-1" style={{ color: '#64748b' }}>
        <p>{store.legalName || store.name}{store.gstin ? ` · GSTIN ${store.gstin}` : ''}{store.city ? ` · ${store.city}` : ''}{store.state ? `, ${store.state}` : ''}</p>
        <p>Prices include GST. Online store by <a className="underline" href="https://finvosmart.com" rel="noopener">Finvosmart</a>.</p>
      </footer>

      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3 sm:hidden">
          <button onClick={() => setOpen(true)} className="w-full h-12 rounded-full text-white font-semibold shadow-lg" style={{ background: accent }}>View cart · {count} · {rupees(itemsTotal)}</button>
        </div>
      )}
      {open && <CartPanel store={store} accent={accent} lines={lines} itemsTotal={itemsTotal} onSet={set} onClose={() => setOpen(false)} onPlaced={() => clear()} />}
    </div>
  )
}

function Stepper({ n, onSet, accent, disabled, name, max }: { n: number; onSet: (n: number) => void; accent: string; disabled?: boolean; name: string; max: number }) {
  if (n <= 0) return <button disabled={disabled} onClick={() => onSet(1)} className="px-3 h-9 rounded-full text-sm font-semibold text-white disabled:opacity-40" style={{ background: accent }} aria-label={`Add ${name}`}>Add</button>
  return (
    <div className="flex items-center rounded-full" style={{ border: `1px solid ${accent}` }}>
      <button className="w-8 h-8 grid place-items-center" onClick={() => onSet(n - 1)} aria-label={`One less ${name}`}><Minus className="w-3.5 h-3.5" /></button>
      <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{n}</span>
      <button className="w-8 h-8 grid place-items-center disabled:opacity-40" disabled={n >= max} onClick={() => onSet(n + 1)} aria-label={`One more ${name}`}><Plus className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function ProductDetail({ store, item, accent, inCart, onSet }: { store: PublicStore; item: PublicItem; accent: string; inCart: number; onSet: (n: number) => void }) {
  const [shown, setShown] = useState(0)
  return (
    <article className="space-y-4" data-testid="store-product">
      <Link href={`/shop/${store.slug}`} className="inline-flex items-center gap-1 text-sm" style={{ color: '#475569' }}><ArrowLeft className="w-4 h-4" aria-hidden />All items</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="aspect-square bg-white rounded-2xl overflow-hidden grid place-items-center" style={{ border: '1px solid #e2e8f0' }}>
            {item.images[shown] ? <img src={pictureUrl(store.slug, item.images[shown])} alt={item.name} className="w-full h-full object-contain" /> : <ShoppingBag className="w-12 h-12" style={{ color: '#cbd5e1' }} aria-hidden />}
          </div>
          {item.images.length > 1 && (
            <div className="flex gap-2">{item.images.map((id, i) => (
              <button key={id} onClick={() => setShown(i)} className="w-16 h-16 rounded-lg overflow-hidden" style={{ border: `2px solid ${i === shown ? accent : '#e2e8f0'}` }} aria-label={`Photo ${i + 1}`}>
                <img src={pictureUrl(store.slug, id, true)} alt="" className="w-full h-full object-cover" /></button>
            ))}</div>
          )}
        </div>
        <div className="space-y-3">
          {item.category && <p className="text-xs uppercase tracking-wide" style={{ color: '#64748b' }}>{item.category}</p>}
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="text-2xl font-bold">{rupees(Number(item.priceWithGst))} <span className="text-sm font-normal" style={{ color: '#64748b' }}>incl. {Number(item.gstRate)}% GST{item.unit ? ` · per ${item.unit.toLowerCase()}` : ''}</span></p>
          <p className="text-sm" style={{ color: item.inStock ? '#15803d' : '#b91c1c' }}>{!item.inStock ? 'Out of stock' : item.left != null ? `Only ${Number(item.left)} left` : 'In stock'}</p>
          {item.description && <p className="text-sm whitespace-pre-line" style={{ color: '#334155' }}>{item.description}</p>}
          <div className="pt-2"><Stepper n={inCart} onSet={onSet} accent={accent} disabled={!item.inStock || !store.accepting} name={item.name} max={item.left ?? 999} /></div>
        </div>
      </div>
    </article>
  )
}

/** The cart and the order form: pickup or delivery, contact details, how to pay; the order is priced by the shop's server. */
function CartPanel({ store, accent, lines, itemsTotal, onSet, onClose, onPlaced }: {
  store: PublicStore; accent: string; lines: { item: PublicItem; n: number }[]; itemsTotal: number
  onSet: (id: string, n: number) => void; onClose: () => void; onPlaced: () => void
}) {
  const router = useRouter()
  const [way, setWay] = useState<'PICKUP' | 'DELIVERY'>(store.pickup ? 'PICKUP' : 'DELIVERY')
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', city: store.city ?? '', pincode: '', state: store.state ?? '', note: '', payment: 'ON_DELIVERY', website: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem('finvo.shop.customer') || 'null'); if (v) setF(x => ({ ...x, name: v.name ?? '', phone: v.phone ?? '', email: v.email ?? '', address: v.address ?? '', pincode: v.pincode ?? '', city: v.city || x.city, state: v.state || x.state })) } catch { /* none kept */ }
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  const freeAbove = Number(store.freeDeliveryAbove ?? 0)
  const delivery = way === 'DELIVERY' ? (freeAbove > 0 && itemsTotal >= freeAbove ? 0 : Number(store.deliveryCharge ?? 0)) : 0
  const total = Math.round(itemsTotal + delivery)
  const short = Number(store.minOrder ?? 0) > 0 && itemsTotal < Number(store.minOrder) ? round2(Number(store.minOrder) - itemsTotal) : 0
  const digits = f.phone.replace(/\D/g, '').slice(-10)
  const problem = !lines.length ? 'Your cart is empty.' : short > 0 ? `Add ${rupees(short)} more — the smallest order is ${rupees(Number(store.minOrder))}.`
    : f.name.trim().length < 2 ? 'Enter your name.' : !(digits.length === 10 && digits[0] >= '6') ? 'Enter your 10-digit mobile number.'
    : way === 'DELIVERY' && f.address.trim().length < 5 ? 'Enter the delivery address.' : way === 'DELIVERY' && !/^[1-9]\d{5}$/.test(f.pincode.trim()) ? 'Enter the 6-digit PIN code.' : null
  const place = async () => {
    setBusy(true); setError(null)
    try {
      const r = await fetch(`${API}/public/shop/${encodeURIComponent(store.slug)}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: f.name.trim(), phone: digits, email: f.email.trim() || null, fulfilment: way, address: way === 'DELIVERY' ? f.address.trim() : null,
          city: way === 'DELIVERY' ? f.city.trim() : null, pincode: way === 'DELIVERY' ? f.pincode.trim() : null, state: way === 'DELIVERY' ? f.state : null,
          note: f.note.trim() || null, payment: f.payment, website: f.website, lines: lines.map(l => ({ itemId: l.item.id, quantity: l.n })) }),
      })
      const body = await r.json().catch(() => null)
      if (!r.ok) { setError(body?.message || (r.status === 429 ? 'Too many orders from this connection — please try again later.' : 'The order could not be placed. Please try again.')); return }
      const placed = body?.data as PlacedOrder
      try { localStorage.setItem('finvo.shop.customer', JSON.stringify({ name: f.name.trim(), phone: digits, email: f.email.trim(), address: f.address.trim(), pincode: f.pincode.trim(), city: f.city.trim(), state: f.state })) } catch { /* not kept */ }
      onPlaced()
      router.push(`/shop/order/${placed.token}?placed=1`)
    } catch {
      setError('No connection — check the internet and try again.')
    } finally {
      setBusy(false)
    }
  }
  const field = 'w-full h-11 rounded-xl px-3 bg-white text-sm'
  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'rgba(15,23,42,0.45)' }} onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Your cart" className="w-full max-w-md h-full bg-white overflow-y-auto" onClick={e => e.stopPropagation()} data-testid="store-cart">
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="font-semibold">Your order</h2><button onClick={onClose} className="w-9 h-9 grid place-items-center rounded-full" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          {lines.length === 0 ? <p className="text-sm" style={{ color: '#64748b' }}>Your cart is empty.</p> : (
            <ul className="space-y-3">
              {lines.map(({ item, n }) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p><p className="text-xs" style={{ color: '#64748b' }}>{rupees(Number(item.priceWithGst))} each</p></div>
                  <Stepper n={n} onSet={x => onSet(item.id, x)} accent={accent} name={item.name} max={item.left ?? 999} />
                  <span className="w-20 text-right text-sm font-semibold">{rupees(round2(Number(item.priceWithGst) * n))}</span>
                  <button onClick={() => onSet(item.id, 0)} className="w-8 h-8 grid place-items-center" aria-label={`Remove ${item.name}`}><Trash2 className="w-4 h-4" style={{ color: '#94a3b8' }} /></button>
                </li>
              ))}
            </ul>
          )}
          {lines.length > 0 && store.accepting && (
            <form className="space-y-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }} onSubmit={e => { e.preventDefault(); if (!problem && !busy) place() }}>
              {store.pickup && store.delivery && (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pickup or delivery">
                  {(['PICKUP', 'DELIVERY'] as const).map(w => (
                    <button type="button" key={w} role="radio" aria-checked={way === w} onClick={() => setWay(w)} className="h-11 rounded-xl text-sm font-medium"
                      style={way === w ? { background: accent, color: '#fff' } : { border: '1px solid #e2e8f0' }}>{w === 'PICKUP' ? 'Pick up from the shop' : 'Deliver to me'}</button>
                  ))}
                </div>
              )}
              <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="Your name" aria-label="Your name" autoComplete="name" maxLength={100} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
              <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="Mobile number" aria-label="Mobile number" autoComplete="tel" inputMode="tel" maxLength={14} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
              <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="Email (optional)" aria-label="Email" autoComplete="email" type="email" maxLength={150} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
              {way === 'DELIVERY' && (
                <>
                  <textarea className="w-full rounded-xl px-3 py-2 bg-white text-sm min-h-[70px]" style={{ border: '1px solid #e2e8f0' }} placeholder="Delivery address" aria-label="Delivery address" autoComplete="street-address" maxLength={300} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="City" aria-label="City" autoComplete="address-level2" maxLength={100} value={f.city} onChange={e => setF({ ...f, city: e.target.value })} />
                    <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="PIN code" aria-label="PIN code" autoComplete="postal-code" inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => setF({ ...f, pincode: e.target.value.replace(/\D/g, '') })} />
                  </div>
                  <select className={field} style={{ border: '1px solid #e2e8f0' }} aria-label="State" value={f.state} onChange={e => setF({ ...f, state: e.target.value })}>
                    <option value="">State</option>{PLACES_OF_SUPPLY.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                  </select>
                </>
              )}
              <input className={field} style={{ border: '1px solid #e2e8f0' }} placeholder="A note for the shop (optional)" aria-label="A note for the shop" maxLength={500} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
              {/* left empty by people; form-fillers fill it in */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" value={f.website} onChange={e => setF({ ...f, website: e.target.value })} />
              <fieldset className="space-y-1.5"><legend className="text-sm font-medium pb-1">How you&apos;ll pay</legend>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="pay" checked={f.payment === 'ON_DELIVERY'} onChange={() => setF({ ...f, payment: 'ON_DELIVERY' })} />{way === 'DELIVERY' ? 'Pay on delivery' : 'Pay at the shop'}</label>
                {store.onlinePay && <label className="flex items-center gap-2 text-sm"><input type="radio" name="pay" checked={f.payment === 'ONLINE'} onChange={() => setF({ ...f, payment: 'ONLINE' })} />Pay online — the shop sends a payment link with your bill</label>}
              </fieldset>
              <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: '#f8fafc' }}>
                <div className="flex justify-between"><span>Items</span><span>{rupees(itemsTotal)}</span></div>
                {way === 'DELIVERY' && <div className="flex justify-between"><span>Delivery</span><span>{delivery ? rupees(delivery) : 'Free'}</span></div>}
                <div className="flex justify-between font-semibold text-base pt-1"><span>To pay</span><span data-testid="store-total">{rupees(total)}</span></div>
                <p className="text-[11px]" style={{ color: '#64748b' }}>Prices include GST. Your order page shows the exact bill.</p>
              </div>
              {(error || problem) && <p className="text-sm" role="alert" style={{ color: '#b91c1c' }}>{error ?? problem}</p>}
              <button className="w-full h-12 rounded-full text-white font-semibold disabled:opacity-50" style={{ background: accent }} disabled={!!problem || busy} data-testid="store-place">{busy ? 'Placing your order…' : 'Place the order'}</button>
            </form>
          )}
          {lines.length > 0 && !store.accepting && <p className="text-sm" style={{ color: '#92400e' }}>{store.closedReason ?? 'The store is not taking orders just now.'}</p>}
        </div>
      </aside>
    </div>
  )
}
