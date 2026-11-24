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

import { use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/** A statement is for one customer or supplier: without one chosen, go to the list to pick. */
export default function StatementsIndex(props: { params: Promise<{ side: string }> }) {
  const params = use(props.params)       // the address's values come as a promise (Next.js 15 and later)
  const router = useRouter()
  const list = params.side === 'supplier' ? { href: '/procurement/vendors', label: 'Suppliers' } : { href: '/crm/customers', label: 'Customers' }
  useEffect(() => { router.replace(list.href) }, [router, list.href])
  return <div className="card text-sm">Choose a {params.side === 'supplier' ? 'supplier' : 'customer'} under <Link href={list.href} className="underline">{list.label}</Link>, then Statement of account.</div>
}
