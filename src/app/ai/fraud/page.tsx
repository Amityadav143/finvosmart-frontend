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
import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/lib/api/ai'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { ShieldAlert, ShieldCheck, AlertTriangle, FileWarning, Users, CreditCard, Receipt } from 'lucide-react'

const fmt = (n?: number) => {
  if (n == null) return '—'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}
const sevColor = (s: string) => s === 'CRITICAL' ? '#DC2626' : s === 'HIGH' ? '#EA580C' : s === 'MEDIUM' ? '#D97706' : '#6b7280'
const catIcon = (c: string) => c === 'Invoices' ? Receipt : c === 'Vendors' ? Users : c === 'Payments' ? CreditCard : FileWarning

export default function FraudPage() {
  const { data: result, isLoading } = useQuery({ queryKey: ['fraud-scan'], queryFn: aiApi.fraud.scan })
  const [filter, setFilter] = useState<string>('')

  const alerts = (result?.alerts ?? []).filter((a: any) => !filter || a.severity === filter)

  return (
    <PermissionGate permission="AI_FRAUD_VIEW">
      <div className="space-y-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#DC2626,#991B1B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>AI Fraud Detection</h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Automatically spots duplicate invoices, fake vendors and abnormal payments before money goes out.</p>
          </div>
        </div>

        {isLoading ? (
          <><SkeletonCard lines={2} /><SkeletonCard lines={4} /></>
        ) : result ? (
          <>
            {/* Risk summary */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: result.riskBand === 'HIGH' ? 'rgba(220,38,38,0.12)' : result.riskBand === 'LOW' ? 'rgba(34,197,94,0.12)' : 'rgba(217,119,6,0.12)' }}>
                  {result.riskBand === 'LOW' ? <ShieldCheck size={28} color="#22C55E" /> : <ShieldAlert size={28} color={result.riskBand === 'HIGH' ? '#DC2626' : '#D97706'} />}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Fraud risk</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: result.riskBand === 'HIGH' ? '#DC2626' : result.riskBand === 'LOW' ? '#22C55E' : '#D97706' }}>
                    {result.riskBand}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                <Stat label="Alerts" value={result.totalAlerts} />
                <Stat label="Critical" value={result.critical} color="#DC2626" />
                <Stat label="At risk" value={fmt(result.totalAmountAtRisk)} color="#EA580C" />
                <Stat label="Scanned" value={result.itemsScanned?.toLocaleString('en-IN')} />
              </div>
            </div>

            {/* Severity filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                <button key={s || 'all'} onClick={() => setFilter(s)}
                  style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${filter === s ? (s ? sevColor(s) : 'var(--gold)') : 'var(--border)'}`,
                    background: filter === s ? (s ? `${sevColor(s)}15` : 'var(--gold-muted)') : 'var(--bg-surface)',
                    color: filter === s ? (s ? sevColor(s) : 'var(--gold)') : 'var(--text-secondary)' }}>
                  {s || 'All'} {s && `(${result[s.toLowerCase()] ?? 0})`}
                </button>
              ))}
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              {alerts.map((a: any) => {
                const Icon = catIcon(a.category)
                return (
                  <div key={a.id} className="card" style={{ padding: '18px', borderLeft: `3px solid ${sevColor(a.severity)}` }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${sevColor(a.severity)}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: sevColor(a.severity) }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '10.5px', fontWeight: 700, color: sevColor(a.severity), background: `${sevColor(a.severity)}15` }}>{a.severity}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {a.confidence}% confidence</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>{a.description}</p>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-surface)' }}>
                          <AlertTriangle size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{a.recommendation}</span>
                        </div>
                      </div>
                      {a.amount && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At risk</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: sevColor(a.severity) }}>{fmt(a.amount)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Insights */}
            {result.insights?.length > 0 && (
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Insights</h3>
                <div className="space-y-2">
                  {result.insights.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--gold)' }}>•</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color ?? 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
