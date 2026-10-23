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

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/** The list of bills lives on Bills and payables. */
export default function BillsIndexPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/purchases') }, [router])
  return <div className="card text-sm">Opening <Link href="/purchases" className="underline">Bills and payables</Link>…</div>
}
