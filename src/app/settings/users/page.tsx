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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { Plus, Shield, Edit2, UserX, UserCheck, Mail, Check, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_META: Record<string, { color: string; desc: string }> = {
  SUPER_ADMIN:   { color:'#f59e0b', desc:'Full system access' },
  COMPANY_ADMIN: { color:'#3b82f6', desc:'Full company access' },
  MANAGER:       { color:'#8b5cf6', desc:'Team view + approvals' },
  FINANCE_ADMIN: { color:'#16a34a', desc:'Finance + invoicing' },
  HR_ADMIN:      { color:'#ec4899', desc:'Full HRMS' },
  ACCOUNTANT:    { color:'#0d9488', desc:'Finance + TDS + GST' },
  SALES_EXEC:    { color:'#ea580c', desc:'CRM + invoicing' },
  EMPLOYEE:      { color:'#64748b', desc:'Own data only' },
  VIEWER:        { color:'#94a3b8', desc:'Read-only' },
}

const BRANCHES = ['Head Office','Mumbai','Delhi','Bangalore','Hyderabad','Pune','Chennai']

interface UserRow { id:string; name:string; email:string; phone?:string; role:string; active:boolean; lastLogin?:string; mfa?:boolean }
interface InviteForm { name:string; email:string; phone:string; role:string; branch:string }
const BLANK: InviteForm = { name:'', email:'', phone:'', role:'EMPLOYEE', branch:'Head Office' }

export default function UsersPage() {
  const { can } = usePermissions()
  const qc = useQueryClient()
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser]     = useState<UserRow|null>(null)
  const [form, setForm]             = useState<InviteForm>(BLANK)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data ?? []),
  })

  const filtered = (users as UserRow[]).filter(u =>
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.includes(search)) &&
    (!roleFilter || u.role === roleFilter)
  )

  const inviteMut = useMutation({
    mutationFn: () => api.post('/admin/users', form).then(r => r.data.data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setShowInvite(false); setForm(BLANK)
      if (data?.tempPassword) {
        toast.success(`User created. Temp password: ${data.tempPassword}`, { duration: 8000 })
      } else {
        toast.success('User invited')
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to invite user'),
  })

  const editMut = useMutation({
    mutationFn: () => api.patch(`/admin/users/${editUser!.id}`, {
      name: editUser!.name, phone: editUser!.phone, role: editUser!.role,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User updated'); setEditUser(null) },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to update user'),
  })

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status changed') },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to change status'),
  })

  const saving = inviteMut.isPending || editMut.isPending
  const handleInvite = () => {
    if (!form.name || !form.email) return toast.error('Name and email are required')
    inviteMut.mutate()
  }
  const handleEdit = () => { if (editUser) editMut.mutate() }
  const toggleActive = (id: string) => toggleMut.mutate(id)

  const inp = { className:'input h-10' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users & Access</h1>
          <p className="text-sm mt-0.5" style={{ color:'var(--text-muted)' }}>
            {users.filter((u: any) =>u.active).length} active · {users.filter((u: any) =>!u.active).length} inactive
          </p>
        </div>
        <PermissionGate permission="SETTINGS_USERS">
          <button onClick={() => setShowInvite(true)} className="btn-primary h-9 text-sm">
            <Plus className="w-4 h-4" />Invite User
          </button>
        </PermissionGate>
      </div>

      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="w-64" />
        <select className="input h-9 text-sm w-48" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {Object.keys(ROLE_META).map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
        {Object.entries(ROLE_META).map(([role,m]) => {
          const cnt = users.filter((u: any) =>u.role===role).length
          if (!cnt) return null
          return (
            <button key={role} onClick={() => setRoleFilter(v=>v===role?'':role)}
              className="card text-left"
              style={{ borderColor:roleFilter===role?m.color:'var(--border)', background:roleFilter===role?`${m.color}08`:'var(--bg-card)' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:m.color, marginBottom:'8px' }} />
              <p style={{ fontFamily:"'Instrument Serif', serif", fontSize:'22px', color:m.color }}>{cnt}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color:'var(--text-primary)' }}>{role.replace(/_/g,' ')}</p>
              <p style={{ fontSize:'10.5px', color:'var(--text-muted)', marginTop:'2px', lineHeight:1.4 }}>{m.desc}</p>
            </button>
          )
        })}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['User','Role','MFA','Last Login','Status',''].map(h=>(
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--text-secondary)', letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const rm = ROLE_META[u.role] ?? {color:'#64748b',desc:''}
              return (
                <tr key={u.id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={(e: any) =>(e.currentTarget as HTMLElement).style.background='var(--bg-hover)'}
                  onMouseLeave={(e: any) =>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:`${rm.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:rm.color, flexShrink:0 }}>
                        {(u.name ?? '?').split(' ').map((w:string)=>w[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>{u.name}</p>
                        <p style={{ fontSize:'12px', color:'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:`${rm.color}12`, color:rm.color, border:`1px solid ${rm.color}25` }}>
                      <Shield size={10}/>{u.role.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    {u.mfa
                      ? <span style={{ fontSize:'11px', color:'#22c55e', display:'flex', alignItems:'center', gap:'4px' }}><Check size={12}/>On</span>
                      : <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:'12px', color:'var(--text-secondary)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'5px' }}><Clock size={11}/>{u.lastLogin}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:u.active?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:u.active?'#22c55e':'#ef4444' }}>
                      {u.active?'Active':'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <PermissionGate permission="SETTINGS_USERS">
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={()=>setEditUser({...u})} className="btn-icon w-8 h-8"><Edit2 size={13}/></button>
                        <button onClick={()=>toggleActive(u.id)} className="btn-icon w-8 h-8" style={{ color:u.active?'#ef4444':'#22c55e' }}>
                          {u.active?<UserX size={13}/>:<UserCheck size={13}/>}
                        </button>
                      </div>
                    </PermissionGate>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showInvite} onClose={()=>{setShowInvite(false);setForm(BLANK)}} title="Invite New User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Full Name *</label><input {...inp} placeholder="Ravi Kumar" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
            <div><label className="label">Work Email *</label><input {...inp} type="email" placeholder="ravi@company.in" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Mobile</label><input {...inp} placeholder="+91 98765 43210" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div><label className="label">Branch</label>
              <select {...inp} value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}>
                {BRANCHES.map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Role *</label>
            <select {...inp} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              {Object.entries(ROLE_META).map(([r,m])=><option key={r} value={r}>{r.replace('_',' ')} — {m.desc}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <button onClick={()=>{setShowInvite(false);setForm(BLANK)}} className="btn-secondary h-10">Cancel</button>
            <button onClick={handleInvite} disabled={saving||!form.name||!form.email} className="btn-primary h-10">
              {saving?'Sending...':<><Mail className="w-4 h-4"/>Send Invitation</>}
            </button>
          </div>
        </div>
      </Modal>

      {editUser && (
        <Modal open={!!editUser} onClose={()=>setEditUser(null)} title="Edit User" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Full Name</label><input {...inp} value={editUser.name} onChange={e=>setEditUser(u=>u?{...u,name:e.target.value}:null)}/></div>
              <div><label className="label">Phone</label><input {...inp} value={editUser.phone} onChange={e=>setEditUser(u=>u?{...u,phone:e.target.value}:null)}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Role</label>
                <select {...inp} value={editUser.role} onChange={e=>setEditUser(u=>u?{...u,role:e.target.value}:null)}>
                  {Object.keys(ROLE_META).map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Branch</label>
                <select {...inp} disabled><option>Head Office</option></select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <button onClick={()=>setEditUser(null)} className="btn-secondary h-10">Cancel</button>
              <button onClick={handleEdit} disabled={saving} className="btn-primary h-10">{saving?'Saving...':'Save Changes'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
