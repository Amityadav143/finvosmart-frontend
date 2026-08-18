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
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, FolderOpen, Calendar, DollarSign, Users, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PROJECTS = [
  {id:'1',code:'PRJ-2025-001',name:'ERP Implementation — Phase 2',client:'Tata Consultancy',status:'ACTIVE',   startDate:'2025-01-15',endDate:'2025-06-30',value:2800000,progress:45,team:6},
  {id:'2',code:'PRJ-2025-002',name:'Network Infrastructure Upgrade',client:'Infosys Ltd.',    status:'ACTIVE',   startDate:'2025-02-01',endDate:'2025-04-30',value:1200000,progress:78,team:4},
  {id:'3',code:'PRJ-2025-003',name:'Data Center Consolidation',     client:'Wipro Technologies',status:'ON_HOLD', startDate:'2025-01-01',endDate:'2025-07-31',value:3500000,progress:32,team:8},
  {id:'4',code:'PRJ-2024-012',name:'Security Audit & Compliance',   client:'HCL Technologies', status:'COMPLETED',startDate:'2024-10-01',endDate:'2025-01-15',value: 480000,progress:100,team:3},
  {id:'5',code:'PRJ-2025-004',name:'Cloud Migration — AWS',         client:'Tech Mahindra',    status:'PLANNING', startDate:'2025-05-01',endDate:'2025-11-30',value:5200000,progress:5, team:10},
]

const STATUS_COLOR: Record<string,string> = {
  ACTIVE:'#22c55e', ON_HOLD:'#f59e0b', COMPLETED:'#3b82f6', PLANNING:'#8b5cf6', CANCELLED:'#64748b'
}

export default function ProjectsPage(){
  const [showCreate, setShowCreate] = useState(false)
  const active    = PROJECTS.filter(p=>p.status==='ACTIVE').length
  const totalVal  = PROJECTS.reduce((s,p)=>s+p.value,0)
  const avgProgress = Math.round(PROJECTS.reduce((s,p)=>s+p.progress,0)/PROJECTS.length)

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>{PROJECTS.length} projects · {active} active</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary h-9 text-sm"><Plus className="w-4 h-4"/>New Project</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Active',       val:active,              color:'#22c55e', icon:FolderOpen},
          {label:'Total Value',  val:formatCurrency(totalVal), color:'var(--gold)', icon:DollarSign},
          {label:'Avg Progress', val:`${avgProgress}%`,   color:'#3b82f6', icon:CheckCircle},
          {label:'Team Members', val:PROJECTS.reduce((s,p)=>s+p.team,0), color:'#8b5cf6', icon:Users},
        ].map(s=>(
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${s.color}15`}}>
              <s.icon className="w-5 h-5" style={{color:s.color}}/>
            </div>
            <div>
              <p className="font-serif text-xl" style={{color:s.color}}>{s.val}</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROJECTS.map((p,i)=>(
          <div key={p.id} className="card group hover:border-gold-500/25 transition-all cursor-pointer" style={{animationDelay:`${i*.06}s`}}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${STATUS_COLOR[p.status]}12`}}>
                <FolderOpen className="w-5 h-5" style={{color:STATUS_COLOR[p.status]}}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug">{p.name}</p>
                  <Badge variant={p.status==='ACTIVE'?'success':p.status==='COMPLETED'?'info':p.status==='ON_HOLD'?'warning':'default'} className="flex-shrink-0">
                    {p.status.replace('_',' ')}
                  </Badge>
                </div>
                <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{p.client}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
              <div><p style={{color:'var(--text-muted)'}}>Value</p><p className="font-mono font-semibold mt-0.5">{formatCurrency(p.value)}</p></div>
              <div><p style={{color:'var(--text-muted)'}}>Deadline</p><p className="font-semibold mt-0.5">{formatDate(p.endDate)}</p></div>
              <div><p style={{color:'var(--text-muted)'}}>Team</p><p className="font-semibold mt-0.5">{p.team} members</p></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{color:'var(--text-muted)'}}>Progress</span>
                <span className="text-xs font-bold" style={{color:p.progress===100?'#22c55e':'var(--gold)'}}>{p.progress}%</span>
              </div>
              <div style={{height:'5px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:'4px',background:p.progress===100?'#22c55e':STATUS_COLOR[p.status]??'var(--gold)',width:`${p.progress}%`,transition:'width .6s ease'}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="New Project" subtitle="Create a project to track work and team">
        <div className="space-y-4">
          <div><label className="label">Project Name *</label><input className="input h-10"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Client</label><input className="input h-10"/></div>
            <div><label className="label">Contract Value ₹</label><input className="input h-10" type="number"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input className="input h-10" type="date"/></div>
            <div><label className="label">End Date</label><input className="input h-10" type="date"/></div>
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button onClick={()=>{toast.success('Project created');setShowCreate(false)}} className="btn-primary">Create Project</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
