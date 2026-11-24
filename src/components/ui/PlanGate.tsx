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

import Link from 'next/link'
import { Lock } from 'lucide-react'
import type { PlanFeature } from '@/lib/api/billing'
import { PLAN_FEATURES, usePlanFeature } from '@/lib/hooks/useSubscription'

/**
 * A page of a plan feature (WhatsApp, the GSTR-2B credit check, bank reconciliation, the TDS register): on a plan that
 * includes it the page itself; on one that doesn't, what the feature does and where to move — instead of a page whose
 * every request the server would refuse (402, PLAN_UPGRADE). The page's own requests start only once it is shown.
 */
export default function PlanGate({ feature, children }: { feature: PlanFeature; children: React.ReactNode }) {
  const { allowed, loading, tierName } = usePlanFeature(feature)
  if (loading) return <div className="p-4 md:p-6"><div className="card h-40 animate-pulse" aria-busy="true" /></div>
  if (allowed) return <>{children}</>
  const info = PLAN_FEATURES[feature]
  return (
    <div className="p-4 md:p-6 max-w-3xl" data-testid="plan-gate" data-feature={feature}>
      <div className="card space-y-3" style={{ borderColor: 'var(--gold)', background: 'rgba(201, 162, 39, 0.07)' }}>
        <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--gold)' }}><Lock size={16} />On the Growth plan</p>
        <h1 className="text-2xl font-semibold">{info.title}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{info.what}</p>
        <p className="text-sm" data-testid="plan-gate-why">
          It is part of the Growth and Enterprise plans{tierName ? `, and your company is on ${tierName}` : ''}. Moving to Growth
          keeps everything you have and adds it, with up to 50 users and any number of branches.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/settings/subscription" className="btn-primary h-10" data-testid="plan-gate-upgrade">See the plans</Link>
        </div>
      </div>
    </div>
  )
}
