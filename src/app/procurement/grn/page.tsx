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

import { StatusBadge, Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Package, CheckCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const GRNS = [
  {id:'1',grnNumber:'GRN-2025-00021',poNumber:'PO-2025-00112',vendor:'Acer India',receivedDate:'2025-03-28',status:'ACCEPTED',  items:3,value:125000},
  {id:'2',grnNumber:'GRN-2025-00020',poNumber:'PO-2025-00108',vendor:'Dell Technologies',receivedDate:'2025-03-25',status:'QUALITY_CHECK',items:5,value:840000},
  {id:'3',grnNumber:'GRN-2025-00019',poNumber:'PO-2025-00103',vendor:'HP India',receivedDate:'2025-03-20',status:'ACCEPTED',  items:2,value:380000},
  {id:'4',grnNumber:'GRN-2025-00018',poNumber:'PO-2025-00098',vendor:'Office Supply Co.',receivedDate:'2025-03-15',status:'REJECTED',items:8,value: 45000},
  {id:'5',grnNumber:'GRN-2025-00017',poNumber:'PO-2025-00092',vendor:'Cisco Systems',receivedDate:'2025-03-10',status:'ACCEPTED',  items:1,value:1200000},
]

export default function GRNPage(){
  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Goods Receipts</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Inbound delivery verification and acceptance</p>
        </div>
        <button onClick={()=>toast('Link to a PO to create GRN')} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>New GRN</button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {label:'Total GRNs',   val:21,  color:'#3b82f6'},
          {label:'Accepted',     val:18,  color:'#22c55e'},
          {label:'Pending QC',   val:2,   color:'#f59e0b'},
          {label:'Rejected',     val:1,   color:'#ef4444'},
        ].map(s=>(
          <div key={s.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.label}</p>
            <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['GRN Number','PO Reference','Vendor','Received Date','Items','Value','Status','Actions'].map(h=>(
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {GRNS.map((g,i)=>(
              <tr key={g.id} className="table-row" style={{animationDelay:`${i*.04}s`}}>
                <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{g.grnNumber}</span></td>
                <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--text-secondary)'}}>{g.poNumber}</span></td>
                <td className="table-cell font-medium">{g.vendor}</td>
                <td className="table-cell text-xs">{formatDate(g.receivedDate)}</td>
                <td className="table-cell"><span className="font-semibold">{g.items}</span></td>
                <td className="table-cell"><span className="font-mono text-sm">{formatCurrency(g.value)}</span></td>
                <td className="table-cell"><StatusBadge status={g.status}/></td>
                <td className="table-cell">
                  {g.status==='QUALITY_CHECK' && (
                    <button onClick={()=>toast.success(`GRN ${g.grnNumber} accepted`)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.2)'}}>
                      <CheckCircle className="w-3 h-3"/>Accept
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
