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
import { CheckCircle2, Circle, ArrowRight, X, Rocket, Building2, Users, FileText, TrendingUp, Sparkles } from 'lucide-react'

interface ChecklistStep {
  id: string
  label: string
  description: string
  href: string
  icon: any
  done: boolean
}

interface OnboardingChecklistProps {
  // Real completion signals passed from the dashboard
  hasEmployees?: boolean
  hasInvoices?: boolean
  hasLeads?: boolean
  companyName?: string
  onDismiss?: () => void
}

/**
 * A dismissible "Getting Started" checklist shown on the dashboard for new
 * users. Completion is driven by real data signals (first employee, first
 * invoice, first lead), so it updates automatically as the user sets things up.
 */
export function OnboardingChecklist({
  hasEmployees = false,
  hasInvoices = false,
  hasLeads = false,
  companyName,
  onDismiss,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  const steps: ChecklistStep[] = [
    { id: 'company',  label: 'Complete your company profile', description: 'Add GST details, address and branding', href: '/settings',           icon: Building2, done: !!companyName },
    { id: 'employee', label: 'Add your first team member',     description: 'Set up your team and start HR',          href: '/hrms/employees',    icon: Users,     done: hasEmployees },
    { id: 'invoice',  label: 'Create your first invoice',      description: 'Send a GST-compliant invoice',           href: '/invoicing',         icon: FileText,  done: hasInvoices },
    { id: 'lead',     label: 'Add a customer or lead',         description: 'Start building your sales pipeline',     href: '/crm/leads',         icon: TrendingUp,done: hasLeads },
  ]

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const pct = Math.round((doneCount / total) * 100)
  const allDone = doneCount === total

  // Hide once dismissed or fully complete
  if (dismissed || allDone) return null

  const handleDismiss = () => { setDismissed(true); onDismiss?.() }

  return (
    <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-strong)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: '24px' }}>
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--btn-primary-bg)' }} />

      <div style={{ padding: '22px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--gold-muted)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Rocket size={21} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Welcome to FINVOSMART{companyName ? `, ${companyName}` : ''} <Sparkles size={15} style={{ color: 'var(--gold)' }} />
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Finish these {total} steps to get your business fully set up.
              </div>
            </div>
          </div>
          <button
            aria-label="Dismiss getting started"
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '8px', borderRadius: '100px', background: 'var(--bg-input)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: 'var(--btn-primary-bg)', transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{doneCount} of {total} done</span>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {steps.map(step => (
            <Link
              key={step.id}
              href={step.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px', borderRadius: '12px', textDecoration: 'none',
                border: `1px solid ${step.done ? 'transparent' : 'var(--border)'}`,
                background: step.done ? 'var(--bg-surface)' : 'var(--bg-card)',
                opacity: step.done ? 0.72 : 1,
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e: any) => { if (!step.done) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={(e: any) => { if (!step.done) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' } }}
            >
              {step.done
                ? <CheckCircle2 size={20} style={{ color: '#22C55E', flexShrink: 0 }} />
                : <Circle size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: step.done ? 'line-through' : 'none' }}>{step.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.description}</div>
              </div>
              {!step.done && <ArrowRight size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />}
            </Link>
          ))}
        </div>

        {/* Full wizard link */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link href="/onboarding" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            Open the full setup guide <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
