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

import { useState } from 'react'
import Link from 'next/link'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { KeyRound, Power, PowerOff, Unlock } from 'lucide-react'
import { platformApi, moment, roleWords, type LoginFilter, type LoginRow } from '@/lib/api/platform'
import { DataTable } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Badge } from '@/components/ui/Badge'
import { ConsoleHeading, FilterChips, NoteDialog, ResetDialog, useConsoleList } from '@/components/platform/ConsoleKit'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { apiError } from '@/lib/apiError'

const FILTERS: LoginFilter[] = ['LOCKED', 'OFF', 'NEVER', 'ADMINS']

type Dialog = null | { reset: LoginRow } | { off: LoginRow } | { on: LoginRow }

/**
 * Every login of every company in one list: find a person by name, email, phone or company; see who is locked out
 * after wrong passwords, switched off, never signed in, or an administrator — and help them (unlock, a reset link,
 * switch off or on), each kept in the company's history.
 */
export default function PlatformLoginsPage() {
  const qc = useQueryClient()
  const me = useAuthStore(s => s.user?.userId)
  const list = useConsoleList(FILTERS)
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['platform', 'logins', list.q, list.filter, list.page],
    queryFn: () => platformApi.logins(list.q, list.filter, list.page),
    placeholderData: keepPreviousData,
  })
  const changed = (message: string) => {
    qc.invalidateQueries({ queryKey: ['platform', 'logins'] })
    qc.invalidateQueries({ queryKey: ['platform', 'company'] })
    qc.invalidateQueries({ queryKey: ['platform', 'overview'] })
    setDialog(null)
    toast.success(message)
  }
  const unlock = useMutation({
    mutationFn: (u: LoginRow) => platformApi.unlock(u.companyId, u.id),
    onSuccess: () => changed('Login unlocked — they can sign in again now'),
    onError: (e: unknown) => toast.error(apiError(e, 'The login could not be unlocked.')),
  })

  const c = data?.counts
  return (
    <div className="space-y-4" data-testid="platform-logins">
      <ConsoleHeading title="All logins"
        line={<>{c ? `${c.all.toLocaleString('en-IN')} login${c.all === 1 ? '' : 's'} in all companies` : 'Every login of every company'}
          {data && list.q ? ` · ${data.total.toLocaleString('en-IN')} found` : ''}{isFetching && data ? ' · updating…' : ''}</>}>
        <SearchInput value={list.typed} onChange={list.setTyped} placeholder="Name, email, phone or company" className="w-full sm:w-80" />
      </ConsoleHeading>

      <FilterChips value={list.filter} onChange={list.setFilter} options={[
        { value: '', label: 'All', count: c?.all },
        { value: 'LOCKED', label: 'Locked now', count: c?.locked },
        { value: 'OFF', label: 'Switched off', count: c?.switchedOff },
        { value: 'NEVER', label: 'Never signed in', count: c?.neverSignedIn },
        { value: 'ADMINS', label: 'Administrators' },
      ]} />

      {isError ? (
        <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The logins could not be loaded.')}</div>
      ) : (
        <>
          <DataTable<LoginRow>
            loading={isLoading}
            data={data?.items ?? []}
            keyExtractor={r => r.id}
            emptyMessage={list.q || list.filter ? 'No login matches — try another search or filter.' : 'No logins yet.'}
            columns={[
              { header: 'Login', render: r => (
                <div className="min-w-0" data-login={r.email}>
                  <span className="block font-medium" style={{ color: 'var(--text-primary)' }}>{r.fullName || '—'}
                    {r.console && <span className="ml-1.5 align-middle" data-console-admin><Badge variant="info">Console administrator</Badge></span>}</span>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
                </div>
              ) },
              { header: 'Company', render: r => (
                <div className="min-w-0">
                  <Link href={`/platform/companies/${r.companyId}`} className="block text-sm font-medium" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{r.companyName}</Link>
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{r.companyCode}{!r.companyActive && ' · company suspended'}</span>
                </div>
              ) },
              { header: 'Roles', render: r => <span className="text-xs">{r.roles.map(roleWords).join(', ') || '—'}</span> },
              { header: 'Sign-in', render: r => (
                <div className="text-xs" data-state={!r.active ? 'off' : r.locked ? 'locked' : 'on'}>
                  {!r.active ? <Badge variant="default">Switched off</Badge>
                    : r.locked ? <Badge variant="danger">Locked until {moment(r.lockedUntil)}</Badge>
                    : <span>{[r.google ? 'Google' : null, r.twoStep ? 'two-step on' : null].filter(Boolean).join(' · ') || 'password'}</span>}
                  {r.active && !r.locked && r.failedAttempts > 0 && <span className="block" style={{ color: '#b45309' }}>{r.failedAttempts} wrong password{r.failedAttempts === 1 ? '' : 's'}</span>}
                </div>
              ) },
              { header: 'Last sign-in', render: r => <span className="text-xs">{r.lastSignIn ? moment(r.lastSignIn) : 'never'}</span> },
              { header: '', className: 'text-right', render: r => (
                <div className="whitespace-nowrap">
                  {(r.locked || r.failedAttempts > 0) && <button type="button" className="btn-ghost h-8 px-2 text-xs" disabled={unlock.isPending}
                    onClick={() => unlock.mutate(r)} data-action="unlock"><Unlock size={13} /> Unlock</button>}
                  {r.active && r.email && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setDialog({ reset: r })} data-action="reset-link">
                    <KeyRound size={13} /> Reset link</button>}
                  {r.active && r.id !== me && <button type="button" className="btn-ghost h-8 px-2 text-xs" style={{ color: '#b91c1c' }}
                    onClick={() => setDialog({ off: r })} data-action="switch-off"><PowerOff size={13} /> Switch off</button>}
                  {!r.active && <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={() => setDialog({ on: r })} data-action="switch-on">
                    <Power size={13} /> Switch on</button>}
                </div>
              ) },
            ]}
          />
          {data && <Pagination currentPage={data.page} totalPages={Math.max(1, Math.ceil(data.total / data.size))} onPageChange={list.setPage}
            totalElements={data.total} pageSize={data.size} />}
        </>
      )}

      {dialog && 'reset' in dialog && <ResetDialog companyId={dialog.reset.companyId} user={dialog.reset} onClose={() => setDialog(null)} />}
      {dialog && 'off' in dialog && <NoteDialog title={`Switch off ${dialog.off.email}`} testId="switch-off-dialog" action="Switch the login off" danger
        label="Why (kept with the company's history)"
        text={`${dialog.off.fullName || dialog.off.email} of ${dialog.off.companyName} can't sign in any more and is signed out on every device at once. `
          + `Nothing is deleted: switch it on again any time.${dialog.off.console ? ' This login is also one of the console’s administrators.' : ''}`}
        run={note => platformApi.switchOff(dialog.off.companyId, dialog.off.id, note)} onClose={() => setDialog(null)}
        onDone={() => changed('Login switched off — signed out everywhere')} />}
      {dialog && 'on' in dialog && <NoteDialog title={`Switch on ${dialog.on.email}`} testId="switch-on-dialog" action="Switch the login on"
        label="Note (kept with the company's history)"
        text={`${dialog.on.fullName || dialog.on.email} of ${dialog.on.companyName} can sign in again straight away, with the same password and roles.`}
        run={note => platformApi.switchOn(dialog.on.companyId, dialog.on.id, note)} onClose={() => setDialog(null)}
        onDone={() => changed('Login switched on')} />}
    </div>
  )
}
