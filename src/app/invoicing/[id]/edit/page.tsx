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

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { invoicingApi } from '@/lib/api/invoicing'
import { InvoiceForm } from '@/components/invoicing/InvoiceForm'
import { SkeletonCard } from '@/components/ui/Skeleton'

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading, isError } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoicingApi.get(id) })
  return (
    <div className="space-y-4">
      <div>
        <Link href={`/invoicing/${id}`} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Back to the invoice</Link>
        <h1 className="page-title mt-1">Edit draft {invoice?.invoiceNumber ?? ''}</h1>
      </div>
      {isLoading && <SkeletonCard lines={6} />}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>This invoice couldn't be loaded.</div>}
      {invoice && invoice.status !== 'DRAFT' && (
        <div className="card text-sm">Only drafts can be edited. To correct an issued invoice, create a credit note or debit note.</div>
      )}
      {invoice && invoice.status === 'DRAFT' && <InvoiceForm invoice={invoice} />}
    </div>
  )
}
