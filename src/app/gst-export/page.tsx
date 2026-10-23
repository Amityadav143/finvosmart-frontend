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
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Download, FileJson, FileSpreadsheet, Info, ListChecks } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { gstReturnsApi, type GstFile } from '@/lib/api/gstReturns'
import { inr } from '@/lib/money'
import { errText } from '@/lib/purchases'
import type { GstMoney, GstNotice, GstNoticeLevel, Gstr3bRow } from '@/types/gst'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Returns are filed for the month gone by: open on the previous month (IST). */
function lastMonth() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const m = now.getMonth() === 0 ? 12 : now.getMonth()
  return { month: m, year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(), current: { month: now.getMonth() + 1, year: now.getFullYear() } }
}

const LEVEL: Record<GstNoticeLevel, { label: string; color: string; icon: any }> = {
  FIX: { label: 'Fix before filing', color: '#dc2626', icon: AlertTriangle },
  CHECK: { label: 'Check', color: '#b45309', icon: ListChecks },
  INFO: { label: 'Note', color: '#2563eb', icon: Info },
}

/** A download failed: the server's explanation is inside the blob. */
async function downloadError(e: any, fallback: string) {
  const d = e?.response?.data
  if (d instanceof Blob) {
    try { const j = JSON.parse(await d.text()); return j?.message ?? fallback } catch { return fallback }
  }
  return errText(e, fallback)
}

export default function GstReturnsPage() {
  const start = lastMonth()
  const [month, setMonth] = useState(start.month)
  const [year, setYear] = useState(start.year)
  const [busy, setBusy] = useState<GstFile | null>(null)
  const years = Array.from({ length: start.current.year - 2017 + 1 }, (_, i) => start.current.year - i)
  const future = year > start.current.year || (year === start.current.year && month > start.current.month)

  const { data: s, isLoading, isError, error } = useQuery({
    queryKey: ['gst-returns', month, year],
    queryFn: () => gstReturnsApi.summary(month, year),
    enabled: !future,
  })

  const get = async (file: GstFile) => {
    setBusy(file)
    try {
      await gstReturnsApi.download(file, month, year)
    } catch (e: any) {
      toast.error(await downloadError(e, 'The file could not be prepared'))
    } finally {
      setBusy(null)
    }
  }

  const notices: (GstNotice & { form: string })[] = s ? [
    ...s.gstr1.notices.map(n => ({ ...n, form: 'GSTR-1' })),
    ...s.gstr3b.notices.map(n => ({ ...n, form: 'GSTR-3B' })),
  ].sort((a, b) => order(a.level) - order(b.level)) : []
  const fixes = notices.filter(n => n.level === 'FIX').length

  return (
    <PermissionGate permission="GST_RECON_VIEW" showDenied>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">GST returns</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              GSTR-1 and GSTR-3B for a month, worked out from your invoices and bills. Check them here, then download the files for the GST portal.
            </p>
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Return period">
            <select className="input h-9 text-sm" style={{ minWidth: 150 }} value={month} onChange={e => setMonth(Number(e.target.value))} aria-label="Month">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select className="input h-9 text-sm" style={{ minWidth: 96 }} value={year} onChange={e => setYear(Number(e.target.value))} aria-label="Year">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {future && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>{MONTHS[month - 1]} {year} hasn't started yet. Choose a month that has.</div>}
        {!future && isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Working out the returns…</div>}
        {!future && isError && <div className="card text-sm" style={{ color: '#dc2626' }}>{errText(error, 'The returns for this month could not be worked out.')}</div>}

        {s && (
          <>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {s.label} · {s.gstin ? `GSTIN ${s.gstin}` : 'GSTIN not set'}{s.businessName ? ` · ${s.businessName}` : ''} · monthly filers: GSTR-1 due {s.dueGstr1}, GSTR-3B due {s.dueGstr3b}
            </p>

            {notices.length > 0 && (
              <div className="card space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="font-semibold text-sm">Before you file</h2>
                  <span className="text-xs inline-flex items-center gap-1.5" style={{ color: fixes ? '#dc2626' : '#16a34a' }}>
                    {fixes ? <AlertTriangle size={13} aria-hidden /> : <CheckCircle2 size={13} aria-hidden />}
                    {fixes ? `${fixes} thing${fixes === 1 ? '' : 's'} to fix` : 'Nothing that stops filing'}
                  </span>
                </div>
                <ul className="space-y-2">
                  {notices.map((n, i) => {
                    const l = LEVEL[n.level]
                    return (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <l.icon size={15} aria-hidden style={{ color: l.color, flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <span className="font-semibold" style={{ color: l.color }}>{l.label}</span>
                          <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>{n.form}</span>
                          <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.text}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* ── GSTR-1 ── */}
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold">GSTR-1 — sales</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {s.gstr1.nothingToReport ? 'Nothing to report this month: file a nil GSTR-1.' : `${s.gstr1.documents} document${s.gstr1.documents === 1 ? '' : 's'} issued this month, by section of the return.`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-primary h-9 text-sm" disabled={busy !== null || !s.gstin} onClick={() => get('gstr1/json')}
                    title={s.gstin ? 'Upload on the portal: GSTR-1 → Prepare offline → Upload' : 'Add your GSTIN in Settings → Company first'}>
                    <FileJson size={15} />{busy === 'gstr1/json' ? 'Preparing…' : 'JSON for the portal'}
                  </button>
                  <button className="btn-secondary h-9 text-sm" disabled={busy !== null} onClick={() => get('gstr1/excel')}>
                    <FileSpreadsheet size={15} />{busy === 'gstr1/excel' ? 'Preparing…' : 'Excel'}
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="table-header">Section</th><th className="table-header">Table</th><th className="table-header">Count</th>
                    <th className="table-header text-right">Taxable value</th><th className="table-header text-right">Tax</th>
                  </tr></thead>
                  <tbody>
                    {s.gstr1.sections.map(sec => {
                      const empty = sec.count.startsWith('0 ')
                      return (
                        <tr key={sec.key} className="table-row" style={{ opacity: empty ? 0.55 : 1 }}>
                          <td className="table-cell" style={{ minWidth: 230 }}>{sec.title}</td>
                          <td className="table-cell font-mono text-xs">{sec.table}</td>
                          <td className="table-cell text-xs">{sec.count}</td>
                          <td className="table-cell text-right font-mono">{sec.key === 'docs' ? '' : inr(sec.amounts.taxable)}</td>
                          <td className="table-cell text-right font-mono">{sec.key === 'docs' || sec.key === 'hsn' || sec.key === 'nil' ? '' : inr(sec.amounts.tax)}</td>
                        </tr>
                      )
                    })}
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="table-cell font-semibold" colSpan={3}>Total for the month, net of notes</td>
                      <td className="table-cell text-right font-mono font-semibold">{inr(s.gstr1.total.taxable)}</td>
                      <td className="table-cell text-right font-mono font-semibold">{inr(s.gstr1.total.tax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── GSTR-3B ── */}
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-semibold">GSTR-3B — summary and tax payment</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {s.gstr3b.gstr2bChecked
                      ? `Input tax credit from ${s.gstr3b.bills} bill${s.gstr3b.bills === 1 ? '' : 's'}, as found in your GSTR-2B for ${s.label}.`
                      : <>Input tax credit from your recorded bills — <Link href="/gst-reconciler" className="underline">check them against GSTR-2B</Link> before filing.</>}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-primary h-9 text-sm" disabled={busy !== null} onClick={() => get('gstr3b/excel')}>
                    <FileSpreadsheet size={15} />{busy === 'gstr3b/excel' ? 'Preparing…' : 'Worksheet (Excel)'}
                  </button>
                  <button className="btn-secondary h-9 text-sm" disabled={busy !== null || !s.gstin} onClick={() => get('gstr3b/json')}
                    title="GSTN's GSTR-3B format, for a GST practitioner's software">
                    <Download size={15} />{busy === 'gstr3b/json' ? 'Preparing…' : 'JSON'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Tax on sales" value={inr(taxOf(s.gstr3b.payment[0]?.amounts))} sub="3.1(a)" />
                <Stat label="Input tax credit" value={inr(taxOf(s.gstr3b.itc.find(r => r.table === '4(C)')?.amounts))} sub="4(C), net" />
                <Stat label="To pay in cash" value={inr(s.gstr3b.cashToPay)} sub="Estimate, after set-off" strong />
                <Stat label="Credit carried forward" value={inr(s.gstr3b.creditCarriedForward)} sub="To next month" />
              </div>

              <Table3b title="3.1 Outward supplies and inward supplies on reverse charge" rows={s.gstr3b.outward} withValue />
              {s.gstr3b.unregistered.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>3.2 Of 3.1(a): inter-state sales to unregistered buyers</h3>
                  <div className="table-wrap">
                    <table className="w-full text-sm">
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="table-header">Place of supply</th><th className="table-header text-right">Taxable value</th><th className="table-header text-right">IGST</th>
                      </tr></thead>
                      <tbody>
                        {s.gstr3b.unregistered.map(p => (
                          <tr key={p.pos} className="table-row">
                            <td className="table-cell whitespace-nowrap">{p.name ?? p.pos} ({p.pos})</td>
                            <td className="table-cell text-right font-mono">{inr(p.taxable)}</td>
                            <td className="table-cell text-right font-mono">{inr(p.igst)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Table3b title="4 Eligible input tax credit" rows={s.gstr3b.itc} />
              <Table3b title="5 Exempt, nil-rated and non-GST purchases" rows={s.gstr3b.exempt} withValue valueOnly />
              <Table3b title="Tax to pay (estimate)" rows={s.gstr3b.payment} total />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Credit is set off as the law requires: IGST credit first, then CGST and SGST credit — never against each other. Tax under reverse charge is paid in cash.
                The portal works out the final figures when you file.
              </p>
            </div>

            <div className="card">
              <h2 className="font-semibold text-sm mb-3">How to file</h2>
              <ol className="text-sm space-y-2 list-decimal pl-5" style={{ color: 'var(--text-secondary)' }}>
                <li>Sort out anything marked <strong>Fix before filing</strong> above.</li>
                <li><strong>GSTR-1:</strong> on gst.gov.in open Services → Returns → Returns Dashboard, choose the month, then GSTR-1 → <strong>Prepare offline → Upload</strong> and choose the JSON file. Once it's processed, check the summary and file it with DSC or EVC by {s.dueGstr1}.</li>
                <li><strong>GSTR-3B:</strong> open GSTR-3B → <strong>Prepare online</strong>. The portal fills it from your GSTR-1 and GSTR-2B — compare each table with the worksheet, pay the tax shown in cash, and file it by {s.dueGstr3b}.</li>
              </ol>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Exports, SEZ supplies, imports, e-commerce sales under Section 9(5), advances and amendments to earlier months aren't worked out here — add them on the portal if you have any.
                Quarterly (QRMP) filers report through the IFF and pay with PMT-06 instead.
              </p>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  )
}

function order(l: GstNoticeLevel) { return l === 'FIX' ? 0 : l === 'CHECK' ? 1 : 2 }

function taxOf(m?: GstMoney) { return m ? m.tax : 0 }

function Stat({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--bg-surface)', border: `1px solid ${strong ? 'var(--border-strong)' : 'var(--border)'}` }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className={`font-serif text-xl mt-1 ${strong ? 'font-semibold' : ''}`} style={{ color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function Table3b({ title, rows, withValue, valueOnly, total }: { title: string; rows: Gstr3bRow[]; withValue?: boolean; valueOnly?: boolean; total?: boolean }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="table-header">{total ? '' : 'Details'}</th>
            {withValue && <th className="table-header text-right">{valueOnly ? 'Value' : 'Taxable value'}</th>}
            {!valueOnly && <><th className="table-header text-right">IGST</th><th className="table-header text-right">CGST</th><th className="table-header text-right">SGST/UTGST</th></>}
            {total && <th className="table-header text-right">Total</th>}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const zero = Number(r.amounts.taxable) === 0 && Number(r.amounts.tax) === 0
              const key = total && i === 3
              return (
                <tr key={r.table + r.label} className="table-row" style={{ opacity: zero && !key ? 0.55 : 1 }}>
                  <td className={`table-cell ${key ? 'font-semibold' : ''}`} style={{ minWidth: 230 }}>{r.table && <span className="font-mono text-xs mr-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{r.table}</span>}{r.label}</td>
                  {withValue && <td className="table-cell text-right font-mono">{inr(r.amounts.taxable)}</td>}
                  {!valueOnly && <>
                    <td className="table-cell text-right font-mono">{inr(r.amounts.igst)}</td>
                    <td className="table-cell text-right font-mono">{inr(r.amounts.cgst)}</td>
                    <td className="table-cell text-right font-mono">{inr(r.amounts.sgst)}</td>
                  </>}
                  {total && <td className={`table-cell text-right font-mono ${key ? 'font-semibold' : ''}`}>{inr(r.amounts.tax)}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
