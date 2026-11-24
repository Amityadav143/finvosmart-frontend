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

import { useEffect, useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { godownsApi } from '@/lib/api/store'
import { useDebounce } from '@/lib/hooks'
import { qty } from '@/lib/inventory'
import type { DocLine, GodownStockRow } from '@/types/store'

/** A line being written on a transfer, a request or an issue: the item, optionally its batch, and how many. */
export interface DraftLine { key: string; itemId: string; itemCode: string; itemName: string; unit?: string | null; batches: boolean; batchId: string; quantity: string; requestLineId?: string; inSource?: number | null }

let seq = 0
export const draftKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

export const fmtDate = (d?: string | null) => !d ? '' : new Date(d.length === 10 ? d + 'T00:00:00+05:30' : d)
  .toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Finds an item for a line by name or code, with the stock in each godown (anyone who may ask for material may
 * search; prices are not shown). Enter takes the item whose code was typed or scanned, or the only one found.
 */
export function GodownItemPicker({ onPick, godownId, placeholder = 'Item name or code' }: {
  onPick: (row: GodownStockRow) => void; godownId?: string | null; placeholder?: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const dq = useDebounce(q.trim(), 250)
  const listId = useId()
  const { data, isFetching } = useQuery({ queryKey: ['godown-item-search', dq], queryFn: () => godownsApi.stock({ q: dq, size: 8 }), enabled: dq.length >= 2 })
  const rows = data?.rows ?? []
  useEffect(() => setActive(-1), [dq])
  const pick = (r: GodownStockRow) => { onPick(r); setQ(''); setOpen(false) }
  const enter = async () => {
    if (active >= 0 && rows[active]) return pick(rows[active])
    const typed = q.trim()
    if (!typed) return
    const list = dq === typed ? rows : (await godownsApi.stock({ q: typed, size: 8 }).catch(() => null))?.rows ?? []
    const exact = list.find(r => r.itemCode.toLowerCase() === typed.toLowerCase())
    if (exact) pick(exact)
    else if (list.length === 1) pick(list[0])
  }
  return (
    <div className="relative">
      <input className="input h-10" placeholder={placeholder} value={q} role="combobox" aria-expanded={open && rows.length > 0} aria-controls={listId}
        aria-label="Find an item" onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, rows.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)) }
          else if (e.key === 'Enter') { e.preventDefault(); enter() }
        }} />
      {open && dq.length >= 2 && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden max-h-72 overflow-y-auto"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
          {rows.length === 0 ? <li className="px-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>{isFetching ? 'Searching…' : 'No stock item matches.'}</li>
            : rows.map((r, i) => {
              const here = godownId ? Number(r.byGodown[godownId] ?? 0) : Number(r.total)
              return (
                <li key={r.itemId} role="option" aria-selected={i === active}>
                  <button type="button" className="w-full text-left px-3 py-2 flex justify-between gap-3 text-sm" style={{ background: i === active ? 'var(--gold-muted)' : undefined }}
                    onMouseDown={e => { e.preventDefault(); pick(r) }}>
                    <span><span className="font-medium">{r.itemName}</span> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.itemCode}</span></span>
                    <span className="text-xs whitespace-nowrap" style={{ color: here > 0 ? 'var(--text-muted)' : '#b91c1c' }}>{qty(here)} {r.unit ?? ''}{godownId ? ' here' : ' in all'}</span>
                  </button>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}

/** The batches of an item in one godown, to choose one — or leave it to the first to expire. */
export function GodownBatchSelect({ itemId, godownId, value, onChange }: { itemId: string; godownId: string; value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({ queryKey: ['godown-item', itemId], queryFn: () => godownsApi.item(itemId), staleTime: 15_000 })
  const lots = (data?.places ?? []).filter(p => p.godownId === godownId && p.batchId && Number(p.quantity) > 0)
  return (
    <select className="input h-9 text-xs" aria-label="Batch" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">First to expire</option>
      {lots.map(l => <option key={l.batchId!} value={l.batchId!}>{l.batchNo}{l.expiry ? ` · exp ${fmtDate(l.expiry)}` : ''} · {qty(l.quantity)}</option>)}
    </select>
  )
}

/** The lines of a transfer, request or issue being written. */
export function DraftLines({ lines, onChange, godownId, batches = true, showStock = true }: {
  lines: DraftLine[]; onChange: (ls: DraftLine[]) => void; godownId?: string | null; batches?: boolean; showStock?: boolean
}) {
  const set = (key: string, patch: Partial<DraftLine>) => onChange(lines.map(l => l.key === key ? { ...l, ...patch } : l))
  const add = (r: GodownStockRow) => {
    const have = lines.find(l => l.itemId === r.itemId && !l.batchId)
    if (have) { set(have.key, { quantity: String(Number(have.quantity || 0) + 1) }); return }
    onChange([...lines, { key: draftKey(), itemId: r.itemId, itemCode: r.itemCode, itemName: r.itemName, unit: r.unit, batches: r.batches, batchId: '', quantity: '1',
      inSource: godownId ? Number(r.byGodown[godownId] ?? 0) : null }])
  }
  return (
    <div className="space-y-2">
      <GodownItemPicker onPick={add} godownId={godownId} placeholder="Add an item: name, code or scan" />
      {lines.length > 0 && (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead><tr>{['Item', ...(batches ? ['Batch'] : []), 'Quantity', ...(showStock && godownId ? ['There'] : []), ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.key} className="table-row">
                  <td className="table-cell"><span className="font-medium">{l.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.itemCode}</span></td>
                  {batches && <td className="table-cell">{l.batches && godownId ? <GodownBatchSelect itemId={l.itemId} godownId={godownId} value={l.batchId} onChange={v => set(l.key, { batchId: v })} /> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}</td>}
                  <td className="table-cell"><input className="input h-9 w-28 font-mono" type="number" min="0" step="any" aria-label={`How many ${l.itemName}`} value={l.quantity}
                    onChange={e => set(l.key, { quantity: e.target.value })} /> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.unit ?? ''}</span></td>
                  {showStock && godownId && <td className="table-cell text-xs font-mono" style={{ color: l.inSource != null && Number(l.quantity) > l.inSource ? '#b91c1c' : 'var(--text-muted)' }}>{l.inSource != null ? qty(l.inSource) : ''}</td>}
                  <td className="table-cell"><button type="button" className="btn-icon w-8 h-8" aria-label={`Remove ${l.itemName}`} onClick={() => onChange(lines.filter(x => x.key !== l.key))}><Trash2 className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/** Lines as the server takes them; a problem in words when one isn't right. */
export function linesOut(lines: DraftLine[]): { lines: { itemId: string; batchId: string | null; quantity: number; requestLineId?: string | null }[]; problem: string | null } {
  if (!lines.length) return { lines: [], problem: 'Add at least one item.' }
  for (const l of lines) if (!(Number(l.quantity) > 0)) return { lines: [], problem: `Enter how many ${l.itemName}.` }
  return { lines: lines.map(l => ({ itemId: l.itemId, batchId: l.batchId || null, quantity: Number(l.quantity), requestLineId: l.requestLineId ?? null })), problem: null }
}

/** A document's lines to read: item, batch, quantity (and value, for those who may see it). */
export function DocLinesTable({ lines, value = false }: { lines: DocLine[]; value?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead><tr>{['Item', 'HSN', 'Batch', 'Quantity', ...(value ? ['Value'] : [])].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="table-row">
              <td className="table-cell"><span className="font-medium">{l.itemName}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{l.itemCode}</span></td>
              <td className="table-cell text-xs">{l.hsn ?? ''}</td>
              <td className="table-cell text-xs">{l.batchNo ? `${l.batchNo}${l.expiry ? ` · exp ${fmtDate(l.expiry)}` : ''}` : '—'}</td>
              <td className="table-cell font-mono">{qty(l.quantity)} {l.unit ?? ''}</td>
              {value && <td className="table-cell font-mono">{l.value != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(l.value)) : ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The status of a godown document as a small coloured word. */
export function DocStatus({ status, label }: { status: string; label?: string }) {
  const tone: Record<string, [string, string]> = {
    DONE: ['#15803d', 'rgba(22,163,74,0.12)'], POSTED: ['#15803d', 'rgba(22,163,74,0.12)'], ISSUED: ['#15803d', 'rgba(22,163,74,0.12)'],
    CLOSED: ['#475569', 'rgba(71,85,105,0.12)'], CANCELLED: ['#b91c1c', 'rgba(220,38,38,0.10)'], REJECTED: ['#b91c1c', 'rgba(220,38,38,0.10)'],
    SUBMITTED: ['#b45309', 'rgba(245,158,11,0.14)'], OPEN: ['#b45309', 'rgba(245,158,11,0.14)'], APPROVED: ['#1d4ed8', 'rgba(37,99,235,0.12)'],
    PARTLY_ISSUED: ['#7c3aed', 'rgba(124,58,237,0.12)'],
  }
  const [c, bg] = tone[status] ?? ['var(--text-muted)', 'rgba(0,0,0,0.05)']
  const words: Record<string, string> = { DONE: 'Done', POSTED: 'Posted', CANCELLED: 'Cancelled', OPEN: 'Open', CLOSED: 'Closed' }
  return <span className="badge" style={{ color: c, background: bg }}>{label ?? words[status] ?? status}</span>
}
