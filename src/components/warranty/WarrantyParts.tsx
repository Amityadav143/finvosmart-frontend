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

import { useId, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { useDebounce } from '@/lib/hooks'
import { godownsApi } from '@/lib/api/store'

const TONES: Record<string, [string, string]> = {
  OPEN: ['#b45309', 'rgba(245,158,11,0.14)'], APPROVED: ['#1d4ed8', 'rgba(37,99,235,0.12)'], REJECTED: ['#b91c1c', 'rgba(220,38,38,0.10)'],
  RESOLVED: ['#15803d', 'rgba(22,163,74,0.12)'], SENT: ['#7c3aed', 'rgba(124,58,237,0.12)'], ACCEPTED: ['#1d4ed8', 'rgba(37,99,235,0.12)'],
  SETTLED: ['#15803d', 'rgba(22,163,74,0.12)'], CLOSED: ['#475569', 'rgba(71,85,105,0.12)'], CANCELLED: ['#475569', 'rgba(71,85,105,0.12)'],
}

/** A claim's status as a small coloured word. */
export function ClaimChip({ status, label }: { status: string; label: string }) {
  const [c, bg] = TONES[status] ?? ['var(--text-muted)', 'rgba(0,0,0,0.05)']
  return <span className="badge" style={{ color: c, background: bg }} data-testid="claim-status">{label}</span>
}

/** Where a claim stands against the warranty: in it, out of it, or not known — with its words. */
export function Coverage({ inWarranty, text }: { inWarranty?: boolean | null; text?: string | null }) {
  const [Icon, color] = inWarranty === true ? [ShieldCheck, '#15803d'] : inWarranty === false ? [ShieldAlert, '#b91c1c'] : [ShieldQuestion, '#b45309']
  return <span className="inline-flex items-center gap-1.5 text-sm" style={{ color }} data-testid="claim-coverage"><Icon className="w-4 h-4 shrink-0" aria-hidden />{text}</span>
}

/**
 * A search box that finds something as you type (customers, suppliers, items, invoices, receipts) and shows the one
 * chosen with a way to change it.
 */
export function SearchPicker<T extends { id: string }>({ label, chosen, onChange, search, title, sub, placeholder, testId, required, queryKey }: {
  label: string; chosen: T | null; onChange: (v: T | null) => void; search: (q: string) => Promise<T[]>
  title: (t: T) => string; sub?: (t: T) => string | null | undefined; placeholder?: string; testId?: string; required?: boolean; queryKey: string
}) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const q = useDebounce(text, 250)
  const id = useId()
  const { data = [], isFetching } = useQuery({ queryKey: ['warranty-search', queryKey, q], queryFn: () => search(q.trim()), enabled: open && !chosen })
  if (chosen) return (
    <div>
      <span className={`label ${required ? 'label-required' : ''}`}>{label}</span>
      <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid={testId ? `${testId}-chosen` : undefined}>
        <span className="min-w-0"><span className="block text-sm font-medium truncate">{title(chosen)}</span>
          {sub?.(chosen) && <span className="block text-xs truncate" style={{ color: 'var(--text-muted)' }}>{sub(chosen)}</span>}</span>
        <button type="button" className="btn-ghost h-8 text-xs" onClick={() => { onChange(null); setText('') }}>Change</button>
      </div>
    </div>
  )
  return (
    <div className="relative">
      <label className={`label ${required ? 'label-required' : ''}`} htmlFor={id}>{label}</label>
      <input id={id} className="input h-10" value={text} placeholder={placeholder} autoComplete="off" data-testid={testId}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={e => { setText(e.target.value); setOpen(true) }} />
      {open && (
        <ul className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden" role="listbox"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
          {data.length === 0
            ? <li className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{isFetching ? 'Looking…' : q.trim() ? 'Nothing found.' : 'Type to search.'}</li>
            : data.map(t => (
              <li key={t.id} role="option" aria-selected={false} className="px-3 py-2 cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}
                onMouseDown={e => e.preventDefault()} onClick={() => { onChange(t); setOpen(false) }} data-testid={testId ? `${testId}-option` : undefined}>
                <span className="block text-sm">{title(t)}</span>
                {sub?.(t) && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{sub(t)}</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

/** The godowns stock can move in (the main one first); the main one is the default. */
export function GodownSelect({ value, onChange, label, testId }: { value: string; onChange: (id: string) => void; label: string; testId?: string }) {
  const { data: godowns = [] } = useQuery({ queryKey: ['godowns'], queryFn: godownsApi.list, staleTime: 60_000, retry: false })
  const open = godowns.filter(g => g.active)
  const id = useId()
  if (open.length <= 1) return null
  return (
    <div><label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="input h-10" value={value || (open.find(g => g.main)?.id ?? '')} onChange={e => onChange(e.target.value)} data-testid={testId}>
        {open.map(g => <option key={g.id} value={g.id}>{g.name}{g.main ? ' (main)' : ''}</option>)}
      </select></div>
  )
}

export const KIND_LABEL = { CUSTOMER: 'From customers', SUPPLIER: 'On suppliers' } as const
