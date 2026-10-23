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
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hrmsApi } from '@/lib/api/hrms'
import { EmployeeModal } from '@/components/hrms/EmployeeModal'
import { SalarySetupModal } from '@/components/payroll/SalarySetupModal'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { DataTable } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate } from '@/lib/utils'
import { useDebounce } from '@/lib/hooks'
import { useUrlParams } from '@/lib/hooks/useUrlParams'
import type { Employee } from '@/types'
import { Plus, Download, Users, UserCheck, UserX, Briefcase, LayoutGrid, List, FileUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function EmployeesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'list'|'grid'>('list')
  const [showCreate, setShowCreate] = useState(false)
  const [prefill, setPrefill] = useState<Record<string, string> | undefined>()
  const [editing, setEditing] = useState<Employee | null>(null)
  const [salaryFor, setSalaryFor] = useState<string | null>(null)
  const { isAdmin, isHR, isSuperAdmin } = usePermissions()
  const canAdd = isAdmin || isHR || isSuperAdmin
  const dq = useDebounce(q, 400)
  useUrlParams(p => {
    if (p.get('q')) setQ(p.get('q')!)
    if (p.get('new') === '1' && canAdd) {
      // e.g. a candidate just hired: /hrms/employees?new=1&name=…&email=…&phone=…&ctc=…
      const parts = (p.get('name') ?? '').trim().split(/\s+/).filter(Boolean)
      const fill: Record<string, string> = {}
      if (parts.length) { fill.firstName = parts[0]; fill.lastName = parts.length > 1 ? parts.slice(1).join(' ') : '' }
      if (p.get('email')) fill.officialEmail = p.get('email')!
      if (p.get('phone')) fill.phonePrimary = p.get('phone')!
      if (p.get('ctc') && /^\d+$/.test(p.get('ctc')!)) fill.ctcAnnual = p.get('ctc')!
      setPrefill(Object.keys(fill).length ? fill : undefined)
      setShowCreate(true)
    }
  }, ['name', 'email', 'phone', 'ctc'])

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, dq, status],
    queryFn: () => hrmsApi.employees.list({ page, size: 20, query: dq || undefined, status: status || undefined }),
  })
  const { data: stats } = useQuery({ queryKey: ['emp-stats'], queryFn: hrmsApi.employees.stats })

  /** Opens an employee with their full record (the list carries only a summary). */
  const open = async (e: Employee) => {
    try { setEditing(await hrmsApi.employees.get(e.id)) }
    catch { toast.error('This employee could not be opened') }
  }
  const saved = () => {
    qc.invalidateQueries({ queryKey: ['employees'] }); qc.invalidateQueries({ queryKey: ['emp-stats'] })
    setShowCreate(false); setEditing(null); setPrefill(undefined)
  }

  const hashColor = (code?: string) => {
    const seed = (code?.charCodeAt(4) ?? 0) + (code?.charCodeAt(5) ?? 0)
    const hue = (seed * 47) % 360
    return { bg: `hsl(${hue}deg 45% 20%)`, text: `hsl(${hue}deg 70% 72%)` }
  }

  const columns = [
    { header: 'Employee', render: (e: Employee) => {
      const c = hashColor(e.employeeCode)
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: c.bg, color: c.text }}>
            {e.firstName?.[0]}{e.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{e.fullName}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{e.officialEmail ?? '—'}</p>
          </div>
        </div>
      )
    }},
    { header: 'Code', render: (e: Employee) => (
      <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '11px' }}>{e.employeeCode}</span>
    )},
    { header: 'Dept', render: (e: Employee) => <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{e.departmentName ?? '—'}</span> },
    { header: 'Type', render: (e: Employee) => (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue, #2563eb)', border: '1px solid rgba(59,130,246,0.15)' }}>
        {e.employmentType?.replace(/_/g,' ')}
      </span>
    )},
    { header: 'Joined', render: (e: Employee) => <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(e.dateOfJoining)}</span> },
    { header: 'Status', render: (e: Employee) => <StatusBadge status={e.status} /> },
  ]

  const exportEmployees = async () => {
    try {
      const all = await hrmsApi.employees.list({ page: 0, size: 1000, query: dq || undefined, status: status || undefined })
      const cell = (v: unknown) => {
        let t = v == null ? '' : String(v)
        if (/^[=+\-@]/.test(t)) t = "'" + t                                     // never a spreadsheet formula
        return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
      }
      const rows = [['Code', 'Name', 'Work email', 'Mobile', 'Department', 'Designation', 'Type', 'Status', 'Joined', 'Left'].join(',')]
      all.content.forEach((e: Employee) => rows.push([e.employeeCode, e.fullName, e.officialEmail, e.phonePrimary, e.departmentName, e.designationName,
        e.employmentType, e.status, e.dateOfJoining, e.dateOfExit].map(cell).join(',')))
      const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'employees.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success('Employee list exported')
    } catch { toast.error('Export failed') }
  }


  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active"    value={stats?.totalActive ?? 0} icon={Users}      accent="#3b82f6" format="number" delay={0} />
        <StatCard label="On Notice" value={stats?.onNotice    ?? 0} icon={UserX}      accent="#f59e0b" format="number" delay={60} />
        <StatCard label="On Leave"  value={stats?.onLeave     ?? 0} icon={UserCheck}  accent="#8b5cf6" format="number" delay={120} />
        <StatCard label={dq || status ? 'Matching your search' : 'All employees'} value={data?.totalElements ?? 0} icon={Briefcase}  accent="#14b8a6" format="number" delay={180} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, code..." className="w-72" />
        <select className="input w-36 h-10 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_NOTICE">On Notice</option>
          <option value="RESIGNED">Resigned</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button onClick={() => setView('list')} className="btn-icon rounded-none border-0 w-9 h-9" style={{ background: view==='list' ? 'var(--gold-muted)' : 'transparent', color: view==='list' ? 'var(--gold)' : 'var(--text-muted)' }}><List className="w-4 h-4" /></button>
            <button onClick={() => setView('grid')} className="btn-icon rounded-none border-0 border-l w-9 h-9" style={{ borderColor: 'var(--border)', background: view==='grid' ? 'var(--gold-muted)' : 'transparent', color: view==='grid' ? 'var(--gold)' : 'var(--text-muted)' }}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <button className="btn-secondary h-10 text-sm" onClick={exportEmployees}><Download className="w-4 h-4" />Export CSV</button>
          {canAdd && <Link href="/import?kind=employees" className="btn-secondary h-10 text-sm"><FileUp className="w-4 h-4" />Import</Link>}
          {canAdd && <button onClick={() => { setPrefill(undefined); setShowCreate(true) }} className="btn-primary h-10 text-sm"><Plus className="w-4 h-4" />Add employee</button>}
        </div>
      </div>

      {/* Table or Grid */}
      {view === 'list' ? (
        <>
          <DataTable columns={columns} data={data?.content ?? []} loading={isLoading} keyExtractor={e => e.id} onRowClick={open}
            emptyMessage="No employees match your search."
            empty={q || status ? undefined : (
              <EmptyState compact icon={Users} title="No employees yet"
                description="Add your team with joining date, PAN, bank, PF and ESI details — attendance, leave, payroll and payslips build on these."
                action={canAdd ? { label: 'Add an employee', onClick: () => setShowCreate(true) } : undefined}
                secondary={canAdd ? { label: 'Import from Excel', href: '/import?kind=employees' } : undefined} />
            )} />
          {data && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20} />}
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? Array.from({length:8}).map((_, i) => <div key={i} className="card"><div className="skeleton h-24 mb-3 rounded-xl" /><div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>) :
          (data?.content ?? []).map((e: any, idx: any) => {
            const c = hashColor(e.employeeCode)
            return (
              <button key={e.id} type="button" className="card text-left" style={{ animationDelay: `${idx * 0.04}s` }} onClick={() => open(e)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: c.bg, color: c.text }}>{e.firstName?.[0]}{e.lastName?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{e.fullName}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--gold)', fontSize: '11px' }}>{e.employeeCode}</p>
                  </div>
                </div>
                <p className="text-xs mb-1 truncate" style={{ color: 'var(--text-muted)' }}>{e.officialEmail ?? '—'}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{e.departmentName ?? 'No Department'}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={e.status} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{formatDate(e.dateOfJoining)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {(showCreate || editing) && (
        <EmployeeModal employee={editing} prefill={editing ? undefined : prefill} onClose={() => { setShowCreate(false); setEditing(null); setPrefill(undefined) }} onSaved={saved}
          onSalary={id => { setEditing(null); setSalaryFor(id) }} />
      )}
      {salaryFor && (
        <SalarySetupModal employeeId={salaryFor} onClose={() => setSalaryFor(null)} onSaved={() => { setSalaryFor(null); qc.invalidateQueries({ queryKey: ['payroll-setups'] }) }} />
      )}
    </div>
  )
}
