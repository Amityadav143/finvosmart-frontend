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

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { showSetupChecklist } from '@/components/ui/OnboardingChecklist'

/**
 * Setting up happens in one place: the "Getting started" checklist on the dashboard, which ticks
 * itself off from the company's real data and opens the full forms (company details with the GSTIN
 * check, customers, items, the invoice form). The old step-by-step wizard here saved half-filled
 * records (no state for GST, no GSTIN check), so an old link to it now brings the checklist back.
 */
export default function OnboardingPage() {
  const router = useRouter()
  useEffect(() => {
    showSetupChecklist()
    router.replace('/dashboard')
  }, [router])
  return (
    <p style={{ padding: '48px 24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
      Opening your getting-started list…
    </p>
  )
}
