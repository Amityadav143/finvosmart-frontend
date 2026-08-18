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

import { useState, useRef } from 'react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Upload, Download, CheckCircle2, AlertTriangle, HelpCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api/client'
import toast from 'react-hot-toast'

type BankFormat = 'STANDARD' | 'SBI' | 'HDFC' | 'ICICI' | 'AXIS'
type MatchStatus = 'UNMATCHED' | 'POTENTIAL_MATCH' | 'MATCHED' | 'RECONCILED' | 'IGNORED'

interface BankTransaction {
  date: string; description: string; refNo: string
  debit: number; credit: number; balance: number
  type: 'DEBIT' | 'CREDIT'; status: MatchStatus; matchNote?: string
}
interface ImportResult { total: number; autoMatched: number; unmatched: number; transactions: BankTransaction[] }

const STATUS_META: Record<MatchStatus, { color: string; bg: string; label: string }> = {
  UNMATCHED:       { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Unmatched'       },
  POTENTIAL_MATCH: { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   label: 'Potential Match' },
  MATCHED:         { color: '#2563EB', bg: 'rgba(37,99,235,0.1)',   label: 'Matched'         },
  RECONCILED:      { color: '#059669', bg: 'rgba(5,150,105,0.1)',   label: 'Reconciled'      },
  IGNORED:         { color: '#6B7280', bg: 'rgba(107,114,128,0.08)',label: 'Ignored'         },
}

const BANKS: { id: BankFormat; name: string; logo: string }[] = [
  { id: 'STANDARD', name: 'Generic CSV', logo: '📄' },
  { id: 'SBI',      name: 'State Bank of India',  logo: '🏦' },
  { id: 'HDFC',     name: 'HDFC Bank',            logo: '🏦' },
  { id: 'ICICI',    name: 'ICICI Bank',           logo: '🏦' },
  { id: 'AXIS',     name: 'Axis Bank',            logo: '🏦' },
]

export default function BankImportPage() {
  const [format, setFormat]     = useState<BankFormat>('STANDARD')
  const [file, setFile]         = useState<File | null>(null)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<ImportResult | null>(null)
  const [filter, setFilter]     = useState<MatchStatus | ''>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const upload = async () => {
    if (!file) { toast.error('Please select a file first'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/bank-import/upload?bankFormat=${format}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data.data)
      toast.success(`${res.data?.data?.total ?? 0} transactions imported`)
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Import failed')
    } finally { setLoading(false) }
  }

  const downloadTemplate = async () => {
    const res = await api.get(`/bank-import/template/${format}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url
    a.download = `bank_template_${format.toLowerCase()}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const fmt = (n: number) => n > 0 ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'

  const txns = result?.transactions.filter(t => !filter || t.status === filter) ?? []

  return (
    <PermissionGate permission="BANK_RECON_RUN" showDenied>
      <div className="space-y-5" style={{ maxWidth: '900px' }}>
        <div>
          <h1 className="page-title">Bank Statement Import</h1>
          <p className="page-subtitle">Import CSV or OFX bank statements and auto-match transactions</p>
        </div>

        {/* Step 1: Select bank */}
        <div className="card">
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '14px' }}>Step 1 — Select your bank</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {BANKS.map(b => (
              <button key={b.id} onClick={() => setFormat(b.id)}
                style={{ padding: '10px 16px', borderRadius: '10px', border: `1.5px solid ${format === b.id ? 'var(--gold)' : 'var(--border)'}`,
                  background: format === b.id ? 'var(--gold-muted)' : 'var(--bg-card)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '13px', fontWeight: 600, color: format === b.id ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {b.logo} {b.name}
              </button>
            ))}
          </div>
          <button aria-label="Download" className="btn-ghost text-xs h-8 mt-3" onClick={downloadTemplate} style={{ color: 'var(--text-muted)' }}><Download size={13} /> Download {format} template
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="card">
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: '14px' }}>Step 2 — Upload statement</h3>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e: any) => e.preventDefault()}
            onDrop={(e: any) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            style={{ border: `2px dashed ${file ? 'var(--gold)' : 'var(--border-strong)'}`, borderRadius: '12px', padding: '28px', textAlign: 'center', cursor: 'pointer',
              background: file ? 'var(--gold-muted)' : 'var(--bg-surface)', transition: 'all 0.2s' }}>
            <input ref={fileRef} type="file" accept=".csv,.ofx,.qfx" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            {file
              ? <><CheckCircle2 size={26} style={{ color: '#059669', margin: '0 auto 8px', display: 'block' }} /><p style={{ fontWeight: 600, color: '#059669' }}>{file.name}</p><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size/1024).toFixed(1)} KB · Click to change</p></>
              : <><Upload size={26} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', display: 'block' }} /><p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Drop CSV or OFX file here</p><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse</p></>
            }
          </div>
          <button className="btn-primary h-10 w-full mt-4" onClick={upload} disabled={!file || loading}>
            {loading ? 'Importing...' : <><Upload size={15} /> Import Statement</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
              {[
                { label: 'Total Transactions', val: result.total,       color: 'var(--text-primary)' },
                { label: 'Credits (money in)',  val: result.transactions.filter(t => t.type === 'CREDIT').length, color: '#059669' },
                { label: 'Debits (money out)',  val: result.transactions.filter(t => t.type === 'DEBIT').length,  color: '#DC2626' },
                { label: 'Auto-matched',         val: result.autoMatched, color: 'var(--gold)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign: 'center', padding: '14px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, fontFamily: 'serif' }}>{s.val}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setFilter('')}
                style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${!filter ? 'var(--gold)' : 'var(--border)'}`, background: !filter ? 'var(--gold-muted)' : 'var(--bg-card)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: !filter ? 'var(--gold)' : 'var(--text-muted)', fontFamily: 'inherit' }}>
                All ({result.total})
              </button>
              {(Object.entries(STATUS_META) as [MatchStatus, any][]).map(([s, m]) => {
                const count = result.transactions.filter(t => t.status === s).length
                if (!count) return null
                return (
                  <button key={s} onClick={() => setFilter(f => f === s ? '' : s)}
                    style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${filter === s ? m.color : 'var(--border)'}`, background: filter === s ? m.bg : 'var(--bg-card)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: m.color, fontFamily: 'inherit' }}>
                    {m.label} ({count})
                  </button>
                )
              })}
            </div>

            {/* Transaction table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      {['Date','Description','Ref No','Debit','Credit','Balance','Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 100).map((txn, i) => {
                      const meta = STATUS_META[txn.status]
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)' }}>
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{txn.date}</td>
                          <td style={{ padding: '8px 14px', color: 'var(--text-primary)', maxWidth: '240px' }}>
                            <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</p>
                            {txn.matchNote && <p style={{ fontSize: '10px', color: '#D97706', margin: 0 }}>{txn.matchNote}</p>}
                          </td>
                          <td style={{ padding: '8px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '11px' }}>{txn.refNo || '—'}</td>
                          <td style={{ padding: '8px 14px', color: '#DC2626', fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {txn.debit > 0 && <><TrendingDown size={11} style={{ display: 'inline', marginRight: '3px' }} />{fmt(txn.debit)}</>}
                          </td>
                          <td style={{ padding: '8px 14px', color: '#059669', fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {txn.credit > 0 && <><TrendingUp size={11} style={{ display: 'inline', marginRight: '3px' }} />{fmt(txn.credit)}</>}
                          </td>
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(txn.balance)}</td>
                          <td style={{ padding: '8px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {txns.length > 100 && <p style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>Showing first 100 of {txns.length} transactions</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGate>
  )
}
