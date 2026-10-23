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
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Lock, Wallet } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { hrmsApi } from '@/lib/api/hrms'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PLACES_OF_SUPPLY } from '@/lib/money'
import { errText } from '@/lib/purchases'
import { todayIST } from '@/lib/money'
import type { Employee } from '@/types'

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/

type Form = Record<string, string>

const fromEmployee = (e?: Employee | null): Form => ({
  employeeCode: '', firstName: e?.firstName ?? '', middleName: e?.middleName ?? '', lastName: e?.lastName ?? '',
  gender: e?.gender ?? '', dateOfBirth: e?.dateOfBirth ?? '', officialEmail: e?.officialEmail ?? '', personalEmail: e?.personalEmail ?? '',
  phonePrimary: e?.phonePrimary ?? '', departmentId: e?.departmentId ?? '', designationId: e?.designationId ?? '',
  employmentType: e?.employmentType ?? 'PERMANENT', status: e?.status ?? 'ACTIVE', dateOfJoining: e?.dateOfJoining ?? todayIST(),
  dateOfExit: e?.dateOfExit ?? '', ctcAnnual: e?.ctcAnnual ? String(e.ctcAnnual) : '',
  panNumber: e?.panNumber ?? '', pfNumber: e?.pfNumber ?? '', esiNumber: e?.esiNumber ?? '', bankName: e?.bankName ?? '',
  bankAccountNumber: e?.bankAccountNumber ?? '', bankIfsc: e?.bankIfsc ?? '', currentAddress: e?.currentAddress ?? '',
  city: e?.city ?? '', state: e?.state ?? '', pincode: e?.pincode ?? '',
})

/** What's wrong with the form, in plain words (null when it can be saved). */
export function employeeProblem(f: Form, editing: boolean): string | null {
  if (!f.firstName.trim() || !f.lastName.trim()) return 'Enter the first and last name.'
  if (!editing && !f.dateOfJoining) return 'Enter the date of joining.'
  if (f.officialEmail && !/^\S+@\S+\.\S+$/.test(f.officialEmail.trim())) return 'The work email doesn\'t look right.'
  if (f.panNumber && !PAN.test(f.panNumber.trim().toUpperCase())) return 'The PAN should look like ABCDE1234F.'
  if (f.bankIfsc && !IFSC.test(f.bankIfsc.trim().toUpperCase())) return 'The IFSC has 11 characters like HDFC0001234 (the fifth is a zero).'
  const acct = f.bankAccountNumber.replace(/[\s-]/g, '')
  if (acct && !acct.includes('X') && !/^\d{9,18}$/.test(acct)) return 'The bank account number should be 9 to 18 digits.'
  if (acct && !f.bankIfsc) return 'Add the IFSC of the bank branch.'
  if (f.esiNumber && !/^\d{10}$/.test(f.esiNumber.replace(/[\s-]/g, ''))) return 'The ESI IP number has 10 digits.'
  if (f.pincode && !/^[1-9]\d{5}$/.test(f.pincode.trim())) return 'The PIN code has 6 digits.'
  if (f.dateOfExit && f.dateOfJoining && f.dateOfExit < f.dateOfJoining) return 'The leaving date can\'t be before the joining date.'
  if (['RESIGNED', 'TERMINATED'].includes(f.status) && !f.dateOfExit) return 'Enter the leaving date — payroll pays up to that day.'
  return null
}

export function EmployeeModal({ employee, onClose, onSaved, onSalary, prefill }: {
  employee: Employee | null; onClose: () => void; onSaved: (e: Employee) => void; onSalary?: (id: string) => void
  /** Starting values for a new employee (e.g. a candidate just hired). */
  prefill?: Partial<Form>
}) {
  const editing = !!employee
  const { canAny, isAdmin, isHR, isSuperAdmin } = usePermissions()
  const canEdit = isAdmin || isHR || isSuperAdmin
  const seesPrivate = editing ? !!employee?.privateDetails : canEdit
  const start = () => ({ ...fromEmployee(employee), ...(employee ? {} : prefill ?? {}) } as Form)
  const [f, setF] = useState<Form>(start)
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setF(start()) }, [employee, prefill])
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: hrmsApi.employees.departments })
  const { data: designations } = useQuery({ queryKey: ['designations'], queryFn: hrmsApi.employees.designations })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }))
  const problem = employeeProblem(f, editing)

  const save = async () => {
    if (problem) { toast.error(problem); return }
    setSaving(true)
    const strip = (v: string) => v.replace(/[\s-]/g, '')
    const body: Record<string, unknown> = {
      firstName: f.firstName.trim(), middleName: f.middleName, lastName: f.lastName.trim(), gender: f.gender || undefined,
      dateOfBirth: f.dateOfBirth || undefined, officialEmail: f.officialEmail.trim(), personalEmail: f.personalEmail, phonePrimary: f.phonePrimary,
      departmentId: f.departmentId || undefined, designationId: f.designationId || undefined, employmentType: f.employmentType,
      dateOfJoining: f.dateOfJoining || undefined, ctcAnnual: f.ctcAnnual === '' ? (editing ? 0 : undefined) : f.ctcAnnual,
      currentAddress: f.currentAddress, city: f.city, state: f.state, pincode: f.pincode,
    }
    if (seesPrivate) Object.assign(body, {
      panNumber: f.panNumber.trim().toUpperCase(), pfNumber: f.pfNumber.trim().toUpperCase(), esiNumber: strip(f.esiNumber),
      bankName: f.bankName, bankAccountNumber: strip(f.bankAccountNumber), bankIfsc: f.bankIfsc.trim().toUpperCase(),
    })
    if (editing) {
      body.status = f.status
      if (f.dateOfExit) body.dateOfExit = f.dateOfExit
      else if (employee?.dateOfExit) body.clearDateOfExit = true
    } else if (f.employeeCode.trim()) body.employeeCode = f.employeeCode.trim()
    try {
      const saved = editing ? await hrmsApi.employees.update(employee!.id, body as any) : await hrmsApi.employees.create(body as any)
      toast.success(editing ? 'Employee updated' : 'Employee added')
      onSaved(saved)
    } catch (e) {
      toast.error(errText(e, 'Could not save the employee'))
    } finally {
      setSaving(false)
    }
  }

  const input = (k: string, label: string, opts: { type?: string; required?: boolean; placeholder?: string; upper?: boolean; span?: boolean; disabled?: boolean } = {}) => (
    <div className={opts.span ? 'sm:col-span-2' : ''}>
      <label className={`label ${opts.required ? 'label-required' : ''}`} htmlFor={`emp-${k}`}>{label}</label>
      <input id={`emp-${k}`} type={opts.type ?? 'text'} className={`input h-10 ${opts.upper ? 'uppercase font-mono' : ''}`} value={f[k]} placeholder={opts.placeholder}
        disabled={opts.disabled || !canEdit} onChange={set(k)} />
    </div>
  )

  return (
    <Modal open onClose={onClose} size="xl" title={editing ? employee!.fullName : 'Add an employee'}
      subtitle={editing ? `${employee!.employeeCode}${employee!.designationName ? ` · ${employee!.designationName}` : ''}` : 'Payroll uses the joining date, PAN, bank details and PF/ESI numbers entered here'}>
      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-sm mb-3">Person</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {input('firstName', 'First name', { required: true })}
            {input('middleName', 'Middle name')}
            {input('lastName', 'Last name', { required: true })}
            <div>
              <label className="label" htmlFor="emp-gender">Gender</label>
              <select id="emp-gender" className="input h-10" value={f.gender} onChange={set('gender')} disabled={!canEdit}>
                <option value="">—</option><option value="FEMALE">Female</option><option value="MALE">Male</option>
                <option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            {input('dateOfBirth', 'Date of birth', { type: 'date' })}
            {input('phonePrimary', 'Mobile', { placeholder: '98xxxxxxxx' })}
            {input('officialEmail', 'Work email', { type: 'email', placeholder: 'Also their login for My Portal' })}
            {input('personalEmail', 'Personal email', { type: 'email' })}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-sm mb-3">Job</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {!editing && input('employeeCode', 'Employee code', { placeholder: 'Leave blank for EMP-0001…' })}
            <div>
              <label className="label" htmlFor="emp-dept">Department</label>
              <select id="emp-dept" className="input h-10" value={f.departmentId} onChange={set('departmentId')} disabled={!canEdit}>
                <option value="">—</option>
                {(departments ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="emp-desig">Designation</label>
              <select id="emp-desig" className="input h-10" value={f.designationId} onChange={set('designationId')} disabled={!canEdit}>
                <option value="">—</option>
                {(designations ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="emp-type">Employment type</label>
              <select id="emp-type" className="input h-10" value={f.employmentType} onChange={set('employmentType')} disabled={!canEdit}>
                <option value="PERMANENT">Permanent</option><option value="CONTRACT">Contract</option><option value="PART_TIME">Part time</option>
                <option value="INTERN">Intern</option><option value="CONSULTANT">Consultant</option>
              </select>
            </div>
            {editing && (
              <div>
                <label className="label" htmlFor="emp-status">Status</label>
                <select id="emp-status" className="input h-10" value={f.status} onChange={set('status')} disabled={!canEdit}>
                  <option value="ACTIVE">Active</option><option value="ON_NOTICE">On notice</option><option value="ON_LEAVE">On long leave</option>
                  <option value="RESIGNED">Resigned</option><option value="TERMINATED">Terminated</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>
            )}
            {input('dateOfJoining', 'Date of joining', { type: 'date', required: true })}
            {editing && input('dateOfExit', 'Leaving date', { type: 'date' })}
            {seesPrivate && input('ctcAnnual', 'CTC a year (₹)', { type: 'number', placeholder: 'Used to suggest a salary split' })}
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2"><Lock size={13} style={{ color: 'var(--text-muted)' }} />Statutory and bank details</h3>
          {seesPrivate ? (
            <>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Seen only by HR and payroll. The UAN is part of the salary set-up.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {input('panNumber', 'PAN', { upper: true, placeholder: 'ABCDE1234F' })}
                {input('pfNumber', 'PF member ID', { upper: true, placeholder: 'MH/BAN/0012345/000/0000123' })}
                {input('esiNumber', 'ESI IP number', { placeholder: '10 digits' })}
                {input('bankName', 'Bank')}
                {input('bankAccountNumber', 'Account number', { placeholder: '9 to 18 digits' })}
                {input('bankIfsc', 'IFSC', { upper: true, placeholder: 'HDFC0001234' })}
              </div>
            </>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              PAN {employee?.panNumber ?? '—'} · Bank account {employee?.bankAccountNumber ?? '—'} — full details are visible to HR and payroll only.
            </p>
          )}
        </section>

        <section>
          <h3 className="font-semibold text-sm mb-3">Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="label" htmlFor="emp-addr">Address</label>
              <textarea id="emp-addr" className="input resize-none" rows={2} value={f.currentAddress} onChange={set('currentAddress')} disabled={!canEdit} />
            </div>
            {input('city', 'City')}
            <div>
              <label className="label" htmlFor="emp-state">State</label>
              <select id="emp-state" className="input h-10" value={f.state} onChange={set('state')} disabled={!canEdit}>
                <option value="">—</option>
                {PLACES_OF_SUPPLY.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                {f.state && !PLACES_OF_SUPPLY.some(s => s.name === f.state) && <option value={f.state}>{f.state}</option>}
              </select>
            </div>
            {input('pincode', 'PIN code', { placeholder: '6 digits' })}
          </div>
        </section>

        <div className="flex items-center justify-between gap-3 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            {editing && onSalary && canAny('PAYROLL_PROCESS', 'PAYROLL_ADMIN') && (
              <button className="btn-secondary h-10" onClick={() => onSalary(employee!.id)}><Wallet size={15} />Salary set-up</button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {problem && <span className="text-xs" style={{ color: '#b45309' }}>{problem}</span>}
            <button className="btn-secondary h-10" onClick={onClose}>{canEdit ? 'Cancel' : 'Close'}</button>
            {canEdit && <button className="btn-primary h-10" disabled={saving || !!problem} onClick={save}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}</button>}
          </div>
        </div>
      </div>
    </Modal>
  )
}
