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
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventory'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'

const MOCK_MOVEMENTS = [
  {id:'1',item:'Acer Laptop Model A15',code:'ELEC-001',date:'2025-04-02',type:'IN',qty:5,unit:'PCS',cost:52000,ref:'GRN-2025-00021',stockAfter:23},
  {id:'2',item:'HP Laser Printer 404',code:'ELEC-002',date:'2025-04-01',type:'OUT',qty:1,unit:'PCS',cost:28000,ref:'INV-2025-000043',stockAfter:7},
  {id:'3',item:'A4 Copy Paper 80GSM', code:'OFFS-001',date:'2025-04-01',type:'IN',qty:50,unit:'REAM',cost:180,ref:'GRN-2025-00020',stockAfter:145},
  {id:'4',item:'Ethernet Cable CAT6', code:'NETW-001',date:'2025-03-31',type:'OUT',qty:20,unit:'MTR',cost:25,ref:'MANUAL',stockAfter:80},
  {id:'5',item:'Dell Monitor 24"',    code:'ELEC-003',date:'2025-03-30',type:'ADJUSTMENT',qty:-2,unit:'PCS',cost:18500,ref:'AUDIT-ADJ',stockAfter:12},
  {id:'6',item:'Acer Laptop Model A15',code:'ELEC-001',date:'2025-03-28',type:'OUT',qty:3,unit:'PCS',cost:52000,ref:'INV-2025-000041',stockAfter:18},
]

const TYPE_CONFIG:{[k:string]:{icon:any,color:string,label:string}} = {
  IN:         {icon:ArrowDownCircle,color:'#22c55e',label:'Stock In'},
  OUT:        {icon:ArrowUpCircle,  color:'#ef4444',label:'Stock Out'},
  ADJUSTMENT: {icon:RefreshCw,     color:'#f59e0b',label:'Adjustment'},
  TRANSFER_IN:{icon:ArrowDownCircle,color:'#3b82f6',label:'Transfer In'},
  TRANSFER_OUT:{icon:ArrowUpCircle, color:'#8b5cf6',label:'Transfer Out'},
}

export default function StockPage(){
  const [filter, setFilter] = useState('')
  const filtered = filter ? MOCK_MOVEMENTS.filter(m=>m.type===filter) : MOCK_MOVEMENTS

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Stock Movements</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Complete inventory transaction ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          {label:'Today In',     val:'+55 units', color:'#22c55e'},
          {label:'Today Out',    val:'-1 unit',   color:'#ef4444'},
          {label:'Adjustments',  val:'-2 units',  color:'#f59e0b'},
          {label:'Transfers',    val:'0',          color:'#3b82f6'},
        ].map(s=>(
          <div key={s.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
            <p className="font-serif text-xl" style={{color:s.color}}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['','IN','OUT','ADJUSTMENT','TRANSFER_IN','TRANSFER_OUT'].map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{background:filter===t?'var(--gold-muted)':'var(--bg-hover)',
                    color:filter===t?'var(--gold)':'var(--text-muted)',
                    border:`1px solid ${filter===t?'rgba(245,158,11,.2)':'var(--border)'}`}}>
            {t||'All'}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Item','Date','Type','Qty','Unit Cost','Reference','Stock After'].map(h=>(
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((m,i)=>{
              const cfg = TYPE_CONFIG[m.type]
              return(
                <tr key={m.id} className="table-row" style={{animationDelay:`${i*.04}s`}}>
                  <td className="table-cell">
                    <p className="font-semibold text-sm">{m.item}</p>
                    <p className="font-mono text-xs" style={{color:'var(--gold)',fontSize:'10px'}}>{m.code}</p>
                  </td>
                  <td className="table-cell text-xs">{formatDate(m.date)}</td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{color:cfg.color}}>
                      <cfg.icon className="w-3.5 h-3.5"/>{cfg.label}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="font-mono text-sm font-bold" style={{color:m.qty>0?'#22c55e':'#ef4444'}}>
                      {m.qty>0?'+':''}{m.qty} {m.unit}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-sm">{formatCurrency(m.cost)}</td>
                  <td className="table-cell">
                    <span className="font-mono text-xs" style={{color:'var(--text-secondary)'}}>{m.ref}</span>
                  </td>
                  <td className="table-cell">
                    <span className="font-mono text-sm font-semibold" style={{color:'var(--text-primary)'}}>{m.stockAfter}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
