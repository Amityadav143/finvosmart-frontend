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

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { BillForm } from '@/components/purchases/BillForm'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { itcApi } from '@/lib/api/purchases'
import { procurementApi } from '@/lib/api/procurement'
import type { BillType } from '@/types/purchases'

const TITLES: Record<Exclude<BillType, 'OPENING_BALANCE'>, [string, string]> = {
  BILL: ['New bill', "A supplier's invoice: it goes into your books (expense and input GST against what you owe them) and into payables."],
  EXPENSE: ['Record an expense', 'Something paid on the spot — fuel, courier, a hotel. Booked to the right account, with GST credit if the bill shows the supplier’s GSTIN.'],
  CREDIT_NOTE: ['Supplier credit note', 'A credit note from a supplier (goods returned, a discount): it reduces what you owe and the GST credit you claim.'],
}

function NewBill() {
  const params = useSearchParams()
  const t = params.get('type') as BillType | null
  const type = (t && t in TITLES ? t : 'BILL') as keyof typeof TITLES
  const docId = params.get('from2b')
  const poId = params.get('fromPo')
  const { data: doc, isLoading } = useQuery({ queryKey: ['itc-doc', docId], queryFn: () => itcApi.document(docId!), enabled: !!docId })
  const { data: po, isLoading: poLoading, isError: poError } = useQuery({ queryKey: ['purchase-order', poId], queryFn: () => procurementApi.purchaseOrders.get(poId!), enabled: !!poId && !docId })
  const [title, sub] = TITLES[doc?.kind === 'CREDIT_NOTE' ? 'CREDIT_NOTE' : poId ? 'BILL' : type]
  return (
    <div className="space-y-4">
      <div>
        <Link href={po ? `/procurement/orders?open=${po.id}` : '/purchases'} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />{po ? `Purchase order ${po.poNumber}` : 'Bills and payables'}
        </Link>
        <h1 className="page-title mt-1">{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {docId ? 'Filled in from your GSTR-2B — check the details against the supplier’s document.'
            : po ? `For purchase order ${po.poNumber} from ${po.vendorName}. Recording it brings the ordered items into stock.`
            : poError ? 'That purchase order couldn’t be opened — enter the bill by hand.' : sub}
        </p>
      </div>
      {(docId && isLoading) || (poId && !docId && poLoading) ? <SkeletonCard lines={6} /> : <BillForm defaultType={poId ? 'BILL' : type} fromDocument={doc ?? null} fromPo={po ?? null} />}
    </div>
  )
}

export default function NewBillPage() {
  return <Suspense fallback={null}><NewBill /></Suspense>
}
