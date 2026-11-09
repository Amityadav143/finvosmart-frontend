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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ShieldCheck, ShieldOff, UserPlus } from 'lucide-react'
import { platformApi, moment, type ConsoleAdmins, type ConsoleLogin } from '@/lib/api/platform'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ConsoleHeading, Problem } from '@/components/platform/ConsoleKit'
import { apiError } from '@/lib/apiError'

type Change = null | { add: ConsoleLogin } | { remove: ConsoleLogin }

/**
 * Who can open the console: the Super Admins of the company that runs Finvosmart. An administrator gives that access
 * to another login of the company, or takes it away (never their own, never the last one's) — the login is signed
 * out everywhere when it loses it. Each change is kept in the platform company's audit log.
 */
export default function PlatformAdminsPage() {
  const qc = useQueryClient()
  const [change, setChange] = useState<Change>(null)
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['platform', 'admins'], queryFn: platformApi.admins })

  if (isLoading) return <SkeletonCard lines={4} />
  if (isError || !data) return <div className="card text-sm" role="alert" style={{ color: '#dc2626' }}>{apiError(error, 'The administrators could not be loaded.')}</div>

  const activeAdmins = data.admins.filter(a => a.active).length
  const done = (d: ConsoleAdmins, message: string) => {
    qc.setQueryData(['platform', 'admins'], d)
    qc.invalidateQueries({ queryKey: ['platform', 'overview'] })
    qc.invalidateQueries({ queryKey: ['platform', 'logins'] })
    qc.invalidateQueries({ queryKey: ['platform', 'company'] })
    setChange(null)
    toast.success(message)
  }

  return (
    <div className="space-y-5" data-testid="platform-admins">
      <ConsoleHeading title="Console administrators"
        line={<>The Super Admins of <b>{data.companyName ?? 'the platform company'}</b> — the company that runs Finvosmart
          (<code className="text-xs">PLATFORM_COMPANY_ID</code>) — can open this console. {activeAdmins} can sign in now.</>} />

      <section className="card space-y-3" aria-labelledby="admins-h">
        <h2 id="admins-h" className="text-base font-semibold">Can open the console</h2>
        <LoginTable rows={data.admins} testId="console-admins" action={a => (
          a.you ? null
            : <button type="button" className="btn-ghost h-8 px-2 text-xs" style={{ color: '#b91c1c' }} onClick={() => setChange({ remove: a })}
                disabled={a.active && activeAdmins <= 1} title={a.active && activeAdmins <= 1 ? 'The last administrator who can sign in keeps access' : undefined}
                data-action="remove-admin"><ShieldOff size={13} /> Take away access</button>
        )} />
      </section>

      <section className="card space-y-3" aria-labelledby="others-h">
        <h2 id="others-h" className="text-base font-semibold">Other logins of {data.companyName ?? 'the platform company'}</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Give one of them access to the console: it gets the Super Admin role on top of its others. Someone new? Add a login for them first under{' '}
          <Link href="/settings/users" className="text-link">Settings → Users</Link> (signed in as you, it is a login of this company), then give it access here.
        </p>
        {data.others.length === 0
          ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No other logins.</p>
          : <LoginTable rows={data.others} testId="console-others" action={a => (
              a.active
                ? <button type="button" className="btn-secondary h-8 px-3 text-xs" onClick={() => setChange({ add: a })} data-action="add-admin">
                    <UserPlus size={13} /> Give console access</button>
                : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>switched off</span>
            )} />}
      </section>

      <section className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <p><b>On the server</b> (if nobody can sign in to the console any more):</p>
        <p className="font-mono">sudo bash scripts/platform-admin.sh</p>
        <p>shows the platform company and who can open the console, and <span className="font-mono">sudo bash scripts/platform-admin.sh grant EMAIL</span> gives
          a login of the platform company access. The backend says who can open the console in its log each time it starts.</p>
      </section>

      {change && <ChangeDialog change={change} onClose={() => setChange(null)} onDone={done} />}
    </div>
  )
}

function LoginTable({ rows, action, testId }: { rows: ConsoleLogin[]; action: (a: ConsoleLogin) => React.ReactNode; testId: string }) {
  return (
    <div className="table-wrap">
      <table className="w-full border-collapse text-sm" data-testid={testId}>
        <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th className="table-header">Name</th><th className="table-header">Sign-in</th><th className="table-header">Last sign-in</th><th className="table-header text-right"></th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td className="table-cell" colSpan={4}>Nobody.</td></tr>}
          {rows.map(a => (
            <tr key={a.id} className="table-row" data-login={a.email}>
              <td className="table-cell">
                <span className="block font-medium">{a.fullName || '—'}{a.you && <span className="ml-1.5 align-middle"><Badge variant="info">you</Badge></span>}</span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{a.email}</span>
              </td>
              <td className="table-cell text-xs">{a.active ? 'can sign in' : <Badge variant="default">Switched off</Badge>}</td>
              <td className="table-cell text-xs">{a.lastSignIn ? moment(a.lastSignIn) : 'never'}</td>
              <td className="table-cell text-right whitespace-nowrap">{action(a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ChangeDialog({ change, onClose, onDone }: { change: NonNullable<Change>; onClose: () => void; onDone: (d: ConsoleAdmins, message: string) => void }) {
  const [problem, setProblem] = useState('')
  const adding = 'add' in change
  const who = adding ? change.add : change.remove
  const m = useMutation({
    mutationFn: () => adding ? platformApi.addAdmin(who.id) : platformApi.removeAdmin(who.id),
    onSuccess: d => onDone(d, adding ? `${who.email} can open the console now` : `${who.email} can't open the console any more`),
    onError: (e: unknown) => setProblem(apiError(e, 'That could not be done.')),
  })
  return (
    <Modal open onClose={onClose} title={adding ? 'Give console access' : 'Take away console access'} size="sm" footer={
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary h-9 px-4" onClick={onClose}>Cancel</button>
        <button type="button" className={`${adding ? 'btn-primary' : 'btn-danger'} h-9 px-4`} disabled={m.isPending}
          onClick={() => { setProblem(''); m.mutate() }} data-action="confirm">
          {m.isPending ? 'Saving…' : adding ? <><ShieldCheck size={14} /> Give access</> : <><ShieldOff size={14} /> Take it away</>}</button>
      </div>}>
      <div className="space-y-3 text-sm" data-testid="admin-dialog" style={{ color: 'var(--text-secondary)' }}>
        {adding
          ? <p><b>{who.fullName || who.email}</b> ({who.email}) gets the Super Admin role: every company on Finvosmart, their logins and payments, and the
              platform settings. They see the console the next time a page loads.</p>
          : <p><b>{who.fullName || who.email}</b> ({who.email}) loses the Super Admin role (keeping its other roles — company admin if it had no other)
              and is signed out on every device at once.</p>}
        <Problem text={problem} />
      </div>
    </Modal>
  )
}
