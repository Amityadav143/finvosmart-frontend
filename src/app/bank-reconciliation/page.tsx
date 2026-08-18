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

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const MATCHED = [
  {bank:'NEFT CR-TCS LTD',     amount:'₹4,20,000',date:'02 Apr',je:'REC-2025-00041',conf:98.5,type:'CREDIT'},
  {bank:'IMPS ACER INDIA',     amount:'₹1,25,000',date:'03 Apr',je:'JE-2025-00039', conf:95.2,type:'DEBIT'},
  {bank:'RTGS INFOSYS LTD',    amount:'₹2,50,000',date:'01 Apr',je:'REC-2025-00040',conf:99.1,type:'CREDIT'},
  {bank:'NEFT CR-HCL TECH',    amount:'₹80,000', date:'01 Apr',je:'REC-2025-00038',conf:97.3,type:'CREDIT'},
]
const UNMATCHED = [
  {desc:'UPI-UNKNOWN-REF928374',amount:'₹8,500', date:'04 Apr',type:'DEBIT'},
  {desc:'ATM WDL-POWAI-42182',  amount:'₹20,000',date:'03 Apr',type:'DEBIT'},
  {desc:'POS-MARRIOTT-MUMBAI',  amount:'₹12,400',date:'02 Apr',type:'DEBIT'},
]

export default function BankReconPage(){
  const [stage,setStage] = useState<'idle'|'done'>('idle')
  const [bank,setBank]   = useState('HDFC Bank')
  const fileRef = useRef<HTMLInputElement>(null)

  return(
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#2563eb',letterSpacing:'.08em'}}>F-01 — New Feature</span>
        </div>
        <h1 className="page-title">Bank Reconciliation</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Import any bank statement — AI auto-matches transactions to your journal entries</p>
      </div>

      {stage==='idle' && (
        <div className="card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="section-title mb-3">Upload Bank Statement</h2>
              <div className="space-y-3">
                <div><label className="label">Bank</label>
                  <select className="input h-10" value={bank} onChange={e=>setBank(e.target.value)}>
                    {['HDFC Bank','SBI','ICICI Bank','Axis Bank','Kotak Mahindra','Yes Bank','IndusInd Bank','PNB'].map(b=><option key={b}>{b}</option>)}
                  </select></div>
                <div><label className="label">Statement Period</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input className="input h-10" type="date" defaultValue="2025-04-01"/>
                    <input className="input h-10" type="date" defaultValue="2025-04-08"/>
                  </div></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={()=>{setStage('done');toast.success('Statement reconciled — 271 of 284 matched (95.4%)')}} className="btn-primary">
                  <RefreshCw className="w-4 h-4"/>Reconcile Demo
                </button>
                <button onClick={()=>fileRef.current?.click()} className="btn-secondary">
                  <Upload className="w-4 h-4"/>Upload CSV/PDF
                </button>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.pdf,.ofx" className="hidden" onChange={()=>{setStage('done');toast.success('Reconciled!')}}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Supported formats','CSV, Excel, PDF, OFX'],['Banks','8 major Indian banks'],['Avg match rate','95%+'],['Time saved','~14 hrs/month']].map(([k,v])=>(
                <div key={k} className="rounded-xl p-4" style={{background:'rgba(37,99,235,.05)',border:'1px solid rgba(37,99,235,.12)'}}>
                  <p className="text-xs mb-1" style={{color:'var(--text-muted)'}}>{k}</p>
                  <p className="font-semibold text-sm" style={{color:'#2563eb'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage==='done' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {l:'Total Entries', v:'284', c:'#3b82f6'},
              {l:'Auto-Matched',  v:'271 (95.4%)', c:'#22c55e'},
              {l:'Unmatched',    v:'13', c:'#f59e0b'},
              {l:'Book Balance', v:'₹48.2L', c:'var(--gold)'},
              {l:'Time Saved',   v:'14 hrs', c:'#8b5cf6'},
            ].map(s=>(
              <div key={s.l} className="card">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px'}}>{s.l}</p>
                <p className="font-serif text-xl" style={{color:s.c}}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Matched Transactions</h2>
                <button onClick={()=>toast.success('271 transactions posted to ledger')} className="btn-primary h-8 text-xs">
                  <CheckCircle className="w-3.5 h-3.5"/>Post All
                </button>
              </div>
              <div className="space-y-2">
                {MATCHED.map((m,i)=>(
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{background:'rgba(34,197,94,.05)',border:'1px solid rgba(34,197,94,.15)'}}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{m.bank}</p>
                      <p className="font-mono text-xs mt-0.5" style={{color:'var(--gold)',fontSize:'10px'}}>{m.je}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-mono text-sm font-bold" style={{color:m.type==='CREDIT'?'#22c55e':'#ef4444'}}>{m.amount}</p>
                      <p className="text-xs" style={{color:'#22c55e'}}>{m.conf}%</p>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs py-2" style={{color:'var(--text-muted)'}}>+ 267 more matched transactions</p>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Needs Review</h2>
                <span className="text-xs px-2 py-1 rounded-full font-bold" style={{background:'rgba(245,158,11,.1)',color:'var(--gold)'}}>13 items</span>
              </div>
              <div className="space-y-2">
                {UNMATCHED.map((u,i)=>(
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{background:'rgba(245,158,11,.05)',border:'1px solid rgba(245,158,11,.15)'}}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{u.desc}</p>
                      <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{u.date}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="font-mono text-sm font-bold" style={{color:'#f59e0b'}}>{u.amount}</p>
                      <button onClick={()=>toast('Select a journal entry to match')} className="text-xs" style={{color:'#3b82f6'}}>Match →</button>
                    </div>
                  </div>
                ))}
                <p className="text-center text-xs py-2" style={{color:'var(--text-muted)'}}>+ 10 more unmatched</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={()=>toast.success('Reconciliation report exported')}><Download className="w-4 h-4"/>Export Report</button>
            <button onClick={()=>setStage('idle')} className="btn-ghost text-sm">Start New</button>
          </div>
        </>
      )}
    </div>
  )
}
