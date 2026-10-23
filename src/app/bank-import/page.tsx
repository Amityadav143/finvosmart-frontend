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
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/** Statement import and matching now live on one page that reads any bank's format. */
export default function BankImportPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/bank-reconciliation') }, [router])
  return (
    <div className="card text-sm">
      Bank statements are now imported on <Link href="/bank-reconciliation" className="underline">Match bank payments</Link> — any bank, CSV, Excel or OFX.
    </div>
  )
}
