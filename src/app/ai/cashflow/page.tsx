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

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle, Zap, ArrowUpRight } from 'lucide-react'

const WEEKS = [
  {w:'W1',in:1200,out:1100,net:100,cum:4920,risk:false},
  {w:'W2',in:1800,out:1400,net:400,cum:5320,risk:false},
  {w:'W3',in:2200,out:1600,net:600,cum:5920,risk:false},
  {w:'W4',in:1600,out:1200,net:400,cum:6320,risk:false},
  {w:'W5',in:2400,out:1800,net:600,cum:6920,risk:false},
  {w:'W6',in:1900,out:1500,net:400,cum:7320,risk:false},
  {w:'W7',in:2100,out:3200,net:-1100,cum:6220,risk:true},
  {w:'W8',in:1700,out:1300,net:400,cum:6620,risk:false},
  {w:'W9',in:2300,out:1700,net:600,cum:7220,risk:false},
  {w:'W10',in:2000,out:1600,net:400,cum:7620,risk:false},
  {w:'W11',in:1800,out:1400,net:400,cum:8020,risk:false},
  {w:'W12',in:2500,out:1900,net:600,cum:8620,risk:false},
]

const RISK_CUSTOMERS = [
  {name:'Wipro Technologies',outstanding:'₹8.4L',days:68,score:78.5,level:'HIGH',  rec:'Immediate WhatsApp follow-up'},
  {name:'HCL Technologies', outstanding:'₹4.2L',days:52,score:55.2,level:'MEDIUM',rec:'Auto-reminder in 3 days'},
  {name:'Infosys Ltd.',     outstanding:'₹12.4L',days:31,score:22.1,level:'LOW',   rec:'On track — expected next week'},
]

const INSIGHTS = [
  '3 customers with >60-day outstanding — ₹8.4L at risk this quarter',
  'Week 7 shows projected cash dip of ₹11L (salary + vendor cluster)',
  'Q1 cash trajectory 18% stronger than same period last year',
  'Early payment discount for TCS could accelerate ₹12L inflow by 14 days',
]

function Tip({active,payload,label}:any){
  if(!active||!payload?.length) return null
  return(
    <div className="rounded-xl px-3 py-2.5 text-xs" style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)'}}>
      <p className="font-bold mb-1" style={{color:'var(--text-secondary)'}}>{label}</p>
      {payload.map((p:any,i:number)=><p key={i} style={{color:p.color}}>{p.name}: ₹{p.value}K</p>)}
    </div>
  )
}

export default function CashFlowOraclePage(){
  const [animated, setAnimated] = useState(false)
  useEffect(()=>{ const t=setTimeout(()=>setAnimated(true),200); return()=>clearTimeout(t) },[])

  return(
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(139,92,246,.15)'}}>
              <Zap className="w-4 h-4" style={{color:'#8b5cf6'}}/>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#8b5cf6',letterSpacing:'.08em'}}>ARIS — AI Feature</span>
          </div>
          <h1 className="page-title">Cash Flow Oracle</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>ML-powered 12-week forecast · 91.4% confidence · Updated now</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs" style={{color:'var(--text-muted)'}}>Current cash position</p>
            <p className="font-serif text-2xl" style={{color:'var(--gold)'}}>₹48.2L</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Projected (Week 12)',val:'₹86.2L',  delta:'+78.8%', color:'#22c55e'},
          {label:'Total Inflow (12W)', val:'₹237.5L', delta:'+12.3%', color:'#3b82f6'},
          {label:'Total Outflow (12W)',val:'₹199.5L', delta:'+9.1%',  color:'#f59e0b'},
          {label:'Risk Exposure',      val:'₹8.4L',   delta:'Wipro',  color:'#ef4444'},
        ].map(k=>(
          <div key={k.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>{k.label}</p>
            <p className="font-serif text-2xl mb-1" style={{color:k.color}}>{k.val}</p>
            <p className="text-xs" style={{color:'var(--text-muted)'}}>{k.delta}</p>
          </div>
        ))}
      </div>

      {/* Cumulative cash chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title">Cumulative Cash Position</h2>
            <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>12-week forecast · ₹ in thousands · Week 7 risk flagged</p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{color:'var(--text-muted)'}}>
            <span className="w-3 h-0.5 inline-block rounded" style={{background:'var(--gold)'}}/>Predicted
            <span className="w-3 h-0.5 inline-block rounded" style={{background:'#ef4444'}}/>Risk week
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={WEEKS} margin={{top:5,right:5,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="w" axisLine={false} tickLine={false} tick={{fontSize:10}}/>
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v: any) =>`₹${v}K`} tick={{fontSize:10}}/>
            <Tooltip content={<Tip/>}/>
            <ReferenceLine x="W7" stroke="#ef4444" strokeDasharray="4 2" label={{value:'Risk',fill:'#ef4444',fontSize:10}}/>
            <Area type="monotone" dataKey="cum" name="Cash" stroke="#f59e0b" strokeWidth={2} fill="url(#gC)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly net + customer risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="section-title mb-1">Weekly Net Cash Flow</h2>
          <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Inflow minus outflow per week · ₹K</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={WEEKS}>
              <XAxis dataKey="w" axisLine={false} tickLine={false} tick={{fontSize:10}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize:10}} tickFormatter={(v: any) =>`${v}K`}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="net" name="Net" radius={[5,5,0,0]}>
                {WEEKS.map((w,i)=><Cell key={i} fill={w.net<0?'#ef4444':w.net>400?'#22c55e':'#f59e0b'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">Customer Payment Risk</h2>
          <div className="space-y-3">
            {RISK_CUSTOMERS.map(r=>(
              <div key={r.name} className="p-3 rounded-xl" style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-xs" style={{color:'var(--text-muted)'}}>{r.outstanding} · {r.days} avg days</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                    style={{background:r.level==='HIGH'?'rgba(239,68,68,.1)':r.level==='MEDIUM'?'rgba(245,158,11,.1)':'rgba(34,197,94,.1)',
                            color:r.level==='HIGH'?'#ef4444':r.level==='MEDIUM'?'var(--gold)':'#22c55e',
                            border:`1px solid ${r.level==='HIGH'?'rgba(239,68,68,.2)':r.level==='MEDIUM'?'rgba(245,158,11,.2)':'rgba(34,197,94,.2)'}`}}>
                    {r.level} {r.score.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs" style={{color:'var(--text-secondary)'}}>{r.rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI insights */}
      <div className="card" style={{background:'rgba(139,92,246,.05)',border:'1px solid rgba(139,92,246,.15)'}}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{color:'#8b5cf6'}}/>
          <h2 className="section-title">AI Insights & Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {INSIGHTS.map((ins,i)=>(
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{background:'var(--bg-card)',border:'1px solid var(--border)'}}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{background:'rgba(139,92,246,.15)',color:'#8b5cf6'}}>{i+1}</span>
              <p className="text-xs leading-relaxed" style={{color:'var(--text-secondary)'}}>{ins}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
