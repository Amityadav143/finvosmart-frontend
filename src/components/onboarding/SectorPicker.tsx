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

import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import type { Sector } from '@/lib/api/sectors'

/**
 * Choosing the business's sectors: a search box over the list (names and the words people use — "clinic" finds
 * Healthcare), one or several ticked (up to six), shown as chips that can be taken off again, and "Other" with
 * the business's own words.
 */
export function SectorPicker({ catalog, value, other, onChange, onOther, max = 6 }: {
  catalog: Sector[]
  value: string[]
  other: string
  onChange: (codes: string[]) => void
  onOther: (text: string) => void
  max?: number
}) {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return catalog
    return catalog.filter(s => s.label.toLowerCase().includes(t) || s.keywords.toLowerCase().split(' ').some(k => k.startsWith(t) || t.includes(k)))
  }, [catalog, q])
  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter(c => c !== code))
    else if (value.length < max) onChange([...value, code])
  }
  const label = (code: string) => catalog.find(s => s.code === code)?.label ?? code
  return (
    <div className="space-y-3" data-testid="sector-picker">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Chosen sectors">
          {value.map(code => (
            <span key={code} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium" data-chip={code}
              style={{ background: 'var(--gold-muted)', border: '1px solid var(--gold)', color: 'var(--text-primary)' }}>
              {code === 'OTHER' && other.trim() ? `Other: ${other.trim()}` : label(code)}
              <button type="button" aria-label={`Remove ${label(code)}`} onClick={() => toggle(code)} className="ml-0.5"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      <label className="relative block">
        <span className="sr-only">Search sectors</span>
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden />
        <input className="input h-10 pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Search — e.g. clinic, factory, software, transport"
          data-testid="sector-search" />
      </label>
      <div role="listbox" aria-multiselectable="true" aria-label="Business sectors" className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {shown.map(s => {
          const on = value.includes(s.code)
          const full = !on && value.length >= max
          return (
            <button key={s.code} type="button" role="option" aria-selected={on} disabled={full} onClick={() => toggle(s.code)} data-sector={s.code}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
              style={{ border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'var(--gold-muted)' : 'var(--bg-surface)',
                opacity: full ? 0.5 : 1, color: 'var(--text-primary)' }}>
              <span className="flex h-4 w-4 items-center justify-center rounded" aria-hidden
                style={{ border: `1px solid ${on ? 'var(--gold)' : 'var(--border-strong)'}`, background: on ? 'var(--gold)' : 'transparent' }}>
                {on && <Check size={11} color="#1a1208" />}
              </span>
              {s.label}
            </button>
          )
        })}
        {shown.length === 0 && <p className="text-sm sm:col-span-2" style={{ color: 'var(--text-muted)' }}>No sector matches — choose “Other” and say what you do.</p>}
      </div>
      {value.includes('OTHER') && (
        <div>
          <label className="label label-required" htmlFor="sector-other">What does your business do?</label>
          <input id="sector-other" className="input h-10" maxLength={100} value={other} onChange={e => onOther(e.target.value)} placeholder="e.g. Printing press" />
        </div>
      )}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose up to {max}. You can change them any time under Settings → Company.</p>
    </div>
  )
}
