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
import { Package } from 'lucide-react'
import { inventoryApi } from '@/lib/api/inventory'
import { useDebounce } from '@/lib/hooks'
import { inr } from '@/lib/money'
import { qty } from '@/lib/inventory'
import type { InventoryItem } from '@/types'

/** "45 PCS in stock", "Out of stock", "No stock kept" (services). */
export function stockLabel(it: Pick<InventoryItem, 'currentStock' | 'unit' | 'trackStock'>) {
  if (it.trackStock === false) return 'No stock kept'
  const n = Number(it.currentStock ?? 0)
  const unit = it.unit ? ` ${it.unit}` : ''
  if (n === 0) return 'Out of stock'
  if (n < 0) return `Stock below zero (${qty(n)}${unit})`
  return `${qty(n)}${unit} in stock`
}

/**
 * The description of a line, with suggestions from the item master as you type. Picking one
 * fills the line (HSN, unit, rate, GST) and links it to the item, so that issuing the document
 * moves the item's stock. Arrow keys and Enter work too.
 */
export function ItemPicker({ value, onChange, onPick, price, placeholder, label, inputClassName = 'input h-10' }: {
  value: string
  onChange: (v: string) => void
  onPick: (it: InventoryItem) => void
  /** Which price to show in the suggestions: sales documents show the selling price, purchases the purchase price. */
  price: 'selling' | 'purchase'
  placeholder?: string
  label?: string
  inputClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const q = useDebounce(value, 250)
  const listId = useId()
  const { data } = useQuery({ queryKey: ['item-search', q], queryFn: () => inventoryApi.items.list({ q, size: 6 }), enabled: open && q.trim().length >= 2 })
  const items = data?.content ?? []
  useEffect(() => setActive(-1), [q])
  const show = open && items.length > 0
  const pick = (it: InventoryItem) => { onPick(it); setOpen(false) }

  return (
    <div className="relative">
      <input className={inputClassName} value={value} placeholder={placeholder} maxLength={1000} aria-label={label}
        role="combobox" aria-expanded={show} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onKeyDown={e => {
          if (!show) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(-1, a - 1)) }
          else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(items[active]) }
          else if (e.key === 'Escape') setOpen(false)
        }} />
      {show && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)', minWidth: '260px' }}>
          {items.map((it, i) => {
            const p = price === 'selling' ? it.sellingPrice : it.purchasePrice
            const none = it.trackStock !== false && Number(it.currentStock ?? 0) <= 0
            return (
              <li key={it.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className="px-3 py-2 cursor-pointer"
                style={{ borderBottom: '1px solid var(--border)', background: i === active ? 'var(--bg-hover)' : undefined }}
                onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(it)}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm">{it.itemName}</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: none ? '#dc2626' : 'var(--text-muted)' }}>{stockLabel(it)}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {[it.itemCode, it.hsnSacCode && `${it.hsnSacCode.startsWith('99') ? 'SAC' : 'HSN'} ${it.hsnSacCode}`, p != null && inr(p), `GST ${it.gstRate ?? 0}%`].filter(Boolean).join(' · ')}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Shown under a line that is linked to an item: which item, and how much of it is in stock. On a
 * sale that will take stock out, it warns when the quantity is more than the records show (the
 * invoice can still be issued — stock records are often behind).
 */
export function LinkedItem({ itemId, quantity, selling, onUnlink }: {
  itemId: string
  quantity?: string | number
  /** A sale that will take stock out: warn about short stock. */
  selling?: boolean
  onUnlink: () => void
}) {
  const { data, isError } = useQuery({ queryKey: ['item', itemId], queryFn: () => inventoryApi.items.get(itemId), staleTime: 30_000, retry: false })
  const it = data && data.id ? data : undefined
  const need = Number(quantity)
  const short = !!selling && !!it && it.trackStock !== false && isFinite(need) && need > Number(it.currentStock ?? 0)
  return (
    <p className="text-xs mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: short || isError ? '#b45309' : 'var(--text-muted)' }} data-linked-item={itemId}>
      <Package size={12} aria-hidden />
      {isError ? 'The linked item no longer exists'
        : it ? <>{it.itemCode} · {short ? `Only ${qty(it.currentStock)} ${it.unit ?? ''} in stock`.trim() : stockLabel(it)}</>
        : 'Linked to an item'}
      <button type="button" className="underline" onClick={onUnlink} title="Keep the line but stop it moving this item's stock">unlink</button>
    </p>
  )
}

export type StockDirection = 'sale' | 'salesReturn' | 'purchase' | 'purchaseReturn'

const CHOICE: Record<StockDirection, string> = {
  sale: 'Take these items out of stock when the invoice is issued',
  salesReturn: 'The goods came back — put them back into stock',
  purchase: 'Add these items to stock when the bill is recorded',
  purchaseReturn: 'The goods went back to the supplier — take them out of stock',
}

/** The "update stock" choice on a document with lines linked to items. */
export function StockChoice({ direction, checked, onChange, linked }: {
  direction: StockDirection; checked: boolean; onChange: (v: boolean) => void
  /** How many lines are linked to items. */
  linked: number
}) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer mt-3" style={{ color: 'var(--text-secondary)' }}>
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>
        {CHOICE[direction]}
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {linked} {linked === 1 ? 'line is' : 'lines are'} linked to items</span>
      </span>
    </label>
  )
}
