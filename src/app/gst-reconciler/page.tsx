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

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download, FileUp, RefreshCw, Trash2 } from 'lucide-react'
import { itcApi } from '@/lib/api/purchases'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Modal } from '@/components/ui/Modal'
import { Notice } from '@/components/invoicing/InvoiceForm'
import { formatDate } from '@/lib/utils'
import { inr } from '@/lib/money'
import { IMS_LABEL, ITC_LINE, errText } from '@/lib/purchases'
import type { ItcLine, ItcLineStatus, ItcReport } from '@/types/purchases'

const ORDER: ItcLineStatus[] = ['MISMATCH', 'ONLY_IN_2B', 'ONLY_IN_BOOKS', 'PROBABLE', 'NOT_AVAILABLE', 'MATCHED', 'OTHER']
const KIND: Record<string, string> = {
  INVOICE: 'Invoice', DEBIT_NOTE: 'Debit note', CREDIT_NOTE: 'Credit note', BILL_OF_ENTRY: 'Bill of entry', ISD_INVOICE: 'ISD invoice', ISD_CREDIT_NOTE: 'ISD credit note',
}

export default function GstCreditCheckPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [period, setPeriod] = useState<string>('')
  const [show, setShow] = useState<ItcLineStatus | 'ALL'>('ALL')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: statements = [] } = useQuery({ queryKey: ['itc-statements'], queryFn: itcApi.statements })
  useEffect(() => { if (!period && statements.length) setPeriod(statements[0].period) }, [statements, period])
  const { data: report, isLoading, isError } = useQuery({ queryKey: ['itc-report', period], queryFn: () => itcApi.report(period), enabled: !!period })

  const after = (r: ItcReport, msg: string) => {
    qc.setQueryData(['itc-report', r.statement.period], r)
    qc.invalidateQueries({ queryKey: ['itc-statements'] })
    qc.invalidateQueries({ queryKey: ['bills'] })
    setPeriod(r.statement.period)
    setShow('ALL')
    toast.success(msg)
  }
  const upload = useMutation({
    mutationFn: (files: File[]) => itcApi.upload(files),
    onSuccess: r => after(r, `GSTR-2B for ${r.statement.periodLabel} checked: ${r.summary.documents} documents`),
    onError: (e: any) => toast.error(errText(e, 'The file could not be read')),
  })
  const recheck = useMutation({ mutationFn: () => itcApi.recheck(period), onSuccess: r => after(r, 'Checked again against your books'), onError: (e: any) => toast.error(errText(e, 'Could not check again')) })
  const remove = useMutation({
    mutationFn: () => itcApi.remove(period),
    onSuccess: () => { toast.success('Statement removed'); setConfirmDelete(false); setPeriod(''); qc.invalidateQueries({ queryKey: ['itc-statements'] }); qc.removeQueries({ queryKey: ['itc-report', period] }) },
    onError: (e: any) => toast.error(errText(e, 'Could not remove it')),
  })

  const onFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []).filter(f => /\.(json|zip)$/i.test(f.name))
    if (!files.length) { toast.error('Choose the .json (or .zip) file downloaded from the GST portal'); return }
    upload.mutate(files)
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const l of report?.lines ?? []) c[l.status] = (c[l.status] ?? 0) + 1
    return c
  }, [report])
  const lines = (report?.lines ?? []).filter(l => show === 'ALL' || l.status === show)
  const s = report?.summary

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">GST credit check</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Compare GSTR-2B — what your suppliers reported — with the bills in your books, before you file GSTR-3B</p>
        </div>
        {statements.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <select className="input h-9 text-sm" style={{ maxWidth: 260 }} value={period} onChange={e => setPeriod(e.target.value)} aria-label="Month">
              {statements.map(st => <option key={st.period} value={st.period}>{st.periodLabel} · {st.documentCount} documents</option>)}
            </select>
            <PermissionGate permission="GST_RECON_RUN">
              <button className="btn-secondary h-9" disabled={!period || recheck.isPending} onClick={() => recheck.mutate()} title="After recording or correcting bills"><RefreshCw size={14} />{recheck.isPending ? 'Checking…' : 'Check again'}</button>
            </PermissionGate>
            <button className="btn-secondary h-9" disabled={!period} onClick={() => itcApi.csv(period).catch(() => toast.error('Export failed'))}><Download size={14} />CSV with IMS actions</button>
            <PermissionGate permission="GST_RECON_RUN">
              <button className="btn-icon w-9 h-9" aria-label="Remove this month's statement" disabled={!period} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></button>
            </PermissionGate>
          </div>
        )}
      </div>

      <PermissionGate permission="GST_RECON_RUN">
        <div className="card">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <h3 className="font-semibold text-sm">Upload a month's GSTR-2B</h3>
              <ol className="text-sm mt-2 space-y-1 list-decimal pl-5" style={{ color: 'var(--text-secondary)' }}>
                <li>On the GST portal, open <strong>Returns → GSTR-2B</strong> (or the IMS dashboard) and pick the month.</li>
                <li>Choose <strong>Download → Generate JSON file</strong>. A large month may come as a .zip — upload it as it is.</li>
                <li>Upload it here. Uploading a month again replaces it (for example after the statement is recomputed).</li>
              </ol>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>The file is read on our server and kept with your company. Nothing is sent to the GST portal, and no GST login is needed.</p>
            </div>
            <div className="w-full md:w-72 rounded-xl flex flex-col items-center justify-center gap-2 p-5 text-center cursor-pointer"
              style={{ border: '2px dashed var(--border-strong)', background: 'var(--bg-surface)' }}
              onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files) }}
              role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }} aria-label="Choose the GSTR-2B file">
              <FileUp size={22} style={{ color: 'var(--gold)' }} />
              <p className="text-sm font-medium">{upload.isPending ? 'Reading the statement…' : 'Choose or drop the file'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>.json or .zip, up to 40 MB</p>
              <input ref={fileRef} type="file" accept=".json,.zip,application/json,application/zip" multiple hidden onChange={e => { onFiles(e.target.files); e.target.value = '' }} />
            </div>
          </div>
        </div>
      </PermissionGate>

      {!statements.length && !upload.isPending && (
        <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>No statement uploaded yet. Once you upload one, each bill in your books shows whether its GST credit is on GSTR-2B.</div>
      )}
      {isLoading && period && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The check for this month couldn't be loaded.</div>}

      {report && s && (
        <>
          {report.statement.warnings.map(w => <Notice key={w} tone="amber">{w}</Notice>)}
          {report.statement.gstin && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {report.statement.source} for {report.statement.periodLabel} · GSTIN {report.statement.gstin}{report.statement.generatedOn ? ` · generated ${formatDate(report.statement.generatedOn)}` : ''}{report.statement.fileName ? ` · ${report.statement.fileName}` : ''}
          </p>}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card label="Credit available on GSTR-2B" value={inr(s.itcIn2b)} color="var(--gold)" sub={`In your books for these bills: ${inr(s.itcInBooks)}`} />
            <Card label="Matched" value={inr(s.itcMatched)} color="#16a34a" sub={`${s.matched + s.probable} document${s.matched + s.probable === 1 ? '' : 's'}${s.probable ? ` (${s.probable} probable)` : ''}`} />
            <Card label="Differences to sort out" value={inr(s.itcMismatched)} color="#d97706" sub={`${s.mismatched} document${s.mismatched === 1 ? '' : 's'} differ`} onClick={() => setShow('MISMATCH')} />
            <Card label="At risk: not on GSTR-2B" value={inr(s.itcOnlyInBooks)} color="#dc2626" sub={`${s.onlyInBooks} bill${s.onlyInBooks === 1 ? '' : 's'} the suppliers haven't reported`} onClick={() => setShow('ONLY_IN_BOOKS')} />
            <Card label="On GSTR-2B, not in your books" value={inr(s.itcOnlyIn2b)} color="#2563eb" sub={`${s.onlyIn2b} document${s.onlyIn2b === 1 ? '' : 's'} — record or reject`} onClick={() => setShow('ONLY_IN_2B')} />
            <Card label="No credit available" value={inr(s.itcNotAvailable)} color="#64748b" sub={`${s.notAvailable} document${s.notAvailable === 1 ? '' : 's'}`} onClick={() => setShow('NOT_AVAILABLE')} />
            {Number(s.reverseChargeTax) > 0 && <Card label="Reverse charge (pay yourself)" value={inr(s.reverseChargeTax)} color="#7c3aed" sub="Paid in cash through GSTR-3B, then claimed" />}
            {Number(s.importsIgst) > 0 && <Card label="IGST on imports" value={inr(s.importsIgst)} color="#0d9488" sub="From bills of entry" />}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className={show === 'ALL' ? 'btn-primary h-8 text-xs' : 'btn-secondary h-8 text-xs'} onClick={() => setShow('ALL')}>All · {report.lines.length}</button>
            {ORDER.filter(st => counts[st]).map(st => (
              <button key={st} className={show === st ? 'btn-primary h-8 text-xs' : 'btn-secondary h-8 text-xs'} onClick={() => setShow(st)} title={ITC_LINE[st].help}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: ITC_LINE[st].color }} />{ITC_LINE[st].label} · {counts[st]}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th className="text-left font-medium px-4 py-3">Result</th>
                  <th className="text-left font-medium px-3 py-3">Supplier</th>
                  <th className="text-left font-medium px-3 py-3">On GSTR-2B</th>
                  <th className="text-left font-medium px-3 py-3">In your books</th>
                  <th className="text-left font-medium px-3 py-3">What to do</th>
                  <th className="text-left font-medium px-4 py-3">IMS</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => <Row key={(l.documentId ?? '') + (l.billId ?? '') + i} l={l} />)}
                {lines.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>Nothing here.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            IMS = the Invoice Management System on the GST portal, where you accept, reject or keep pending each supplier document before GSTR-2B is finalised.
            Documents you don't act on are treated as accepted. Suggestions here are a guide — the decision is yours.
          </p>
        </>
      )}

      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(false)} title="Remove this month's statement?" size="sm">
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bills found in it go back to "not checked". You can upload the statement again at any time.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary h-10" onClick={() => setConfirmDelete(false)}>Keep it</button>
              <button className="btn-danger h-10" disabled={remove.isPending} onClick={() => remove.mutate()}>{remove.isPending ? 'Removing…' : 'Remove'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Card({ label, value, color, sub, onClick }: { label: string; value: string; color: string; sub?: string; onClick?: () => void }) {
  const body = <>
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="font-serif text-2xl mt-1" style={{ color }}>{value}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
  </>
  return onClick ? <button className="card text-left" onClick={onClick}>{body}</button> : <div className="card">{body}</div>
}

function Row({ l }: { l: ItcLine }) {
  const st = ITC_LINE[l.status]
  const ims = l.imsAction ? IMS_LABEL[l.imsAction] : null
  return (
    <tr style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
      <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: st.color }}><span className="w-2 h-2 rounded-full" style={{ background: st.color }} />{st.label}</span></td>
      <td className="px-3 py-3">
        <p className="font-medium">{l.supplierName ?? '—'}</p>
        {l.supplierGstin && <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.supplierGstin}</p>}
      </td>
      <td className="px-3 py-3">
        {l.documentNumber || l.kind ? <>
          <p className="font-mono text-xs">{KIND[l.kind ?? ''] ?? l.kind} {l.documentNumber}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(l.documentDate)} · value {inr(l.taxable)}</p>
          <p className="text-xs">GST <span className="font-mono">{inr(l.tax)}</span>{l.reverseCharge ? ' · reverse charge' : ''}</p>
        </> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td className="px-3 py-3">
        {l.billId ? <>
          <Link href={`/purchases/bills/${l.billId}`} className="font-mono text-xs underline">{l.billReference}</Link>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.billNumber ? `No. ${l.billNumber} · ` : ''}{formatDate(l.billDate)}</p>
          <p className="text-xs">GST <span className="font-mono">{inr(l.billTax)}</span>{l.billCreditBlocked ? ' · credit blocked' : ''}</p>
        </> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td className="px-3 py-3 text-xs" style={{ maxWidth: 360 }}>
        {l.differences.map(d => <p key={d} style={{ color: d.startsWith('Date') || d.startsWith('Number') ? 'var(--text-secondary)' : '#b45309' }}>{d}</p>)}
        {l.advice && <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{l.advice}</p>}
        {l.status === 'ONLY_IN_2B' && l.documentId && (
          <PermissionGate anyOf={['PROCUREMENT_CREATE', 'FINANCE_CREATE']}>
            <Link href={`/purchases/bills/new?from2b=${l.documentId}`} className="btn-secondary h-7 text-xs mt-2 inline-flex">Record this bill</Link>
          </PermissionGate>
        )}
      </td>
      <td className="px-4 py-3">{ims ? <span className="text-xs font-semibold" style={{ color: ims.color }}>{ims.label}</span> : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}</td>
    </tr>
  )
}
