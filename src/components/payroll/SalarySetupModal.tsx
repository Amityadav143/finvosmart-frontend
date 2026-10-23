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

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, Calculator, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { payrollApi, PT_BUILT_IN, PT_NONE } from '@/lib/api/payroll'
import { useDebounce } from '@/lib/hooks'
import { inr, PLACES_OF_SUPPLY, stateName } from '@/lib/money'
import { errText } from '@/lib/purchases'
import type { SalarySetup, SalarySetupInput } from '@/types/payroll'

type Form = Record<keyof SalarySetupInput, any>

const MONEY: (keyof SalarySetupInput)[] = ['basic', 'da', 'hra', 'conveyance', 'specialAllowance', 'otherAllowance', 'fixedDeduction',
  'rentPaidMonthly', 'declared80c', 'declared80d', 'declaredNps', 'otherIncome', 'previousEmployerSalary', 'previousEmployerTds']

const toForm = (s: SalarySetup): Form => {
  const f: any = { ...s }
  for (const k of MONEY) f[k] = Number(s[k] ?? 0) === 0 ? '' : String(s[k])
  f.ptFixed = s.ptFixed == null ? '' : String(s.ptFixed)
  f.uan = s.uan ?? ''
  f.fixedDeductionLabel = s.fixedDeductionLabel ?? ''
  f.workState = s.workState ?? ''
  f.notes = s.notes ?? ''
  return f
}

const toInput = (f: Form): SalarySetupInput => {
  const out: any = {}
  for (const k of MONEY) out[k] = f[k] === '' || f[k] == null ? 0 : f[k]
  return {
    ...out, fixedDeductionLabel: f.fixedDeductionLabel || null, pfMode: f.pfMode, epsMember: !!f.epsMember, uan: f.uan || null,
    esiMode: f.esiMode, disabled: !!f.disabled, workState: f.workState || null, ptExempt: !!f.ptExempt,
    ptFixed: f.ptFixed === '' ? null : f.ptFixed, taxRegime: f.taxRegime, metroCity: !!f.metroCity, notes: f.notes || null,
  }
}

/**
 * A starting split of yearly CTC into monthly components that meets the labour codes' 50%
 * rule: basic is half of gross, HRA 40% of basic, the rest special allowance. The employer's
 * PF (12%, plus 1% EDLI and admin) on wages up to ₹25,000 and ESI (3.25% up to ₹21,000 gross)
 * come out of the CTC first. Wages here are basic plus special allowance: 80% of gross.
 */
export function splitCtc(ctcAnnual: number) {
  const monthly = ctcAnnual / 12
  let gross = monthly - 0.13 * 25000                           // PF on the full ₹25,000 limit
  if (gross * 0.8 <= 25000) {
    gross = monthly / (1 + 0.13 * 0.8)
    if (gross <= 21000) gross = monthly / (1 + 0.13 * 0.8 + 0.0325)
  }
  gross = Math.max(0, Math.floor(gross))
  const basic = Math.round(gross * 0.5), hra = Math.round(basic * 0.4)
  return { basic, hra, special: Math.max(0, gross - basic - hra) }
}

export function SalarySetupModal({ employeeId, onClose, onSaved }: { employeeId: string; onClose: () => void; onSaved: () => void }) {
  const { data: setup, isLoading, isError } = useQuery({ queryKey: ['payroll-setup', employeeId], queryFn: () => payrollApi.setup(employeeId) })
  const [f, setF] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (setup) setF(toForm(setup)) }, [setup])

  const input = useMemo(() => (f ? toInput(f) : null), [f])
  const debounced = useDebounce(input, 450)
  const { data: preview, isFetching: previewing, error: previewError } = useQuery({
    queryKey: ['payroll-preview', employeeId, debounced],
    queryFn: () => payrollApi.preview(employeeId, debounced!),
    enabled: !!debounced && Number(debounced.basic) > 0,
    placeholderData: prev => prev,
    retry: false,
  })

  const set = (k: keyof SalarySetupInput, v: any) => setF(s => (s ? { ...s, [k]: v } : s))
  const money = (k: keyof SalarySetupInput, label: string, hint?: string) => (
    <div>
      <label className="label" htmlFor={`ss-${k}`}>{label}</label>
      <input id={`ss-${k}`} type="number" min="0" step="0.01" inputMode="decimal" className="input h-10 font-mono" value={f?.[k] ?? ''}
        onChange={e => set(k, e.target.value)} />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )

  const save = async () => {
    if (!f || !input) return
    if (!(Number(input.basic) > 0)) { toast.error('Enter the basic pay (monthly).'); return }
    setSaving(true)
    try {
      await payrollApi.saveSetup(employeeId, input)
      toast.success('Salary set-up saved')
      onSaved()
    } catch (e) {
      toast.error(errText(e, 'Could not save the salary set-up'))
    } finally {
      setSaving(false)
    }
  }

  const gross = f ? ['basic', 'da', 'hra', 'conveyance', 'specialAllowance', 'otherAllowance'].reduce((t, k) => t + Number(f[k as keyof Form] || 0), 0) : 0
  const ptState = f?.workState as string
  const ptKind = !ptState ? 'none-set' : PT_BUILT_IN.includes(ptState) ? 'built-in' : PT_NONE.includes(ptState) ? 'no-pt' : 'manual'

  return (
    <Modal open onClose={onClose} size="xl" title={setup ? `Salary set-up — ${setup.name}` : 'Salary set-up'}
      subtitle="Full-month amounts. Payroll pays them for the days worked and works out PF, ESI, professional tax and TDS">
      {isLoading || !f ? (
        <p className="text-sm" style={{ color: isError ? '#dc2626' : 'var(--text-muted)' }}>{isError ? 'This set-up could not be loaded.' : 'Loading…'}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">Monthly pay</h3>
                {setup?.ctcAnnual && Number(setup.ctcAnnual) > 0 && (
                  <button type="button" className="btn-secondary h-8 text-xs" onClick={() => {
                    const s = splitCtc(Number(setup.ctcAnnual))
                    setF(x => x ? { ...x, basic: String(s.basic), hra: String(s.hra), specialAllowance: String(s.special), da: '', conveyance: '', otherAllowance: '' } : x)
                  }}><Calculator size={13} />Split CTC of {inr(setup.ctcAnnual)}</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {money('basic', 'Basic pay *')}
                {money('da', 'Dearness allowance')}
                {money('hra', 'House rent allowance')}
                {money('conveyance', 'Conveyance allowance')}
                {money('specialAllowance', 'Special allowance')}
                {money('otherAllowance', 'Other allowance')}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Gross {inr(gross)} a month. Under the labour codes, HRA, conveyance and similar allowances above half of pay count as wages for PF.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {money('fixedDeduction', 'Fixed monthly deduction')}
                <div className="md:col-span-2">
                  <label className="label" htmlFor="ss-fdl">Deduction name</label>
                  <input id="ss-fdl" className="input h-10" maxLength={60} placeholder="For example: canteen, loan instalment" value={f.fixedDeductionLabel}
                    onChange={e => set('fixedDeductionLabel', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-sm">Provident fund and ESI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="ss-pf">Provident fund</label>
                  <select id="ss-pf" className="input h-10" value={f.pfMode} onChange={e => set('pfMode', e.target.value)}>
                    <option value="CEILING">On wages up to ₹25,000</option>
                    <option value="ACTUAL">On full wages</option>
                    <option value="NONE">Not a PF member</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="ss-uan">UAN</label>
                  <input id="ss-uan" className="input h-10 font-mono" inputMode="numeric" placeholder="12 digits" value={f.uan}
                    onChange={e => set('uan', e.target.value.replace(/\D/g, '').slice(0, 12))} />
                </div>
                <label className="flex items-start gap-2 text-sm md:col-span-2">
                  <input type="checkbox" className="mt-1" checked={!!f.epsMember} onChange={e => set('epsMember', e.target.checked)} />
                  <span>In the pension scheme (EPS)<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                    Untick only for members who joined with wages above the limit. From 17 Sep 2026 members earning up to ₹25,000 are covered anyway.</span></span>
                </label>
                <div>
                  <label className="label" htmlFor="ss-esi">ESI</label>
                  <select id="ss-esi" className="input h-10" value={f.esiMode} onChange={e => set('esiMode', e.target.value)}>
                    <option value="AUTO">By pay (up to ₹21,000)</option>
                    <option value="ALWAYS">Always covered</option>
                    <option value="NEVER">Not covered</option>
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm pt-6">
                  <input type="checkbox" className="mt-1" checked={!!f.disabled} onChange={e => set('disabled', e.target.checked)} />
                  <span>Person with disability<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>ESI limit ₹25,000</span></span>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-sm">Professional tax</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="ss-state">Work state</label>
                  <select id="ss-state" className="input h-10" value={f.workState} onChange={e => set('workState', e.target.value)}>
                    <option value="">Choose…</option>
                    {PLACES_OF_SUPPLY.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {ptKind === 'built-in' ? `${stateName(ptState)}'s slabs are built in.`
                      : ptKind === 'no-pt' ? `${stateName(ptState)} doesn't levy professional tax.`
                      : ptKind === 'manual' ? `Enter the monthly amount for ${stateName(ptState)} if it applies.` : 'Professional tax follows the place of work.'}
                  </p>
                </div>
                <div>
                  <label className="label" htmlFor="ss-ptf">Fixed monthly amount (optional)</label>
                  <input id="ss-ptf" type="number" min="0" step="1" className="input h-10 font-mono" value={f.ptFixed} placeholder={ptKind === 'built-in' ? 'Worked out from slabs' : ''}
                    onChange={e => set('ptFixed', e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={!!f.ptExempt} onChange={e => set('ptExempt', e.target.checked)} />
                  Exempt from professional tax (for example, disability or senior citizen exemptions)
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-semibold text-sm">Income tax</h3>
              <div className="flex gap-4 text-sm">
                {(['NEW', 'OLD'] as const).map(r => (
                  <label key={r} className="flex items-center gap-2">
                    <input type="radio" name="regime" checked={f.taxRegime === r} onChange={() => set('taxRegime', r)} />
                    {r === 'NEW' ? 'New regime (default)' : 'Old regime'}
                  </label>
                ))}
              </div>
              {f.taxRegime === 'OLD' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {money('rentPaidMonthly', 'Rent paid a month')}
                  <label className="flex items-center gap-2 text-sm pt-6">
                    <input type="checkbox" checked={!!f.metroCity} onChange={e => set('metroCity', e.target.checked)} />Lives in a metro (50% HRA)
                  </label>
                  <div />
                  {money('declared80c', '80C investments (year)', 'PF is added automatically')}
                  {money('declared80d', '80D health insurance (year)')}
                  {money('declaredNps', 'Own NPS, 80CCD(1B) (year)')}
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {money('previousEmployerSalary', 'Salary from previous employer this year')}
                {money('previousEmployerTds', 'TDS by previous employer')}
                {money('otherIncome', 'Other income to tax through salary (year)')}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-2">
            <div className="rounded-xl p-4 space-y-3 lg:sticky lg:top-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="font-semibold text-sm flex items-center gap-2"><Info size={14} style={{ color: 'var(--gold)' }} />
                A full month{preview ? ` — ${preview.month}` : ''}{previewing ? '…' : ''}</h3>
              {!preview ? (
                <p className="text-sm" style={{ color: previewError ? '#dc2626' : 'var(--text-muted)' }}>
                  {previewError ? errText(previewError, 'Could not work this out') : 'Enter the basic pay to see PF, ESI, tax and net pay.'}
                </p>
              ) : (
                <>
                  <PRow k="Gross pay" v={inr(preview.gross)} />
                  <PRow k="Wages (labour codes)" v={inr(preview.codeWages)} />
                  {Number(preview.wagesAddedBack) > 0 && <p className="text-xs" style={{ color: '#b45309' }}>{inr(preview.wagesAddedBack)} of allowances counts as wages (allowances above half of pay).</p>}
                  <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {preview.deductions.map(d => <PRow key={d.code} k={d.label} v={`− ${inr(d.amount)}`} />)}
                  </div>
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <PRow k="Net pay" v={inr(preview.netPay)} strong />
                    <PRow k="Cost to company" v={inr(preview.employerCost)} />
                    <PRow k="…of which yearly" v={inr(Number(preview.employerCost) * 12)} />
                  </div>
                  <div className="pt-2 text-xs space-y-0.5" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <p>Employer PF {inr(Number(preview.pf.eps) + Number(preview.pf.employer))}{Number(preview.esi.employer) > 0 ? ` · employer ESI ${inr(preview.esi.employer)}` : ''}</p>
                    <p>Tax for the year {inr(preview.tax.annualTax)} on {inr(preview.tax.taxableIncome)} ({preview.tax.regime === 'OLD' ? 'old' : 'new'} regime)</p>
                  </div>
                  {preview.warnings.length > 0 && (
                    <ul className="text-xs space-y-1" style={{ color: '#b45309' }}>
                      {preview.warnings.map(w => <li key={w} className="flex gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" />{w}</li>)}
                    </ul>
                  )}
                  {preview.notes.length > 0 && (
                    <ul className="text-xs space-y-1 list-disc pl-4" style={{ color: 'var(--text-muted)' }}>{preview.notes.map(x => <li key={x}>{x}</li>)}</ul>
                  )}
                </>
              )}
              {setup && (!setup.pan || !setup.bankReady) && (
                <p className="text-xs pt-2" style={{ borderTop: '1px solid var(--border)', color: '#b45309' }}>
                  {!setup.pan ? 'No PAN on the employee record — TDS would be at 20% where tax is due. ' : ''}
                  {!setup.bankReady ? 'No valid bank account and IFSC on the employee record — salary can\'t go in the bank file.' : ''}
                </p>
              )}
            </div>
          </aside>

          <div className="lg:col-span-5 flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save set-up'}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function PRow({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-sm ${strong ? 'font-semibold' : ''}`}>
      <span style={{ color: strong ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  )
}
