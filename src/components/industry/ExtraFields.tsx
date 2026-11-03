'use client'
/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { extraFieldsApi } from '@/lib/api/industry'
import { apiError } from '@/lib/apiError'
import type { EntityType, ExtraFieldDef } from '@/types/industry'

/**
 * The extra fields of a customer, item, project or supplier — the ones the company's sector template
 * added (or an admin added by hand) — and what is typed into them. The record is saved first, then
 * these with its id (save), so a new record gets them too.
 */
export function useExtraFields(type: EntityType, id?: string | null) {
  const qc = useQueryClient()
  const defs = useQuery({ queryKey: ['extra-fields', type], queryFn: () => extraFieldsApi.fields(type), staleTime: 60_000, retry: false })
  const stored = useQuery({ queryKey: ['extra-values', type, id ?? ''], queryFn: () => extraFieldsApi.get(type, id!), enabled: !!id, retry: false })
  const [values, setValues] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState(false)
  // only a well-formed answer counts: an older server (or a stand-in) may answer with a list or nothing,
  // and a list's own .values() must never be taken for the record's values
  useEffect(() => { setValues(id ? plainValues(stored.data) : {}); setTouched(false) }, [id, stored.data])

  const fields: ExtraFieldDef[] = Array.isArray(defs.data) ? defs.data : []
  const set = (key: string, value: string) => { setValues(v => ({ ...v, [key]: value })); setTouched(true) }

  /** What is wrong with what was typed, in words — the same rules as the server (CustomValueRules). */
  const problem = (): string | null => {
    for (const f of fields) {
      const v = (values[f.key] ?? '').trim()
      if (!v) { if (f.required) return `${f.label} is required.`; continue }
      if (f.type === 'NUMBER' && !NUMBER.test(v.replace(/[,₹\s\u00A0]/g, ''))) return `${f.label} must be a number.`
      if (f.type === 'DATE' && !isDate(v)) return `${f.label} must be a date.`
      if (f.type === 'TEXT' && v.length > 500) return `${f.label} is longer than 500 characters.`
      if (f.type === 'TEXTAREA' && v.length > 2000) return `${f.label} is longer than 2000 characters.`
      // the whole value must match, as on the server (a pattern without ^ and $ would otherwise match a part)
      if (f.type === 'TEXT' && f.pattern) { try { if (!new RegExp(`^(?:${f.pattern})$`).test(v)) return `${f.label} isn't in the expected form.` } catch { /* the server decides */ } }
    }
    return null
  }

  /** Saves the values for this record. Returns null when saved (or nothing to save), else what went wrong. */
  const save = async (entityId: string): Promise<string | null> => {
    if (!fields.length || (!touched && !!id)) return null
    const body: Record<string, string> = {}
    for (const f of fields) body[f.key] = (values[f.key] ?? '').trim()
    try {
      const saved = await extraFieldsApi.save(type, entityId, body)
      qc.setQueryData(['extra-values', type, entityId], saved)
      setTouched(false)
      return null
    } catch (e) {
      return apiError(e, 'The extra details could not be saved.')
    }
  }

  return { type, fields, values, set, problem, save, loading: defs.isLoading || (!!id && stored.isLoading) }
}

/** A number as the server takes it (CustomValueRules.NUMBER), once grouping commas, ₹ and spaces are taken out. */
const NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/
/** A real calendar date written yyyy-mm-dd (31 February isn't one). */
function isDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const d = new Date(`${v}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v
}

/** The record's values from the server's answer, or none when the answer isn't one. */
function plainValues(d: unknown): Record<string, string> {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {}
  const v = (d as { values?: unknown }).values
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
  const out: Record<string, string> = {}
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (typeof x === 'string') out[k] = x
  return out
}

export type ExtraFieldsState = ReturnType<typeof useExtraFields>

/** The extra fields as form inputs; nothing when the record has none. Spans the whole row of a two-column form. */
export function ExtraFields({ state, title, readOnly = false }: { state: ExtraFieldsState; title?: string; readOnly?: boolean }) {
  if (!state.fields.length) return null
  return (
    <div style={{ gridColumn: '1/-1' }} data-testid={`extra-fields-${state.type.toLowerCase()}`}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', margin: '6px 0 8px', letterSpacing: '0.08em' }}>
        {title ?? 'More details'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {state.fields.map(f => <Input key={f.key} f={f} value={state.values[f.key] ?? ''} onChange={v => state.set(f.key, v)} readOnly={readOnly} />)}
      </div>
    </div>
  )
}

function Input({ f, value, onChange, readOnly }: { f: ExtraFieldDef; value: string; onChange: (v: string) => void; readOnly: boolean }) {
  const id = `xf-${f.key}`
  const hintId = f.hint ? `${id}-hint` : undefined
  // the line under a field is read out with it (aria-describedby); a required field says so
  const a11y = { 'aria-describedby': hintId, 'aria-required': f.required || undefined }
  const label = <label htmlFor={id} className={`label${f.required ? ' label-required' : ''}`}>{f.label}</label>
  const hint = f.hint ? <span id={hintId} className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{f.hint}</span> : null
  if (f.type === 'CHECKBOX') return (
    <div className="flex items-end pb-2">
      <label htmlFor={id} className="flex items-start gap-2 text-sm cursor-pointer">
        <input id={id} type="checkbox" checked={value === 'true'} disabled={readOnly} onChange={e => onChange(e.target.checked ? 'true' : '')} style={{ marginTop: '3px' }} {...a11y} />
        <span>{f.label}{hint}</span>
      </label>
    </div>
  )
  if (f.type === 'TEXTAREA') return (
    <div style={{ gridColumn: '1/-1' }}>{label}
      <textarea id={id} className="input" rows={2} maxLength={2000} value={value} readOnly={readOnly} onChange={e => onChange(e.target.value)} {...a11y} />{hint}
    </div>
  )
  if (f.type === 'DROPDOWN') return (
    <div>{label}
      <select id={id} className="input h-10" value={value} disabled={readOnly} onChange={e => onChange(e.target.value)} {...a11y}>
        <option value="">—</option>
        {!f.options.includes(value) && value && <option value={value}>{value}</option>}
        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>{hint}
    </div>
  )
  return (
    <div>{label}
      <input id={id} className="input h-10" value={value} readOnly={readOnly} maxLength={500}
        type={f.type === 'DATE' ? 'date' : 'text'} inputMode={f.type === 'NUMBER' ? 'decimal' : undefined}
        onChange={e => onChange(e.target.value)} {...a11y} />{hint}
    </div>
  )
}
