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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Banknote, Camera, History, Keyboard, Lock, Minus, PauseCircle, Plus, RotateCcw, ScanBarcode, Search, Trash2, User, Users,
} from 'lucide-react'
import { posApi, type SaleBody } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { Modal } from '@/components/ui/Modal'
import { inr } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { computeInvoice, type InvoiceTotals } from '@/lib/invoiceMath'
import { useDebounce } from '@/lib/hooks'
import { clientRef } from '@/lib/storeHelpers'
import type { HeldBill, PosItem, PosQuote, PosRegister, PosSession, PosState, Receipt, ShiftReport } from '@/types/store'
import { CashModal, CloseShiftModal, PayModal, ReceiptModal, ReturnModal } from './PosDialogs'
import { CameraScan, cameraScanAvailable } from './CameraScan'
import { CustomerPicker, type BillCustomer } from './CustomerPicker'
import { BillsList, HeldBills } from './PosLists'

/** A line on the bill being made: the item as the counter found it, how many, and — set by a manager — its price or discount. */
interface CartLine { key: string; item: PosItem; quantity: number; price: number | null; discountPct: number }
interface Cart { lines: CartLine[]; customer: BillCustomer | null; billDiscount: string }

const MAX_LINES = 50
const EMPTY: Cart = { lines: [], customer: null, billDiscount: '' }
const cartKey = (registerId: string) => `finvo.pos.cart.${registerId}`
const r3 = (n: number) => Math.round(n * 1000) / 1000
const r4 = (n: number) => Math.round(n * 10000) / 10000

/** The bill on screen, kept in this browser so a reload or a closed tab doesn't lose it (it is not sent anywhere until billed). */
function loadCart(registerId: string): Cart {
  try {
    const s = localStorage.getItem(cartKey(registerId))
    if (s) {
      const v = JSON.parse(s)
      if (Array.isArray(v?.lines)) return { lines: v.lines.filter((l: any) => l?.item?.id && Number(l.quantity) > 0), customer: v.customer ?? null, billDiscount: String(v.billDiscount ?? '') }
    }
  } catch { /* storage off or the saved bill unreadable: start empty */ }
  return EMPTY
}
function saveCart(registerId: string, c: Cart) {
  try {
    if (c.lines.length || c.customer) localStorage.setItem(cartKey(registerId), JSON.stringify(c))
    else localStorage.removeItem(cartKey(registerId))
  } catch { /* storage off: the bill stays on screen only */ }
}
/** What decides a bill: a second attempt at the same cart reuses its reference, so it is billed once. */
const fingerprint = (c: Cart) => JSON.stringify([c.lines.map(l => [l.item.id, l.quantity, l.price, l.discountPct]), c.customer?.id ?? c.customer?.phone ?? null, c.billDiscount])

export function Counter({ state, session, register, onLeave, onClosed }: {
  state: PosState; session: PosSession; register: PosRegister; onLeave: () => void
  /** the shift was closed: its report is shown by the page (the counter itself goes, with the shift) */
  onClosed: (report: ShiftReport, width: 58 | 80) => void
}) {
  const qc = useQueryClient()
  const admin = state.admin
  const mine = state.mine?.id === session.id
  const mayRunShift = mine || admin
  const [cart, setCart] = useState<Cart>(() => loadCart(register.id))
  const { lines, customer, billDiscount } = cart
  useEffect(() => saveCart(register.id, cart), [register.id, cart])
  const setLines = (f: (ls: CartLine[]) => CartLine[]) => setCart(c => ({ ...c, lines: f(c.lines) }))

  const [q, setQ] = useState('')
  const dq = useDebounce(q.trim(), 200)
  const searchRef = useRef<HTMLInputElement>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [dialog, setDialog] = useState<null | 'customer' | 'held' | 'bills' | 'return' | 'cash' | 'close' | 'camera' | 'keys'>(null)
  const [paying, setPaying] = useState<PosQuote | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const pending = useRef<{ ref: string; print: string } | null>(null)
  const [clearing, setClearing] = useState(false)

  const { data: found = [], isFetching } = useQuery({
    queryKey: ['pos-items', register.id, dq],
    queryFn: () => posApi.items(register.id, dq || undefined),
    staleTime: 20_000,
  })
  const { data: held = [] } = useQuery({ queryKey: ['pos-held', register.id], queryFn: () => posApi.held(register.id), staleTime: 30_000 })

  const focusSearch = useCallback(() => setTimeout(() => searchRef.current?.focus(), 0), [])
  useEffect(() => { focusSearch() }, [focusSearch])

  const totals: InvoiceTotals | { error: string } | null = useMemo(() => {
    if (!lines.length) return null
    try {
      return computeInvoice(lines.map(l => ({ quantity: l.quantity, rate: l.price ?? Number(l.item.price), discountPct: l.discountPct || 0, gstRate: l.item.gstRate })),
        false, Number(billDiscount) > 0 ? billDiscount : null, true)
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [lines, billDiscount])
  const ok = totals && !('error' in totals) ? totals : null

  const add = (item: PosItem, n = 1) => {
    const same = lines.findIndex(l => l.item.id === item.id && l.price === null && !l.discountPct)
    if (same < 0 && lines.length >= MAX_LINES) { toast.error(`A counter bill can have ${MAX_LINES} lines at most.`); return }
    setLines(ls => {
      const i = ls.findIndex(l => l.item.id === item.id && l.price === null && !l.discountPct)
      if (i >= 0) return ls.map((l, j) => j === i ? { ...l, item, quantity: r3(l.quantity + n) } : l)
      return [...ls, { key: clientRef(), item, quantity: n, price: null, discountPct: 0 }]
    })
    setFlash(item.id)
    setTimeout(() => setFlash(f => (f === item.id ? null : f)), 600)
  }

  /** Enter in the search box: a code or barcode (what a scanner types), "3*code" for three, else the one item the search found. */
  const submit = async () => {
    const text = q.trim()
    if (!text) return
    const m = /^(\d+(?:\.\d+)?)\s*\*\s*(\S.*)$/.exec(text)
    const n = m ? Number(m[1]) : 1
    const code = m ? m[2].trim() : text
    if (!(n > 0)) { toast.error('Enter a quantity above zero'); return }
    try {
      const it = await posApi.byCode(register.id, code)
      if (it) { add(it, n); setQ(''); return }
    } catch (e: any) {
      const status = e?.response?.status
      if (status && status !== 404) { toast.error(apiError(e, 'The item could not be found')); return }
      if (!status) { toast.error(apiError(e, 'The item could not be looked up — check the connection')); return }
    }
    const list = dq === code ? found : await posApi.items(register.id, code).catch(() => [] as PosItem[])
    if (list.length === 1) { add(list[0], n); setQ('') }
    else if (list.length === 0) toast.error(`No item matches “${code}”`)
    else toast(`${list.length} items match “${code}” — tap the one you want`)
  }
  const onScan = useCallback(async (code: string) => {
    try {
      const it = await posApi.byCode(register.id, code)
      if (it) { add(it, 1); toast.success(`${it.name} added`, { duration: 1200 }) }
    } catch (e: any) {
      toast.error(apiError(e, `No item has the code ${code}`))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register.id, lines])

  const setQty = (key: string, v: number) => setLines(ls => ls.map(l => l.key === key ? { ...l, quantity: r3(Math.max(v, 0.001)) } : l))
  const remove = (key: string) => setLines(ls => ls.filter(l => l.key !== key))
  const clear = () => { setCart(EMPTY); setPayError(null); focusSearch() }

  const body = (): Omit<SaleBody, 'clientRef' | 'payments'> => ({
    sessionId: session.id,
    customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone ?? undefined, gstin: customer.gstin ?? undefined } : null,
    lines: lines.map(l => ({ itemId: l.item.id, quantity: l.quantity, ...(l.price !== null ? { price: l.price } : {}), ...(l.discountPct ? { discountPct: l.discountPct } : {}) })),
    billDiscount: Number(billDiscount) > 0 ? Number(billDiscount) : undefined,
  })

  const quote = useMutation({
    mutationFn: () => posApi.quote(body()),
    onSuccess: qt => { setPayError(null); setPaying(qt) },
    onError: (e: any) => toast.error(apiError(e, 'The bill could not be worked out')),
  })
  const startPay = () => {
    if (!lines.length) { toast('Add an item first'); focusSearch(); return }
    if (totals && 'error' in totals) { toast.error(totals.error); return }
    quote.mutate()
  }
  const sell = useMutation({
    mutationFn: ({ payments, prescription }: { payments: SaleBody['payments']; prescription: SaleBody['prescription'] }) => {
      const print = fingerprint(cart)
      if (!pending.current || pending.current.print !== print) pending.current = { ref: clientRef(), print }
      return posApi.sell({ ...body(), clientRef: pending.current.ref, payments, prescription })
    },
    onSuccess: r => {
      pending.current = null
      setPaying(null)
      setCart(EMPTY)
      setReceipt(r)
      qc.invalidateQueries({ queryKey: ['pos-state'] })
      qc.invalidateQueries({ queryKey: ['pos-items', register.id] })
      qc.invalidateQueries({ queryKey: ['pos-bills', session.id] })
    },
    onError: (e: any) => {
      // no answer at all: the bill may have been made — the same reference is sent again, so it is never made twice
      if (!e?.response) setPayError('The connection dropped before the answer came. Tap Complete again — the bill will not be made twice.')
      else { pending.current = null; setPayError(apiError(e, 'The bill could not be made')) }
    },
  })

  const hold = useMutation({
    mutationFn: () => posApi.hold(register.id, customer?.name ?? `Bill of ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}`, JSON.stringify(cart)),
    onSuccess: () => { toast.success('Bill put on hold'); clear(); qc.invalidateQueries({ queryKey: ['pos-held', register.id] }) },
    onError: (e: any) => toast.error(apiError(e, 'The bill could not be held')),
  })
  const recall = async (h: HeldBill) => {
    if (lines.length) { toast.error('Finish or hold the bill on screen first'); return }
    let saved: Cart
    try {
      const v = JSON.parse(h.cart)
      saved = { lines: Array.isArray(v?.lines) ? v.lines : [], customer: v?.customer ?? null, billDiscount: String(v?.billDiscount ?? '') }
    } catch {
      toast.error('That held bill could not be read'); return
    }
    try { await posApi.dropHeld(h.id) } catch (e: any) { toast.error(apiError(e, 'The held bill could not be taken up')); return }
    setCart(saved)
    setDialog(null)
    qc.invalidateQueries({ queryKey: ['pos-held', register.id] })
    focusSearch()
  }

  // keys: F2 search, F4 customer, F6 return, F8 hold, F9 pay
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (dialog || paying || receipt) return
      if (e.key === 'F2') { e.preventDefault(); focusSearch() }
      else if (e.key === 'F4') { e.preventDefault(); setDialog('customer') }
      else if (e.key === 'F6') { e.preventDefault(); setDialog('return') }
      else if (e.key === 'F8') { e.preventDefault(); if (lines.length) hold.mutate() }
      else if (e.key === 'F9' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); startPay() }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })

  const itemCount = lines.reduce((t, l) => t + l.quantity, 0)
  const opened = new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(session.openedAt) ? session.openedAt : session.openedAt + '+05:30')
    .toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4 pb-24 lg:pb-0" data-testid="pos-counter">
      {/* the shift */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">{register.name}</h1>
          <p className="page-subtitle">{register.godown} · shift opened {opened}{session.openedBy ? ` by ${session.openedBy}` : ''} · {session.bills} bill{session.bills === 1 ? '' : 's'}, {inr(session.sales)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary h-9" onClick={() => setDialog('held')} data-testid="pos-held-open"><PauseCircle className="w-4 h-4" aria-hidden />Held{held.length ? ` (${held.length})` : ''}</button>
          <button className="btn-secondary h-9" onClick={() => setDialog('bills')}><History className="w-4 h-4" aria-hidden />Bills</button>
          <button className="btn-secondary h-9" onClick={() => setDialog('return')} data-testid="pos-return-open"><RotateCcw className="w-4 h-4" aria-hidden />Return</button>
          <button className="btn-secondary h-9" disabled={!mayRunShift} title={mayRunShift ? undefined : 'Only the person who opened the shift, or a manager'} onClick={() => setDialog('cash')}><Banknote className="w-4 h-4" aria-hidden />Cash in/out</button>
          <button className="btn-secondary h-9" disabled={!mayRunShift} title={mayRunShift ? undefined : 'Only the person who opened the shift, or a manager'} onClick={() => setDialog('close')} data-testid="pos-close-open"><Lock className="w-4 h-4" aria-hidden />Close shift</button>
          {!mine && <button className="btn-ghost h-9" onClick={onLeave}>Leave counter</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* finding items */}
        <section className="lg:col-span-3 space-y-3" aria-label="Items">
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); submit() }}>
            <div className="relative flex-1">
              <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden />
              <input ref={searchRef} className="input h-12 pl-9 text-base" placeholder="Scan a barcode, or type a code or name (3*code for three)" aria-label="Scan or search items"
                value={q} onChange={e => setQ(e.target.value)} autoComplete="off" data-testid="pos-search" />
            </div>
            {cameraScanAvailable() && <button type="button" className="btn-secondary h-12" onClick={() => setDialog('camera')} aria-label="Scan with the camera"><Camera className="w-5 h-5" /></button>}
            <button type="button" className="btn-ghost h-12 hidden md:inline-flex" onClick={() => setDialog('keys')} aria-label="Keyboard shortcuts"><Keyboard className="w-5 h-5" /></button>
          </form>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dq ? (isFetching ? 'Searching…' : `${found.length} found`) : found.length ? 'Sold most at this counter lately' : 'Scan or search to add items.'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2" data-testid="pos-results">
            {found.map(it => {
              const out = it.keepsStock && Number(it.stock) <= 0
              return (
                <button key={it.id} onClick={() => { add(it); setQ(''); focusSearch() }} className="text-left rounded-xl p-3 transition-colors"
                  style={{ border: `1px solid ${flash === it.id ? 'var(--gold)' : 'var(--border)'}`, background: flash === it.id ? 'var(--gold-muted)' : 'var(--bg-elevated)' }}
                  data-testid={`pos-item-${it.code}`}>
                  <p className="font-medium text-sm leading-snug line-clamp-2">{it.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{it.code}{it.schedule ? ` · Sch ${it.schedule}` : ''}</p>
                  <div className="flex items-end justify-between mt-2 gap-2">
                    <span className="font-semibold font-mono text-sm">{inr(it.priceWithGst)}</span>
                    {it.keepsStock && <span className="text-[11px]" style={{ color: out ? '#b91c1c' : 'var(--text-muted)' }}>{out ? 'Out of stock' : `${qty(it.stock)} ${it.unit ?? ''}`.trim()}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* the bill */}
        <section className="lg:col-span-2 card p-0 overflow-hidden flex flex-col" aria-label="The bill" style={{ minHeight: 420 }}>
          <button className="flex items-center justify-between gap-2 px-4 py-3 text-left" style={{ borderBottom: '1px solid var(--border)' }} onClick={() => setDialog('customer')} data-testid="pos-customer">
            <span className="flex items-center gap-2 min-w-0">
              {customer ? <User className="w-4 h-4 flex-shrink-0" aria-hidden /> : <Users className="w-4 h-4 flex-shrink-0" aria-hidden />}
              <span className="truncate"><span className="font-medium">{customer ? customer.name : 'Walk-in customer'}</span>
                {customer?.phone && <span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {customer.phone}</span>}</span>
            </span>
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--gold)' }}>{customer ? 'Change' : 'Add customer (F4)'}</span>
          </button>
          {customer && Number(customer.outstanding) > 0 && <p className="px-4 pt-2 text-xs" style={{ color: '#b45309' }}>Already owes {inr(customer.outstanding)}</p>}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }} data-testid="pos-cart">
            {lines.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}><Search className="w-6 h-6 mx-auto mb-2 opacity-60" aria-hidden />Scan or tap items to start a bill.</div>
            ) : lines.map((l, i) => {
              const each = l.price ?? Number(l.item.price)
              const withGst = r4(each * (1 + Number(l.item.gstRate) / 100))
              const short = l.item.keepsStock && l.quantity > Number(l.item.stock)
              return (
                <div key={l.key} className="px-4 py-2.5 space-y-1.5" data-testid={`pos-line-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="text-sm font-medium leading-snug">{l.item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{inr(withGst)} each · GST {Number(l.item.gstRate)}%{l.discountPct ? ` · ${l.discountPct}% off` : ''}</p></div>
                    <span className="font-mono text-sm font-semibold whitespace-nowrap">{ok ? inr(ok.lines[i]?.total) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center rounded-lg" style={{ border: '1px solid var(--border)' }}>
                      <button className="w-8 h-8 grid place-items-center" aria-label={`One less ${l.item.name}`} onClick={() => l.quantity > 1 ? setQty(l.key, l.quantity - 1) : remove(l.key)}><Minus className="w-3.5 h-3.5" /></button>
                      <input className="w-16 h-8 text-center font-mono text-sm bg-transparent" type="number" min="0" step="any" aria-label={`How many ${l.item.name}`}
                        value={l.quantity} onChange={e => { const v = Number(e.target.value); if (v > 0) setQty(l.key, v) }} />
                      <button className="w-8 h-8 grid place-items-center" aria-label={`One more ${l.item.name}`} onClick={() => setQty(l.key, l.quantity + 1)}><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    {admin && (
                      <>
                        <label className="sr-only" htmlFor={`price-${l.key}`}>Price with GST</label>
                        <input id={`price-${l.key}`} className="input h-8 w-24 font-mono text-xs" type="number" min="0" step="0.01" title="Price each, with GST (a manager's change)"
                          defaultValue={withGst.toFixed(2)} onBlur={e => {
                            const v = Number(e.target.value)
                            if (!(v >= 0) || r4(v) === withGst) return
                            const before = r4(v / (1 + Number(l.item.gstRate) / 100))
                            setLines(ls => ls.map(x => x.key === l.key ? { ...x, price: before } : x))
                          }} />
                        <label className="sr-only" htmlFor={`disc-${l.key}`}>Discount %</label>
                        <input id={`disc-${l.key}`} className="input h-8 w-20 font-mono text-xs" type="number" min="0" max="100" step="0.5" placeholder="% off" title="Discount on this line, % (a manager's change)"
                          defaultValue={l.discountPct || ''} onBlur={e => {
                            const v = Number(e.target.value || 0)
                            if (v < 0 || v > 100 || v === l.discountPct) return
                            setLines(ls => ls.map(x => x.key === l.key ? { ...x, discountPct: v } : x))
                          }} />
                      </>
                    )}
                    <button className="btn-icon w-8 h-8 ml-auto" aria-label={`Remove ${l.item.name}`} onClick={() => remove(l.key)}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {short && <p className="text-xs" style={{ color: '#b45309' }}>Only {qty(l.item.stock)} in {register.godown}.</p>}
                  {l.item.schedule && ['H1', 'X'].includes(l.item.schedule) && <p className="text-xs" style={{ color: '#b45309' }}>Schedule {l.item.schedule}: the prescription is asked for when paying.</p>}
                </div>
              )
            })}
          </div>
          {/* totals */}
          <div className="px-4 py-3 space-y-1 text-sm" style={{ borderTop: '1px solid var(--border)' }} data-testid="pos-totals">
            {admin && lines.length > 0 && (
              <div className="flex items-center justify-between gap-2 pb-1">
                <label htmlFor="pos-bill-discount" style={{ color: 'var(--text-muted)' }}>Discount on the bill (₹)</label>
                <input id="pos-bill-discount" className="input h-8 w-28 font-mono text-right" type="number" min="0" step="0.01" value={billDiscount}
                  onChange={e => setCart(c => ({ ...c, billDiscount: e.target.value }))} />
              </div>
            )}
            {totals && 'error' in totals && <p className="text-xs" role="alert" style={{ color: '#b91c1c' }}>{totals.error}</p>}
            {ok && (
              <>
                <Row k={`${qty(itemCount)} item${itemCount === 1 ? '' : 's'}, before GST`} v={inr(ok.taxable)} />
                {Number(ok.discount) > 0 && <Row k="Discount" v={`−${inr(ok.discount)}`} />}
                <Row k="GST" v={inr(ok.tax)} />
                {Number(ok.roundOff) !== 0 && <Row k="Round off" v={inr(ok.roundOff)} />}
              </>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold font-mono" data-testid="pos-total">{inr(ok?.total ?? 0)}</span>
            </div>
          </div>
          <div className="px-4 pb-4 grid grid-cols-3 gap-2">
            <button className="btn-secondary h-12" disabled={!lines.length || hold.isPending} onClick={() => hold.mutate()} data-testid="pos-hold">Hold (F8)</button>
            <button className="btn-primary h-12 col-span-2 text-base" disabled={!lines.length || quote.isPending} onClick={startPay} data-testid="pos-pay-open">
              {quote.isPending ? 'Working out…' : `Pay ${inr(ok?.total ?? 0)} (F9)`}
            </button>
            {lines.length > 0 && <button className="btn-ghost h-9 col-span-3 text-xs" onClick={() => { if (clearing) { setClearing(false); clear() } else { setClearing(true); setTimeout(() => setClearing(false), 3000) } }}
              data-testid="pos-clear">{clearing ? 'Tap again to clear the bill' : 'Clear the bill'}</button>}
          </div>
        </section>
      </div>

      {/* phones: the total and Pay always in reach */}
      {lines.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
          <span className="font-mono font-bold text-lg">{inr(ok?.total ?? 0)}</span>
          <button className="btn-primary h-11 flex-1 max-w-xs" disabled={quote.isPending} onClick={startPay}>Pay</button>
        </div>
      )}

      {paying && <PayModal quote={paying} named={!!customer} upi={state.upi} busy={sell.isPending} error={payError}
        onClose={() => { if (!sell.isPending) { setPaying(null); setPayError(null); focusSearch() } }}
        onPay={(payments, prescription) => sell.mutate({ payments, prescription })} />}
      {receipt && <ReceiptModal receipt={receipt} onClose={() => { setReceipt(null); focusSearch() }} />}
      {dialog === 'customer' && <CustomerPicker current={customer} onClose={() => { setDialog(null); focusSearch() }}
        onPick={c => { setCart(x => ({ ...x, customer: c })); setDialog(null); focusSearch() }} />}
      {dialog === 'held' && <HeldBills registerId={register.id} onRecall={recall} onClose={() => { setDialog(null); focusSearch() }} />}
      {dialog === 'bills' && <BillsList sessionId={session.id} onReceipt={r => { setDialog(null); setReceipt(r) }} onClose={() => { setDialog(null); focusSearch() }} />}
      {dialog === 'return' && <ReturnModal sessionId={session.id} onClose={() => { setDialog(null); focusSearch() }}
        onDone={r => { setDialog(null); setReceipt(r); qc.invalidateQueries({ queryKey: ['pos-state'] }); qc.invalidateQueries({ queryKey: ['pos-bills', session.id] }) }} />}
      {dialog === 'cash' && <CashModal sessionId={session.id} onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
      {dialog === 'close' && <CloseShiftModal sessionId={session.id} company={state.company} width={register.receiptWidth} onClose={() => setDialog(null)}
        onClosed={r => {
          setDialog(null)
          try { localStorage.removeItem(cartKey(register.id)) } catch { /* storage off */ }
          onClosed(r, register.receiptWidth)
        }} />}
      {dialog === 'camera' && <CameraScan onCode={onScan} onClose={() => { setDialog(null); focusSearch() }} />}
      {dialog === 'keys' && <KeysHelp onClose={() => { setDialog(null); focusSearch() }} />}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><span style={{ color: 'var(--text-muted)' }}>{k}</span><span className="font-mono">{v}</span></div>
}

function KeysHelp({ onClose }: { onClose: () => void }) {
  const keys: [string, string][] = [
    ['F2', 'Back to the search box'], ['Enter', 'Add the scanned or typed code'], ['3*code', 'Add three of an item'], ['F4', 'Choose the customer'],
    ['F6', 'Goods returned'], ['F8', 'Hold the bill'], ['F9 or Ctrl+Enter', 'Pay — and again to complete the bill'], ['Ctrl+P', 'Print the receipt (on the receipt)'],
    ['Esc', 'Close a window'],
  ]
  return (
    <Modal open onClose={onClose} title="Keyboard shortcuts" subtitle="A USB or Bluetooth barcode scanner types the code and presses Enter for you." size="sm">
      <div className="space-y-2">
        {keys.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-sm"><kbd className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--border)' }}>{k}</kbd><span className="text-right">{v}</span></div>)}
        <div className="flex justify-end pt-2"><button className="btn-secondary h-9" onClick={onClose} autoFocus>Close</button></div>
      </div>
    </Modal>
  )
}

export type { CartLine }
