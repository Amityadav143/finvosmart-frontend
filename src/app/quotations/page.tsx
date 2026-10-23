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

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { invoicingApi } from '@/lib/api/invoicing'
import { DataTable } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { STATUS_LABEL, todayIST } from '@/lib/money'
import type { Invoice } from '@/types'
import { Plus, FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePermissions } from '@/lib/hooks/usePermissions'

/** Where a quotation stands: invoiced, expired (past its validity, not invoiced) or its own status. */
function QuoteStatus({ q, today }: { q: Invoice; today: string }) {
  if (q.convertedToId) return <Badge variant="success">Invoiced · {q.convertedToNumber}</Badge>
  if (q.acceptedAt && q.status !== 'CANCELLED') return <Badge variant="info">Accepted · {q.acceptedBy}</Badge>
  if (q.status !== 'DRAFT' && q.status !== 'CANCELLED' && q.dueDate && q.dueDate < today) return <Badge variant="warning">Expired</Badge>
  return <StatusBadge status={q.status === 'OVERDUE' ? 'SENT' : q.status} label={q.status === 'OVERDUE' ? STATUS_LABEL.SENT : STATUS_LABEL[q.status]} />
}

export default function QuotationsPage(){
  const router = useRouter()
  const { can } = usePermissions()
  const [page, setPage] = useState(0)
  const today = todayIST()
  const {data,isLoading} = useQuery({
    queryKey:['quotations', page],
    queryFn:()=>invoicingApi.list({page,size:20,invoiceType:'QUOTATION'}),
  })
  const columns = [
    {header:'Quote #',   render:(i:Invoice)=><span className="font-mono text-sm" style={{color:'var(--gold)'}}>{i.invoiceNumber}</span>},
    {header:'Customer',  render:(i:Invoice)=><span className="font-semibold text-sm">{i.customerName}</span>},
    {header:'Date',      render:(i:Invoice)=><span className="text-xs">{formatDate(i.invoiceDate)}</span>},
    {header:'Valid until',render:(i:Invoice)=><span className="text-xs">{i.dueDate?formatDate(i.dueDate):'—'}</span>},
    {header:'Amount',    render:(i:Invoice)=><span className="font-mono text-sm font-semibold">{formatCurrency(i.totalAmount)}</span>},
    {header:'Status',    render:(i:Invoice)=><QuoteStatus q={i} today={today}/>},
  ]
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>{data?.totalElements??0} quotations created</p>
        </div>
        {can('INVOICE_CREATE') && <button onClick={()=>router.push('/invoicing/new?type=QUOTATION')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>New quotation</button>}
      </div>
      <DataTable columns={columns} data={data?.content??[]} loading={isLoading} keyExtractor={i=>i.id}
        onRowClick={i=>router.push(`/invoicing/${i.id}`)}
        empty={<EmptyState compact icon={FileText} title="No quotations yet"
          description="Send a quotation with the same GST maths as your invoices. Your customer can accept it from its link; then open it and choose Convert to invoice."
          action={can('INVOICE_CREATE') ? { label: 'Create a quotation', href: '/invoicing/new?type=QUOTATION' } : undefined} />}/>
      {data && data.totalPages > 1 && <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onPageChange={setPage} totalElements={data.totalElements} pageSize={20}/>}
    </div>
  )
}
