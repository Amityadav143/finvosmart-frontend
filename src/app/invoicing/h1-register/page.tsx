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
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ClipboardList, Download, FileText } from 'lucide-react'
import { drugRegisterApi } from '@/lib/api/invoicing'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { EmptyState } from '@/components/ui/EmptyState'
import { downloadBlob, formatDate, apiError } from '@/lib/utils'
import { expiryText, qty } from '@/lib/inventory'
import { todayIST } from '@/lib/money'
import type { DrugRegisterEntry } from '@/types'

const SCHEDULES = [
  { value: '', label: 'Schedule H1 and X' },
  { value: 'H1', label: 'Schedule H1' },
  { value: 'X', label: 'Schedule X' },
]

/**
 * The Schedule H1 register, from the bills issued: every Schedule H1 (and X) medicine sold, with the patient,
 * the prescriber's name and address, the medicine and the quantity — as Rule 65 of the Drugs and Cosmetics
 * Rules, 1945 asks, kept three years. Issued bills are never deleted, only cancelled (and marked here).
 */
export default function DrugRegisterPage() {
  const today = todayIST()
  const [from, setFrom] = useState(today.slice(0, 8) + '01')
  const [to, setTo] = useState(today)
  const [schedule, setSchedule] = useState('')
  const [busy, setBusy] = useState<'' | 'pdf' | 'csv'>('')
  const params = { from, to, ...(schedule ? { schedule } : {}) }
  const bad = !from || !to ? 'Choose both dates.' : from > to ? 'The start is after the end.' : null
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['drug-register', from, to, schedule], queryFn: () => drugRegisterApi.get(params), enabled: !bad, retry: false,
  })
  const rows = data?.entries ?? []
  const save = async (kind: 'pdf' | 'csv') => {
    setBusy(kind)
    try {
      downloadBlob(await drugRegisterApi.file(kind, params), `schedule-h1-register-${from}-to-${to}.${kind}`)
    } catch (e: any) {
      toast.error(apiError(e, 'The register could not be made'))
    } finally { setBusy('') }
  }

  return (
    <PermissionGate anyOf={['INVOICE_VIEW']} showDenied>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Schedule H1 register</h1>
            <p className="text-sm mt-0.5 max-w-3xl" style={{ color: 'var(--text-muted)' }}>
              Every Schedule H1 and X medicine sold on your bills, with the patient, the prescriber&apos;s name and address, the medicine and the
              quantity — as Rule 65 of the Drugs and Cosmetics Rules, 1945 asks, to be kept for three years and shown on inspection. It is made
              from the bills you issue; issued bills are never deleted, only cancelled, and a cancelled one stays here, marked.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary h-9 text-sm" onClick={() => save('csv')} disabled={!!bad || !!busy}><Download className="w-4 h-4" />{busy === 'csv' ? 'Exporting…' : 'Export CSV'}</button>
            <button className="btn-primary h-9 text-sm" onClick={() => save('pdf')} disabled={!!bad || !!busy}><FileText className="w-4 h-4" />{busy === 'pdf' ? 'Preparing…' : 'Download PDF'}</button>
          </div>
        </div>

        <div className="card flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="reg-from">From</label><input id="reg-from" className="input h-10" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="label" htmlFor="reg-to">To</label><input id="reg-to" className="input h-10" type="date" value={to} min={from} onChange={e => setTo(e.target.value)} /></div>
          <div><label className="label" htmlFor="reg-schedule">Medicines</label>
            <select id="reg-schedule" className="input h-10" value={schedule} onChange={e => setSchedule(e.target.value)}>
              {SCHEDULES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select></div>
          <p className="text-xs pb-2.5" style={{ color: bad || isError ? '#dc2626' : 'var(--text-muted)' }}>
            {bad ?? (isError ? apiError(error, 'The register could not be loaded') : data ? `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}${data.truncated ? ' (the first ones only — choose a shorter period)' : ''}` : '')}
          </p>
        </div>

        <div className="card p-0 overflow-x-auto" data-testid="drug-register">
          {!isLoading && rows.length === 0 && !bad && !isError ? (
            <EmptyState compact icon={ClipboardList} title="Nothing in this period"
              description="A sale of a medicine whose Schedule is H1 or X (on the medicine's details) appears here once its bill is issued." />
          ) : (
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['No.', 'Date, bill', 'Patient', 'Prescriber', 'Medicine', 'Quantity'].map(h => <th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>{rows.map(r => <Row key={`${r.serial}-${r.invoiceId}`} r={r} />)}</tbody>
            </table>
          )}
        </div>
      </div>
    </PermissionGate>
  )
}

function Row({ r }: { r: DrugRegisterEntry }) {
  const muted = r.cancelled ? { opacity: 0.6 } : undefined
  const rx = [r.prescriptionRef, r.prescriptionDate ? formatDate(r.prescriptionDate, 'dd-MM-yyyy') : null].filter(Boolean).join(' of ')
  return (
    <tr className="table-row align-top" style={muted} data-register-row={r.serial}>
      <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>{r.serial}</td>
      <td className="table-cell text-xs whitespace-nowrap">
        {formatDate(r.date)}
        <Link href={`/invoicing/${r.invoiceId}`} className="block font-mono hover:underline" style={{ color: 'var(--text-secondary)' }}>{r.invoiceNumber}</Link>
        {r.cancelled && <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Bill cancelled</span>}
      </td>
      <td className="table-cell text-sm">{r.patientName || <span style={{ color: 'var(--text-muted)' }}>{r.customerName} (buyer)</span>}</td>
      <td className="table-cell text-sm">
        <p className="font-medium">{r.prescriberName ?? '—'}</p>
        {r.prescriberRegNo && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reg. no. {r.prescriberRegNo}</p>}
        {r.prescriberAddress && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.prescriberAddress}</p>}
        {rx && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Prescription {rx}</p>}
      </td>
      <td className="table-cell text-sm">
        <p className="font-medium">{r.medicine}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Sch. {r.schedule}{r.batchNo ? ` · Batch ${r.batchNo}` : ''}{r.expiryDate ? ` · Exp. ${expiryText(r.expiryDate)}` : ''}
        </p>
      </td>
      <td className="table-cell font-mono text-sm font-semibold whitespace-nowrap">{qty(r.quantity)} {r.unit ?? ''}</td>
    </tr>
  )
}
