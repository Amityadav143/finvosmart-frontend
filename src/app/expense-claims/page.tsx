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
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { Camera, CheckCircle, AlertTriangle, Plus, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const CLAIMS = [
  {id:'EXP-001',emp:'Priya Sharma',code:'EMP-25-0002',category:'Travel',  amount:450,   vendor:'Ola Cabs',     status:'APPROVED',time:'09:02 AM',auto:true},
  {id:'EXP-002',emp:'Rohit Gupta', code:'EMP-25-0005',category:'Meals',   amount:2800,  vendor:'Mainland China',status:'PENDING', time:'10:15 AM',auto:false},
  {id:'EXP-003',emp:'Amit Singh',  code:'EMP-25-0003',category:'Fuel',    amount:1200,  vendor:'BPCL',         status:'APPROVED',time:'10:47 AM',auto:true},
  {id:'EXP-004',emp:'Sneha Patel', code:'EMP-25-0004',category:'Supplies',amount:3400,  vendor:'Staples',      status:'PENDING', time:'11:20 AM',auto:false},
  {id:'EXP-005',emp:'Vikram Nair', code:'EMP-25-0006',category:'Travel',  amount:780,   vendor:'Uber',         status:'APPROVED',time:'11:55 AM',auto:true},
]

const POLICY = [
  {cat:'Travel (Cab/Auto)',limit:'₹1,000 / claim',monthly:'₹8,000'},
  {cat:'Meals',           limit:'₹2,000 / claim',monthly:'₹6,000'},
  {cat:'Fuel',            limit:'₹2,000 / claim',monthly:'₹10,000'},
  {cat:'Office Supplies', limit:'₹3,000 / claim',monthly:'₹5,000'},
  {cat:'Hotel / Travel',  limit:'Manager approval',monthly:'No limit'},
]

export default function ExpenseClaimsPage(){
  const [showNew,setShowNew]=useState(false)
  const [form,setForm]=useState({category:'Travel',amount:'',vendor:'',remarks:''})

  const todayTotal = CLAIMS.reduce((s,c)=>s+c.amount,0)
  const pending    = CLAIMS.filter(c=>c.status==='PENDING').length
  const autoCount  = CLAIMS.filter(c=>c.auto).length

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#16a34a',letterSpacing:'.08em'}}>F-02 — New Feature</span>
          <h1 className="page-title">Expense Claims</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Receipt photo → auto-approved claim · Zero paperwork</p>
        </div>
        <button onClick={()=>setShowNew(true)} className="btn-primary h-9"><Plus className="w-4 h-4"/>New Claim</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {l:'Today Total',    v:formatCurrency(todayTotal), c:'var(--gold)',i:DollarSign},
          {l:'Auto-Approved',  v:`${autoCount} claims`,     c:'#22c55e',   i:CheckCircle},
          {l:'Pending Review', v:`${pending} claims`,       c:'#f59e0b',   i:AlertTriangle},
        ].map(s=>(
          <div key={s.l} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${s.c}15`}}>
              <s.i className="w-5 h-5" style={{color:s.c}}/>
            </div>
            <div><p className="font-serif text-xl" style={{color:s.c}}>{s.v}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.l}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-4">Today's Claims</h2>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Employee','Category','Amount','Vendor','Method','Time','Status'].map(h=><th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {CLAIMS.map((c,i)=>(
                  <tr key={i} className="table-row">
                    <td className="table-cell"><p className="font-semibold text-sm">{c.emp}</p><p className="font-mono text-xs" style={{color:'var(--text-muted)',fontSize:'10px'}}>{c.code}</p></td>
                    <td className="table-cell"><span className="text-xs px-2 py-1 rounded-full" style={{background:'rgba(139,92,246,.1)',color:'#8b5cf6'}}>{c.category}</span></td>
                    <td className="table-cell font-mono font-semibold">{formatCurrency(c.amount)}</td>
                    <td className="table-cell text-xs" style={{color:'var(--text-secondary)'}}>{c.vendor}</td>
                    <td className="table-cell">
                      <span className="text-xs" style={{color:c.auto?'#22c55e':'#f59e0b'}}>{c.auto?'Auto':'Manual'}</span>
                    </td>
                    <td className="table-cell text-xs">{c.time}</td>
                    <td className="table-cell"><StatusBadge status={c.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Expense Policy</h2>
          <div className="space-y-2.5">
            {POLICY.map(p=>(
              <div key={p.cat} className="p-3 rounded-xl" style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>
                <p className="text-xs font-semibold mb-1">{p.cat}</p>
                <div className="flex items-center justify-between text-xs" style={{color:'var(--text-muted)'}}>
                  <span>Per claim: <span style={{color:'var(--gold)'}}>{p.limit}</span></span>
                  <span>Monthly: {p.monthly}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-xl" style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.15)'}}>
            <p className="text-xs font-semibold" style={{color:'#22c55e'}}>WhatsApp shortcut</p>
            <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>Send receipt photo to +91-XXXXX-XXXXX to submit instantly</p>
          </div>
        </div>
      </div>

      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Submit Expense Claim" subtitle="Upload receipt for auto-approval">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl" style={{background:'rgba(22,163,74,.05)',border:'2px dashed rgba(22,163,74,.2)'}}>
            <Camera className="w-8 h-8" style={{color:'#16a34a'}}/>
            <p className="text-sm font-medium">Upload receipt photo</p>
            <button className="btn-secondary text-xs">Choose File</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label>
              <select className="input h-10" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                {['Travel','Meals','Fuel','Supplies','Hotel','Other'].map(c=><option key={c}>{c}</option>)}
              </select></div>
            <div><label className="label">Amount ₹</label>
              <input className="input h-10" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
          </div>
          <div><label className="label">Vendor / Merchant</label>
            <input className="input h-10" value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))}/></div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowNew(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('Claim submitted — auto-processing...');setShowNew(false)}} className="btn-primary">Submit Claim</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
