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
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { tdsRegisterApi } from '@/lib/api/purchases'
import { Notice } from '@/components/invoicing/InvoiceForm'
import { formatDate } from '@/lib/utils'
import { inr, todayIST } from '@/lib/money'
import { addDays, quarterOf } from '@/lib/purchases'

export default function TdsRegisterPage() {
  const [anchor, setAnchor] = useState(todayIST())
  const q = useMemo(() => quarterOf(anchor), [anchor])
  const { data: reg, isLoading, isError } = useQuery({ queryKey: ['tds-register', q.from, q.to], queryFn: () => tdsRegisterApi.register(q.from, q.to) })
  const today = todayIST()

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">TDS register</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Income tax deducted on supplier bills — what to deposit each month, and for the quarterly TDS statement</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-icon w-9 h-9" aria-label="Previous quarter" onClick={() => setAnchor(addDays(q.from, -1))}><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-32 text-center">{q.label}</span>
          <button className="btn-icon w-9 h-9" aria-label="Next quarter" disabled={q.to >= today} onClick={() => setAnchor(addDays(q.to, 1))}><ChevronRight size={16} /></button>
          <button className="btn-secondary h-9" onClick={() => tdsRegisterApi.csv(q.from, q.to).catch(() => toast.error('Export failed'))}><Download size={15} />CSV</button>
        </div>
      </div>

      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>The register couldn't be loaded.</div>}

      {reg && (
        <>
          {reg.missingPan > 0 && <Notice tone="amber">{reg.missingPan} deduction{reg.missingPan === 1 ? ' is' : 's are'} for suppliers without a valid PAN: the higher rate (generally 20%) applies, and the TDS statement needs their PAN. Add it on the supplier.</Notice>}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>TDS deducted</p><p className="font-serif text-2xl mt-1" style={{ color: 'var(--gold)' }}>{inr(reg.totalTds)}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{reg.count} bill{reg.count === 1 ? '' : 's'}</p></div>
            <div className="card"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>On payments of</p><p className="font-serif text-2xl mt-1">{inr(reg.totalBase)}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>value before GST</p></div>
            <div className="card lg:col-span-2"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quarterly TDS statement</p><p className="font-serif text-2xl mt-1">Due {formatDate(reg.statementDue)}</p><p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>For {q.label}. From April 2026 these deductions are under section 393 of the Income-tax Act, 2025.</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h3 className="font-semibold text-sm mb-2">Deposit by month</h3>
              {reg.months.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No TDS deducted in this quarter.</p>}
              <div className="space-y-1.5">
                {reg.months.map(m => (
                  <div key={m.month} className="flex items-center justify-between text-sm">
                    <span>{m.label} <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {m.count} bill{m.count === 1 ? '' : 's'}</span></span>
                    <span className="flex items-center gap-3"><span className="text-xs" style={{ color: m.depositDue < today ? 'var(--text-muted)' : '#d97706' }}>by {formatDate(m.depositDue)}</span><span className="font-mono">{inr(m.tds)}</span></span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>TDS is paid to the government by the 7th of the next month (March: by 30 April) through challan on the income-tax portal.</p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-sm mb-2">By kind of payment</h3>
              {reg.natures.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>—</p>}
              <div className="space-y-1.5">
                {reg.natures.map(n => (
                  <div key={n.nature} className="flex items-center justify-between text-sm gap-3">
                    <span className="truncate">{n.label} <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{n.section}</span></span>
                    <span className="font-mono shrink-0">{inr(n.tds)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th className="text-left font-medium px-4 py-3">Bill</th>
                  <th className="text-left font-medium px-3 py-3">Supplier</th>
                  <th className="text-left font-medium px-3 py-3">Kind</th>
                  <th className="text-right font-medium px-3 py-3">Amount</th>
                  <th className="text-right font-medium px-3 py-3">Rate</th>
                  <th className="text-right font-medium px-4 py-3">TDS</th>
                </tr>
              </thead>
              <tbody>
                {reg.entries.map(e => (
                  <tr key={e.billId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-2.5"><Link href={`/purchases/bills/${e.billId}`} className="font-mono text-xs underline">{e.referenceNumber}</Link><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(e.date)}</p></td>
                    <td className="px-3 py-2.5"><p>{e.vendorName}</p><p className="text-xs font-mono" style={{ color: e.panMissing ? '#dc2626' : 'var(--text-muted)' }}>{e.pan || 'No PAN'}</p></td>
                    <td className="px-3 py-2.5 text-xs">{e.natureLabel}<p className="font-mono" style={{ color: 'var(--text-muted)' }}>{e.section}</p></td>
                    <td className="px-3 py-2.5 text-right font-mono">{inr(e.base)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{Number(e.rate)}%</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{inr(e.tds)}</td>
                  </tr>
                ))}
                {reg.entries.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>No bills with TDS in {q.label}. TDS is set on each supplier and suggested on their bills.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
