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

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { Plus, Shield, Edit2, UserX, UserCheck, Check, Clock, KeyRound, Copy, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiError } from '@/lib/utils'

interface UserRow { id: string; name: string; email: string; phone?: string; role: string; active: boolean; lastLogin?: string; mfa?: boolean }
interface RoleInfo { name: string; displayName?: string | null; system: boolean; users: number }
interface InviteForm { name: string; email: string; phone: string; role: string }
const BLANK: InviteForm = { name: '', email: '', phone: '', role: 'EMPLOYEE' }

const COLORS: Record<string, string> = {
  COMPANY_ADMIN: '#2563eb', MANAGER: '#7c3aed', FINANCE_ADMIN: '#16a34a', HR_ADMIN: '#db2777', ACCOUNTANT: '#0d9488',
  SALES_EXEC: '#ea580c', EMPLOYEE: '#64748b', VIEWER: '#94a3b8',
}
const HINT: Record<string, string> = {
  COMPANY_ADMIN: 'Everything, including users and settings', MANAGER: 'Their team, with approvals', FINANCE_ADMIN: 'Books, invoices, bills and GST',
  HR_ADMIN: 'Employees, attendance, leave and payroll', ACCOUNTANT: 'Books, TDS and GST returns', SALES_EXEC: 'Customers, leads and invoices',
  EMPLOYEE: 'Their own leave, attendance and payslips', VIEWER: 'Can look, not change',
}
const color = (r: string) => COLORS[r] ?? '#64748b'
const label = (r: string, roles: RoleInfo[]) => roles.find(x => x.name === r)?.displayName || r.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())

export default function UsersPage() {
  const { can, isAdmin, isSuperAdmin } = usePermissions()
  const { user: me } = useAuthStore()
  const manage = can('SETTINGS_USERS')
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [form, setForm] = useState<InviteForm>(BLANK)
  const [secret, setSecret] = useState<{ title: string; name: string; email: string; password: string } | null>(null)
  const [confirm, setConfirm] = useState<{ user: UserRow; action: 'off' | 'on' | 'reset' } | null>(null)

  const { data: users = [], isLoading, isError, error } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data ?? []),
  })
  const { data: roles = [] } = useQuery<RoleInfo[]>({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles').then(r => r.data.data ?? []),
  })
  // A company admin may make others admins; nobody here may hand out platform-wide rights.
  const assignable = useMemo(() => roles.filter(r => r.name !== 'SUPER_ADMIN' && (r.name !== 'COMPANY_ADMIN' || isAdmin || isSuperAdmin)), [roles, isAdmin, isSuperAdmin])

  const s = search.trim().toLowerCase()
  const filtered = users.filter(u =>
    (!s || u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)) && (!roleFilter || u.role === roleFilter))
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-roles'] }) }

  const inviteMut = useMutation({
    mutationFn: () => api.post('/admin/users', { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), role: form.role }).then(r => r.data.data),
    onSuccess: (data: any) => {
      refresh(); setShowInvite(false)
      if (data?.tempPassword) setSecret({ title: 'Account created', name: data.name, email: data.email, password: data.tempPassword })
      else toast.success('User added')
      setForm(BLANK)
    },
    onError: (e: any) => toast.error(apiError(e, 'The user could not be added')),
  })
  const editMut = useMutation({
    mutationFn: () => api.patch(`/admin/users/${editUser!.id}`, { name: editUser!.name, phone: editUser!.phone, role: editUser!.role }),
    onSuccess: () => { refresh(); toast.success('Saved'); setEditUser(null) },
    onError: (e: any) => toast.error(apiError(e, 'The user could not be updated')),
  })
  const toggleMut = useMutation({
    mutationFn: (u: UserRow) => api.post(`/admin/users/${u.id}/toggle-active`).then(r => r.data.data),
    onSuccess: (d: any) => { refresh(); setConfirm(null); toast.success(d?.active ? 'Account switched on' : 'Account switched off — they can no longer sign in') },
    onError: (e: any) => { setConfirm(null); toast.error(apiError(e, 'The account could not be changed')) },
  })
  const resetMut = useMutation({
    mutationFn: (u: UserRow) => api.post(`/admin/users/${u.id}/reset-password`).then(r => r.data.data),
    onSuccess: (d: any, u) => { setConfirm(null); if (d?.tempPassword) setSecret({ title: 'Password reset', name: u.name, email: u.email, password: d.tempPassword }) },
    onError: (e: any) => { setConfirm(null); toast.error(apiError(e, 'The password could not be reset')) },
  })

  const signInText = secret ? [
    `Sign in to Finvosmart: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`,
    me?.companyCode ? `Company code: ${me.companyCode}` : null,
    `Email: ${secret.email}`,
    `Temporary password: ${secret.password}`,
    'Please change the password after signing in (Settings → Security).',
  ].filter(Boolean).join('\n') : ''
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); toast.success('Copied') } catch { toast.error('Copy failed — select the text and copy it yourself') }
  }
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    users.forEach(u => m.set(u.role, (m.get(u.role) ?? 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [users])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Users & access</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {users.filter(u => u.active).length} active · {users.filter(u => !u.active).length} switched off · what each person can do comes from their role
          </p>
        </div>
        {manage && (
          <button onClick={() => { setForm({ ...BLANK, role: assignable.some(r => r.name === 'EMPLOYEE') ? 'EMPLOYEE' : assignable[0]?.name ?? 'EMPLOYEE' }); setShowInvite(true) }} className="btn-primary h-9 text-sm">
            <Plus className="w-4 h-4" />Add a user
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" className="w-64" />
        {counts.map(([r, n]) => (
          <button key={r} onClick={() => setRoleFilter(v => v === r ? '' : r)} className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-2"
            style={{ border: `1px solid ${roleFilter === r ? color(r) : 'var(--border)'}`, background: roleFilter === r ? `${color(r)}12` : 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color(r) }} />{label(r, roles)} · {n}
          </button>
        ))}
      </div>

      {isError && <div className="card text-sm" style={{ color: 'var(--text-secondary)' }}>{apiError(error, 'Users could not be loaded.')}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Role', 'Two-step sign-in', 'Last sign-in', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ padding: '24px 16px', color: 'var(--text-muted)' }}>Loading…</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '24px 16px', color: 'var(--text-muted)' }}>{users.length ? 'Nobody matches.' : 'No users yet.'}</td></tr>}
              {filtered.map(u => {
                const c = color(u.role), self = u.id === me?.userId
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.active ? 1 : 0.65 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex items-center gap-2.5">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: c, flexShrink: 0 }}>
                          {(u.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', margin: 0 }}>{u.name}{self ? <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}> (you)</span> : null}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${c}12`, color: c, border: `1px solid ${c}25` }}>
                        <Shield size={10} />{label(u.role, roles)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.mfa ? <span style={{ fontSize: '11.5px', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12} />On</span>
                             : <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Off</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span className="inline-flex items-center gap-1.5"><Clock size={11} />{u.lastLogin}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: u.active ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: u.active ? '#16a34a' : '#dc2626' }}>
                        {u.active ? 'Active' : 'Switched off'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {manage && (
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => setEditUser({ ...u })} className="btn-icon w-8 h-8" aria-label={`Edit ${u.name}`} title="Edit"><Edit2 size={13} /></button>
                          {!self && <button onClick={() => setConfirm({ user: u, action: 'reset' })} className="btn-icon w-8 h-8" aria-label={`Reset password for ${u.name}`} title="Reset password"><KeyRound size={13} /></button>}
                          {!self && (
                            <button onClick={() => setConfirm({ user: u, action: u.active ? 'off' : 'on' })} className="btn-icon w-8 h-8" style={{ color: u.active ? '#dc2626' : '#16a34a' }}
                              aria-label={u.active ? `Switch off ${u.name}` : `Switch on ${u.name}`} title={u.active ? 'Switch off' : 'Switch on'}>
                              {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showInvite} onClose={() => { setShowInvite(false); setForm(BLANK) }} title="Add a user" subtitle="They get a temporary password to sign in with, shown once on the next screen.">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (form.name.trim() && form.email.trim()) inviteMut.mutate() }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label label-required" htmlFor="u-name">Full name</label><input id="u-name" className="input h-10" placeholder="Ravi Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label label-required" htmlFor="u-email">Work email</label><input id="u-email" className="input h-10" type="email" placeholder="ravi@yourcompany.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label" htmlFor="u-phone">Mobile</label><input id="u-phone" className="input h-10" placeholder="98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><label className="label label-required" htmlFor="u-role">Role</label>
              <select id="u-role" className="input h-10" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {assignable.map(r => <option key={r.name} value={r.name}>{label(r.name, roles)}</option>)}
              </select>
            </div>
          </div>
          {HINT[form.role] && <p className="text-xs" style={{ color: 'var(--text-secondary)', margin: 0 }}>{label(form.role, roles)}: {HINT[form.role].toLowerCase()}.</p>}
          <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            To let them see their payslips and ask for leave, also add them as an employee with this same email.
          </p>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowInvite(false); setForm(BLANK) }} className="btn-secondary h-10">Cancel</button>
            <button type="submit" disabled={inviteMut.isPending || !form.name.trim() || !form.email.trim()} className="btn-primary h-10">
              <UserPlus className="w-4 h-4" />{inviteMut.isPending ? 'Adding…' : 'Add user'}
            </button>
          </div>
        </form>
      </Modal>

      {editUser && (
        <Modal open onClose={() => setEditUser(null)} title={`Edit ${editUser.name}`} subtitle={editUser.email}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label" htmlFor="e-name">Full name</label><input id="e-name" className="input h-10" value={editUser.name} onChange={e => setEditUser(u => u ? { ...u, name: e.target.value } : null)} /></div>
              <div><label className="label" htmlFor="e-phone">Mobile</label><input id="e-phone" className="input h-10" value={editUser.phone ?? ''} onChange={e => setEditUser(u => u ? { ...u, phone: e.target.value } : null)} /></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="e-role">Role</label>
                <select id="e-role" className="input h-10" value={editUser.role} disabled={editUser.id === me?.userId}
                  onChange={e => setEditUser(u => u ? { ...u, role: e.target.value } : null)}>
                  {[...assignable.filter(r => r.name !== editUser.role), ...roles.filter(r => r.name === editUser.role)].sort((a, b) => label(a.name, roles).localeCompare(label(b.name, roles)))
                    .map(r => <option key={r.name} value={r.name}>{label(r.name, roles)}</option>)}
                </select>
                {editUser.id === me?.userId && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Your own role can only be changed by another administrator.</p>}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditUser(null)} className="btn-secondary h-10">Cancel</button>
              <button onClick={() => editMut.mutate()} disabled={editMut.isPending} className="btn-primary h-10">{editMut.isPending ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} size="sm"
        title={confirm?.action === 'reset' ? 'Reset this password?' : confirm?.action === 'off' ? 'Switch off this account?' : 'Switch this account back on?'}
        subtitle={confirm ? `${confirm.user.name} · ${confirm.user.email}` : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-secondary h-10" onClick={() => setConfirm(null)}>Cancel</button>
            <button className={confirm?.action === 'off' ? 'btn-danger h-10' : 'btn-primary h-10'} disabled={toggleMut.isPending || resetMut.isPending}
              onClick={() => confirm && (confirm.action === 'reset' ? resetMut.mutate(confirm.user) : toggleMut.mutate(confirm.user))}>
              {confirm?.action === 'reset' ? 'Reset password' : confirm?.action === 'off' ? 'Switch off' : 'Switch on'}
            </button>
          </div>
        }>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          {confirm?.action === 'reset' ? 'Their current password stops working. You get a new temporary password to give them.'
            : confirm?.action === 'off' ? 'They can no longer sign in. Everything they entered stays, with their name on it. You can switch them back on at any time.'
            : 'They can sign in again with their existing password.'}
        </p>
      </Modal>

      <Modal open={!!secret} onClose={() => setSecret(null)} title={secret?.title ?? ''} subtitle="Give these sign-in details to the person — the password is shown only now.">
        {secret && (
          <div className="space-y-3">
            <pre data-testid="signin-details" style={{ margin: 0, padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: '12.5px', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontFamily: 'var(--font-geist-mono), monospace' }}>{signInText}</pre>
            <div className="flex justify-between gap-2 flex-wrap">
              <button className="btn-secondary h-10" onClick={() => copy(signInText)}><Copy size={14} />Copy sign-in details</button>
              <button className="btn-primary h-10" onClick={() => setSecret(null)}>Done</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
