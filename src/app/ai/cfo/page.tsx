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
import {
  TrendingUp, TrendingDown, Minus, Sparkles, Send, Lightbulb,
  AlertTriangle, ArrowRight, Brain,
} from 'lucide-react'

const fmt = (n?: number) => {
  if (n == null) return '₹0'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`
  return `₹${n}`
}

export default function AiCfoPage() {
  const { data: briefing, isLoading } = useQuery({ queryKey: ['cfo-briefing'], queryFn: aiApi.cfo.briefing })
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [answer, setAnswer] = useState<any>(null)

  const ask = async (q?: string) => {
    const query = q ?? question
    if (!query.trim()) return
    setAsking(true); setQuestion(query)
    try {
      const res = await aiApi.cfo.ask(query)
      setAnswer(res)
    } catch { setAnswer({ answer: 'Could not get an answer right now. Please try again.' }) }
    finally { setAsking(false) }
  }

  return (
    <PermissionGate permission="AI_CFO_VIEW">
      <div className="space-y-5">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} color="#fff" />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>AI CFO</h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Your financial advisor — not just reports, but what they mean and what to do.</p>
          </div>
        </div>

        {/* Ask box */}
        <div className="card" style={{ padding: '20px', border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ask your CFO anything</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              value={question}
              onChange={(e: any) => setQuestion(e.target.value)}
              onKeyDown={(e: any) => { if (e.key === 'Enter') ask() }}
              placeholder="e.g. Why did profit fall this month?"
              style={{ flex: 1 }}
            />
            <button onClick={() => ask()} disabled={asking} aria-label="Ask CFO" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Send size={15} /> {asking ? 'Thinking…' : 'Ask'}
            </button>
          </div>
          {/* Suggested questions */}
          {!answer && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {['How much profit this month?', 'What is my total outstanding?', 'Why is revenue lower this month?'].map(q => (
                <button key={q} onClick={() => ask(q)}
                  style={{ fontSize: '12.5px', padding: '6px 12px', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {/* Answer */}
          {answer && (
            <div style={{ marginTop: '14px', padding: '16px', borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{answer.answer}</p>
              {answer.formatted && (
                <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--gold)', marginTop: '8px' }}>{answer.formatted}</div>
              )}
              {answer.followUps?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {answer.followUps.map((q: string) => (
                    <button key={q} onClick={() => ask(q)}
                      style={{ fontSize: '12px', padding: '5px 11px', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--gold)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {q} <ArrowRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <><SkeletonCard lines={2} /><SkeletonCard lines={3} /></>
        ) : briefing ? (
          <>
            {/* Headline */}
            <div className="card" style={{ padding: '22px', borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>{briefing.period} · CFO Briefing</div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.4 }}>{briefing.headline}</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{briefing.narrative}</p>
            </div>

            {/* Metrics */}
            <div className="auto-grid-4">
              {briefing.metrics?.map((m: any) => {
                const Icon = m.direction === 'UP' ? TrendingUp : m.direction === 'DOWN' ? TrendingDown : Minus
                const color = m.sentiment === 'GOOD' ? '#22C55E' : m.sentiment === 'BAD' ? '#EF4444' : 'var(--text-muted)'
                return (
                  <div key={m.label} className="card" style={{ padding: '18px' }}>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>{m.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.formatted}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color, fontSize: '12.5px', fontWeight: 600 }}>
                      <Icon size={14} /> {m.changePercent > 0 ? '+' : ''}{m.changePercent}%
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Why it moved */}
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={17} style={{ color: 'var(--gold)' }} /> What's driving the change
              </h3>
              <div className="space-y-2.5">
                {briefing.drivers?.map((d: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-surface)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.impact === 'POSITIVE' ? '#22C55E' : '#EF4444', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.factor}</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{d.detail}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: d.impact === 'POSITIVE' ? '#22C55E' : '#EF4444' }}>
                      {d.impactPercent > 0 ? '+' : ''}{d.impactPercent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Recommended actions</h3>
              <div className="space-y-3">
                {briefing.recommendations?.map((r: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '14px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ flexShrink: 0, padding: '3px 10px', borderRadius: '100px', height: 'fit-content', fontSize: '11px', fontWeight: 700, color: r.priority === 'HIGH' ? '#DC2626' : r.priority === 'MEDIUM' ? '#D97706' : '#6b7280', background: r.priority === 'HIGH' ? 'rgba(220,38,38,0.1)' : r.priority === 'MEDIUM' ? 'rgba(217,119,6,0.1)' : 'var(--bg-surface)' }}>
                      {r.priority}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.6 }}>{r.rationale}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        <span style={{ fontSize: '12.5px', color: 'var(--gold)', fontWeight: 600 }}>{r.action}</span>
                        {r.potentialValue > 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>· up to {fmt(r.potentialValue)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            {briefing.risks?.length > 0 && (
              <div className="card" style={{ padding: '20px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#EF4444' }} /> Watch-outs
                </h3>
                <div className="space-y-2">
                  {briefing.risks.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#EF4444' }}>•</span> {r}
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
