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

import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { platformApi } from '@/lib/api/platform'
import { Modal } from '@/components/ui/Modal'
import { apiError } from '@/lib/apiError'

/** The pieces the console's pages share: their lists' search, filters and pages, and the dialogs support uses. */

/**
 * A list's search (typing waits a moment), filter and page — a filter or search in the address (from a tile or a
 * link) is taken once, when the page opens.
 */
export function useConsoleList(filters: readonly string[]) {
  const [q, setQ] = useState('')
  const [typed, setTyped] = useState('')
  const [filter, setFilterNow] = useState('')
  const [page, setPage] = useState(0)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const f = (p.get('filter') ?? '').toUpperCase()
    if (filters.includes(f)) setFilterNow(f)
    const s = p.get('q') ?? ''
    if (s) { setQ(s); setTyped(s) }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the page opens
  }, [])
  useEffect(() => {
    const t = setTimeout(() => { setQ(typed.trim()); setPage(0) }, 300)
    return () => clearTimeout(t)
  }, [typed])
  return { q, typed, setTyped, filter, setFilter: (f: string) => { setFilterNow(f); setPage(0) }, page, setPage }
}

/** The filter chips above a list, each with its count when there is one. */
export function FilterChips({ options, value, onChange, label = 'Show' }: {
  options: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void; label?: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map(f => {
        const on = value === f.value
        return (
          <button key={f.value || 'all'} type="button" onClick={() => onChange(f.value)} aria-pressed={on} data-filter={f.value || 'ALL'}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'var(--gold-muted)' : 'transparent',
              color: on ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer',
            }}>
            {f.label}{f.count !== undefined && <span className="ml-1.5 tabular-nums" style={{ opacity: 0.75 }} data-count>{f.count.toLocaleString('en-IN')}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** The server's answer to a dialog's action, when it refused. */
export function Problem({ text }: { text: string }) {
  return text ? <p role="alert" className="text-sm" style={{ color: '#dc2626' }} data-testid="dialog-error">{text}</p> : null
}

/**
 * A note, then the action (suspend, reopen, switch a login off or on, mark an enquiry followed up): the server
 * checks the note is 5 to 300 characters and keeps it with the history.
 */
export function NoteDialog<T>({ title, text, label, action, danger, testId, run, onClose, onDone, placeholder }: {
  title: string; text: string; label: string; action: string; danger?: boolean; testId: string; placeholder?: string
  run: (note: string) => Promise<T>; onClose: () => void; onDone: (r: T) => void
}) {
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState('')
  const m = useMutation({ mutationFn: () => run(note), onSuccess: onDone, onError: (e: unknown) => setProblem(apiError(e, 'That could not be done.')) })
  return (
    <Modal open onClose={onClose} title={title} size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className={`${danger ? 'btn-danger' : 'btn-primary'} h-9 px-4`} disabled={m.isPending || note.trim().length < 5}
          onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">{m.isPending ? 'Saving…' : action}</button>
      </div>}>
      <div className="space-y-3" data-testid={testId}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
        <div>
          <label className="label" htmlFor="pf-note">{label}</label>
          <textarea id="pf-note" className="input" rows={3} maxLength={300} value={note} onChange={e => setNote(e.target.value)} data-field="note"
            placeholder={placeholder} />
        </div>
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

/** Sends a login a link to choose a new password — to its own address; nobody else sees the link. */
export function ResetDialog({ companyId, user, onClose }: { companyId: string; user: { id: string; email?: string; fullName?: string }; onClose: () => void }) {
  const [problem, setProblem] = useState('')
  const [sent, setSent] = useState('')
  const m = useMutation({ mutationFn: () => platformApi.resetLink(companyId, user.id), onSuccess: r => setSent(r),
    onError: (e: unknown) => setProblem(apiError(e, 'The link could not be sent.')) })
  return (
    <Modal open onClose={onClose} title="Send a password-reset link" size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>{sent ? 'Close' : 'Cancel'}</button>
        {!sent && <button type="button" className="btn-primary h-9 px-4" disabled={m.isPending} onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">
          {m.isPending ? 'Sending…' : 'Send the link'}</button>}
      </div>}>
      <div className="space-y-3" data-testid="reset-dialog">
        {sent ? <p role="status" className="text-sm" data-testid="reset-sent">{sent}</p> : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            A link to choose a new password goes to <strong>{user.email}</strong> ({user.fullName}). It works once, for 30 minutes; nobody but them sees it.
          </p>
        )}
        <Problem text={problem} />
      </div>
    </Modal>
  )
}

/** A page's heading: its title and a line under it. */
export function ConsoleHeading({ title, line, children }: { title: string; line: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>
      </div>
      {children}
    </div>
  )
}
