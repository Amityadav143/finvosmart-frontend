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
import { StatusBadge, Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, Play, CheckCircle, Download, ChevronRight, Users, TrendingUp, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

const RUNS = [
  { id:'1', month:'March 2025',   employees:247, gross:4820000, deductions:620000, net:4200000, status:'PAID',       processedOn:'01 Apr 2025' },
  { id:'2', month:'February 2025',employees:245, gross:4780000, deductions:615000, net:4165000, status:'PAID',       processedOn:'01 Mar 2025' },
  { id:'3', month:'January 2025', employees:243, gross:4720000, deductions:608000, net:4112000, status:'PAID',       processedOn:'01 Feb 2025' },
  { id:'4', month:'December 2024',employees:241, gross:4650000, deductions:598000, net:4052000, status:'PAID',       processedOn:'01 Jan 2025' },
  { id:'5', month:'November 2024',employees:240, gross:4610000, deductions:595000, net:4015000, status:'PAID',       processedOn:'01 Dec 2024' },
  { id:'6', month:'April 2025',   employees:0,   gross:0,       deductions:0,      net:0,        status:'DRAFT',      processedOn:'—' },
]

const TREND = [
  {m:'Nov',net:40.2},{m:'Dec',net:40.5},{m:'Jan',net:41.1},{m:'Feb',net:41.7},{m:'Mar',net:42.0},
]

const COMP = [
  {name:'Basic Salary',  pct:50, color:'#3b82f6'},
  {name:'HRA',           pct:20, color:'#8b5cf6'},
  {name:'Allowances',    pct:18, color:'#14b8a6'},
  {name:'Deductions',    pct:12, color:'#ef4444'},
]

export default function PayrollPage(){
  const [selected, setSelected] = useState<string|null>(null)
  const [showProcess, setShowProcess] = useState(false)
  const sel = RUNS.find(r=>r.id===selected)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Payroll</h1>
        <button onClick={()=>setShowProcess(true)} className="btn-primary h-9 text-sm">
          <Play className="w-4 h-4"/>Run April 2025 Payroll
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Total Payroll (Mar)',  val:formatCurrency(4200000), icon:DollarSign, color:'#f59e0b'},
          {label:'Employees',           val:'247',                    icon:Users,      color:'#3b82f6'},
          {label:'Avg Salary',          val:formatCurrency(17004),    icon:TrendingUp, color:'#22c55e'},
          {label:'Next Run',            val:'Apr 30, 2025',           icon:CreditCard, color:'#8b5cf6'},
        ].map(k=>(
          <div key={k.label} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--text-muted)',letterSpacing:'.07em',fontSize:'9px'}}>{k.label}</p>
                <p className="font-serif text-xl font-normal" style={{color:'var(--text-primary)'}}>{k.val}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${k.color}15`}}>
                <k.icon className="w-4 h-4" style={{color:k.color}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Runs list */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Payroll Runs</h2>
          </div>
          <div className="space-y-2">
            {RUNS.map(run=>(
              <button key={run.id} onClick={()=>setSelected(run.id===selected?null:run.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                style={{background:run.id===selected?'var(--gold-muted)':' var(--bg-hover)',
                        border:`1px solid ${run.id===selected?'rgba(245,158,11,.2)':'var(--border)'}`}}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background:run.status==='PAID'?'rgba(34,197,94,.1)':run.status==='DRAFT'?'rgba(100,116,139,.1)':'rgba(245,158,11,.1)'}}>
                  {run.status==='PAID'
                    ? <CheckCircle className="w-5 h-5 text-green-500"/>
                    : <DollarSign className="w-5 h-5" style={{color:'var(--text-muted)'}}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{run.month}</p>
                  <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
                    {run.employees>0?`${run.employees} employees · Processed ${run.processedOn}`:'Not processed yet'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {run.net>0 && <p className="font-mono text-sm font-bold" style={{color:'var(--text-primary)'}}>{formatCurrency(run.net)}</p>}
                  <StatusBadge status={run.status}/>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{color:'var(--text-muted)',transform:run.id===selected?'rotate(90deg)':'',transition:'transform .2s'}}/>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Trend */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Net Payroll Trend</h3>
            <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>₹ in Lakhs · last 5 months</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={TREND} margin={{top:0,right:0,left:0,bottom:0}}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fontSize:10}}/>
                <YAxis hide/>
                <Tooltip formatter={(v:any)=>`₹${v}L`} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'10px',fontSize:'11px'}}/>
                <Bar dataKey="net" radius={[5,5,0,0]}>
                  {TREND.map((_,i)=><Cell key={i} fill={i===TREND.length-1?'#f59e0b':'rgba(245,158,11,.35)'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Composition */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">Salary Composition</h3>
            <div className="space-y-3">
              {COMP.map(c=>(
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{color:'var(--text-secondary)'}}>{c.name}</span>
                    <span className="text-xs font-semibold font-mono" style={{color:c.color}}>{c.pct}%</span>
                  </div>
                  <div style={{height:'5px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'4px',background:c.color,width:`${c.pct}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded run detail */}
      {sel && sel.status==='PAID' && (
        <div className="card animate-[slideUp_.25s_ease]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{sel.month} — Breakdown</h2>
            <button className="btn-secondary h-8 text-xs" onClick={()=>toast.success('Payslip generation queued — employees will receive theirs by email')}><Download className="w-3.5 h-3.5"/>Payslips</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {label:'Gross Payroll',     val:formatCurrency(sel.gross),      color:'#3b82f6'},
              {label:'Total Deductions',  val:formatCurrency(sel.deductions),  color:'#ef4444'},
              {label:'Net Disbursement',  val:formatCurrency(sel.net),         color:'#22c55e'},
            ].map(b=>(
              <div key={b.label} className="rounded-xl p-4" style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>
                <p className="text-xs mb-1" style={{color:'var(--text-muted)'}}>{b.label}</p>
                <p className="font-serif text-xl" style={{color:b.color}}>{b.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showProcess} onClose={()=>setShowProcess(false)} title="Run April 2025 Payroll" subtitle="This will calculate salaries for all active employees">
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
            <p className="text-sm font-semibold mb-1" style={{color:'var(--gold)'}}>⚠ Pre-run checklist</p>
            <ul className="text-xs space-y-1" style={{color:'var(--text-secondary)'}}>
              <li>• Attendance for March finalized: ✓</li>
              <li>• Leave deductions applied: ✓</li>
              <li>• Salary revisions updated: ✓</li>
              <li>• New joiners added: ✓</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><label className="label">Pay Month</label><input className="input h-10" value="April 2025" readOnly/></div>
            <div><label className="label">Pay Date</label><input className="input h-10" type="date" defaultValue="2025-04-30"/></div>
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowProcess(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('Payroll run initiated for April 2025');setShowProcess(false)}} className="btn-primary">
              <Play className="w-4 h-4"/>Process Payroll
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
