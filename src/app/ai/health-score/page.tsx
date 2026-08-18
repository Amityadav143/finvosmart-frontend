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

import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/lib/api/ai'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Activity, TrendingUp, TrendingDown, Minus, CheckCircle2, ArrowUpRight, Heart } from 'lucide-react'

const bandColor = (band: string) => {
  switch (band) {
    case 'EXCELLENT': return '#22C55E'
    case 'GOOD': return '#3B82F6'
    case 'FAIR': return '#D97706'
    case 'NEEDS ATTENTION': return '#F59E0B'
    default: return '#EF4444'
  }
}
const ratingColor = (r: string) => {
  switch (r) {
    case 'EXCELLENT': return '#22C55E'
    case 'GOOD': return '#3B82F6'
    case 'FAIR': return '#D97706'
    default: return '#EF4444'
  }
}

export default function HealthScorePage() {
  const { data: report, isLoading } = useQuery({ queryKey: ['health-score'], queryFn: aiApi.health.report })

  return (
    <PermissionGate permission="AI_HEALTH_VIEW">
      <div className="space-y-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#0D9488,#0F766E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Business Health Score</h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>One number for how healthy your business is — like a CIBIL score, for your company.</p>
          </div>
        </div>

        {isLoading ? (
          <><SkeletonCard lines={2} /><SkeletonCard lines={4} /></>
        ) : report ? (
          <>
            {/* Score hero */}
            <div className="card" style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '32px' }}>
              {/* Circular gauge */}
              <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-input)" strokeWidth="12" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke={bandColor(report.band)} strokeWidth="12"
                    strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - report.overallScore / 100)}`}
                    transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{report.overallScore}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>out of 100</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '30px', fontWeight: 800, color: bandColor(report.band) }}>{report.grade}</span>
                  <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: bandColor(report.band), background: `${bandColor(report.band)}18` }}>{report.band}</span>
                  {report.changeFromLast !== 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 600, color: report.changeFromLast > 0 ? '#22C55E' : '#EF4444' }}>
                      {report.changeFromLast > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {report.changeFromLast > 0 ? '+' : ''}{report.changeFromLast} pts
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{report.summary}</p>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px' }}>Previous score: {report.previousScore}/100</div>
              </div>
            </div>

            {/* Pillars */}
            <div>
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>Score breakdown</h3>
              <div className="auto-grid-2">
                {report.pillars?.map((p: any) => {
                  const TrendIcon = p.trend === 'UP' ? TrendingUp : p.trend === 'DOWN' ? TrendingDown : Minus
                  return (
                    <div key={p.name} className="card" style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {p.weight}% weight</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendIcon size={14} style={{ color: p.trend === 'UP' ? '#22C55E' : p.trend === 'DOWN' ? '#EF4444' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '18px', fontWeight: 700, color: ratingColor(p.rating) }}>{p.score}</span>
                        </div>
                      </div>
                      <div style={{ height: '6px', borderRadius: '100px', background: 'var(--bg-input)', overflow: 'hidden', marginBottom: '8px' }}>
                        <div style={{ height: '100%', width: `${p.score}%`, background: ratingColor(p.rating), borderRadius: '100px', transition: 'width 0.8s ease' }} />
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.insight}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Strengths + Improvements */}
            <div className="auto-grid-2">
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: '#22C55E' }} /> Strengths
                </h3>
                <div className="space-y-2">
                  {report.strengths?.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
                      <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span> {s}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowUpRight size={16} style={{ color: 'var(--gold)' }} /> How to improve your score
                </h3>
                <div className="space-y-2">
                  {report.improvements?.length > 0 ? report.improvements.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>→</span> {s}
                    </div>
                  )) : <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No urgent improvements — your business is in good shape.</p>}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}
