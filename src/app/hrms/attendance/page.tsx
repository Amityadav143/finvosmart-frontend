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
import { hrmsApi } from '@/lib/api/hrms'
import { StatusBadge } from '@/components/ui/Badge'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, Monitor, Smartphone, Calendar, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const MOCK_DAILY = Array.from({length:30},(_,i)=>{
  const statuses = ['PRESENT','PRESENT','PRESENT','PRESENT','ABSENT','WFH','PRESENT','HALF_DAY','PRESENT','ON_LEAVE']
  const s = statuses[i % statuses.length]
  return { day: i+1, status: s }
})

const STATUS_COLOR: Record<string,string> = {
  PRESENT:'#22c55e', ABSENT:'#ef4444', WFH:'#3b82f6', HALF_DAY:'#f59e0b',
  ON_LEAVE:'#8b5cf6', HOLIDAY:'#14b8a6', WEEKEND:'#64748b'
}

export default function AttendancePage() {
  const qc = useQueryClient()
  const today = new Date()
  const [viewMode, setViewMode] = useState<'calendar'|'list'>('calendar')
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear]   = useState(today.getFullYear())
  const [empSearch, setEmpSearch] = useState('')
  const [showMark, setShowMark] = useState(false)
  const [form, setForm] = useState({
    employeeId:'', attendanceDate: today.toISOString().split('T')[0],
    status:'PRESENT', source:'MANUAL', checkInTime:'09:00', checkOutTime:'18:00', remarks:''
  })

  const markMutation = useMutation({
    mutationFn: (d:any) => hrmsApi.attendance.mark(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['attendance']}); setShowMark(false); toast.success('Attendance marked') },
    onError: (e:any) => toast.error(e?.response?.data?.error ?? 'Failed')
  })

  const statsData = [
    { label:'Present Today', value:187, pct:76, color:'#22c55e' },
    { label:'WFH',           value:28,  pct:11, color:'#3b82f6' },
    { label:'Absent',        value:22,  pct:9,  color:'#ef4444' },
    { label:'On Leave',      value:10,  pct:4,  color:'#8b5cf6' },
  ]

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>
            {today.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{border:'1px solid var(--border)'}}>
            {(['calendar','list'] as const).map(m=>(
              <button key={m} onClick={()=>setViewMode(m)}
                className="px-4 py-2 text-xs font-semibold capitalize transition-all"
                style={{background:viewMode===m?'var(--gold-muted)':'transparent',color:viewMode===m?'var(--gold)':'var(--text-muted)'}}>
                {m}
              </button>
            ))}
          </div>
          <button onClick={()=>setShowMark(true)} className="btn-primary h-9 text-sm">
            <Clock className="w-4 h-4"/>Mark Attendance
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map(s=>(
          <div key={s.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:'var(--text-muted)',letterSpacing:'.07em',fontSize:'9px'}}>{s.label}</p>
              <span className="text-lg font-serif font-normal" style={{color:s.color}}>{s.value}</span>
            </div>
            <div className="progress-track" style={{height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:'4px',background:s.color,width:`${s.pct}%`,transition:'width .6s ease'}}/>
            </div>
            <p className="text-xs mt-1.5" style={{color:'var(--text-muted)'}}>{s.pct}% of workforce</p>
          </div>
        ))}
      </div>

      {/* Calendar or List */}
      {viewMode==='calendar' ? (
        <div className="card">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-2">
              <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)}} className="btn-icon w-8 h-8">‹</button>
              <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)}} className="btn-icon w-8 h-8">›</button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d=>(
              <div key={d} className="text-center text-xs font-bold uppercase tracking-wider py-2"
                style={{color:'var(--text-muted)',fontSize:'9px'}}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length:firstDay},(_,i)=>(
              <div key={'e'+i} className="h-14 rounded-xl" style={{background:'var(--bg-hover)',opacity:.3}}/>
            ))}
            {Array.from({length:daysInMonth},(_,i)=>{
              const day = i+1
              const isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
              const mock = MOCK_DAILY[i]
              const col  = STATUS_COLOR[mock?.status??''] ?? 'transparent'
              return (
                <div key={day} className="h-14 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all"
                  style={{background:isToday?'var(--gold-muted)':mock?.status?`${col}10`:'var(--bg-hover)',
                          border:`1px solid ${isToday?'rgba(245,158,11,.25)':mock?.status?`${col}20`:'var(--border)'}`}}
                  title={mock?.status??''}>
                  <span className="text-sm font-semibold" style={{color:isToday?'var(--gold)':'var(--text-secondary)'}}>{day}</span>
                  {mock?.status && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{background:col}}/>
                  )}
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{borderTop:'1px solid var(--border)'}}>
            {Object.entries(STATUS_COLOR).map(([s,c])=>(
              <span key={s} className="flex items-center gap-1.5 text-xs" style={{color:'var(--text-muted)'}}>
                <span className="w-2 h-2 rounded-full" style={{background:c}}/>
                {s.replace('_',' ')}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Today's Attendance Log</h2>
            <SearchInput value={empSearch} onChange={setEmpSearch} placeholder="Filter employees..." className="w-56"/>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Employee','Status','Check In','Check Out','Hours','Source'].map(h=>(
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[
                  {name:'Rajesh Kumar',code:'EMP-25-0001',status:'PRESENT',in:'09:02',out:'18:15',hrs:'9.2',src:'BIOMETRIC'},
                  {name:'Priya Sharma',code:'EMP-25-0002',status:'WFH',    in:'09:30',out:'18:00',hrs:'8.5',src:'MOBILE'},
                  {name:'Amit Singh', code:'EMP-25-0003',status:'PRESENT',in:'08:55',out:'17:50',hrs:'8.9',src:'BIOMETRIC'},
                  {name:'Sneha Patel', code:'EMP-25-0004',status:'ABSENT', in:'—',   out:'—',    hrs:'0',  src:'—'},
                  {name:'Rohit Gupta',code:'EMP-25-0005',status:'HALF_DAY',in:'09:00',out:'13:00',hrs:'4.0',src:'MANUAL'},
                ].filter(r=>!empSearch||r.name.toLowerCase().includes(empSearch.toLowerCase())).map((r,i)=>(
                  <tr key={i} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                          style={{background:'rgba(59,130,246,.1)',color:'#3b82f6'}}>
                          {(r.name ?? '?').split(' ').map(w=>w[0]).join('')}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{r.name}</p>
                          <p className="font-mono text-xs" style={{color:'var(--text-muted)',fontSize:'10px'}}>{r.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell"><StatusBadge status={r.status}/></td>
                    <td className="table-cell"><span className="font-mono text-xs">{r.in}</span></td>
                    <td className="table-cell"><span className="font-mono text-xs">{r.out}</span></td>
                    <td className="table-cell">
                      <span className="font-mono text-sm font-semibold" style={{color:Number(r.hrs)>=8?'#22c55e':Number(r.hrs)>0?'#f59e0b':'#ef4444'}}>{r.hrs}h</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg font-mono" style={{background:'var(--bg-hover)',color:'var(--text-secondary)'}}>{r.src}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showMark} onClose={()=>setShowMark(false)} title="Mark Attendance" subtitle="Record attendance for an employee">
        <form onSubmit={e=>{e.preventDefault();markMutation.mutate({...form,checkInTime:form.attendanceDate+'T'+form.checkInTime,checkOutTime:form.attendanceDate+'T'+form.checkOutTime})}} className="space-y-4">
          <div><label className="label">Employee ID</label>
            <input className="input h-10" placeholder="UUID or leave blank for self" value={form.employeeId} onChange={e=>setForm(f=>({...f,employeeId:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Date *</label>
              <input className="input h-10" type="date" required value={form.attendanceDate} onChange={e=>setForm(f=>({...f,attendanceDate:e.target.value}))}/></div>
            <div><label className="label">Status *</label>
              <select className="input h-10" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {['PRESENT','ABSENT','HALF_DAY','WFH','ON_LEAVE','HOLIDAY'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Check-In</label>
              <input className="input h-10" type="time" value={form.checkInTime} onChange={e=>setForm(f=>({...f,checkInTime:e.target.value}))}/></div>
            <div><label className="label">Check-Out</label>
              <input className="input h-10" type="time" value={form.checkOutTime} onChange={e=>setForm(f=>({...f,checkOutTime:e.target.value}))}/></div>
          </div>
          <div><label className="label">Source</label>
            <select className="input h-10" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
              {['MANUAL','BIOMETRIC','MOBILE','GEO','SYSTEM'].map(s=><option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className="label">Remarks</label>
            <input className="input h-10" value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} placeholder="Optional notes"/></div>
          <div className="flex justify-end gap-3 pt-2" style={{borderTop:'1px solid var(--border)'}}>
            <button type="button" onClick={()=>setShowMark(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={markMutation.isPending} className="btn-primary">
              {markMutation.isPending?'Marking...':'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
