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
import { formatCurrency } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Plus, RefreshCw, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const SUBS = [
  {id:'S1',customer:'Infosys Ltd.',  desc:'Monthly Technology Retainer',     amount:250000, freq:'Monthly',   next:'30 Apr 2025', generated:6,  total:1500000, status:'ACTIVE'},
  {id:'S2',customer:'TCS Ltd.',       desc:'Annual Maintenance Contract',     amount:80000,  freq:'Quarterly', next:'01 Jul 2025', generated:4,  total:320000,  status:'ACTIVE'},
  {id:'S3',customer:'Wipro Tech',     desc:'Cloud Infrastructure Support',   amount:45000,  freq:'Monthly',   next:'30 Apr 2025', generated:8,  total:360000,  status:'ACTIVE'},
  {id:'S4',customer:'HCL Technologies',desc:'Software Subscription',          amount:120000, freq:'Annually',  next:'15 Jan 2026', generated:1,  total:120000,  status:'ACTIVE'},
  {id:'S5',customer:'Tech Mahindra',  desc:'On-site Support Contract',        amount:95000,  freq:'Monthly',   next:'30 Apr 2025', generated:3,  total:285000,  status:'PAUSED'},
]

export default function SubscriptionsPage(){
  const [showCreate,setShowCreate]=useState(false)
  const arr = SUBS.filter(s=>s.status==='ACTIVE').reduce((t,s)=>t+(s.freq==='Monthly'?s.amount:s.freq==='Quarterly'?s.amount/3:s.amount/12),0)

  return(
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#0d9488',letterSpacing:'.08em'}}>F-04 — New Feature</span>
          <h1 className="page-title">Recurring Billing</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Set once — invoices auto-generate and send on schedule</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary h-9"><Plus className="w-4 h-4"/>New Subscription</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{l:'Active Subscriptions',v:SUBS.filter(s=>s.status==='ACTIVE').length,c:'#0d9488'},
          {l:'Monthly ARR',v:formatCurrency(arr),c:'var(--gold)'},
          {l:'Next auto-invoice',v:'30 Apr 2025',c:'#3b82f6'}].map(s=>(
          <div key={s.l} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.l}</p>
            <p className="font-serif text-2xl" style={{color:s.c}}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Customer','Description','Amount','Frequency','Next Invoice','Generated','Total Billed','Status'].map(h=><th key={h} className="table-header">{h}</th>)}
          </tr></thead>
          <tbody>
            {SUBS.map((s,i)=>(
              <tr key={i} className="table-row">
                <td className="table-cell font-semibold">{s.customer}</td>
                <td className="table-cell text-xs" style={{color:'var(--text-secondary)'}}>{s.desc}</td>
                <td className="table-cell font-mono font-semibold">{formatCurrency(s.amount)}</td>
                <td className="table-cell">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{background:'rgba(13,148,136,.1)',color:'#0d9488',border:'1px solid rgba(13,148,136,.18)'}}>
                    <RefreshCw className="w-3 h-3 inline mr-1"/>{s.freq}
                  </span>
                </td>
                <td className="table-cell text-xs">{s.next}</td>
                <td className="table-cell text-center font-semibold">{s.generated}</td>
                <td className="table-cell font-mono text-sm">{formatCurrency(s.total)}</td>
                <td className="table-cell"><Badge variant={s.status==='ACTIVE'?'success':'default'}>{s.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New Subscription" subtitle="Set up recurring billing schedule">
        <div className="space-y-4">
          <div><label className="label">Customer</label><select className="input h-10"><option>Select customer…</option></select></div>
          <div><label className="label">Description</label><input className="input h-10" placeholder="e.g. Monthly Retainer"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Amount ₹</label><input className="input h-10" type="number"/></div>
            <div><label className="label">Frequency</label>
              <select className="input h-10">
                {['Monthly','Quarterly','Half-Yearly','Annually'].map(f=><option key={f}>{f}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input className="input h-10" type="date"/></div>
            <div><label className="label">End Date (optional)</label><input className="input h-10" type="date"/></div>
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('Subscription activated — first invoice on schedule');setShowCreate(false)}} className="btn-primary">Activate</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
