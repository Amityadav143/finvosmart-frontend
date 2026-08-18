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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/finance'
import { DataTable } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Trash2, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Line { accountId:string; accountName:string; debitAmount:number; creditAmount:number; narration:string }

export default function VouchersPage(){
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [entryType, setEntryType] = useState('JOURNAL')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [narration, setNarration] = useState('')
  const [lines, setLines] = useState<Line[]>([
    {accountId:'',accountName:'',debitAmount:0,creditAmount:0,narration:''},
    {accountId:'',accountName:'',debitAmount:0,creditAmount:0,narration:''},
  ])

  const { data: accounts } = useQuery({queryKey:['accounts'], queryFn: financeApi.accounts.list})

  const createMutation = useMutation({
    mutationFn:(d:any)=>financeApi.journalEntries.create(d),
    onSuccess:()=>{qc.invalidateQueries({queryKey:['journal-entries']});setShowCreate(false);toast.success('Journal entry posted')},
    onError:(e:any)=>toast.error(e?.response?.data?.error??'Failed — check debit/credit balance'),
  })

  const totalDr = lines.reduce((s,l)=>s+(l.debitAmount||0),0)
  const totalCr = lines.reduce((s,l)=>s+(l.creditAmount||0),0)
  const isBalanced = Math.abs(totalDr-totalCr)<0.01 && totalDr>0

  const addLine=()=>setLines(l=>[...l,{accountId:'',accountName:'',debitAmount:0,creditAmount:0,narration:''}])
  const delLine=(i:number)=>setLines(l=>l.filter((_,j)=>j!==i))
  const updLine=(i:number,k:keyof Line,v:any)=>setLines(l=>l.map((ln,j)=>j===i?{...ln,[k]:v}:ln))

  const MOCK_ENTRIES = [
    {id:'1',number:'JE-2025-00041',date:'2025-03-31',type:'JOURNAL',narration:'Monthly depreciation for March 2025',debit:285000,credit:285000,posted:true},
    {id:'2',number:'JE-2025-00040',date:'2025-03-30',type:'PAYMENT',narration:'Vendor payment — Acer India Pvt. Ltd.',debit:125000,credit:125000,posted:true},
    {id:'3',number:'JE-2025-00039',date:'2025-03-29',type:'RECEIPT',narration:'Payment received from TCS',debit:480000,credit:480000,posted:true},
    {id:'4',number:'JE-2025-00038',date:'2025-03-28',type:'JOURNAL',narration:'Salary provision — March 2025',debit:4200000,credit:4200000,posted:false},
  ]

  const typeColors:Record<string,string> = {JOURNAL:'#3b82f6',PAYMENT:'#ef4444',RECEIPT:'#22c55e',CONTRA:'#8b5cf6',OPENING:'#f59e0b'}

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Journal Entries</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Double-entry bookkeeping · All entries</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary h-9 text-sm">
          <Plus className="w-4 h-4"/>New Entry
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Total Entries',   val:'41', color:'#3b82f6'},
          {label:'Posted Today',    val:'3',  color:'#22c55e'},
          {label:'Pending Review',  val:'2',  color:'#f59e0b'},
          {label:'Total Debit',     val:'₹82L',color:'var(--text-primary)'},
        ].map(s=>(
          <div key={s.label} className="card flex items-start gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{s.label}</p>
              <p className="font-serif text-2xl" style={{color:s.color}}>{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Entry filter tabs */}
      <div className="flex items-center gap-2">
        {['ALL','JOURNAL','PAYMENT','RECEIPT','CONTRA'].map(t=>(
          <button key={t} className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{background:'var(--bg-hover)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>
            {t}
          </button>
        ))}
      </div>

      {/* Entries table */}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
            {['Entry #','Date','Type','Narration','Debit','Credit','Status'].map(h=>(
              <th key={h} className="table-header">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MOCK_ENTRIES.map((e,i)=>(
              <tr key={e.id} className="table-row" style={{animationDelay:`${i*.04}s`}}>
                <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{e.number}</span></td>
                <td className="table-cell"><span className="text-xs">{formatDate(e.date)}</span></td>
                <td className="table-cell">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{background:`${typeColors[e.type]}12`,color:typeColors[e.type],border:`1px solid ${typeColors[e.type]}20`}}>
                    {e.type}
                  </span>
                </td>
                <td className="table-cell"><span className="text-xs" style={{color:'var(--text-secondary)'}}>{e.narration}</span></td>
                <td className="table-cell"><span className="font-mono text-sm font-semibold">{formatCurrency(e.debit)}</span></td>
                <td className="table-cell"><span className="font-mono text-sm">{formatCurrency(e.credit)}</span></td>
                <td className="table-cell">
                  {e.posted
                    ? <span className="flex items-center gap-1 text-xs font-semibold" style={{color:'#22c55e'}}><Check className="w-3 h-3"/>Posted</span>
                    : <span className="flex items-center gap-1 text-xs font-semibold" style={{color:'#f59e0b'}}><AlertTriangle className="w-3 h-3"/>Draft</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New Journal Entry" subtitle="Debit must equal Credit (double-entry)" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Entry Type</label>
              <select className="input h-10" value={entryType} onChange={e=>setEntryType(e.target.value)}>
                {['JOURNAL','PAYMENT','RECEIPT','CONTRA','OPENING'].map(t=><option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Entry Date</label>
              <input className="input h-10" type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/></div>
            <div><label className="label">Narration</label>
              <input className="input h-10" value={narration} onChange={e=>setNarration(e.target.value)} placeholder="Brief description"/></div>
          </div>

          {/* Lines */}
          <div className="rounded-xl overflow-hidden" style={{border:'1px solid var(--border)'}}>
            <div className="grid grid-cols-12 gap-0 text-xs font-bold uppercase tracking-wider px-4 py-2.5"
              style={{background:'var(--bg-hover)',color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.08em'}}>
              <div className="col-span-4">Account</div>
              <div className="col-span-3 text-right">Debit (₹)</div>
              <div className="col-span-3 text-right">Credit (₹)</div>
              <div className="col-span-1 text-right">Del</div>
            </div>
            {lines.map((line,i)=>(
              <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2"
                style={{borderTop:'1px solid var(--border)'}}>
                <div className="col-span-4">
                  <select className="input h-9 text-xs" value={line.accountId} onChange={e=>{
                    const acc = accounts?.find((a: any) =>a.id===e.target.value)
                    updLine(i,'accountId',e.target.value)
                    updLine(i,'accountName',acc?.accountName??'')
                  }}>
                    <option value="">Select account…</option>
                    {(accounts??[]).map((a: any) =><option key={a.id} value={a.id}>{a.accountCode} — {a.accountName}</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" min="0" step="0.01" className="input h-9 text-xs text-right" placeholder="0.00"
                    value={line.debitAmount||''} onChange={e=>updLine(i,'debitAmount',parseFloat(e.target.value)||0)}/>
                </div>
                <div className="col-span-3">
                  <input type="number" min="0" step="0.01" className="input h-9 text-xs text-right" placeholder="0.00"
                    value={line.creditAmount||''} onChange={e=>updLine(i,'creditAmount',parseFloat(e.target.value)||0)}/>
                </div>
                <div className="col-span-1 flex justify-end">
                  {lines.length>2 && <button onClick={()=>delLine(i)} className="btn-icon w-7 h-7 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5"/></button>}
                </div>
              </div>
            ))}
            {/* Totals */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2.5" style={{borderTop:'1px solid var(--border)',background:'var(--bg-hover)'}}>
              <div className="col-span-4 text-xs font-bold" style={{color:'var(--text-muted)'}}>TOTALS</div>
              <div className={`col-span-3 text-right text-sm font-mono font-bold ${isBalanced?'text-green-400':''}`}>{formatCurrency(totalDr)}</div>
              <div className={`col-span-3 text-right text-sm font-mono font-bold ${isBalanced?'text-green-400':''}`}>{formatCurrency(totalCr)}</div>
              <div className="col-span-1"/>
            </div>
          </div>

          {!isBalanced && totalDr>0 && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
              style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)',color:'#ef4444'}}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0"/>
              Difference of {formatCurrency(Math.abs(totalDr-totalCr))} — Debit must equal Credit
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={addLine} className="btn-ghost text-xs"><Plus className="w-3.5 h-3.5"/>Add line</button>
            <div className="flex gap-3">
              <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button disabled={!isBalanced||createMutation.isPending}
                onClick={()=>createMutation.mutate({entryType,entryDate,narration,lines:lines.filter(l=>l.accountId)})}
                className="btn-primary">
                {createMutation.isPending?'Posting…':'Post Entry'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
