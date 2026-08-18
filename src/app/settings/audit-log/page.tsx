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

import { useState, Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { formatDate, formatCurrency, exportToCsv } from '@/lib/utils'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Activity, Filter, Download, Eye, Plus, Edit2, Trash2,
  LogIn, LogOut, Shield, FileText, Users, DollarSign,
  ShoppingCart, RefreshCw, CheckCircle, AlertTriangle, Search
} from 'lucide-react'

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
  CREATE:   { icon: Plus,         color: '#22c55e', label: 'Created' },
  UPDATE:   { icon: Edit2,        color: '#3b82f6', label: 'Updated' },
  DELETE:   { icon: Trash2,       color: '#ef4444', label: 'Deleted' },
  VIEW:     { icon: Eye,          color: '#64748b', label: 'Viewed' },
  LOGIN:    { icon: LogIn,        color: '#8b5cf6', label: 'Login' },
  LOGOUT:   { icon: LogOut,       color: '#94a3b8', label: 'Logout' },
  APPROVE:  { icon: CheckCircle,  color: '#10b981', label: 'Approved' },
  REJECT:   { icon: AlertTriangle,color: '#f97316', label: 'Rejected' },
  EXPORT:   { icon: Download,     color: '#f59e0b', label: 'Exported' },
  SEND:     { icon: RefreshCw,    color: '#0d9488', label: 'Sent' },
}

const MODULE_ICONS: Record<string, any> = {
  INVOICE:     FileText,
  EMPLOYEE:    Users,
  FINANCE:     DollarSign,
  PROCUREMENT: ShoppingCart,
  USER:        Shield,
  LEAVE:       RefreshCw,
}

// Demo seed data
const DEMO_LOGS = Array.from({ length: 40 }, (_, i) => {
  const actions = ['CREATE','UPDATE','DELETE','VIEW','LOGIN','LOGOUT','APPROVE','REJECT','EXPORT','SEND']
  const modules = ['INVOICE','EMPLOYEE','FINANCE','PROCUREMENT','USER','LEAVE','INVENTORY','CRM']
  const users   = [
    { name:'System Administrator', email:'admin@nvgrow.in',   role:'SUPER_ADMIN' },
    { name:'Priya Sharma',         email:'priya@nvgrow.in',   role:'HR_ADMIN' },
    { name:'Rahul Mehta',          email:'rahul@nvgrow.in',   role:'FINANCE_ADMIN' },
    { name:'Anjali Desai',         email:'anjali@nvgrow.in',  role:'SALES_EXEC' },
    { name:'Vikram Nair',          email:'vikram@nvgrow.in',  role:'ACCOUNTANT' },
  ]
  const action = actions[i % actions.length]
  const module = modules[i % modules.length]
  const user   = users[i % users.length]
  const entities: Record<string, string[]> = {
    INVOICE:     ['INV/2026/0'+String(i+1).padStart(3,'0'), 'PRO/2026/0'+String(i+2).padStart(3,'0')],
    EMPLOYEE:    ['Ravi Kumar (EMP-0'+String(i+1).padStart(3,'0')+')', 'Neha Joshi (EMP-0'+String(i+2).padStart(3,'0')+')'],
    FINANCE:     ['Journal Entry #JE-'+String(i+1).padStart(4,'0'), 'Payment Voucher #PV-'+String(i+2).padStart(4,'0')],
    PROCUREMENT: ['PO/2026/0'+String(i+1).padStart(3,'0'), 'GRN-'+String(i+2).padStart(4,'0')],
    USER:        ['user@example.com', 'newuser@company.in'],
    LEAVE:       ['Annual Leave — Ravi Kumar', 'Sick Leave — Priya Sharma'],
    INVENTORY:   ['Item: Steel Bolts M6', 'Item: Safety Gloves XL'],
    CRM:         ['Lead: Tata Motors Pvt.Ltd.', 'Lead: Reliance Industries'],
  }
  const entity   = entities[module]?.[i % 2] ?? module
  const hoursAgo = i * 0.7
  const ts       = new Date(Date.now() - hoursAgo * 3600000)

  return {
    id: String(i + 1),
    action,
    module,
    entity,
    user,
    timestamp: ts.toISOString(),
    ip: `192.168.${1 + (i % 5)}.${10 + (i % 50)}`,
    details: action === 'UPDATE'
      ? `Changed status from DRAFT to SENT`
      : action === 'DELETE'
      ? `Soft-deleted record`
      : action === 'LOGIN'
      ? `Successful login from Chrome/Windows`
      : `${action} operation completed`,
    severity: action === 'DELETE' ? 'HIGH' : action === 'LOGIN' || action === 'LOGOUT' ? 'LOW' : 'MEDIUM',
  }
})

function ActionBadge({ action }: { action: string }) {
  const m = ACTION_META[action] ?? { icon: Activity, color: '#64748b', label: action }
  const Icon = m.icon
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background:`${m.color}15`, color:m.color, border:`1px solid ${m.color}25` }}>
      <Icon size={11} />
      {m.label}
    </span>
  )
}

function SeverityDot({ severity }: { severity: string }) {
  const c = severity==='HIGH'?'#ef4444':severity==='MEDIUM'?'#f59e0b':'#22c55e'
  return <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:c }} title={severity} />
}

export default function AuditLogPage() {
  const [search, setSearch]           = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage]               = useState(0)
  const [expanded, setExpanded]       = useState<string|null>(null)
  const PAGE_SIZE = 15

  const filtered = DEMO_LOGS.filter(l =>
    (!search || l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.user.name.toLowerCase().includes(search.toLowerCase())) &&
    (!moduleFilter || l.module === moduleFilter) &&
    (!actionFilter || l.action === actionFilter)
  )
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <PermissionGate permission="AUDIT_LOG_VIEW" showDenied>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Audit Log</h1>
            <p className="text-sm mt-0.5" style={{ color:'var(--text-muted)' }}>{filtered.length} events · Last 30 days</p>
          </div>
          <button className="btn-secondary h-9 text-sm" onClick={()=>exportToCsv('audit-log', ((filtered??[]) as any[]).map((l:any)=>({ Time:l.timestamp??l.createdAt, User:l.userName??l.user, Action:l.action, Entity:l.entityType, Details:l.details })))}><Download className="w-4 h-4" />Export CSV</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {['CREATE','UPDATE','DELETE','LOGIN','APPROVE'].map(a => {
            const m  = ACTION_META[a]
            const cnt = DEMO_LOGS.filter(l => l.action === a).length
            const Icon = m.icon
            return (
              <div key={a} className="card cursor-pointer"
                onClick={() => setActionFilter(v => v===a?'':a)}
                style={{ borderColor:actionFilter===a?m.color:'var(--border)', background:actionFilter===a?`${m.color}08`:'var(--bg-card)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${m.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={17} color={m.color} />
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Instrument Serif', serif", fontSize:'22px', color:m.color }}>{cnt}</p>
                    <p className="text-xs" style={{ color:'var(--text-muted)' }}>{m.label}s</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search entity, user..." className="w-64" />
          <select className="input h-9 text-sm w-44" value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(0) }}>
            <option value="">All Modules</option>
            {['INVOICE','EMPLOYEE','FINANCE','PROCUREMENT','USER','LEAVE','INVENTORY','CRM'].map(m =>
              <option key={m} value={m}>{m}</option>
            )}
          </select>
          <select className="input h-9 text-sm w-40" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0) }}>
            <option value="">All Actions</option>
            {Object.keys(ACTION_META).map(a => <option key={a} value={a}>{ACTION_META[a].label}</option>)}
          </select>
          {(moduleFilter || actionFilter) && (
            <button className="btn-ghost text-xs h-9" onClick={() => { setModuleFilter(''); setActionFilter('') }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Log table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No matching events"
                description="No audit events match your current filters. Try adjusting your search or clearing the filters."
                compact
              />
            ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Severity','Timestamp','User','Action','Module / Entity','IP Address'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:600, color:'var(--text-secondary)', letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((log, idx) => (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => setExpanded(v => v===log.id ? null : log.id)}
                      style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', background:expanded===log.id?'var(--bg-hover)':'transparent', transition:'background 0.15s' }}
                      onMouseEnter={(e: any) => { if(expanded!==log.id)(e.currentTarget as HTMLElement).style.background='var(--bg-hover)' }}
                      onMouseLeave={(e: any) => { if(expanded!==log.id)(e.currentTarget as HTMLElement).style.background='transparent' }}>
                      <td style={{ padding:'11px 16px' }}><SeverityDot severity={log.severity} /></td>
                      <td style={{ padding:'11px 16px', whiteSpace:'nowrap' }}>
                        <p className="text-xs font-medium" style={{ color:'var(--text-primary)' }}>
                          {new Date(log.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}
                        </p>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                        </p>
                      </td>
                      <td style={{ padding:'11px 16px' }}>
                        <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{log.user.name}</p>
                        <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>{log.user.role}</p>
                      </td>
                      <td style={{ padding:'11px 16px' }}><ActionBadge action={log.action} /></td>
                      <td style={{ padding:'11px 16px' }}>
                        <p className="text-xs font-bold" style={{ color:'var(--text-secondary)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'2px' }}>{log.module}</p>
                        <p className="text-sm" style={{ color:'var(--text-primary)' }}>{log.entity}</p>
                      </td>
                      <td style={{ padding:'11px 16px', fontFamily:'monospace', fontSize:'12px', color:'var(--text-muted)' }}>{log.ip}</td>
                    </tr>
                    {expanded===log.id && (
                      <tr key={`exp-${log.id}`} style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-surface)' }}>
                        <td colSpan={6} style={{ padding:'12px 16px 14px' }}>
                          <div style={{ display:'flex', gap:'24px', fontSize:'12.5px', color:'var(--text-secondary)' }}>
                            <div><span style={{ color:'var(--text-muted)', fontSize:'11px' }}>EVENT ID</span><br /><span style={{ fontFamily:'monospace', color:'var(--text-primary)' }}>EVT-{log.id.padStart(8,'0')}</span></div>
                            <div><span style={{ color:'var(--text-muted)', fontSize:'11px' }}>USER EMAIL</span><br />{log.user.email}</div>
                            <div><span style={{ color:'var(--text-muted)', fontSize:'11px' }}>DETAILS</span><br />{log.details}</div>
                            <div><span style={{ color:'var(--text-muted)', fontSize:'11px' }}>SEVERITY</span><br />
                              <span style={{ color:log.severity==='HIGH'?'#ef4444':log.severity==='MEDIUM'?'#f59e0b':'#22c55e', fontWeight:600 }}>{log.severity}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalElements={filtered.length} pageSize={PAGE_SIZE} />
      </div>
    </PermissionGate>
  )
}
