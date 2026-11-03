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

import { useEffect, useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventory'
import { batchState, batchText, expiryText, qty, splitByBatch, normaliseBatch, parseExpiry, EXPIRY_HINT, priceWithGst, rateAtMrp } from '@/lib/inventory'
import { inr } from '@/lib/money'

/**
 * Under a sales line of an item kept by batch: which batch is billed. Left alone, the first to expire is
 * billed (worked out when the invoice is saved); an expired batch can't be chosen. When the line needs more
 * than its batch holds, it offers to split the line over the next batches to expire. On a credit note: the
 * batch the goods came back from. Shows nothing for an item that isn't kept by batch.
 */
export function BatchPicker({ itemId, value, onChange, kind, quantity, date, onSplit, taken, price, onRate }: {
  itemId: string
  /** the batch chosen; empty: the first to expire (a sale) or none (a return) */
  value?: string | null
  onChange: (batchId: string | undefined) => void
  kind: 'sale' | 'return'
  quantity?: string | number
  /** the document's date: what has expired is judged on it */
  date: string
  /** split the line: one part per batch, in this order */
  onSplit?: (parts: { batchId: string; quantity: number }[]) => void
  /** what the lines above take from each batch of this item: this line has what is left */
  taken?: Record<string, number>
  /** the line's rate, discount and GST, to compare its price with the batch's MRP */
  price?: { rate: string | number; discountPct?: string | number; gstRate: string | number }
  /** bill the line at the batch's MRP: the rate (before GST) that comes to it */
  onRate?: (rate: string) => void
}) {
  const { data: item } = useQuery({ queryKey: ['item', itemId], queryFn: () => inventoryApi.items.get(itemId), staleTime: 30_000, retry: false })
  const byBatch = !!item?.trackBatchNumbers
  const { data: stored } = useQuery({ queryKey: ['item-batches', itemId], queryFn: () => inventoryApi.items.batches(itemId), enabled: byBatch, staleTime: 15_000 })
  if (!byBatch || !stored) return null
  const unit = item?.unit ?? ''
  // what is left of each batch for this line, after the lines above
  const batches = kind === 'sale' && taken
    ? stored.map(b => ({ ...b, quantity: Math.round((Number(b.quantity) - (taken[b.id] ?? 0)) * 1000) / 1000 }))
    : stored
  const expired = (b: { expiryDate?: string | null }) => batchState(b.expiryDate, date) === 'EXPIRED'
  const sellable = batches.filter(b => Number(b.quantity) > 0 && !expired(b))
  const first = sellable[0] ?? null                       // the server lists them first to expire first
  const chosen = value ? batches.find(b => b.id === value) ?? null : null
  const billed = kind === 'sale' ? chosen ?? first : chosen
  const need = Number(quantity)
  const parts = kind === 'sale' && billed && isFinite(need) ? splitByBatch(batches, need, date, billed.id) : null
  const short = kind === 'sale' && !!billed && isFinite(need) && need > Number(billed.quantity)
  // a sale lists batches with stock (and the one already on the line); a return lists them all
  const options = kind === 'sale' ? batches.filter(b => Number(b.quantity) > 0 || b.id === value) : batches
  // the price with GST can't be more than the MRP printed on the batch (Legal Metrology: MRP includes all taxes)
  const mrp = billed?.mrp != null ? Number(billed.mrp) : null
  const each = price ? priceWithGst(price.rate, price.discountPct, price.gstRate) : NaN
  const aboveMrp = kind === 'sale' && mrp != null && mrp > 0 && isFinite(each) && each > mrp
  const atMrp = mrp != null && mrp > 0 && price ? rateAtMrp(mrp, price.gstRate) : null

  return (
    <div className="mt-1 text-xs flex items-center gap-1.5 flex-wrap" data-batch-picker={itemId}>
      <label style={{ color: 'var(--text-muted)' }}>
        <span className="sr-only">Batch </span>
        <select className="rounded-md px-1.5 py-0.5 text-xs" aria-label="Batch" value={value ?? ''}
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', color: chosen && expired(chosen) && kind === 'sale' ? '#dc2626' : 'var(--text-primary)', maxWidth: '100%' }}
          onChange={e => onChange(e.target.value || undefined)}>
          <option value="">{kind === 'sale'
            ? first ? `Batch: first to expire — ${batchText(first, unit)}` : 'Batch: none in stock that hasn\u2019t expired'
            : 'Batch: none (stock without a batch)'}</option>
          {options.map(b => (
            <option key={b.id} value={b.id} disabled={kind === 'sale' && expired(b)}>
              {batchText(b, unit)}{b.mrp != null ? ` · MRP ${inr(b.mrp)}` : ''}{expired(b) ? ' · expired' : ''}
            </option>
          ))}
        </select>
      </label>
      {kind === 'sale' && chosen && expired(chosen) && (
        <span style={{ color: '#dc2626' }}>Batch {chosen.batchNo} has expired (Exp. {expiryText(chosen.expiryDate)}) — it can&apos;t be billed.</span>
      )}
      {kind === 'sale' && !billed && batches.length > 0 && (
        <span style={{ color: '#b45309' }}>No batch in stock that hasn&apos;t expired — record the supplier&apos;s bill first, or the sale takes stock held without a batch.</span>
      )}
      {short && billed && (
        <span style={{ color: '#b45309' }}>
          Only {qty(billed.quantity)} {unit} left in batch {billed.batchNo}.
          {parts && onSplit && <> <button type="button" className="underline font-semibold" onClick={() => onSplit(parts)}>Split over {parts.length} batches</button></>}
        </span>
      )}
      {aboveMrp && (
        <span style={{ color: '#dc2626' }} data-above-mrp>
          {inr(each)} {unit ? `a ${unit}` : 'each'} with GST is above the MRP of batch {billed!.batchNo} ({inr(mrp!)}).
          {onRate && atMrp != null && <> <button type="button" className="underline font-semibold" onClick={() => onRate(atMrp.toFixed(2))}>Bill at the MRP</button></>}
        </span>
      )}
      {kind === 'return' && !chosen && (
        <span style={{ color: 'var(--text-muted)' }}>Choose the batch printed on the customer&apos;s bill, so it goes back into that batch.</span>
      )}
    </div>
  )
}

/**
 * Under a purchase line of an item kept by batch: the batch it brings in, with the expiry and MRP printed on
 * the pack — or, on a supplier credit note, the batch the goods go back from. Known batches are suggested; a
 * known batch's expiry is filled in for you, and a different one is pointed out (one batch has one expiry).
 * Tells the form whether the line's item is kept by batch. Shows nothing for an item that isn't.
 */
export function BatchEntry({ itemId, kept, batchNo, expiry, mrp, kind, onChange, onKeptByBatch }: {
  itemId: string
  /** what the form already knows (the item as picked), used until the item is read */
  kept?: boolean
  batchNo: string; expiry: string; mrp: string
  /** in: a bill brings the batch in; out: a supplier credit note sends it back */
  kind: 'in' | 'out'
  onChange: (patch: { batchNo?: string; expiry?: string; mrp?: string }) => void
  onKeptByBatch: (yes: boolean) => void
}) {
  const { data: item } = useQuery({ queryKey: ['item', itemId], queryFn: () => inventoryApi.items.get(itemId), staleTime: 30_000, retry: false })
  const byBatch = item ? !!item.trackBatchNumbers : !!kept
  useEffect(() => { if (item) onKeptByBatch(!!item.trackBatchNumbers) }, [item?.id, item?.trackBatchNumbers]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data: batches } = useQuery({ queryKey: ['item-batches', itemId], queryFn: () => inventoryApi.items.batches(itemId), enabled: byBatch, staleTime: 15_000 })
  const listId = useId()
  if (!byBatch) return null
  const known = (batches ?? []).find(b => b.batchNo === normaliseBatch(batchNo))
  const parsed = parseExpiry(expiry)
  const clash = kind === 'in' && known?.expiryDate && parsed && parsed !== known.expiryDate
  const missing = kind === 'out' && normaliseBatch(batchNo) && batches && !known
  const tag = { color: 'var(--text-muted)' }
  return (
    <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap text-xs" data-batch-entry={itemId}>
      <label className="flex items-center gap-1.5"><span style={tag}>{kind === 'in' ? 'Batch in' : 'Batch going back'}</span>
        <input className="input h-8 text-xs font-mono uppercase" style={{ width: '8.5rem' }} aria-label="Batch number" placeholder="As on the pack" maxLength={40}
          list={listId} value={batchNo} onChange={e => {
            const no = e.target.value
            const k = (batches ?? []).find(b => b.batchNo === normaliseBatch(no))
            // a batch already held: its expiry and MRP as recorded, unless typed already
            onChange({ batchNo: no, ...(k && !expiry && k.expiryDate ? { expiry: expiryText(k.expiryDate) } : {}), ...(k && !mrp && k.mrp != null ? { mrp: String(k.mrp) } : {}) })
          }} /></label>
      <datalist id={listId}>{(batches ?? []).map(b => <option key={b.id} value={b.batchNo}>{batchText(b, item?.unit)}</option>)}</datalist>
      {kind === 'in' && <>
        <label className="flex items-center gap-1.5"><span style={tag}>Expiry</span>
          <input className="input h-8 text-xs font-mono" style={{ width: '6.5rem' }} aria-label="Expiry" placeholder="MM/YYYY" maxLength={10}
            value={expiry} onChange={e => onChange({ expiry: e.target.value })} /></label>
        <label className="flex items-center gap-1.5"><span style={tag}>MRP ₹</span>
          <input className="input h-8 text-xs" style={{ width: '5.5rem' }} aria-label="MRP" placeholder="On the pack" inputMode="decimal"
            value={mrp} onChange={e => onChange({ mrp: e.target.value })} /></label>
      </>}
      {parsed === undefined && <span style={{ color: '#dc2626' }}>{EXPIRY_HINT}</span>}
      {clash && <span style={{ color: '#dc2626' }}>Batch {known!.batchNo} expires {expiryText(known!.expiryDate)} in your records.</span>}
      {missing && <span style={{ color: '#dc2626' }}>There is no batch {normaliseBatch(batchNo)} of this item.</span>}
      {!batchNo.trim() && <span style={{ color: 'var(--text-muted)' }}>{kind === 'in' ? 'Kept by batch: the batch number and expiry on the pack' : 'Kept by batch: the batch going back'}</span>}
    </div>
  )
}
