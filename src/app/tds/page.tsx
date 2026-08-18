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
import { StatusBadge } from '@/components/ui/Badge'
import { Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const ENTRIES=[
  {vendor:'Acer India Pvt Ltd', pan:'AAACI1234A',section:'194C',payment:125000,rate:2,tds:2500,date:'02 Apr',status:'DEDUCTED'},
  {vendor:'Infosys Consulting', pan:'AAIIF0121H',section:'194J',payment:185000,rate:10,tds:18500,date:'01 Apr',status:'DEDUCTED'},
  {vendor:'Office Lease (Powai)',pan:'AAACO4567G',section:'194I',payment:80000,rate:10,tds:8000,date:'01 Apr',status:'DEDUCTED'},
  {vendor:'Tech Writer - Ravi K.',pan:'AAAPR9012K',section:'194J',payment:30000,rate:10,tds:3000,date:'03 Apr',status:'DEDUCTED'},
  {vendor:'Transport - FastMove', pan:'AABCT3456L',section:'194C',payment:18000,rate:1,tds:180,date:'04 Apr',status:'PENDING'},
]

const SECTIONS=[
  {sec:'194C',desc:'Payments to contractors/sub-contractors',rateInd:'1%',rateCo:'2%',thresh:'₹30,000 per contract / ₹1L annual'},
  {sec:'194J',desc:'Professional / technical service fees',rateInd:'10%',rateCo:'10%',thresh:'₹30,000 per annum'},
  {sec:'194I',desc:'Rent (land, building, machinery)',rateInd:'10%',rateCo:'10%',thresh:'₹2,40,000 per annum'},
  {sec:'194H',desc:'Commission or brokerage',rateInd:'5%',rateCo:'5%',thresh:'₹15,000 per annum'},
]

export default function TdsPage(){
  const [quarter,setQuarter]=useState('Q4 FY 2024-25')
  const totalTds=ENTRIES.reduce((s,e)=>s+e.tds,0)

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#b45309',letterSpacing:'.08em'}}>F-05 — New Feature</span>
          <h1 className="page-title">TDS Calculator & Tracker</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Auto-detect TDS section · Deduct at correct rate · Track challans · Generate Form 26Q</p>
        </div>
        <div className="flex gap-2">
          <select className="input h-9 w-44 text-sm" value={quarter} onChange={e=>setQuarter(e.target.value)}>
            {['Q1 FY 2024-25','Q2 FY 2024-25','Q3 FY 2024-25','Q4 FY 2024-25'].map(q=><option key={q}>{q}</option>)}
          </select>
          <button onClick={()=>toast('Form 26Q data exported')} className="btn-secondary h-9"><Download className="w-4 h-4"/>Form 26Q</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{l:'Total Payments',v:formatCurrency(ENTRIES.reduce((s,e)=>s+e.payment,0)),c:'#3b82f6'},
          {l:'TDS Deducted',  v:formatCurrency(totalTds),c:'var(--gold)'},
          {l:'Challan Due',   v:'7 May 2025',c:'#ef4444'},
          {l:'Form 26Q Status',v:'Ready',c:'#22c55e'}].map(s=>(
          <div key={s.l} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.l}</p>
            <p className="font-serif text-xl" style={{color:s.c}}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h2 className="section-title mb-4">TDS Deductions — {quarter}</h2>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Vendor','PAN','Section','Payment','Rate','TDS','Date','Status'].map(h=><th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {ENTRIES.map((e,i)=>(
                  <tr key={i} className="table-row">
                    <td className="table-cell font-medium text-sm">{e.vendor}</td>
                    <td className="table-cell font-mono text-xs">{e.pan}</td>
                    <td className="table-cell"><span className="text-xs px-2 py-1 rounded-full font-semibold" style={{background:'rgba(180,83,9,.1)',color:'#b45309'}}>{e.section}</span></td>
                    <td className="table-cell font-mono text-sm">{formatCurrency(e.payment)}</td>
                    <td className="table-cell font-mono text-sm">{e.rate}%</td>
                    <td className="table-cell font-mono text-sm font-semibold" style={{color:'var(--gold)'}}>{formatCurrency(e.tds)}</td>
                    <td className="table-cell text-xs">{e.date}</td>
                    <td className="table-cell"><StatusBadge status={e.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">TDS Sections</h2>
          <div className="space-y-3">
            {SECTIONS.map(s=>(
              <div key={s.sec} className="p-3 rounded-xl" style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{color:'#b45309'}}>{s.sec}</span>
                  <span className="text-xs font-mono" style={{color:'var(--gold)'}}>Indiv: {s.rateInd} / Co: {s.rateCo}</span>
                </div>
                <p className="text-xs" style={{color:'var(--text-secondary)'}}>{s.desc}</p>
                <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>Threshold: {s.thresh}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
