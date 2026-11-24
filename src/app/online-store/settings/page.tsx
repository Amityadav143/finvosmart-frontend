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

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Copy, ExternalLink, ImagePlus, MessageCircle, Printer, Star, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useDebounce } from '@/lib/hooks'
import { godownsApi, shopApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { printHtml, whatsappShare } from '@/lib/storeHelpers'
import type { CatalogueItem, ShopSettings, ShopSettingsInput } from '@/types/store'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/** Setting up the online store: its address and details, how orders are taken, and which items it sells. */
export default function OnlineStoreSetupPage() {
  const { can } = usePermissions()
  const allowed = can('SHOP_MANAGE')
  const { data: settings, isLoading, error } = useQuery({ queryKey: ['shop-settings'], queryFn: shopApi.settings, enabled: allowed })
  if (!allowed) return <PermissionGate permission="SHOP_MANAGE" showDenied><span /></PermissionGate>
  if (error) return <p className="text-sm" role="alert" style={{ color: '#b91c1c' }}>{apiError(error, 'The store could not be loaded')}</p>
  if (isLoading || !settings) return <div className="h-64 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} aria-busy="true" />
  return (
    <div className="space-y-6">
      <div>
        <Link href="/online-store" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Online orders</Link>
        <h1 className="page-title">Online store set-up</h1>
        <p className="page-subtitle">Your own store page: customers browse your items, order for pickup or delivery, and follow the order on their phone. Prices, GST and stock come from your items.</p>
      </div>
      {settings.readOnlyReason && <p className="text-sm rounded-xl px-4 py-3" role="alert" style={{ background: 'rgba(245,158,11,0.12)' }}>{settings.readOnlyReason}</p>}
      <ShareCard s={settings} />
      <SettingsForm key={settings.saved ? 'saved' : 'draft'} s={settings} />
      <Catalogue s={settings} />
    </div>
  )
}

function ShareCard({ s }: { s: ShopSettings }) {
  const { data: qr } = useQuery({ queryKey: ['shop-qr', s.url], queryFn: shopApi.qr, enabled: s.saved })
  const text = `Order from ${s.displayName} online: ${s.url}`
  const copy = async () => { try { await navigator.clipboard.writeText(s.url); toast.success('Link copied') } catch { toast.error('Copying is blocked in this browser') } }
  const poster = () => qr && printHtml(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(s.displayName)}</title><style>@page{size:A5;margin:12mm}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:center;margin:0}h1{font-size:26px;margin:8px 0}svg{width:70mm;height:70mm}p{font-size:14px}</style></head><body><h1>${esc(s.displayName)}</h1><p>Scan to order online — pickup${s.delivery ? ' or delivery' : ''}</p>${qr}<p>${esc(s.url)}</p></body></html>`)
  return (
    <section className="card p-5 flex flex-col md:flex-row gap-5 items-start" aria-label="Your store's link">
      <div className="w-36 h-36 rounded-xl bg-white p-2 flex-shrink-0 grid place-items-center" style={{ border: '1px solid var(--border)' }} data-testid="shop-qr">
        {qr ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: qr }} /> : <span className="text-xs text-center" style={{ color: '#64748b' }}>Save the settings to get the QR code</span>}
      </div>
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge" style={s.published ? { background: 'rgba(22,163,74,0.12)', color: '#15803d' } : { background: 'rgba(245,158,11,0.14)', color: '#b45309' }}>{s.published ? (s.acceptingOrders ? 'Open — taking orders' : 'Online, not taking orders') : 'Not online yet'}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.items} item{s.items === 1 ? '' : 's'} in the store{s.newOrders ? ` · ${s.newOrders} new order${s.newOrders === 1 ? '' : 's'}` : ''}</span>
        </div>
        <p className="font-mono text-sm break-all" data-testid="shop-url">{s.url}</p>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary h-9" onClick={copy}><Copy className="w-4 h-4" aria-hidden />Copy link</button>
          {s.published && <a className="btn-secondary h-9" href={s.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" aria-hidden />Open</a>}
          {s.published && <a className="btn-secondary h-9" href={whatsappShare(text)} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" aria-hidden />Share on WhatsApp</a>}
          {qr && <button className="btn-secondary h-9" onClick={poster}><Printer className="w-4 h-4" aria-hidden />Print a QR poster</button>}
        </div>
        {!s.published && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose the items below, then switch on “Put the store online” and save.</p>}
      </div>
    </section>
  )
}
const esc = (x: unknown) => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

function SettingsForm({ s }: { s: ShopSettings }) {
  const qc = useQueryClient()
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, retry: false })
  const [f, setF] = useState<ShopSettingsInput>(() => ({
    slug: s.slug, published: s.published, acceptingOrders: s.acceptingOrders, listed: s.listed, displayName: s.displayName, tagline: s.tagline ?? '',
    about: s.about ?? '', phone: s.phone ?? '', whatsapp: s.whatsapp ?? '', email: s.email ?? '', address: s.address ?? '', pickup: s.pickup, delivery: s.delivery,
    deliveryCharge: s.deliveryCharge, deliveryGstRate: s.deliveryGstRate, freeDeliveryAbove: s.freeDeliveryAbove ?? null, minOrder: s.minOrder ?? null,
    deliveryNote: s.deliveryNote ?? '', godownId: s.godownId ?? null, showOutOfStock: s.showOutOfStock, accent: s.accent ?? '#0f766e',
  }))
  const set = (patch: Partial<ShopSettingsInput>) => setF(x => ({ ...x, ...patch }))
  const num = (v: string) => (v.trim() === '' ? null : Number(v))
  const save = useMutation({
    mutationFn: () => shopApi.save({ ...f, slug: (f.slug ?? '').trim().toLowerCase() }),
    onSuccess: n => { qc.setQueryData(['shop-settings'], n); qc.invalidateQueries({ queryKey: ['shop-qr'] }); toast.success(n.published ? 'Saved — the store is online' : 'Saved') },
    onError: (e: any) => toast.error(apiError(e, 'The store could not be saved')),
  })
  const logoRef = useRef<HTMLInputElement>(null)
  const logo = useMutation({
    mutationFn: (file: File | null) => file ? shopApi.logo(file) : shopApi.noLogo(),
    onSuccess: n => { qc.setQueryData(['shop-settings'], n); toast.success(n.hasLogo ? 'Logo saved' : 'Logo removed') },
    onError: (e: any) => toast.error(apiError(e, 'The logo could not be saved')),
  })
  const toggle = (k: keyof ShopSettingsInput, label: string, hint?: string) => (
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" checked={!!f[k]} onChange={e => set({ [k]: e.target.checked } as any)} />
      <span>{label}{hint && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</span>}</span></label>
  )
  return (
    <form className="card p-5 space-y-5" onSubmit={e => { e.preventDefault(); save.mutate() }} aria-label="Store settings" data-testid="shop-settings">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="label label-required">Store name</label><input className="input h-10" maxLength={100} value={f.displayName ?? ''} onChange={e => set({ displayName: e.target.value })} /></div>
        <div><label className="label label-required">Store address on the web</label>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <span className="px-2 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>…/shop/</span>
            <input className="input h-10 border-0 font-mono lowercase" maxLength={40} value={f.slug ?? ''} onChange={e => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} aria-label="Store address" data-testid="shop-slug" />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Letters, digits and hyphens. Changing it later breaks links already shared.</p></div>
        <div className="md:col-span-2"><label className="label">One line about the store</label><input className="input h-10" maxLength={150} value={f.tagline ?? ''} onChange={e => set({ tagline: e.target.value })} placeholder="Fresh groceries, delivered in Salt Lake" /></div>
        <div className="md:col-span-2"><label className="label">About</label><textarea className="input min-h-[80px] py-2" maxLength={1000} value={f.about ?? ''} onChange={e => set({ about: e.target.value })} /></div>
        <div><label className="label">Phone</label><input className="input h-10" maxLength={20} value={f.phone ?? ''} onChange={e => set({ phone: e.target.value })} /></div>
        <div><label className="label">WhatsApp number (for orders)</label><input className="input h-10" maxLength={20} value={f.whatsapp ?? ''} onChange={e => set({ whatsapp: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input h-10" type="email" maxLength={150} value={f.email ?? ''} onChange={e => set({ email: e.target.value })} /></div>
        <div><label className="label">Shop address (for pickup)</label><input className="input h-10" maxLength={300} value={f.address ?? ''} onChange={e => set({ address: e.target.value })} /></div>
      </div>

      <fieldset className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <legend className="font-semibold text-sm">Orders</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {toggle('pickup', 'Customers can pick up from the shop')}
          {toggle('delivery', 'You deliver')}
        </div>
        {f.delivery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Delivery charge, with GST (₹)</label><input className="input h-10 font-mono" type="number" min="0" step="0.01" value={f.deliveryCharge ?? ''} onChange={e => set({ deliveryCharge: num(e.target.value) ?? 0 })} /></div>
            <div><label className="label">GST on delivery (%)</label><input className="input h-10 font-mono" type="number" min="0" max="40" step="0.01" value={f.deliveryGstRate ?? ''} onChange={e => set({ deliveryGstRate: num(e.target.value) ?? 0 })} /></div>
            <div><label className="label">Free delivery above (₹)</label><input className="input h-10 font-mono" type="number" min="0" step="1" value={f.freeDeliveryAbove ?? ''} onChange={e => set({ freeDeliveryAbove: num(e.target.value) })} /></div>
            <div><label className="label">Where you deliver</label><input className="input h-10" maxLength={300} value={f.deliveryNote ?? ''} onChange={e => set({ deliveryNote: e.target.value })} placeholder="Within 5 km, same day" /></div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="label">Smallest order (₹)</label><input className="input h-10 font-mono" type="number" min="0" step="1" value={f.minOrder ?? ''} onChange={e => set({ minOrder: num(e.target.value) })} /></div>
          <div><label className="label">Stock is taken from</label>
            <select className="input h-10" value={f.godownId ?? ''} onChange={e => set({ godownId: e.target.value || null })} aria-label="Godown">
              <option value="">The main godown</option>{godowns.filter(g => g.active && !g.main).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          <div><label className="label">Colour</label><input className="input h-10 p-1 w-24" type="color" value={f.accent ?? '#0f766e'} onChange={e => set({ accent: e.target.value })} aria-label="The store's colour" /></div>
        </div>
        {toggle('showOutOfStock', 'Show items that are out of stock (they can\'t be ordered)')}
      </fieldset>

      <fieldset className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <legend className="font-semibold text-sm">Logo</legend>
        <div className="flex items-center gap-3 flex-wrap">
          {s.hasLogo && s.published && <img src={`${API}/public/shop/${encodeURIComponent(s.slug)}/logo`} alt="" className="h-12 w-12 rounded-lg object-contain" style={{ border: '1px solid var(--border)' }} />}
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.hasLogo ? 'Your logo is on the store.' : 'No logo yet — the store shows its name.'}</span>
          <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) logo.mutate(file) }} />
          <button type="button" className="btn-secondary h-9" disabled={!s.saved || logo.isPending} title={s.saved ? undefined : 'Save the settings first'} onClick={() => logoRef.current?.click()}>{s.hasLogo ? 'Change' : 'Upload'}</button>
          {s.hasLogo && <button type="button" className="btn-ghost h-9" disabled={logo.isPending} onClick={() => logo.mutate(null)}>Remove</button>}
        </div>
      </fieldset>

      <fieldset className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <legend className="font-semibold text-sm">Online</legend>
        {toggle('published', 'Put the store online', 'Anyone with the link can see it.')}
        {toggle('acceptingOrders', 'Taking orders', 'Switch off for a holiday: the store stays visible but can\'t take orders.')}
        {toggle('listed', 'Let search engines (Google and others) list the store', 'Off: only people with the link find it.')}
      </fieldset>
      <div className="flex justify-end"><button className="btn-primary h-10" disabled={save.isPending || !(f.displayName ?? '').trim() || !(f.slug ?? '').trim()} data-testid="shop-save">{save.isPending ? 'Saving…' : 'Save'}</button></div>
    </form>
  )
}

function Catalogue({ s }: { s: ShopSettings }) {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const dq = useDebounce(q.trim(), 300)
  const [only, setOnly] = useState<'' | 'in' | 'out'>('')
  const [page, setPage] = useState(0)
  const [chosen, setChosen] = useState<Set<string>>(new Set())
  const [photos, setPhotos] = useState<CatalogueItem | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['shop-catalogue', dq, only, page],
    queryFn: () => shopApi.catalogue({ q: dq || undefined, published: only === '' ? undefined : only === 'in', page, size: 25 }),
  })
  const publish = useMutation({
    mutationFn: ({ ids, on, featured }: { ids: string[]; on: boolean; featured?: boolean }) => shopApi.publish(ids, on, featured),
    onSuccess: () => { setChosen(new Set()); qc.invalidateQueries({ queryKey: ['shop-catalogue'] }); qc.invalidateQueries({ queryKey: ['shop-settings'] }) },
    onError: (e: any) => toast.error(apiError(e, 'The items could not be changed')),
  })
  const items = data?.items ?? []
  const all = items.length > 0 && items.every(i => chosen.has(i.itemId))
  return (
    <section className="card p-5 space-y-3" aria-label="Items in the store" data-testid="shop-catalogue">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div><h2 className="font-semibold text-lg">Items in the store</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{data?.published ?? s.items} of your items are in the store. Prices with GST, as your items sell them; the stock shown is in {s.godown ?? 'the main godown'}.</p></div>
        <div className="flex gap-2 items-center">
          <select className="input h-9 w-40" aria-label="Show" value={only} onChange={e => { setOnly(e.target.value as any); setPage(0) }}>
            <option value="">All items</option><option value="in">In the store</option><option value="out">Not in the store</option></select>
          <input className="input h-9 w-56" placeholder="Find an item" aria-label="Find an item" value={q} onChange={e => { setQ(e.target.value); setPage(0) }} />
        </div>
      </div>
      {chosen.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap rounded-xl px-3 py-2" style={{ background: 'var(--gold-muted)' }}>
          <span className="text-sm">{chosen.size} chosen</span>
          <button className="btn-primary h-8 text-xs" disabled={publish.isPending} onClick={() => publish.mutate({ ids: [...chosen], on: true })} data-testid="shop-publish-chosen">Put in the store</button>
          <button className="btn-secondary h-8 text-xs" disabled={publish.isPending} onClick={() => publish.mutate({ ids: [...chosen], on: false })}>Take out</button>
          <button className="btn-ghost h-8 text-xs" onClick={() => setChosen(new Set())}>Clear</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr>
            <th className="table-header w-8"><input type="checkbox" aria-label="Choose every item on this page" checked={all} onChange={e => setChosen(e.target.checked ? new Set([...chosen, ...items.map(i => i.itemId)]) : new Set([...chosen].filter(id => !items.some(i => i.itemId === id))))} /></th>
            {['Item', 'Price with GST', 'Stock', 'Photos', 'In the store', 'Featured'].map(h => <th key={h} className="table-header">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading ? <tr><td className="table-cell" colSpan={7}>Loading…</td></tr>
              : items.length === 0 ? <tr><td className="table-cell" colSpan={7} style={{ color: 'var(--text-muted)' }}>{dq ? 'No item matches.' : 'No items yet — add them under Inventory → Items.'}</td></tr>
              : items.map(i => (
                <tr key={i.itemId} className="table-row">
                  <td className="table-cell"><input type="checkbox" aria-label={`Choose ${i.name}`} checked={chosen.has(i.itemId)} onChange={e => { const n = new Set(chosen); if (e.target.checked) n.add(i.itemId); else n.delete(i.itemId); setChosen(n) }} /></td>
                  <td className="table-cell"><span className="font-medium">{i.name}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{i.code}{i.category ? ` · ${i.category}` : ''}</span></td>
                  <td className="table-cell font-mono">{Number(i.price) > 0 ? inr(i.priceWithGst) : <span style={{ color: '#b91c1c' }}>No price</span>}</td>
                  <td className="table-cell font-mono">{i.keepsStock ? qty(i.stock) : '—'}</td>
                  <td className="table-cell"><button className="btn-ghost h-8 text-xs" onClick={() => setPhotos(i)}><ImagePlus className="w-3.5 h-3.5" aria-hidden />{i.images.length || 'Add'}</button></td>
                  <td className="table-cell"><input type="checkbox" aria-label={`${i.name} in the store`} checked={i.published} disabled={publish.isPending} onChange={e => publish.mutate({ ids: [i.itemId], on: e.target.checked })} /></td>
                  <td className="table-cell"><button className="btn-icon w-8 h-8" aria-pressed={i.featured} aria-label={`${i.featured ? 'Stop featuring' : 'Feature'} ${i.name}`} disabled={!i.published || publish.isPending}
                    onClick={() => publish.mutate({ ids: [i.itemId], on: true, featured: !i.featured })}><Star className="w-4 h-4" style={{ color: i.featured ? '#f59e0b' : undefined, fill: i.featured ? '#f59e0b' : 'none' }} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-between items-center text-sm">
          <button className="btn-secondary h-9" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ color: 'var(--text-muted)' }}>Page {page + 1} of {data?.totalPages}</span>
          <button className="btn-secondary h-9" disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
      {photos && <PhotoManager item={photos} onClose={() => { setPhotos(null); qc.invalidateQueries({ queryKey: ['shop-catalogue'] }) }} />}
    </section>
  )
}

/** An item's photos for the store (up to 4): add, put in order, remove. The first is the one lists show. */
function PhotoManager({ item, onClose }: { item: CatalogueItem; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: pics = [], isLoading } = useQuery({ queryKey: ['shop-pictures', item.itemId], queryFn: () => shopApi.pictures(item.itemId) })
  const [urls, setUrls] = useState<Record<string, string>>({})
  // every picture fetched (with the session) becomes an object URL, let go of when the window closes
  const made = useRef<string[]>([])
  useEffect(() => {
    let live = true
    ;(async () => {
      for (const p of pics) {
        if (urls[p.id]) continue
        try {
          const u = await shopApi.pictureUrl(p.id, true)
          made.current.push(u)
          if (live) setUrls(x => ({ ...x, [p.id]: u }))
        } catch { /* shown as a blank tile */ }
      }
    })()
    return () => { live = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pics])
  useEffect(() => () => { made.current.forEach(u => { try { URL.revokeObjectURL(u) } catch { /* already gone */ } }) }, [])
  const fileRef = useRef<HTMLInputElement>(null)
  const done = (list: unknown) => { qc.setQueryData(['shop-pictures', item.itemId], list) }
  const add = useMutation({ mutationFn: (f: File) => shopApi.addPicture(item.itemId, f), onSuccess: l => { done(l); toast.success('Photo added') }, onError: (e: any) => toast.error(apiError(e, 'The photo could not be added')) })
  const order = useMutation({ mutationFn: (ids: string[]) => shopApi.orderPictures(item.itemId, ids), onSuccess: done, onError: (e: any) => toast.error(apiError(e, 'The order could not be saved')) })
  const drop = useMutation({ mutationFn: (id: string) => shopApi.deletePicture(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-pictures', item.itemId] }), onError: (e: any) => toast.error(apiError(e, 'The photo could not be removed')) })
  const move = (i: number, by: number) => { const ids = pics.map(p => p.id); const j = i + by; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; order.mutate(ids) }
  return (
    <Modal open onClose={onClose} title={`Photos of ${item.name}`} subtitle="Up to 4 — the first is the one lists show. Photos are resized for the web and saved as JPEG." size="lg">
      <div className="space-y-4" data-testid="shop-photos">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isLoading ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p> : pics.map((p, i) => (
            <div key={p.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="aspect-square bg-white grid place-items-center">{urls[p.id] ? <img src={urls[p.id]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" /> : null}</div>
              <div className="flex items-center justify-between px-1 py-1">
                <button className="btn-icon w-7 h-7" aria-label="Earlier" disabled={i === 0 || order.isPending} onClick={() => move(i, -1)}><ArrowLeft className="w-3.5 h-3.5" /></button>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{i === 0 ? 'Main' : i + 1}</span>
                <button className="btn-icon w-7 h-7" aria-label="Later" disabled={i === pics.length - 1 || order.isPending} onClick={() => move(i, 1)}><ArrowRight className="w-3.5 h-3.5" /></button>
                <button className="btn-icon w-7 h-7" aria-label="Remove this photo" disabled={drop.isPending} onClick={() => drop.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" hidden onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) add.mutate(file) }} />
        <div className="flex justify-between">
          <button className="btn-secondary h-10" disabled={pics.length >= 4 || add.isPending} onClick={() => fileRef.current?.click()} data-testid="shop-photo-add"><ImagePlus className="w-4 h-4" aria-hidden />{add.isPending ? 'Uploading…' : 'Add a photo'}</button>
          <button className="btn-primary h-10" onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  )
}
