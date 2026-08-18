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
import { AlertTriangle, Package, CheckCircle, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const ITEMS = [
  {code:'ELEC-001',name:'Acer Laptop A15',stock:3,reorder:5,daily:0,lead:14,stockout:'3 days',rec:10,risk:88,level:'CRITICAL',color:'#ef4444'},
  {code:'ELEC-003',name:'Dell Monitor 24"',stock:12,reorder:8,daily:0,lead:21,stockout:'11 days',rec:5,risk:55,level:'WARNING',color:'#f59e0b'},
  {code:'ELEC-002',name:'HP Printer 404',stock:7,reorder:5,daily:1,lead:7,stockout:'7 days',rec:6,risk:62,level:'WARNING',color:'#f59e0b'},
  {code:'OFFS-001',name:'A4 Paper 80gsm',stock:145,reorder:50,daily:8,lead:2,stockout:'18 days',rec:100,risk:35,level:'MODERATE',color:'#d97706'},
  {code:'NETW-001',name:'Cat6 Ethernet (m)',stock:80,reorder:30,daily:2,lead:3,stockout:'40 days',rec:0,risk:12,level:'HEALTHY',color:'#22c55e'},
]

const RISK_COLOR:{[k:string]:string}={CRITICAL:'#ef4444',WARNING:'#f59e0b',MODERATE:'#d97706',HEALTHY:'#22c55e'}

export default function DemandForecastPage(){
  const [selected,setSelected]=useState<string[]>([])

  const toggle=(code:string)=>setSelected(s=>s.includes(code)?s.filter(c=>c!==code):[...s,code])
  const needOrder=ITEMS.filter(i=>i.level!=='HEALTHY')
  const estValue=formatCurrency(needOrder.reduce((t,i)=>t+i.rec*52000,0))

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#db2777',letterSpacing:'.08em'}}>F-06 — New Feature</span>
          <h1 className="page-title">Demand Forecasting</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>AI analyses 12-month velocity, seasonality and lead times to prevent stockouts</p>
        </div>
        {selected.length>0&&(
          <button onClick={()=>{toast.success(`${selected.length} draft POs created for approval`);setSelected([])}} className="btn-primary h-9">
            <ShoppingCart className="w-4 h-4"/>Generate {selected.length} PO{selected.length>1?'s':''}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:'Items Analysed',v:ITEMS.length,c:'#3b82f6'},
          {l:'Critical (order now)',v:1,c:'#ef4444'},
          {l:'Warning (7 days)',v:2,c:'#f59e0b'},
          {l:'Est. PO Value',v:'₹12.4L',c:'var(--gold)'}].map(s=>(
          <div key={s.l} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.l}</p>
            <p className="font-serif text-2xl" style={{color:s.c}}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="section-title mb-4">AI Restock Recommendations</h2>
        <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Select items to auto-generate draft Purchase Orders for approval</p>
        <div className="space-y-3">
          {ITEMS.map((item,i)=>{
            const isSel=selected.includes(item.code)
            const canOrder=item.level!=='HEALTHY'
            return(
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
                style={{background:isSel?`${item.color}08`:'var(--bg-hover)',
                        border:`1px solid ${isSel?item.color+'30':'var(--border)'}`,
                        opacity:canOrder?1:.7}}
                onClick={()=>canOrder&&toggle(item.code)}>
                {canOrder&&<input type="checkbox" checked={isSel} onChange={()=>toggle(item.code)} className="flex-shrink-0"/>}
                {!canOrder&&<CheckCircle className="w-4 h-4 flex-shrink-0" style={{color:'#22c55e'}}/>}

                <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-2">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="font-mono text-xs" style={{color:'var(--gold)',fontSize:'10px'}}>{item.code}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{color:'var(--text-muted)'}}>Current Stock</p>
                    <p className="font-bold text-sm" style={{color:item.risk>60?item.color:'#22c55e'}}>{item.stock} units</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{color:'var(--text-muted)'}}>Predicted Stockout</p>
                    <p className="font-bold text-sm" style={{color:item.color}}>{item.stockout}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs" style={{color:'var(--text-muted)'}}>Recommend Order</p>
                    <p className="font-bold text-sm">{item.rec>0?`${item.rec} units`:'—'}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{background:`${RISK_COLOR[item.level]}12`,color:RISK_COLOR[item.level],border:`1px solid ${RISK_COLOR[item.level]}20`}}>
                    {item.level}
                  </span>
                  <div style={{width:'80px',height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden',marginTop:'6px'}}>
                    <div style={{height:'100%',borderRadius:'4px',background:item.color,width:`${item.risk}%`}}/>
                  </div>
                  <p className="text-xs mt-0.5 font-mono" style={{color:item.color}}>Risk {item.risk}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
