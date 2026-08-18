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

import { ReactNode } from 'react'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { Lock } from 'lucide-react'
import Link from 'next/link'

type Plan = 'STARTER' | 'GROWTH' | 'ENTERPRISE'

const PLAN_TIER: Record<Plan, number> = {
  STARTER: 1, GROWTH: 2, ENTERPRISE: 3,
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  STARTER: [
    'Dashboard', 'HRMS', 'Finance', 'Invoicing', 'CRM', 'Notifications', 'Settings',
  ],
  GROWTH: [
    'Dashboard', 'HRMS', 'Finance', 'Invoicing', 'CRM', 'Procurement', 'Inventory',
    'Projects', 'Timesheets', 'Analytics', 'BankReconciliation', 'ExpenseClaims',
    'ClientPortal', 'TDS', 'Automations', 'Notifications', 'Settings',
  ],
  ENTERPRISE: [
    'Dashboard', 'HRMS', 'Finance', 'Invoicing', 'CRM', 'Procurement', 'Inventory',
    'Projects', 'Timesheets', 'Analytics', 'BankReconciliation', 'ExpenseClaims',
    'ClientPortal', 'TDS', 'Automations', 'Subscriptions', 'DemandForecast',
    'DigitalSigning', 'WhatsApp', 'AI_CashFlow', 'AI_Wellness', 'AI_Scanner',
    'GST_Reconciler', 'BharatVoice', 'Notifications', 'Settings',
  ],
}

interface SubscriptionGateProps {
  /** Feature key — must be in PLAN_FEATURES for the user's plan */
  feature: string
  /** Minimum plan required */
  minPlan?: Plan
  /** What to show when locked (default: upgrade prompt card) */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Hides features not available in the user's subscription plan.
 *
 * NEW FEATURE (v1.2): Subscription-based feature gating.
 * Previously the sidebar showed all features regardless of plan.
 *
 * Usage:
 *   <SubscriptionGate feature="AI_CashFlow" minPlan="ENTERPRISE">
 *     <CashFlowOraclePage />
 *   </SubscriptionGate>
 */
export function SubscriptionGate({
  feature, minPlan, fallback, children
}: SubscriptionGateProps) {
  const { user } = useAuthStore()
  const plan = (user?.subscriptionPlan as Plan) ?? 'STARTER'

  const planTier = PLAN_TIER[plan] ?? 1
  const minTier  = minPlan ? PLAN_TIER[minPlan] : 1
  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.STARTER

  const allowed = planTier >= minTier && features.includes(feature)

  if (allowed) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const requiredPlan = minPlan ?? 'GROWTH'

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        padding: '60px 24px',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        maxWidth: '480px',
        margin: '40px auto',
      }}
    >
      <div
        style={{ width: '56px', height: '56px', borderRadius: '16px',
          background: 'var(--gold-muted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}
      >
        <Lock size={24} style={{ color: 'var(--gold)' }} />
      </div>
      <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
        {requiredPlan} Plan Required
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        This feature is available on the <strong>{requiredPlan}</strong> plan and above.
        Your current plan is <strong>{plan}</strong>.
        Upgrade to unlock {feature.replace(/_/g, ' ')}.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/settings/modules" className="btn-primary h-10 px-6 text-sm" style={{ textDecoration: 'none' }}>
          View Plans & Upgrade
        </Link>
        <Link href="/dashboard" className="btn-secondary h-10 px-6 text-sm" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
