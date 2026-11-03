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
import type { InventoryItem, MovementType } from '@/types'
import { todayInIndia } from '@/lib/dueDates'

/** GST unit codes (UQC) used on invoices and in GSTR-1's HSN summary. */
export const UNITS: { value: string; label: string }[] = [
  { value: 'NOS', label: 'NOS — numbers' }, { value: 'PCS', label: 'PCS — pieces' }, { value: 'KGS', label: 'KGS — kilograms' },
  { value: 'GMS', label: 'GMS — grams' }, { value: 'MTS', label: 'MTS — tonnes' }, { value: 'QTL', label: 'QTL — quintals' },
  { value: 'LTR', label: 'LTR — litres' }, { value: 'MLT', label: 'MLT — millilitres' }, { value: 'MTR', label: 'MTR — metres' },
  { value: 'CMS', label: 'CMS — centimetres' }, { value: 'SQF', label: 'SQF — square feet' }, { value: 'SQM', label: 'SQM — square metres' }, { value: 'CBM', label: 'CBM — cubic metres' },
  { value: 'BOX', label: 'BOX — boxes' }, { value: 'PAC', label: 'PAC — packs' }, { value: 'SET', label: 'SET — sets' },
  { value: 'PRS', label: 'PRS — pairs' }, { value: 'DOZ', label: 'DOZ — dozens' }, { value: 'BAG', label: 'BAG — bags' },
  { value: 'BTL', label: 'BTL — bottles' }, { value: 'CAN', label: 'CAN — cans' }, { value: 'CTN', label: 'CTN — cartons' },
  { value: 'ROL', label: 'ROL — rolls' }, { value: 'BDL', label: 'BDL — bundles' }, { value: 'TBS', label: 'TBS — tablets' },
  { value: 'HRS', label: 'HRS — hours (services)' }, { value: 'OTH', label: 'OTH — others' },
]

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  IN: 'Stock in', OUT: 'Stock out', ADJUSTMENT: 'Adjustment', OPENING: 'Opening stock', TRANSFER_IN: 'Transfer in', TRANSFER_OUT: 'Transfer out',
}

/** "12.5" → "12.5", 3 → "3" — quantities without trailing zeros, Indian grouping. */
export const qty = (x: unknown) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(x ?? 0))

/**
 * How much to order of an item at or below its reorder level: enough to bring it to twice the
 * reorder level, and at least its minimum order quantity — in whole units, never less than one.
 */
export function reorderQty(it: Pick<InventoryItem, 'currentStock' | 'reorderLevel' | 'minOrderQty'>) {
  const stock = Number(it.currentStock ?? 0), level = Number(it.reorderLevel ?? 0), min = Number(it.minOrderQty ?? 0)
  return Math.max(1, Math.ceil(Math.max(min, 2 * level - stock)))
}

// ── batches and expiry (as the server's BatchRules) ─────────────────────────

/** Batches expiring within this many days are flagged. */
export const EXPIRING_DAYS = 90

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const monthEnd = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate()
const validDay = (y: number, m: number, d: number) => m >= 1 && m <= 12 && d >= 1 && d <= monthEnd(y, m)

/**
 * An expiry as people write it — "03/2028", "3/28" or "2028-03" (a month: its last day), "31-03-2028" or
 * "2028-03-31" (a day) — as yyyy-mm-dd. null for a blank; undefined when it can't be read.
 */
export function parseExpiry(text: string | null | undefined): string | null | undefined {
  const s = (text ?? '').trim()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) { const [y, mo, d] = [+m[1], +m[2], +m[3]]; return validDay(y, mo, d) ? iso(y, mo, d) : undefined }
  m = s.match(/^(\d{4})-(\d{2})$/)
  if (m) { const [y, mo] = [+m[1], +m[2]]; return mo >= 1 && mo <= 12 ? iso(y, mo, monthEnd(y, mo)) : undefined }
  m = s.match(/^(\d{1,2})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{4})$/)
  if (m) { const [d, mo, y] = [+m[1], +m[2], +m[3]]; return validDay(y, mo, d) ? iso(y, mo, d) : undefined }
  m = s.match(/^(\d{1,2})\s*[/\-.]\s*(\d{2}|\d{4})$/)
  if (m) {
    const mo = +m[1], y = m[2].length === 2 ? 2000 + +m[2] : +m[2]
    return mo >= 1 && mo <= 12 ? iso(y, mo, monthEnd(y, mo)) : undefined
  }
  return undefined
}

export const EXPIRY_HINT = 'Write the expiry as on the pack, for example 03/2028 or 31-03-2028.'

/** "03/2028" for the end of a month (as packs print it), else "15-03-2028". */
export function expiryText(date: string | null | undefined): string {
  if (!date) return ''
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return date
  return d === monthEnd(y, m) ? `${String(m).padStart(2, '0')}/${y}` : `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`
}

/** A batch number as kept: trimmed, in capitals, inner spaces made single. */
export const normaliseBatch = (s: string | null | undefined) => (s ?? '').trim().replace(/\s+/g, ' ').toUpperCase()

/** What is wrong with a batch number, or null: up to 40 letters, digits, spaces and - / . (starting with a letter or digit). */
export function batchNoProblem(s: string | null | undefined): string | null {
  const b = normaliseBatch(s)
  if (!b) return 'Enter the batch number.'
  return /^[A-Z0-9][A-Z0-9/.\- ]{0,39}$/.test(b) ? null : 'A batch number has up to 40 letters, digits, spaces and - / .'
}

/** Expired the day after its expiry date; expiring within the days given of today. */
export function batchState(expiry: string | null | undefined, today = todayInIndia(), days = EXPIRING_DAYS): 'EXPIRED' | 'EXPIRING' | 'OK' | 'NO_EXPIRY' {
  if (!expiry) return 'NO_EXPIRY'
  if (expiry < today) return 'EXPIRED'
  const until = new Date(Date.parse(today + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10)
  return expiry <= until ? 'EXPIRING' : 'OK'
}

/** How a batch reads in a list: "B12 · Exp. 03/2028 · 40 left". */
export function batchText(b: { batchNo: string; expiryDate?: string | null; quantity?: number | null }, unit?: string) {
  return [b.batchNo, b.expiryDate ? `Exp. ${expiryText(b.expiryDate)}` : 'no expiry',
    b.quantity != null ? `${qty(b.quantity)}${unit ? ` ${unit}` : ''} left` : ''].filter(Boolean).join(' · ')
}

/**
 * A sale of more than the chosen batch holds, spread over the batches billed first (first expiry, never an
 * expired one): [{ batchId, quantity }], the last taking what is left over. Null when one batch is enough or
 * there is nothing else to take from.
 */
export function splitByBatch(batches: { id: string; batchNo: string; expiryDate?: string | null; quantity: number }[], need: number,
                             date: string, firstId?: string | null): { batchId: string; quantity: number }[] | null {
  if (!(need > 0)) return null
  const sellable = batches.filter(b => Number(b.quantity) > 0 && !(b.expiryDate && b.expiryDate < date))
    .sort((a, b) => (a.expiryDate ?? '9999') .localeCompare(b.expiryDate ?? '9999') || a.batchNo.localeCompare(b.batchNo))
  // the batch chosen for the line goes first, the rest by expiry
  const order = firstId ? [...sellable.filter(b => b.id === firstId), ...sellable.filter(b => b.id !== firstId)] : sellable
  if (order.length < 2 || Number(order[0].quantity) >= need) return null
  const out: { batchId: string; quantity: number }[] = []
  let left = need
  for (const b of order) {
    if (left <= 0) break
    const take = Math.min(left, Number(b.quantity))
    out.push({ batchId: b.id, quantity: Math.round(take * 1000) / 1000 })
    left = Math.round((left - take) * 1000) / 1000
  }
  if (left > 0) out[out.length - 1].quantity = Math.round((out[out.length - 1].quantity + left) * 1000) / 1000
  return out.length > 1 ? out : null
}

/**
 * Which batch each line of a sale takes, in order, as the server works it out: the one chosen, else the first to
 * expire with stock left after the lines before it (never an expired one). For each line, by its key: the batch,
 * and what the lines before it take from each batch.
 */
export function allocateBatches(lines: { key: string; itemId?: string; batchId?: string | null; quantity: string | number }[],
                                batchesByItem: Record<string, { id: string; batchNo: string; expiryDate?: string | null; quantity: number }[]>,
                                date: string): Record<string, { batchId: string | null; takenBefore: Record<string, number> }> {
  const taken: Record<string, number> = {}
  const out: Record<string, { batchId: string | null; takenBefore: Record<string, number> }> = {}
  for (const l of lines) {
    const batches = l.itemId ? batchesByItem[l.itemId] : undefined
    if (!batches) continue
    const before = { ...taken }
    let id: string | null = l.batchId ?? null
    if (!id) {
      const first = batches.filter(b => Number(b.quantity) - (taken[b.id] ?? 0) > 0 && !(b.expiryDate && b.expiryDate < date))
        .sort((a, b) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999') || a.batchNo.localeCompare(b.batchNo))[0]
      id = first?.id ?? null
    }
    out[l.key] = { batchId: id, takenBefore: before }
    const q = Number(l.quantity)
    if (id && isFinite(q) && q > 0) taken[id] = Math.round(((taken[id] ?? 0) + q) * 1000) / 1000
  }
  return out
}

/** The price with GST of one unit at a rate, after the line's discount, to the paisa. */
export function priceWithGst(rate: string | number, discountPct: string | number | undefined, gstRate: string | number) {
  const r = Number(rate), d = Number(discountPct || 0), g = Number(gstRate || 0)
  if (!isFinite(r) || !isFinite(d) || !isFinite(g)) return NaN
  return Math.round(r * (1 - d / 100) * (1 + g / 100) * 100) / 100
}

/** The rate (before GST) that bills a unit at its MRP, which includes GST: rounded down, so it never goes above. */
export function rateAtMrp(mrp: number, gstRate: string | number) {
  const g = Number(gstRate || 0)
  return Math.floor((mrp / (1 + g / 100)) * 100) / 100
}
