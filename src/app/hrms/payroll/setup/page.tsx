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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Info } from 'lucide-react'
import { payrollApi, PF_MODE_LABEL } from '@/lib/api/payroll'
import { DataTable } from '@/components/ui/Table'
import { SearchInput } from '@/components/ui/SearchInput'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SalarySetupModal } from '@/components/payroll/SalarySetupModal'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { inr, stateName } from '@/lib/money'
import type { SalarySetupRow } from '@/types/payroll'

const PREPARE = ['PAYROLL_PROCESS', 'PAYROLL_ADMIN']

export default function SalarySetupPage() {
  const qc = useQueryClient()
  const { canAny } = usePermissions()
  const allowed = canAny(...PREPARE)
  const { data, isLoading, isError } = useQuery({ queryKey: ['payroll-setups'], queryFn: payrollApi.setups, enabled: allowed })
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)

  if (!allowed) return <PermissionGate anyOf={PREPARE} showDenied><div /></PermissionGate>

  const rows = (data ?? []).filter(r => {
    if (onlyMissing && r.hasSetup) return false
    const q = search.trim().toLowerCase()
    return !q || [r.name, r.employeeCode, r.department, r.designation].some(x => (x ?? '').toLowerCase().includes(q))
  })
  const missing = (data ?? []).filter(r => !r.hasSetup).length

  const columns = [
    {
      header: 'Employee',
      render: (r: SalarySetupRow) => (
        <div>
          <p className="font-medium text-sm">{r.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[r.employeeCode, r.designation, r.department].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    {
      header: 'Monthly pay',
      className: 'text-right',
      render: (r: SalarySetupRow) => r.hasSetup ? <span className="font-mono text-sm">{inr(r.monthlyGross)}</span> : <span className="badge s-amber">Not set up</span>,
    },
    {
      header: 'Wages (labour codes)',
      className: 'text-right',
      render: (r: SalarySetupRow) => r.hasSetup ? <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{inr(r.codeWages)}</span> : '—',
    },
    { header: 'PF', render: (r: SalarySetupRow) => <span className="text-xs">{r.pfMode ? PF_MODE_LABEL[r.pfMode] : '—'}</span> },
    { header: 'Work state', render: (r: SalarySetupRow) => <span className="text-xs">{stateName(r.workState) || '—'}</span> },
    { header: 'Tax', render: (r: SalarySetupRow) => <span className="text-xs">{r.taxRegime === 'OLD' ? 'Old regime' : r.taxRegime ? 'New regime' : '—'}</span> },
    {
      header: 'Still needed',
      render: (r: SalarySetupRow) => r.missing.length === 0
        ? <span className="badge s-green">Ready</span>
        : <span className="flex flex-wrap gap-1">{r.missing.map(m => <span key={m} className="badge s-amber">{m}</span>)}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <Link href="/hrms/payroll" className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={13} />Payroll</Link>
        <h1 className="page-title mt-1">Salary set-up</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Monthly pay for each employee, and their PF, ESI, professional tax and income-tax choices. Click an employee to set up or change their salary.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <Info size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ color: 'var(--text-secondary)' }}>
          Since 21 November 2025 the labour codes count everything except HRA, conveyance, overtime, bonus, commission and similar items as
          wages — and if those items are more than half of pay, the excess counts too. PF is worked out on these wages (up to ₹25,000 from
          September 2026). Bank details, PAN and ESI numbers are taken from the employee's record.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button className={onlyMissing ? 'btn-primary h-8 text-xs' : 'btn-secondary h-8 text-xs'} aria-pressed={onlyMissing} onClick={() => setOnlyMissing(v => !v)}>
          Not set up{missing ? ` (${missing})` : ''}
        </button>
        <SearchInput value={search} onChange={setSearch} placeholder="Name, code or department…" className="w-72 ml-auto" />
      </div>

      {isError ? (
        <div className="card text-sm" style={{ color: '#dc2626' }}>Salary set-ups couldn't be loaded. Check your connection and try again.</div>
      ) : (
        <DataTable columns={columns} data={rows} loading={isLoading} keyExtractor={r => r.employeeId} onRowClick={r => setEditing(r.employeeId)}
          emptyMessage={search ? 'Nobody matches.' : onlyMissing ? 'Everyone has a salary set-up.' : 'No employees yet. Add employees under People → Employees first.'} />
      )}

      {editing && (
        <SalarySetupModal employeeId={editing} onClose={() => setEditing(null)} onSaved={() => {
          setEditing(null)
          qc.invalidateQueries({ queryKey: ['payroll-setups'] })
          qc.invalidateQueries({ queryKey: ['payroll-setup'] })
        }} />
      )}
    </div>
  )
}
