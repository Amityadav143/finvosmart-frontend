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

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { InvoiceForm } from '@/components/invoicing/InvoiceForm'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { warrantyApi } from '@/lib/api/warranty'
import type { InvoiceType } from '@/types'

const TYPES: InvoiceType[] = ['TAX_INVOICE', 'PROFORMA', 'QUOTATION', 'CREDIT_NOTE', 'DEBIT_NOTE', 'DELIVERY_CHALLAN']
const TITLE: Record<string, string> = {
  TAX_INVOICE: 'New invoice', PROFORMA: 'New proforma invoice', QUOTATION: 'New quotation', CREDIT_NOTE: 'New credit note',
  DEBIT_NOTE: 'New debit note', DELIVERY_CHALLAN: 'New delivery challan',
}
/** A record id as it may appear in the address (letters, digits and hyphens). */
const ID_RE = /^[A-Za-z0-9-]{1,64}$/

function NewInvoice() {
  const params = useSearchParams()
  const t = params.get('type') as InvoiceType | null
  const type = t && TYPES.includes(t) ? t : 'TAX_INVOICE'
  const customer = params.get('customer')
  // a credit note for a customer's warranty claim (approved for credit)
  const claimId = params.get('claim')
  const fromClaim = !!claimId && ID_RE.test(claimId)
  const { data: claim, isLoading: claimLoading, isError: claimError } = useQuery({ queryKey: ['warranty-claim', claimId], queryFn: () => warrantyApi.get(claimId!), enabled: fromClaim })
  const customerId = claim?.customerId ?? (customer && ID_RE.test(customer) ? customer : undefined)
  return (
    <div className="space-y-4">
      <div>
        <Link href={type === 'QUOTATION' ? '/quotations' : '/invoicing'} className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />{type === 'QUOTATION' ? 'Quotations' : 'Invoices'}
        </Link>
        <h1 className="page-title mt-1">{TITLE[type]}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {claim ? `For warranty claim ${claim.number} of ${claim.partyName}: the goods at what they paid. Saved as a draft first; issuing it resolves the claim.`
            : claimError ? 'That warranty claim couldn’t be opened — enter the credit note by hand.'
            : 'Saved as a draft first. GST is worked out from the place of supply; totals match the PDF to the paisa.'}</p>
      </div>
      {fromClaim && claimLoading ? <SkeletonCard lines={6} />
        : <InvoiceForm defaultType={claim ? 'CREDIT_NOTE' : type} defaultCustomerId={customerId}
            fromClaim={claim && claim.kind === 'CUSTOMER' ? claim : null} />}
    </div>
  )
}

export default function NewInvoicePage() {
  return <Suspense fallback={null}><NewInvoice /></Suspense>
}
