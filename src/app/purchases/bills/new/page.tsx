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
import { grnApi, returnsApi } from '@/lib/api/purchaseStore'
import { warrantyApi } from '@/lib/api/warranty'
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
  const grnId = params.get('fromGrn'), returnId = params.get('fromReturn'), claimId = params.get('fromClaim')
  const { data: grn, isLoading: grnLoading, isError: grnError } = useQuery({ queryKey: ['grn', grnId], queryFn: () => grnApi.get(grnId!), enabled: !!grnId })
  const { data: ret, isLoading: retLoading, isError: retError } = useQuery({ queryKey: ['purchase-return', returnId], queryFn: () => returnsApi.get(returnId!), enabled: !!returnId })
  const { data: claim, isLoading: claimLoading, isError: claimError } = useQuery({ queryKey: ['warranty-claim', claimId], queryFn: () => warrantyApi.get(claimId!), enabled: !!claimId })
  const { data: doc, isLoading } = useQuery({ queryKey: ['itc-doc', docId], queryFn: () => itcApi.document(docId!), enabled: !!docId })
  const { data: po, isLoading: poLoading, isError: poError } = useQuery({ queryKey: ['purchase-order', poId], queryFn: () => procurementApi.purchaseOrders.get(poId!), enabled: !!poId && !docId })
  const [title, sub] = TITLES[doc?.kind === 'CREDIT_NOTE' || returnId || claimId ? 'CREDIT_NOTE' : poId || grnId ? 'BILL' : type]
  return (
    <div className="space-y-4">
      <div>
        <Link href={grn ? `/procurement/grn/${grn.id}` : ret ? `/procurement/returns?open=${ret.id}` : claim ? `/warranty/${claim.id}` : po ? `/procurement/orders?open=${po.id}` : '/purchases'} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />{grn ? `Goods receipt ${grn.number}` : ret ? `Return ${ret.number}` : claim ? `Warranty claim ${claim.number}` : po ? `Purchase order ${po.poNumber}` : 'Bills and payables'}
        </Link>
        <h1 className="page-title mt-1">{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {docId ? 'Filled in from your GSTR-2B — check the details against the supplier’s document.'
            : grn ? `From goods receipt ${grn.number} (${grn.vendorName}): what was accepted, at the order’s rates — check it against their invoice. The goods are in stock already.`
            : grnError ? 'That goods receipt couldn’t be opened — enter the bill by hand.'
            : ret ? `The credit note ${ret.vendorName} gives for the goods returned with ${ret.number}.`
            : retError ? 'That return couldn’t be opened — enter the credit note by hand.'
            : claim ? `The credit note ${claim.partyName} gives for warranty claim ${claim.number}${claim.acceptedValue != null ? ', at the value they accepted' : ''} — check it against their document.`
            : claimError ? 'That warranty claim couldn’t be opened — enter the credit note by hand.'
            : po ? `For purchase order ${po.poNumber} from ${po.vendorName}. Recording it brings the ordered items into stock.`
            : poError ? 'That purchase order couldn’t be opened — enter the bill by hand.' : sub}
        </p>
      </div>
      {(docId && isLoading) || (poId && !docId && poLoading) || (grnId && grnLoading) || (returnId && retLoading) || (claimId && claimLoading) ? <SkeletonCard lines={6} />
        : <BillForm defaultType={returnId || claimId ? 'CREDIT_NOTE' : poId || grnId ? 'BILL' : type} fromDocument={doc ?? null} fromPo={grnId || returnId || claimId ? null : po ?? null}
            fromGrn={grn ?? null} fromReturn={ret ?? null} fromClaim={claim && claim.kind === 'SUPPLIER' ? claim : null} />}
    </div>
  )
}

export default function NewBillPage() {
  return <Suspense fallback={null}><NewBill /></Suspense>
}
