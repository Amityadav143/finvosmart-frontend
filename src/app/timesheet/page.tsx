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

import { exportToCsv } from '@/lib/utils'
import { useState } from 'react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Modal } from '@/components/ui/Modal'
import { Play, Square, Plus, Clock, Calendar, TrendingUp, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

type EntryStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

interface TimesheetEntry {
  id: string
  date: string
  project: string
  task: string
  hours: number
  billable: boolean
  notes: string
  status: EntryStatus
}

const STATUS_STYLE: Record<EntryStatus, { color: string; bg: string }> = {
  DRAFT:     { color: '#94a3b8', bg: 'rgba(71,85,105,0.1)' },
  SUBMITTED: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  APPROVED:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  REJECTED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const PROJECTS = [
  'NVGROW — Website Redesign', 'TATA Steel — ERP Integration',
  'Internal — Admin & Management', 'Reliance Industries — Audit',
  'Leave / Holiday', 'Training & Development',
]

const TASKS = [
  'Development', 'Design', 'Testing / QA', 'Client Meeting',
  'Documentation', 'Code Review', 'Planning', 'Support',
]

function getWeekDates(offset = 0) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const SEED: TimesheetEntry[] = [
  { id:'1', date:'2026-04-14', project:'TATA Steel — ERP Integration', task:'Development',   hours:7.5, billable:true,  notes:'API integration for invoice module',     status:'APPROVED'  },
  { id:'2', date:'2026-04-14', project:'Internal — Admin & Management', task:'Planning',      hours:0.5, billable:false, notes:'Sprint planning',                        status:'APPROVED'  },
  { id:'3', date:'2026-04-15', project:'TATA Steel — ERP Integration', task:'Testing / QA',  hours:6.0, billable:true,  notes:'UAT testing session with client team',   status:'SUBMITTED' },
  { id:'4', date:'2026-04-15', project:'NVGROW — Website Redesign',    task:'Design',        hours:2.0, billable:true,  notes:'Landing page wireframes review',         status:'SUBMITTED' },
  { id:'5', date:'2026-04-16', project:'TATA Steel — ERP Integration', task:'Client Meeting',hours:2.0, billable:true,  notes:'Go-live review call',                    status:'DRAFT'     },
  { id:'6', date:'2026-04-17', project:'Internal — Admin & Management', task:'Documentation', hours:3.0, billable:false, notes:'API docs update',                       status:'DRAFT'     },
]

const BLANK = { date: new Date().toISOString().split('T')[0], project: PROJECTS[0], task: TASKS[0], hours: 1, billable: true, notes: '' }

export default function TimesheetPage() {
  const [entries, setEntries]   = useState<TimesheetEntry[]>(SEED)
  const [weekOffset, setWeek]   = useState(0)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ ...BLANK })
  const [timer, setTimer]       = useState<{ running: boolean; start: number; elapsed: number }>({ running: false, start: 0, elapsed: 0 })
  const [activeProject, setActiveProject] = useState(PROJECTS[0])
  const [activeTask, setActiveTask]       = useState(TASKS[0])

  const weekDates = getWeekDates(weekOffset)
  const weekStart = weekDates[0].toISOString().split('T')[0]
  const weekEnd   = weekDates[6].toISOString().split('T')[0]
  const weekEntries = entries.filter(e => e.date >= weekStart && e.date <= weekEnd)

  const totalHours    = weekEntries.reduce((s, e) => s + e.hours, 0)
  const billableHours = weekEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0)
  const billableRate  = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0

  const toggleTimer = () => {
    if (timer.running) {
      const elapsed = timer.elapsed + (Date.now() - timer.start) / 3600000
      setTimer({ running: false, start: 0, elapsed })
      const hrs = Math.round(elapsed * 4) / 4
      setForm(f => ({ ...f, project: activeProject, task: activeTask, hours: hrs }))
      setShowAdd(true)
    } else {
      setTimer({ running: true, start: Date.now(), elapsed: timer.elapsed })
    }
  }

  const addEntry = () => {
    if (!form.hours || form.hours <= 0) { toast.error('Hours must be greater than 0'); return }
    setEntries(prev => [...prev, { id: Date.now().toString(), ...form, status: 'DRAFT' }])
    toast.success('Time entry added')
    setShowAdd(false)
    setForm({ ...BLANK })
    setTimer({ running: false, start: 0, elapsed: 0 })
  }

  const submitWeek = () => {
    setEntries(prev => prev.map(e =>
      e.date >= weekStart && e.date <= weekEnd && e.status === 'DRAFT'
        ? { ...e, status: 'SUBMITTED' }
        : e
    ))
    toast.success(`${weekEntries.filter(e => e.status === 'DRAFT').length} entries submitted for approval`)
  }

  const hasDraft = weekEntries.some(e => e.status === 'DRAFT')

  const fmt = (h: number) => `${Math.floor(h)}h ${Math.round((h % 1) * 60).toString().padStart(2,'0')}m`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Timesheets</h1>
          <p className="page-subtitle">Track billable & non-billable hours across projects</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasDraft && (
            <button onClick={submitWeek} className="btn-secondary h-9 text-sm">
              Submit Week for Approval
            </button>
          )}
          <button className="btn-secondary h-9 text-sm" onClick={()=>{ const rows=(entries??[]) as any[]; if(!rows.length){toast('No timesheet data to export');return;} exportToCsv('timesheet', rows.map((e:any)=>({ Date:e.date, Project:e.projectName, Hours:e.hours, Billable:e.billable, Description:e.description }))) }}><Download size={14} />Export</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary h-9 text-sm">
            <Plus size={14} />Log Time
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'This Week', value: fmt(totalHours),    color:'var(--gold)',  sub:'total hours' },
          { label:'Billable',  value: fmt(billableHours), color:'#22c55e',      sub:`${billableRate}% of time` },
          { label:'Entries',   value: weekEntries.length, color:'#3b82f6',      sub:`${weekEntries.filter(e=>e.status==='DRAFT').length} draft` },
          { label:'Est. Revenue', value: `₹${(billableHours * 1800).toLocaleString('en-IN')}`, color:'#8b5cf6', sub:'@ ₹1800/hr avg' },
        ].map(k => (
          <div key={k.label} className="card">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight:600 }}>{k.label}</p>
            <p className="font-serif text-2xl" style={{ color:k.color }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Live timer */}
      <div className="card" style={{ borderColor: timer.running ? 'var(--gold)' : 'var(--border)', background: timer.running ? 'var(--gold-muted)' : 'var(--bg-card)' }}>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={toggleTimer}
            style={{ width:'44px', height:'44px', borderRadius:'50%', border:'none', cursor:'pointer',
              background: timer.running ? '#ef4444' : 'var(--btn-primary-bg)', color:'var(--text-on-gold)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            {timer.running ? <Square size={16} /> : <Play size={16} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                className="input h-9 text-sm"
                style={{ width:'260px' }}
                value={activeProject}
                onChange={e => setActiveProject(e.target.value)}
                disabled={timer.running}
              >
                {PROJECTS.map(p => <option key={p}>{p}</option>)}
              </select>
              <select
                className="input h-9 text-sm"
                style={{ width:'160px' }}
                value={activeTask}
                onChange={e => setActiveTask(e.target.value)}
                disabled={timer.running}
              >
                {TASKS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p className="font-mono font-bold" style={{ fontSize:'22px', color: timer.running ? 'var(--gold)' : 'var(--text-muted)', letterSpacing:'0.04em' }}>
              {timer.running ? '⏱ Running' : '00:00:00'}
            </p>
            <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>
              {timer.running ? 'Click stop to log time' : 'Click play to start timer'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom:'1px solid var(--border)' }}>
          <button className="btn-icon" onClick={() => setWeek(w => w - 1)}><ChevronLeft size={15} /></button>
          <div className="text-center">
            <p className="font-semibold text-sm">{weekDates[0].toLocaleDateString('en-IN', { day:'numeric', month:'short' })} — {weekDates[6].toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
            <p style={{ fontSize:'11px', color:'var(--text-muted)' }}>
              {weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${Math.abs(weekOffset)} weeks ${weekOffset < 0 ? 'ago' : 'ahead'}`}
            </p>
          </div>
          <button className="btn-icon" onClick={() => setWeek(w => w + 1)}><ChevronRight size={15} /></button>
        </div>

        {/* Day columns header */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
          {weekDates.map((d, i) => {
            const dayEntries = weekEntries.filter(e => e.date === d.toISOString().split('T')[0])
            const dayHours   = dayEntries.reduce((s, e) => s + e.hours, 0)
            const isToday    = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
            return (
              <div key={i} style={{ padding:'10px 8px', textAlign:'center', borderRight: i < 6 ? '1px solid var(--border)' : 'none', background: isToday ? 'var(--gold-muted)' : 'transparent' }}>
                <p style={{ fontSize:'10px', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  {d.toLocaleDateString('en-IN', { weekday:'short' })}
                </p>
                <p style={{ fontSize:'16px', fontWeight:600, color: isToday ? 'var(--gold)' : 'var(--text-primary)', margin:'2px 0' }}>
                  {d.getDate()}
                </p>
                <p style={{ fontSize:'11px', color: dayHours >= 8 ? '#22c55e' : dayHours > 0 ? 'var(--gold)' : 'var(--text-muted)', fontWeight:600 }}>
                  {dayHours > 0 ? fmt(dayHours) : '—'}
                </p>
              </div>
            )
          })}
        </div>

        {/* Day entries */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', minHeight:'200px' }}>
          {weekDates.map((d, i) => {
            const dateStr    = d.toISOString().split('T')[0]
            const dayEntries = weekEntries.filter(e => e.date === dateStr)
            return (
              <div key={i} style={{ padding:'8px', borderRight: i < 6 ? '1px solid var(--border)' : 'none', minHeight:'200px' }}>
                {dayEntries.map(entry => (
                  <div key={entry.id} style={{ padding:'6px 8px', borderRadius:'8px', marginBottom:'4px',
                    background: STATUS_STYLE[entry.status].bg, border:`1px solid ${STATUS_STYLE[entry.status].color}20` }}>
                    <p style={{ fontSize:'10px', fontWeight:700, color:'var(--text-primary)', lineClamp:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {entry.project.split('—')[0].trim()}
                    </p>
                    <p style={{ fontSize:'9.5px', color:'var(--text-secondary)', marginTop:'1px' }}>{entry.task}</p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'4px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, fontFamily:'monospace', color: STATUS_STYLE[entry.status].color }}>
                        {entry.hours}h
                      </span>
                      {entry.billable && (
                        <span style={{ fontSize:'8px', padding:'1px 4px', borderRadius:'3px', background:'rgba(34,197,94,0.15)', color:'#22c55e', fontWeight:700 }}>$</span>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setForm(f => ({ ...f, date:dateStr })); setShowAdd(true) }}
                  style={{ width:'100%', padding:'4px', borderRadius:'6px', border:'1px dashed var(--border)', background:'transparent',
                    color:'var(--text-muted)', fontSize:'11px', cursor:'pointer', marginTop:'2px' }}
                >
                  + add
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Time Entry Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setForm({ ...BLANK }) }} title="Log Time Entry" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input h-10" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
            </div>
            <div>
              <label className="label">Hours</label>
              <input type="number" step="0.25" min="0.25" max="24" className="input h-10" value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="label">Project</label>
            <select className="input h-10" value={form.project} onChange={e => setForm(f => ({ ...f, project:e.target.value }))}>
              {PROJECTS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Task Type</label>
            <select className="input h-10" value={form.task} onChange={e => setForm(f => ({ ...f, task:e.target.value }))}>
              {TASKS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input h-10" placeholder="What did you work on?" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} />
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' }}>
            <input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable:e.target.checked }))} />
            <span className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>Billable to client</span>
          </label>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => { setShowAdd(false); setForm({ ...BLANK }) }} className="btn-secondary h-10">Cancel</button>
            <button onClick={addEntry} className="btn-primary h-10">Save Entry</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
