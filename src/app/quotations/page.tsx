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

import { useQuery } from '@tanstack/react-query'
import { invoicingApi } from '@/lib/api/invoicing'
import { DataTable } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Invoice } from '@/types'
import { Plus, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuotationsPage(){
  const {data,isLoading} = useQuery({
    queryKey:['quotations'],
    queryFn:()=>invoicingApi.list({page:0,size:20,invoiceType:'QUOTATION'}),
  })
  const columns = [
    {header:'Quote #',   render:(i:Invoice)=><span className="font-mono text-sm" style={{color:'var(--gold)'}}>{i.invoiceNumber}</span>},
    {header:'Customer',  render:(i:Invoice)=><span className="font-semibold text-sm">{i.customerName}</span>},
    {header:'Date',      render:(i:Invoice)=><span className="text-xs">{formatDate(i.invoiceDate)}</span>},
    {header:'Valid Until',render:(i:Invoice)=><span className="text-xs">{i.dueDate?formatDate(i.dueDate):'30 days'}</span>},
    {header:'Amount',    render:(i:Invoice)=><span className="font-mono text-sm font-semibold">{formatCurrency(i.totalAmount)}</span>},
    {header:'Status',    render:(i:Invoice)=><StatusBadge status={i.status}/>},
  ]
  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>{data?.totalElements??0} quotations created</p>
        </div>
        <button onClick={()=>toast('New quotation form')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>New Quote</button>
      </div>
      <DataTable columns={columns} data={data?.content??[]} loading={isLoading} keyExtractor={i=>i.id} emptyMessage="No quotations yet. Create your first quote."/>
    </div>
  )
}
