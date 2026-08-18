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
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const MISMATCHES = [
  {inv:'WIP-2025-0341',vendor:'Wipro Ltd.',gstin:'29AABCW5678E1Z8',books:'₹4,20,000',gstr2a:'₹3,91,000',diff:'₹29,000',type:'AMOUNT_MISMATCH',itcRisk:'₹52,200',color:'#f59e0b'},
  {inv:'NAD-2025-122', vendor:'Nadeem Traders',gstin:'27AAGPN9012F2Y7',books:'₹85,000',gstr2a:'—',diff:'₹85,000',type:'NOT_IN_2A',itcRisk:'₹15,300',color:'#ef4444'},
  {inv:'FLX-2025-441', vendor:'Flexon Corp.',gstin:'29AABCF3456G3X6',books:'—',gstr2a:'₹1,80,000',diff:'₹1,80,000',type:'NOT_IN_BOOKS',itcRisk:'₹0',color:'#3b82f6'},
]

const TYPE_LABELS: Record<string,string> = {
  AMOUNT_MISMATCH:'Amount differs',NOT_IN_2A:'Missing in GSTR-2A',NOT_IN_BOOKS:'Not in purchase register'
}

export default function GstReconcilerPage(){
  const [period, setPeriod] = useState('March 2025')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const run = () => {
    setRunning(true)
    setTimeout(()=>{ setRunning(false); setDone(true); toast.success('Reconciliation complete — 8 mismatches found') }, 2000)
  }

  return(
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🇮🇳</span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#14b8a6',letterSpacing:'.08em'}}>GST Feature — USP 05</span>
        </div>
        <h1 className="page-title">GST Auto-Reconciler</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>One-click GSTR-2A vs purchase books · ITC optimisation · India-exclusive feature</p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="label mb-0">Period</label>
            <select className="input h-10 w-44" value={period} onChange={e=>setPeriod(e.target.value)}>
              {['March 2025','February 2025','January 2025','December 2024'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={run} disabled={running} className="btn-primary h-10">
              {running ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full" style={{borderColor:'rgba(26,18,8,.3)',borderTopColor:'var(--text-on-gold)',animation:'spin .7s linear infinite'}}/>
                  Fetching GSTR-2A...
                </span>
              ) : <><RefreshCw className="w-4 h-4"/>Run Reconciliation</>}
            </button>
            {done && <button className="btn-secondary h-10" onClick={()=>toast.success('GSTR reconciliation report exported')}><Download className="w-4 h-4"/>Export Report</button>}
          </div>
        </div>
      </div>

      {done && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {label:'Total Invoices',  val:'182',     color:'#3b82f6'},
              {label:'Matched',        val:'174 (95.6%)',color:'#22c55e'},
              {label:'Mismatches',     val:'8',         color:'#f59e0b'},
              {label:'ITC Available',  val:'₹14.2L',    color:'#22c55e'},
              {label:'ITC At Risk',    val:'₹1.8L',     color:'#ef4444'},
            ].map(s=>(
              <div key={s.label} className="card">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
                <p className="font-serif text-xl" style={{color:s.color}}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* ITC optimiser */}
          <div className="card" style={{background:'rgba(20,184,166,.05)',border:'1px solid rgba(20,184,166,.2)'}}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4" style={{color:'#14b8a6'}}/>
              <h2 className="section-title">ITC Optimisation Summary</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                {label:'Total ITC in GSTR-2A',  val:'₹14,20,000', desc:'Claimable from portal'},
                {label:'Risk-adjusted ITC',      val:'₹12,40,000', desc:'After removing mismatches'},
                {label:'Recommended claim',      val:'₹11,80,000', desc:'Conservative estimate for safety'},
              ].map(s=>(
                <div key={s.label} className="rounded-xl p-4" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
                  <p className="text-xs mb-1" style={{color:'var(--text-muted)'}}>{s.label}</p>
                  <p className="font-serif text-2xl mb-0.5" style={{color:'#14b8a6'}}>{s.val}</p>
                  <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mismatches table */}
          <div className="card">
            <h2 className="section-title mb-4">Mismatch Details ({MISMATCHES.length} items)</h2>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Invoice No.','Vendor','Type','In Books','In GSTR-2A','Difference','ITC Risk','Action'].map(h=>(
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {MISMATCHES.map((m,i)=>(
                    <tr key={i} className="table-row">
                      <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{m.inv}</span></td>
                      <td className="table-cell">
                        <p className="font-semibold text-sm">{m.vendor}</p>
                        <p className="font-mono text-xs" style={{color:'var(--text-muted)',fontSize:'10px'}}>{m.gstin}</p>
                      </td>
                      <td className="table-cell">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold"
                          style={{background:`${m.color}12`,color:m.color,border:`1px solid ${m.color}20`}}>
                          {TYPE_LABELS[m.type]}
                        </span>
                      </td>
                      <td className="table-cell font-mono text-sm">{m.books}</td>
                      <td className="table-cell font-mono text-sm">{m.gstr2a}</td>
                      <td className="table-cell font-mono text-sm font-semibold" style={{color:m.color}}>{m.diff}</td>
                      <td className="table-cell font-mono text-sm" style={{color:'#ef4444'}}>{m.itcRisk}</td>
                      <td className="table-cell">
                        <button onClick={()=>toast(`Contact ${m.vendor} to resolve mismatch`)}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all"
                          style={{background:'var(--bg-hover)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!done && !running && (
        <div className="card flex flex-col items-center py-16 gap-4">
          <FileText className="w-12 h-12" style={{color:'var(--text-muted)'}}/>
          <div className="text-center">
            <p className="font-serif text-xl mb-2">Ready to reconcile {period}</p>
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Click "Run Reconciliation" to fetch GSTR-2A and compare against your purchase register</p>
          </div>
        </div>
      )}
    </div>
  )
}
