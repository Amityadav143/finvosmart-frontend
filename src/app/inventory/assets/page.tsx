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

import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Building2, Monitor, Car, Wrench } from 'lucide-react'

const ASSETS = [
  {id:'1',name:'HP LaserJet Pro M404',code:'FA-ELEC-001',category:'Electronics',value:35000,wdv:24500,location:'Head Office',condition:'Good',  depreciation:30},
  {id:'2',name:'Dell Precision Workstation',code:'FA-ELEC-002',category:'Electronics',value:125000,wdv:87500,location:'Design Lab',condition:'Excellent',depreciation:30},
  {id:'3',name:'Office Furniture Set (10 Desks)',code:'FA-FURN-001',category:'Furniture',value:180000,wdv:144000,location:'Floor 2',condition:'Good',depreciation:10},
  {id:'4',name:'Toyota Innova Crysta',code:'FA-VEH-001',category:'Vehicles',value:2200000,wdv:1760000,location:'Company Pool',condition:'Excellent',depreciation:15},
  {id:'5',name:'Server Room AC Unit',code:'FA-INFRA-001',category:'Infrastructure',value:85000,wdv:59500,location:'Server Room',condition:'Good',depreciation:15},
]

const CATICON:{[k:string]:any} = {Electronics:Monitor,Furniture:Building2,Vehicles:Car,Infrastructure:Wrench}

export default function AssetsPage(){
  const totalValue    = ASSETS.reduce((s,a)=>s+a.value,0)
  const totalWdv      = ASSETS.reduce((s,a)=>s+a.wdv,0)
  const totalDeprec   = totalValue - totalWdv

  return(
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Fixed Assets</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Asset register with depreciation tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Gross Block',    val:formatCurrency(totalValue),  color:'#3b82f6'},
          {label:'Net Book Value', val:formatCurrency(totalWdv),    color:'#22c55e'},
          {label:'Depreciation',   val:formatCurrency(totalDeprec), color:'#ef4444'},
        ].map(s=>(
          <div key={s.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
            <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Asset','Code','Category','Gross Value','Net Book Value','Dep Rate','Location','Condition'].map(h=>(
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {ASSETS.map((a,i)=>{
              const Icon = CATICON[a.category]||Building2
              return(
                <tr key={a.id} className="table-row" style={{animationDelay:`${i*.04}s`}}>
                  <td className="table-cell font-medium">{a.name}</td>
                  <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{a.code}</span></td>
                  <td className="table-cell">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Icon className="w-3.5 h-3.5" style={{color:'var(--text-muted)'}}/>
                      {a.category}
                    </span>
                  </td>
                  <td className="table-cell font-mono text-sm">{formatCurrency(a.value)}</td>
                  <td className="table-cell font-mono text-sm font-semibold" style={{color:'#22c55e'}}>{formatCurrency(a.wdv)}</td>
                  <td className="table-cell"><span className="font-mono text-sm">{a.depreciation}%</span></td>
                  <td className="table-cell text-xs">{a.location}</td>
                  <td className="table-cell">
                    <Badge variant={a.condition==='Excellent'?'success':'default'}>{a.condition}</Badge>
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
