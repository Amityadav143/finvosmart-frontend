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
import { Users, FileText, ShoppingCart, Package, TrendingUp, BarChart3, FolderOpen, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const MODULES = [
  {key:'hrms',        name:'HRMS',           desc:'Employees, attendance, leave, payroll', icon:Users,       enabled:true,  plan:'Starter'},
  {key:'finance',     name:'Finance',        desc:'Double-entry accounting, reports',       icon:Building2,   enabled:true,  plan:'Starter'},
  {key:'invoicing',   name:'Invoicing',      desc:'GST invoices, quotations, billing',      icon:FileText,    enabled:true,  plan:'Starter'},
  {key:'procurement', name:'Procurement',    desc:'Purchase orders, vendors, GRN',          icon:ShoppingCart,enabled:true,  plan:'Growth'},
  {key:'inventory',   name:'Inventory',      desc:'Stock management, movements',            icon:Package,     enabled:true,  plan:'Growth'},
  {key:'crm',         name:'CRM',            desc:'Leads, pipeline, customers',             icon:TrendingUp,  enabled:true,  plan:'Growth'},
  {key:'projects',    name:'Projects',       desc:'Project tracking and billing',           icon:FolderOpen,  enabled:true,  plan:'Enterprise'},
  {key:'analytics',   name:'Advanced Analytics',desc:'Custom dashboards, BI reports',       icon:BarChart3,   enabled:false, plan:'Enterprise'},
]

export default function ModulesPage(){
  const [mods, setMods] = useState(MODULES)

  const toggle=(key:string)=>{
    setMods(m=>m.map(mod=>mod.key===key?{...mod,enabled:!mod.enabled}:mod))
    toast.success('Module preference updated')
  }

  return(
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Modules</h1>
        <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>Enable or disable platform modules · ENTERPRISE plan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mods.map((mod,i)=>(
          <div key={mod.key} className="card flex items-center gap-4" style={{animationDelay:`${i*.04}s`}}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{background:mod.enabled?'var(--gold-muted)':'var(--bg-hover)',border:`1px solid ${mod.enabled?'rgba(245,158,11,.2)':'var(--border)'}`}}>
              <mod.icon className="w-5 h-5" style={{color:mod.enabled?'var(--gold)':'var(--text-muted)'}}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{mod.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{background:'rgba(139,92,246,.1)',color:'#8b5cf6',border:'1px solid rgba(139,92,246,.15)',fontSize:'9px'}}>
                  {mod.plan}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{mod.desc}</p>
            </div>
            <button onClick={()=>toggle(mod.key)}
              className="relative flex-shrink-0 rounded-full transition-all duration-300"
              style={{width:'44px',height:'24px',padding:'3px',
                      background:mod.enabled?'var(--btn-primary-bg)':'var(--border)',
                      border:`1px solid ${mod.enabled?'transparent':'var(--border-strong)'}`}}>
              <div className="absolute inset-y-0 rounded-full transition-all duration-300"
                style={{width:'18px',height:'18px',top:'3px',background:'white',boxShadow:'0 1px 3px rgba(0,0,0,.2)',
                        left:mod.enabled?'23px':'3px'}}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
