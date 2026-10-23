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
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { billsApi } from '@/lib/api/purchases'
import { BillForm } from '@/components/purchases/BillForm'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { BILL_TYPE_LABEL } from '@/lib/purchases'

export default function EditBillPage() {
  const { id } = useParams<{ id: string }>()
  const { data: bill, isLoading, isError } = useQuery({ queryKey: ['bill', id], queryFn: () => billsApi.get(id) })
  const { data: payments = [] } = useQuery({ queryKey: ['bill-payments', id], queryFn: () => billsApi.payments(id), enabled: !!bill && bill.status !== 'DRAFT' })
  const locked = bill && (bill.status === 'CANCELLED' || payments.some(p => !p.voidedAt))
  return (
    <div className="space-y-4">
      <div>
        <Link href={`/purchases/bills/${id}`} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Back</Link>
        <h1 className="page-title mt-1">Edit {bill ? `${BILL_TYPE_LABEL[bill.billType].toLowerCase()} ${bill.referenceNumber}` : ''}</h1>
        {bill && bill.status !== 'DRAFT' && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Saving replaces the entry in your books with the corrected one; the change is kept in the edit log.</p>}
      </div>
      {isLoading && <SkeletonCard lines={6} />}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>This bill couldn't be loaded.</div>}
      {locked && <div className="card text-sm">{bill!.status === 'CANCELLED' ? 'A cancelled bill can’t be edited.' : 'Payments or credit notes are recorded against this bill. Void them first to edit it, or enter a supplier credit note for the difference.'}</div>}
      {bill && !locked && <BillForm bill={bill} />}
    </div>
  )
}
