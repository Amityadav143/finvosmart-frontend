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
import { api } from '@/lib/api/client'
import { SubscriptionGate } from '@/components/ui/SubscriptionGate'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Download, FileJson, FileSpreadsheet, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

type ExportType = 'gstr1-json' | 'gstr1-excel' | 'gstr3b-json'

interface ExportStatus { type: ExportType; status: 'idle'|'loading'|'done'|'error'; message?: string }

const EXPORT_CONFIG: Record<ExportType, { label: string; desc: string; icon: any; badge: string; badgeColor: string }> = {
  'gstr1-json':   { label: 'GSTR-1 JSON',   desc: 'Upload directly to GSTN portal',           icon: FileJson,        badge: 'Portal upload', badgeColor: '#2563EB' },
  'gstr1-excel':  { label: 'GSTR-1 Excel',  desc: 'B2B, B2C, Credit/Debit Note sheets',       icon: FileSpreadsheet, badge: '3 worksheets',  badgeColor: '#059669' },
  'gstr3b-json':  { label: 'GSTR-3B JSON',  desc: 'Summary return for direct portal filing',  icon: FileJson,        badge: 'Summary',       badgeColor: '#7C3AED' },
}

export default function GstExportPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year,  setYear]  = useState(CURRENT_YEAR)
  const [statuses, setStatuses] = useState<Record<ExportType, ExportStatus>>(
    Object.fromEntries(
      Object.keys(EXPORT_CONFIG).map(k => [k, { type: k as ExportType, status: 'idle' }])
    ) as Record<ExportType, ExportStatus>
  )

  const download = async (type: ExportType) => {
    setStatuses(p => ({ ...p, [type]: { type, status: 'loading' } }))
    try {
      const endpointMap: Record<ExportType, string> = {
        'gstr1-json':  `/gst/export/gstr1/json?month=${month}&year=${year}`,
        'gstr1-excel': `/gst/export/gstr1/excel?month=${month}&year=${year}`,
        'gstr3b-json': `/gst/export/gstr3b/json?month=${month}&year=${year}`,
      }
      const extMap: Record<ExportType, string> = {
        'gstr1-json': 'json', 'gstr1-excel': 'xlsx', 'gstr3b-json': 'json',
      }
      const res = await api.get(`${endpointMap[type]}`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `${type.replace('-','_')}_${String(month).padStart(2,'0')}_${year}.${extMap[type]}`
      a.click()
      URL.revokeObjectURL(url)
      setStatuses(p => ({ ...p, [type]: { type, status: 'done', message: 'Downloaded successfully' } }))
      toast.success(`${EXPORT_CONFIG[type].label} downloaded`)
    } catch {
      setStatuses(p => ({ ...p, [type]: { type, status: 'error', message: 'Export failed' } }))
      toast.error('Export failed — please try again')
    }
  }

  return (
    <SubscriptionGate feature="GST_Reconciler" minPlan="ENTERPRISE">
      <PermissionGate permission="GST_RECON_VIEW" showDenied>
        <div className="space-y-5" style={{ maxWidth: '760px' }}>
          <div>
            <h1 className="page-title">GST Returns Export</h1>
            <p className="page-subtitle">Generate GSTR-1 and GSTR-3B files for direct GSTN portal upload</p>
          </div>

          {/* Return period selector */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <Calendar size={18} style={{ color: 'var(--gold)' }} />
              <h3 style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>Return Period</h3>
            </div>
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="label">Month</label>
                <select className="input h-10" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div style={{ width: '140px' }}>
                <label className="label">Year</label>
                <select className="input h-10" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)' }}>
              <p style={{ fontSize: '12px', color: '#2563EB', margin: 0 }}>
                <b>Period:</b> {MONTHS[month-1]} {year} &nbsp;·&nbsp;
                <b>Financial Year:</b> {month >= 4 ? year : year-1}–{month >= 4 ? year+1 : year}
              </p>
            </div>
          </div>

          {/* Export tiles */}
          <div className="space-y-3">
            {(Object.entries(EXPORT_CONFIG) as [ExportType, typeof EXPORT_CONFIG[ExportType]][]).map(([type, cfg]) => {
              const st = statuses[type]
              const Icon = cfg.icon
              return (
                <div key={type} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${cfg.badgeColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} style={{ color: cfg.badgeColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{cfg.label}</span>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: `${cfg.badgeColor}18`, color: cfg.badgeColor, fontWeight: 700 }}>{cfg.badge}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{cfg.desc}</p>
                    {st.status === 'done' && (
                      <p style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={11} /> {st.message}
                      </p>
                    )}
                    {st.status === 'error' && (
                      <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={11} /> {st.message}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => download(type)}
                    disabled={st.status === 'loading'}
                    className="btn-primary h-9 text-sm"
                    style={{ flexShrink: 0, minWidth: '110px' }}
                  >
                    {st.status === 'loading'
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="animate-spin" style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Exporting</span>
                      : <><Download size={14} /> Export</>
                    }
                  </button>
                </div>
              )
            })}
          </div>

          {/* How-to guide */}
          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>How to file on GSTN portal</h3>
            {[
              ['Export GSTR-1 JSON', 'Click "Export" for GSTR-1 JSON above for the filing period'],
              ['Login to GST portal', 'Go to gstin.gov.in → Services → Returns → Returns Dashboard'],
              ['Select period', 'Choose the same month and year, then click GSTR-1'],
              ['Upload JSON', 'Click "Upload JSON" button → select the downloaded file → Submit'],
              ['File GSTR-3B', 'After GSTR-1, go to GSTR-3B → import the 3B JSON → Pay tax → File'],
            ].map(([step, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < 4 ? '10px' : 0 }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--btn-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-on-gold)', flexShrink: 0, marginTop: '1px' }}>
                  {i+1}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{step}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PermissionGate>
    </SubscriptionGate>
  )
}
