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
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Heart, AlertTriangle, CheckCircle, TrendingDown, Users } from 'lucide-react'

const DEPTS = [
  {dept:'Engineering', avg:62.4, high:3, total:28, status:'MEDIUM', color:'#f59e0b'},
  {dept:'Sales',       avg:74.1, high:1, total:12, status:'GOOD',   color:'#22c55e'},
  {dept:'Finance',     avg:68.9, high:1, total:8,  status:'GOOD',   color:'#22c55e'},
  {dept:'HR',          avg:81.2, high:0, total:5,  status:'EXCELLENT',color:'#3b82f6'},
  {dept:'Operations',  avg:57.3, high:4, total:18, status:'MEDIUM', color:'#f97316'},
]

const EMPLOYEES = [
  {name:'Rajesh Kumar', dept:'Engineering', score:82, risk:'LOW',    trend:'STABLE',   factors:[], rec:'Healthy — no action needed', initials:'RK', color:'#22c55e'},
  {name:'Priya Sharma', dept:'Engineering', score:61, risk:'MEDIUM', trend:'DECLINING',factors:['12 overtime in 8 weeks','2 leave rejections'], rec:'Schedule 1-on-1 check-in', initials:'PS', color:'#f59e0b'},
  {name:'Amit Singh',   dept:'Engineering', score:38, risk:'HIGH',   trend:'DECLINING',factors:['28 overtime hrs/month','Attendance -15%','4 sick leaves','6/8 weekends worked'], rec:'URGENT: Workload rebalancing needed', initials:'AS', color:'#ef4444'},
  {name:'Sneha Patel',  dept:'Engineering', score:77, risk:'LOW',    trend:'IMPROVING',factors:[], rec:'Improving — positive trend', initials:'SP', color:'#22c55e'},
  {name:'Rohit Gupta',  dept:'Engineering', score:55, risk:'MEDIUM', trend:'STABLE',   factors:['9-10hr days consistently','No leave in 90 days'], rec:'Encourage leave utilisation', initials:'RG', color:'#f59e0b'},
]

const RADAR_DATA = [
  {factor:'Attendance',  val:85}, {factor:'Overtime',   val:42},
  {factor:'Leave Usage', val:60}, {factor:'Weekend Work',val:35},
  {factor:'Login Hours', val:72}, {factor:'Consistency', val:80},
]

export default function WellnessPage(){
  const [selDept, setSelDept] = useState('Engineering')
  const [selEmp, setSelEmp] = useState<typeof EMPLOYEES[0]|null>(EMPLOYEES[2])

  return(
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4" style={{color:'#ec4899'}}/>
            <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#ec4899',letterSpacing:'.08em'}}>AI Feature — USP 04</span>
          </div>
          <h1 className="page-title">Employee Wellness Monitor</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Burnout risk detection from behavioural patterns · Scores updated every Monday</p>
        </div>
      </div>

      {/* Company heat map */}
      <div className="card">
        <h2 className="section-title mb-4">Department Wellness Heat Map</h2>
        <div className="grid grid-cols-5 gap-3">
          {DEPTS.map(d=>(
            <button key={d.dept} onClick={()=>setSelDept(d.dept)}
              className="rounded-xl p-4 text-left transition-all"
              style={{background:selDept===d.dept?`${d.color}12`:'var(--bg-hover)',
                      border:`1px solid ${selDept===d.dept?d.color+'30':'var(--border)'}`}}>
              <p className="text-xs font-semibold mb-2" style={{color:'var(--text-secondary)'}}>{d.dept}</p>
              <p className="font-serif text-3xl mb-1" style={{color:d.color}}>{Math.round(d.avg)}</p>
              <div style={{height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden',marginBottom:'8px'}}>
                <div style={{height:'100%',borderRadius:'4px',background:d.color,width:`${d.avg}%`}}/>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{color:'var(--text-muted)'}}>{d.total} people</span>
                {d.high > 0 && <span style={{color:'#ef4444'}}>{d.high} at risk</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Employee list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="section-title mb-4">{selDept} Team</h2>
          <div className="space-y-2">
            {EMPLOYEES.map(e=>(
              <button key={e.name} onClick={()=>setSelEmp(e)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{background:selEmp?.name===e.name?`${e.color}10`:'var(--bg-hover)',
                        border:`1px solid ${selEmp?.name===e.name?e.color+'25':'var(--border)'}`}}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{background:`${e.color}18`,color:e.color}}>{e.initials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{e.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div style={{height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden',flex:1}}>
                      <div style={{height:'100%',borderRadius:'4px',background:e.color,width:`${e.score}%`}}/>
                    </div>
                    <span className="text-xs font-bold" style={{color:e.color}}>{e.score}</span>
                  </div>
                </div>
                {e.risk==='HIGH' && <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{color:'#ef4444'}}/>}
                {e.risk==='LOW'  && <CheckCircle   className="w-4 h-4 flex-shrink-0" style={{color:'#22c55e'}}/>}
              </button>
            ))}
          </div>
        </div>

        {selEmp && (
          <div className="lg:col-span-2 card">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{background:`${selEmp.color}18`,color:selEmp.color}}>{selEmp.initials}</div>
              <div className="flex-1">
                <h2 className="font-serif text-xl">{selEmp.name}</h2>
                <p className="text-sm" style={{color:'var(--text-muted)'}}>{selEmp.dept} · Wellness Score: <strong style={{color:selEmp.color}}>{selEmp.score}/100</strong></p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{background:`${selEmp.color}12`,color:selEmp.color,border:`1px solid ${selEmp.color}20`}}>
                  {selEmp.risk==='HIGH'?'🔴':selEmp.risk==='MEDIUM'?'🟡':'🟢'} {selEmp.risk} RISK · {selEmp.trend}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>Behavioural Radar</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="var(--border)"/>
                    <PolarAngleAxis dataKey="factor" tick={{fontSize:10,fill:'var(--text-muted)'}}/>
                    <Radar name="Score" dataKey="val" stroke={selEmp.color} fill={selEmp.color} fillOpacity={0.15} strokeWidth={2}/>
                    <Tooltip contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'10px',fontSize:'11px'}}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--text-muted)',fontSize:'9px',letterSpacing:'.07em'}}>
                  {selEmp.factors.length > 0 ? 'Risk Factors Detected' : 'No Issues Detected'}
                </h4>
                {selEmp.factors.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {selEmp.factors.map((f,i)=>(
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.14)'}}>
                        <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5"/>
                        <p className="text-xs" style={{color:'var(--text-secondary)'}}>{f}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{background:'rgba(34,197,94,.06)',border:'1px solid rgba(34,197,94,.14)'}}>
                    <CheckCircle className="w-4 h-4 text-green-400"/>
                    <p className="text-xs" style={{color:'#22c55e'}}>All behavioural indicators healthy</p>
                  </div>
                )}
                <div className="p-3 rounded-xl" style={{background:'var(--gold-muted)',border:'1px solid rgba(245,158,11,.2)'}}>
                  <p className="text-xs font-semibold mb-1" style={{color:'var(--gold)'}}>AI Recommendation</p>
                  <p className="text-xs" style={{color:'var(--text-secondary)'}}>{selEmp.rec}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
