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
import { useRouter } from 'next/navigation'
import { goTo } from '@/lib/hooks/useUrlParams'
import { Plus } from 'lucide-react'
import { CREATE_ACTIONS, type CreateAction } from '@/lib/quickCreate'
import { usePermissions } from '@/lib/hooks/usePermissions'

/** Whether this person may create this kind of record (the same rule the server applies). */
export function useCreateAllowed() {
  const { can, hasRole, isSuperAdmin } = usePermissions()
  return (a: CreateAction) => isSuperAdmin || a.perms.some(p => can(p)) || (a.roles ?? []).some(r => hasRole(r))
}

/** "+ New" in the top bar: everything this person can create, one click (or two keys) away. */
export function QuickCreate() {
  const allowed = useCreateAllowed()
  const actions = CREATE_ACTIONS.filter(allowed)
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (actions.length === 0) return null
  const groups = Array.from(new Set(actions.map(a => a.group)))

  return (
    <div style={{ position: 'relative' }}>
      <button ref={button} className="btn-primary h-9 px-3 text-sm" onClick={() => setOpen(v => !v)}
        aria-haspopup="menu" aria-expanded={open} data-testid="quick-create" title="Create something new (N)">
        <Plus size={15} /><span className="hidden sm:inline">New</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" aria-label="Create new" className="absolute right-0 z-50 mt-2 rounded-xl overflow-hidden slide-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', width: '260px', padding: '6px' }}>
            {groups.map(g => (
              <div key={g} style={{ marginBottom: '2px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '6px 10px 4px' }}>{g}</p>
                {actions.filter(a => a.group === g).map(a => {
                  const Icon = a.icon
                  return (
                    <button key={a.href} role="menuitem" onClick={() => { setOpen(false); goTo(router, a.href) }}
                      className="w-full flex items-center gap-2.5 rounded-lg text-sm text-left"
                      style={{ padding: '7px 10px', color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={(e: any) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e: any) => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <Icon size={15} style={{ color: 'var(--gold)' }} />
                      <span className="flex-1">{a.label}</span>
                      <kbd className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0 5px' }}>N {a.key.toUpperCase()}</kbd>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
