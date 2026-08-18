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

import { api } from '@/lib/api/client'
import { useState, useRef } from 'react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Upload, CheckCircle2, XCircle, Users, FileText, Send, Download, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'invoice-status' | 'invoice-send' | 'employee-import'

interface BulkResult { succeeded: number; failed: number; successItems: string[]; failedItems: string[] }

export default function BulkOperationsPage() {
  const [tab, setTab] = useState<Tab>('employee-import')

  // Invoice status
  const [invoiceIds, setInvoiceIds]   = useState('')
  const [targetStatus, setStatus]     = useState('SENT')
  const [statusResult, setStatusResult] = useState<BulkResult | null>(null)

  // WhatsApp send
  const [waIds, setWaIds]           = useState('')
  const [waResult, setWaResult]     = useState<BulkResult | null>(null)

  // Employee import
  const [file, setFile]             = useState<File | null>(null)
  const [importResult, setImportResult] = useState<BulkResult | null>(null)
  const [loading, setLoading]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const callBulk = async (endpoint: string, body: any) => {
    const res = await api.post(endpoint, body)
    return res.data.data as BulkResult
  }

  const handleStatusUpdate = async () => {
    const ids = invoiceIds.split('\n').map(s => s.trim()).filter(Boolean)
    if (!ids.length) { toast.error('Enter at least one Invoice ID'); return }
    setLoading(true)
    try {
      const result = await callBulk('/api/v1/bulk/invoices/status', { invoiceIds: ids, status: targetStatus })
      setStatusResult(result)
      toast.success(`${result.succeeded} invoices updated`)
    } catch { toast.error('Bulk update failed') }
    finally { setLoading(false) }
  }

  const handleWaSend = async () => {
    const ids = waIds.split('\n').map(s => s.trim()).filter(Boolean)
    if (!ids.length) { toast.error('Enter at least one Invoice ID'); return }
    setLoading(true)
    try {
      const result = await callBulk('/api/v1/bulk/invoices/send-whatsapp', { invoiceIds: ids })
      setWaResult(result)
      toast.success(`${result.succeeded} invoices sent via WhatsApp`)
    } catch { toast.error('Bulk send failed') }
    finally { setLoading(false) }
  }

  const handleEmployeeImport = async () => {
    if (!file) { toast.error('Select a CSV file first'); return }
    setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post('/bulk/employees/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportResult(res.data.data)
      toast.success(`${res.data?.data?.succeeded ?? 0} employees imported`)
    } catch { toast.error('Import failed — check your CSV format') }
    finally { setLoading(false) }
  }

  const downloadTemplate = async () => {
    const res = await api.get('/bulk/employees/import/template', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data); const a = document.createElement('a')
    a.href = url; a.download = 'employee_import_template.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const ResultPanel = ({ result }: { result: BulkResult }) => (
    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
        {[{ label: 'Succeeded', val: result.succeeded, color: '#059669' },
          { label: 'Failed',    val: result.failed,    color: '#DC2626' }].map(s => (
          <div key={s.label} style={{ padding: '10px 16px', borderRadius: '10px', background: `${s.color}10`, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: 0, fontFamily: 'serif' }}>{s.val}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
      {result.successItems.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Succeeded</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {result.successItems.map((item, i) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(5,150,105,0.1)', color: '#059669', fontFamily: 'monospace' }}>{item}</span>
            ))}
          </div>
        </div>
      )}
      {result.failedItems.length > 0 && (
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Failed</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {result.failedItems.map((item, i) => (
              <span key={i} style={{ fontSize: '11px', color: '#DC2626', fontFamily: 'monospace' }}>• {item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const TABS: { id: Tab; label: string; icon: any; perm: string }[] = [
    { id: 'employee-import',  label: 'Employee CSV Import', icon: Users,    perm: 'EMPLOYEE_CREATE' },
    { id: 'invoice-status',   label: 'Bulk Status Update',  icon: FileText, perm: 'INVOICE_EDIT'    },
    { id: 'invoice-send',     label: 'Bulk WhatsApp Send',  icon: Send,     perm: 'INVOICE_SEND'    },
  ]

  return (
    <PermissionGate permission="INVOICE_EDIT" showDenied>
      <div style={{ maxWidth: '700px' }}>
        <h1 className="page-title">Bulk Operations</h1>
        <p className="page-subtitle">Update multiple invoices or import employees at once</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--bg-surface)', borderRadius: '12px', padding: '4px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
                background: tab === t.id ? 'var(--bg-card)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none' }}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        <div className="card">
          {/* Employee Import tab */}
          {tab === 'employee-import' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Import Employees from CSV</h2>
                <button aria-label="Download" className="btn-secondary h-8 text-xs" onClick={downloadTemplate}><Download size={13} /> Download Template
                </button>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: '#2563EB', margin: 0 }}>
                  <b>Required columns:</b> fullName, email, phone, designation, department, employmentType, ctc<br />
                  Default password for imported employees: <code>Welcome@1234</code> (they can change on first login)
                </p>
              </div>
              <div
                style={{ border: `2px dashed ${file ? '#059669' : 'var(--border-strong)'}`, borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(5,150,105,0.04)' : 'var(--bg-surface)', transition: 'all 0.2s' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e: any) => { e.preventDefault() }}
                onDrop={(e: any) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) setFile(f); else toast.error('Please drop a .csv file') }}
              >
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                {file ? (
                  <div>
                    <CheckCircle2 size={28} style={{ color: '#059669', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#059669', margin: '0 0 4px' }}>{file.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>Drop CSV file here</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>or click to browse</p>
                  </div>
                )}
              </div>
              <button className="btn-primary h-10 w-full mt-4" onClick={handleEmployeeImport} disabled={!file || loading}>
                {loading ? 'Importing...' : <><Users size={15} /> Import Employees</>}
              </button>
              {importResult && <ResultPanel result={importResult} />}
            </div>
          )}

          {/* Invoice status tab */}
          {tab === 'invoice-status' && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Bulk Invoice Status Update</h2>
              <div>
                <label className="label">Invoice IDs (one per line)</label>
                <textarea className="input" rows={6} placeholder={'550e8400-e29b-41d4-a716-446655440000\n...'}
                  value={invoiceIds} onChange={e => setInvoiceIds(e.target.value)} style={{ fontFamily: 'monospace', fontSize: '12px' }} />
              </div>
              <div style={{ marginTop: '12px' }}>
                <label className="label">Target Status</label>
                <select className="input h-10" value={targetStatus} onChange={e => setStatus(e.target.value)}>
                  {['SENT','PAID','CANCELLED','OVERDUE'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p style={{ fontSize: '12px', color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={13} /> This action will update all listed invoices to <b>{targetStatus}</b>. This cannot be undone.
                </p>
              </div>
              <button className="btn-primary h-10 w-full mt-4" onClick={handleStatusUpdate} disabled={loading}>
                {loading ? 'Updating...' : <><FileText size={15} /> Update Status</>}
              </button>
              {statusResult && <ResultPanel result={statusResult} />}
            </div>
          )}

          {/* WhatsApp send tab */}
          {tab === 'invoice-send' && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Bulk WhatsApp Send</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Sends the invoice amount and a thank-you message to each customer's WhatsApp number on record. Automatically marks invoices as SENT.
              </p>
              <div>
                <label className="label">Invoice IDs (one per line)</label>
                <textarea className="input" rows={6} placeholder={'550e8400-e29b-41d4-a716-446655440000\n...'}
                  value={waIds} onChange={e => setWaIds(e.target.value)} style={{ fontFamily: 'monospace', fontSize: '12px' }} />
              </div>
              <button className="btn-primary h-10 w-full mt-4" onClick={handleWaSend} disabled={loading}>
                {loading ? 'Sending...' : <><Send size={15} /> Send via WhatsApp</>}
              </button>
              {waResult && <ResultPanel result={waResult} />}
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  )
}
