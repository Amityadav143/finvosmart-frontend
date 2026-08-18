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
import { hrmsApi } from '@/lib/api/hrms'
import { invoicingApi } from '@/lib/api/invoicing'
import { crmApi } from '@/lib/api/crm'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Download } from 'lucide-react'

const MONTHLY = [
  {m:'Oct',rev:38,exp:23,profit:15},{m:'Nov',rev:42,exp:25,profit:17},{m:'Dec',rev:36,exp:21,profit:15},
  {m:'Jan',rev:48,exp:29,profit:19},{m:'Feb',rev:51,exp:31,profit:20},{m:'Mar',rev:46,exp:28,profit:18},
  {m:'Apr',rev:52,exp:32,profit:20},
]

const DEPT_PERFORMANCE = [
  {dept:'Engineering',target:90,actual:87,color:'#3b82f6'},
  {dept:'Sales',      target:85,actual:92,color:'#22c55e'},
  {dept:'HR',         target:80,actual:78,color:'#f59e0b'},
  {dept:'Finance',    target:95,actual:94,color:'#8b5cf6'},
  {dept:'Operations', target:88,actual:85,color:'#14b8a6'},
]

const LEAD_FUNNEL = [
  {stage:'Inquiries',   count:120,color:'#3b82f6'},
  {stage:'Qualified',   count:72, color:'#8b5cf6'},
  {stage:'Proposals',   count:38, color:'#f59e0b'},
  {stage:'Negotiations',count:18, color:'#f97316'},
  {stage:'Won',         count:11, color:'#22c55e'},
]

const INV_AGING = [
  {range:'0–30 days', amount:1240000, color:'#22c55e'},
  {range:'31–60 days',amount: 680000, color:'#f59e0b'},
  {range:'61–90 days',amount: 340000, color:'#f97316'},
  {range:'>90 days',  amount: 180000, color:'#ef4444'},
]

function ChartTip({active,payload,label}:any){
  if(!active||!payload?.length) return null
  return(
    <div className="rounded-xl px-3 py-2 text-xs" style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)'}}>
      <p className="font-bold mb-1" style={{color:'var(--text-secondary)'}}>{label}</p>
      {payload.map((p:any,i:number)=>(
        <p key={i} style={{color:p.color||'var(--text-primary)'}}>
          {p.name}: {typeof p.value==='number'&&p.value>1000?formatCurrency(p.value*100000):p.value+'L'}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsPage(){
  const [period, setPeriod] = useState<'3M'|'6M'|'1Y'>('6M')
  const {data:empStats} = useQuery({queryKey:['emp-stats'],queryFn:hrmsApi.employees.stats})
  const {data:invStats} = useQuery({queryKey:['inv-stats'],queryFn:invoicingApi.stats})

  const displayMonths = period==='3M'?MONTHLY.slice(-3):period==='1Y'?MONTHLY:MONTHLY.slice(-6)

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Business intelligence across all modules</p>
        </div>
        <div className="flex items-center gap-2">
          {(['3M','6M','1Y'] as const).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{background:period===p?'var(--gold-muted)':'var(--bg-hover)',
                      color:period===p?'var(--gold)':'var(--text-muted)',
                      border:`1px solid ${period===p?'rgba(245,158,11,.2)':'var(--border)'}`}}>
              {p}
            </button>
          ))}
          <button className="btn-secondary h-9 text-sm" onClick={()=>exportToCsv('business-summary', [{ Employees:empStats?.total??0, Invoices:invStats?.totalInvoices??0, Revenue:invStats?.totalPaid??0, Outstanding:invStats?.totalOutstanding??0 }])}><Download className="w-4 h-4"/>Report</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Revenue (Mar)',     val:'₹51L',  change:+11.8, icon:TrendingUp,   color:'#22c55e'},
          {label:'Net Profit (Mar)',  val:'₹20L',  change:+5.2,  icon:TrendingUp,   color:'#3b82f6'},
          {label:'Headcount',         val:empStats?.totalActive??247, change:+1.2, icon:Activity, color:'#8b5cf6'},
          {label:'Outstanding AR',    val:formatCurrency(invStats?.outstanding??2840000), change:-5.1, icon:TrendingDown, color:'#ef4444'},
        ].map((k,i)=>(
          <div key={i} className="stat-card" style={{['--stat-accent' as string]:k.color}}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.05] pointer-events-none" style={{background:k.color,transform:'translate(30%,-30%)'}}/>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{k.label}</p>
                <p className="font-serif text-2xl mb-1.5" style={{color:'var(--text-primary)'}}>{k.val}</p>
                <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full`}
                  style={{background:`${k.change>=0?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)'}`,
                          color:k.change>=0?'#22c55e':'#ef4444',
                          border:`1px solid ${k.change>=0?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`}}>
                  {k.change>=0?'↑':'↓'}{Math.abs(k.change)}% vs last month
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${k.color}15`}}>
                <k.icon className="w-5 h-5" style={{color:k.color}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue + Profit trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Revenue, Expenses & Profit</h2>
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>₹ in Lakhs</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {[['Revenue','#f59e0b'],['Expenses','rgba(100,116,139,.7)'],['Profit','#22c55e']].map(([n,c])=>(
              <span key={n} className="flex items-center gap-1.5" style={{color:'var(--text-muted)'}}>
                <span className="w-3 h-1.5 rounded-full inline-block" style={{background:c as string}}/>
                {n}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={displayMonths} margin={{top:5,right:5,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fontSize:11}}/>
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v: any) =>`₹${v}L`} tick={{fontSize:10}}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="rev"    name="Revenue"  stroke="#f59e0b" strokeWidth={2} fill="url(#gR)"/>
            <Area type="monotone" dataKey="exp"    name="Expenses" stroke="rgba(100,116,139,.6)" strokeWidth={1.5} fill="none"/>
            <Area type="monotone" dataKey="profit" name="Profit"   stroke="#22c55e" strokeWidth={2} fill="url(#gP)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Three charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Sales funnel */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-1">Sales Funnel</h3>
          <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Lead conversion stages</p>
          <div className="space-y-2">
            {LEAD_FUNNEL.map((f,i)=>(
              <div key={f.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{color:'var(--text-secondary)'}}>{f.stage}</span>
                  <span className="text-xs font-mono font-bold" style={{color:f.color}}>{f.count}</span>
                </div>
                <div style={{height:'6px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:'4px',background:f.color,width:`${(f.count/120)*100}%`,transition:'width .6s ease'}}/>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{borderTop:'1px solid var(--border)'}}>
            <p className="text-xs" style={{color:'var(--text-muted)'}}>
              Conversion rate: <span style={{color:'#22c55e',fontWeight:700}}>9.2%</span>
            </p>
          </div>
        </div>

        {/* Invoice aging */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-1">Invoice Aging</h3>
          <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Outstanding receivables by age</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={INV_AGING} layout="vertical" margin={{top:0,right:0,left:0,bottom:0}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'var(--text-muted)'}} width={70}/>
              <Tooltip formatter={(v:any)=>formatCurrency(v)} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'10px',fontSize:'11px'}}/>
              <Bar dataKey="amount" radius={[0,6,6,0]}>
                {INV_AGING.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm font-semibold mt-2" style={{color:'var(--text-primary)'}}>
            Total: <span style={{color:'var(--gold)'}}>{formatCurrency(INV_AGING.reduce((s,a)=>s+a.amount,0))}</span>
          </p>
        </div>

        {/* Dept performance */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-1">Department Performance</h3>
          <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Target vs actual score</p>
          <div className="space-y-3">
            {DEPT_PERFORMANCE.map(d=>(
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{color:'var(--text-secondary)'}}>{d.dept}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{color:'var(--text-muted)'}}>T:{d.target}</span>
                    <span className="text-xs font-bold" style={{color:d.actual>=d.target?'#22c55e':'#ef4444'}}>A:{d.actual}</span>
                  </div>
                </div>
                <div className="relative" style={{height:'5px',borderRadius:'4px',background:'var(--border)'}}>
                  <div style={{position:'absolute',height:'100%',borderRadius:'4px',background:d.color,opacity:.3,width:`${d.target}%`}}/>
                  <div style={{position:'absolute',height:'100%',borderRadius:'4px',background:d.color,width:`${d.actual}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
