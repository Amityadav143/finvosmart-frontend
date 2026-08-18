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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Plus, Package, TrendingDown, BarChart2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface FixedAsset {
  id: string; assetCode: string; assetName: string; category: string
  purchaseDate: string; purchaseCost: number; salvageValue: number
  usefulLifeYears: number; depreciationRate: number; method: 'WDV' | 'SLM'
  status: 'ACTIVE' | 'IDLE' | 'UNDER_MAINTENANCE' | 'DISPOSED'
  currentBookValue: number; accumulatedDepreciation: number
}

interface DepnRow { year: number; calendarYear: number; openingValue: number; depreciation: number; closingValue: number }
interface Schedule { assetId: string; assetName: string; method: string; purchaseCost: number; salvageValue: number; usefulLifeYears: number; totalDepreciation: number; schedule: DepnRow[] }

const STATUS_META = {
  ACTIVE:            { color: '#059669', bg: 'rgba(5,150,105,0.1)',   label: 'Active'            },
  IDLE:              { color: '#D97706', bg: 'rgba(217,119,6,0.1)',   label: 'Idle'              },
  UNDER_MAINTENANCE: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)',  label: 'Maintenance'       },
  DISPOSED:          { color: '#6B7280', bg: 'rgba(107,114,128,0.1)','label': 'Disposed'        },
}

const CATEGORIES = ['PLANT_MACHINERY','VEHICLE','COMPUTER_IT','FURNITURE_FIXTURE','BUILDING','OTHER']

const BLANK_FORM = {
  assetName: '', category: 'COMPUTER_IT', purchaseDate: new Date().toISOString().split('T')[0],
  purchaseCost: '', salvageValue: '0', usefulLifeYears: 5, depreciationRate: '',
  method: 'WDV' as 'WDV' | 'SLM', vendorName: '', invoiceNumber: '', hsnCode: '', location: '', notes: ''
}

const WDV_RATES: Record<string, number> = {
  'PLANT_MACHINERY': 15, 'VEHICLE': 15, 'COMPUTER_IT': 40,
  'FURNITURE_FIXTURE': 10, 'BUILDING': 5, 'OTHER': 15
}

const SLM_YEARS: Record<string, number> = {
  'PLANT_MACHINERY': 10, 'VEHICLE': 8, 'COMPUTER_IT': 4,
  'FURNITURE_FIXTURE': 10, 'BUILDING': 30, 'OTHER': 10
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct  = (n: number) => `${n.toFixed(1)}%`

export default function AssetsPage() {
  const qc = useQueryClient()
  const [showNew, setShowNew]         = useState(false)
  const [form, setForm]               = useState({ ...BLANK_FORM })
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [expandedSched, setSched]     = useState<Schedule | null>(null)
  const [schedLoading, setSchedLoad]  = useState(false)

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['fixed-assets'],
    queryFn: () => api.get('/assets').then(r => r.data.data?.content ?? []),
  })

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/assets', {
      ...d, purchaseCost: Number(d.purchaseCost),
      salvageValue: Number(d.salvageValue),
      depreciationRate: d.depreciationRate ? Number(d.depreciationRate) : WDV_RATES[d.category] ?? 15
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixed-assets'] })
      setShowNew(false); setForm({ ...BLANK_FORM }); toast.success('Asset added to register')
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? 'Failed to add asset'),
  })

  const loadSchedule = async (assetId: string) => {
    if (expandedId === assetId) { setExpandedId(null); setSched(null); return }
    setExpandedId(assetId); setSchedLoad(true)
    try {
      const res = await api.get(`/assets/${assetId}/schedule`)
      setSched(res.data.data)
    } catch { toast.error('Failed to load depreciation schedule') }
    finally { setSchedLoad(false) }
  }

  // Auto-fill rate/years when category or method changes
  const handleCategoryChange = (cat: string) => {
    const rate  = String(WDV_RATES[cat] ?? 15)
    const years = SLM_YEARS[cat] ?? 10
    setForm(f => ({ ...f, category: cat, depreciationRate: rate, usefulLifeYears: years }))
  }

  const totalCost   = (assets as FixedAsset[]).reduce((s, a) => s + a.purchaseCost, 0)
  const totalBook   = (assets as FixedAsset[]).reduce((s, a) => s + (a.currentBookValue ?? 0), 0)
  const totalAccDep = (assets as FixedAsset[]).reduce((s, a) => s + (a.accumulatedDepreciation ?? 0), 0)

  return (
    <PermissionGate permission="FINANCE_VIEW" showDenied>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Fixed Assets & Depreciation</h1>
            <p className="page-subtitle">Asset register with WDV and SLM auto-depreciation schedules</p>
          </div>
          <PermissionGate permission="FINANCE_CREATE">
            <button className="btn-primary h-9" onClick={() => setShowNew(true)}>
              <Plus size={15} /> Add Asset
            </button>
          </PermissionGate>
        </div>

        {/* Summary KPIs */}
        {(assets as FixedAsset[]).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {[
              { label: 'Total Assets',           val: String((assets as FixedAsset[]).length),   color: 'var(--gold)' },
              { label: 'Gross Block',             val: fmt(totalCost),                            color: 'var(--text-primary)' },
              { label: 'Accumulated Dep.',        val: fmt(totalAccDep),                          color: '#DC2626' },
              { label: 'Net Block (Book Value)',  val: fmt(totalBook),                            color: '#059669' },
            ].map(k => (
              <div key={k.label} className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ fontSize: '20px', fontWeight: 700, color: k.color, fontFamily: 'serif', margin: 0 }}>{k.val}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{k.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Asset list */}
        <div className="space-y-3">
          {isLoading && <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading assets...</div>}
          {!isLoading && (assets as FixedAsset[]).length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Package size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No fixed assets registered. Add your first asset.</p>
            </div>
          )}

          {(assets as FixedAsset[]).map(asset => {
            const meta   = STATUS_META[asset.status] ?? STATUS_META.ACTIVE
            const depnPct = asset.purchaseCost > 0 ? (asset.accumulatedDepreciation / asset.purchaseCost) * 100 : 0
            return (
              <div key={asset.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{asset.assetName}</span>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{asset.assetCode}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>{asset.category?.replace(/_/g, ' ')}</span>
                      <span>· Method: <b>{asset.method}</b></span>
                      <span>· Rate: <b>{asset.depreciationRate}%</b></span>
                      <span>· Life: <b>{asset.usefulLifeYears} yrs</b></span>
                    </div>
                    {/* Depreciation progress bar */}
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--border)' }}>
                        <div style={{ width: `${Math.min(depnPct, 100)}%`, height: '100%', borderRadius: '3px', background: depnPct > 80 ? '#DC2626' : depnPct > 50 ? '#D97706' : 'var(--gold)', transition: 'width 0.3s' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{pct(depnPct)} depreciated</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#059669', margin: 0, fontFamily: 'monospace' }}>{fmt(asset.currentBookValue ?? 0)}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '2px 0 0' }}>book value</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0' }}>Cost: {fmt(asset.purchaseCost)}</p>
                  </div>
                  <button className="btn-ghost h-8 w-8" onClick={() => loadSchedule(asset.id)}>
                    {expandedId === asset.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Depreciation schedule */}
                {expandedId === asset.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px' }}>
                    {schedLoading ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Loading schedule...</p>
                    ) : expandedSched ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <BarChart2 size={15} style={{ color: 'var(--gold)' }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {expandedSched.method} Schedule · Total depreciation: {fmt(expandedSched.totalDepreciation)}
                          </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-surface)' }}>
                                {['Year','Calendar Year','Opening Value','Depreciation','Closing Value'].map(h => (
                                  <th key={h} style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {expandedSched.schedule.map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)' }}>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{row.year}</td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{row.calendarYear}</td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(row.openingValue)}</td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#DC2626' }}>{fmt(row.depreciation)}</td>
                                  <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>{fmt(row.closingValue)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Asset Modal */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}
            onClick={() => setShowNew(false)}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e: any) => e.stopPropagation()}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Add Fixed Asset</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="label label-required">Asset Name</label>
                  <input className="input h-10" placeholder="e.g. Dell Precision Workstation"
                    value={form.assetName} onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input h-10" value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Depreciation Method</label>
                  <select className="input h-10" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as 'WDV' | 'SLM' }))}>
                    <option value="WDV">WDV (Written Down Value)</option>
                    <option value="SLM">SLM (Straight Line)</option>
                  </select>
                </div>
                <div>
                  <label className="label label-required">Purchase Date</label>
                  <input type="date" className="input h-10" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label label-required">Purchase Cost (₹)</label>
                  <input type="number" className="input h-10" placeholder="0.00" value={form.purchaseCost} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Salvage Value (₹)</label>
                  <input type="number" className="input h-10" value={form.salvageValue} onChange={e => setForm(f => ({ ...f, salvageValue: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Depreciation Rate (%/year)</label>
                  <input type="number" className="input h-10" placeholder={`${WDV_RATES[form.category] ?? 15}% (default for ${form.category.replace(/_/g,' ')})`}
                    value={form.depreciationRate} onChange={e => setForm(f => ({ ...f, depreciationRate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Useful Life (years)</label>
                  <input type="number" className="input h-10" value={form.usefulLifeYears} onChange={e => setForm(f => ({ ...f, usefulLifeYears: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Vendor Name</label>
                  <input className="input h-10" placeholder="Supplier name" value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Purchase Invoice No.</label>
                  <input className="input h-10" placeholder="INV/2026/001" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="label">HSN Code</label>
                  <input className="input h-10" placeholder="8471" value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input h-10" placeholder="Head Office — Server Room" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="btn-secondary h-10" onClick={() => setShowNew(false)}>Cancel</button>
                <button className="btn-primary h-10" disabled={!form.assetName || !form.purchaseCost || createMutation.isPending}
                  onClick={() => createMutation.mutate(form)}>
                  {createMutation.isPending ? 'Adding...' : 'Add Asset'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  )
}
