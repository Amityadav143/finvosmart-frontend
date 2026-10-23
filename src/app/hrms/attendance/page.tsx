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

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarCheck, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { hrmsApi } from '@/lib/api/hrms'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { errText } from '@/lib/purchases'
import { todayIST } from '@/lib/money'
import type { AttendanceCode, AttendanceRegisterRow, AttendanceStatus } from '@/types'

/** What each code means, its colour, and the status that sets it. Colour always comes with the letter. */
const CODES: Record<Exclude<AttendanceCode, '' | 'X'>, { label: string; color: string; status: AttendanceStatus }> = {
  P: { label: 'Present', color: '#16a34a', status: 'PRESENT' },
  W: { label: 'Work from home', color: '#2563eb', status: 'WFH' },
  H: { label: 'Half day', color: '#d97706', status: 'HALF_DAY' },
  A: { label: 'Absent', color: '#dc2626', status: 'ABSENT' },
  L: { label: 'On leave', color: '#7c3aed', status: 'ON_LEAVE' },
  U: { label: 'Leave without pay', color: '#9d174d', status: 'ON_LEAVE' },
  HO: { label: 'Holiday', color: '#64748b', status: 'HOLIDAY' },
  WO: { label: 'Weekly off', color: '#64748b', status: 'WEEKEND' },
}
const CHOICES: { status: AttendanceStatus; code: keyof typeof CODES; ahead: boolean }[] = [
  { status: 'PRESENT', code: 'P', ahead: false }, { status: 'WFH', code: 'W', ahead: false },
  { status: 'HALF_DAY', code: 'H', ahead: false }, { status: 'ABSENT', code: 'A', ahead: false },
  { status: 'ON_LEAVE', code: 'L', ahead: true }, { status: 'HOLIDAY', code: 'HO', ahead: true }, { status: 'WEEKEND', code: 'WO', ahead: true },
]
const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const shift = (month: string, by: number) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
const dayLabel = (month: string, day: number) =>
  new Date(`${month}-${String(day).padStart(2, '0')}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })

export default function AttendancePage() {
  return (
    <PermissionGate anyOf={['ATTENDANCE_CREATE', 'ATTENDANCE_EDIT', 'ATTENDANCE_ADMIN']} fallback={<OwnAttendance />}>
      <Register />
    </PermissionGate>
  )
}

/** Without attendance rights: where to see your own. */
function OwnAttendance() {
  return (
    <div className="card max-w-xl text-sm space-y-2">
      <h1 className="page-title">Attendance</h1>
      <p style={{ color: 'var(--text-muted)' }}>Attendance is marked by HR or your manager. Your leave and payslips are in your portal.</p>
      <Link href="/self-service" className="btn-secondary h-9 text-sm inline-flex">Open my portal</Link>
    </div>
  )
}

function Register() {
  const qc = useQueryClient()
  const today = todayIST()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [cell, setCell] = useState<{ row: AttendanceRegisterRow; day: number } | null>(null)
  const [dayOpen, setDayOpen] = useState(false)

  const { data: reg, isLoading, isError, error } = useQuery({
    queryKey: ['attendance-register', month],
    queryFn: () => hrmsApi.attendance.register(month),
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['attendance-register'] })

  const todayIndex = reg && today.startsWith(reg.month) ? Number(today.slice(8, 10)) - 1 : -1
  const todaySummary = useMemo(() => {
    if (!reg || todayIndex < 0) return null
    const c = { in: 0, away: 0, leave: 0, unmarked: 0, total: 0 }
    for (const r of reg.employees) {
      const code = r.days[todayIndex]
      if (code === 'X') continue
      c.total++
      if (code === 'P' || code === 'W' || code === 'H') c.in++
      else if (code === 'A') c.away++
      else if (code === 'L' || code === 'U') c.leave++
      else if (code === '') c.unmarked++
    }
    return c
  }, [reg, todayIndex])

  const set = useMutation({
    mutationFn: (v: { status: AttendanceStatus | null }) => v.status
      ? hrmsApi.attendance.set(cell!.row.employeeId, `${reg!.month}-${String(cell!.day).padStart(2, '0')}`, { status: v.status })
      : hrmsApi.attendance.clear(cell!.row.employeeId, `${reg!.month}-${String(cell!.day).padStart(2, '0')}`),
    onSuccess: () => { setCell(null); refresh() },
    onError: (e: any) => toast.error(errText(e, 'Attendance could not be saved')),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Mark who worked each day. Absences and half days — with approved leave — are the unpaid days payroll starts from.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Month">
            <button className="btn-icon w-9 h-9" aria-label="Previous month" onClick={() => setMonth(m => shift(m, -1))}><ChevronLeft size={16} /></button>
            <span className="text-sm font-semibold w-36 text-center">{reg?.label ?? month}</span>
            <button className="btn-icon w-9 h-9" aria-label="Next month" disabled={month >= today.slice(0, 7)} onClick={() => setMonth(m => shift(m, 1))}><ChevronRight size={16} /></button>
          </div>
          {reg?.canEdit && <button className="btn-primary h-9 text-sm" onClick={() => setDayOpen(true)}><CalendarCheck size={15} />Mark a day</button>}
        </div>
      </div>

      {reg?.payrollNote && (
        <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2.5" style={{ background: '#2563eb14', border: '1px solid #2563eb40' }}>
          <Info size={15} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} aria-hidden /><span>{reg.payrollNote}</span>
        </div>
      )}

      {todaySummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'At work today', value: todaySummary.in, sub: 'present, from home or half day' },
            { label: 'Absent today', value: todaySummary.away, sub: 'not on approved leave' },
            { label: 'On leave today', value: todaySummary.leave, sub: 'approved leave' },
            { label: 'Not marked yet', value: todaySummary.unmarked, sub: `of ${todaySummary.total} employees` },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="font-serif text-2xl mt-1">{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}
      {isError && <div className="card text-sm" style={{ color: '#dc2626' }}>{errText(error, "The register couldn't be loaded.")}</div>}
      {reg && reg.employees.length === 0 && (
        <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>
          No one was employed in {reg.label}. Add employees under <Link href="/hrms/employees" className="underline">Employees</Link> (or import them from Excel).
        </div>
      )}

      {reg && reg.employees.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="text-xs" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="table-header sticky left-0 z-10 text-left" style={{ background: 'var(--bg-card)', minWidth: 180 }}>Employee</th>
                  {Array.from({ length: reg.days }, (_, i) => {
                    const wd = (reg.firstWeekday - 1 + i) % 7
                    return (
                      <th key={i} className="px-0.5 py-2 text-center font-semibold" style={{ minWidth: 30, color: i === todayIndex ? 'var(--gold)' : wd >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                        <div style={{ fontSize: 9 }}>{WEEKDAY[wd]}</div>{i + 1}
                      </th>
                    )
                  })}
                  {['Present', 'Absent', 'Half', 'Leave', 'Unpaid days'].map(h => <th key={h} className="table-header text-right whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reg.employees.map(r => (
                  <tr key={r.employeeId}>
                    <td className="sticky left-0 z-10 px-3 py-1.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                      <p className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{r.name}</p>
                      <p className="font-mono" style={{ color: 'var(--text-muted)', fontSize: 10 }}>{r.code}{r.department ? ` · ${r.department}` : ''}</p>
                    </td>
                    {r.days.map((code, i) => {
                      const info = code && code !== 'X' ? CODES[code] : null
                      const editable = reg.canEdit && code !== 'X'
                      const what = code === 'X' ? 'not employed' : info ? info.label : 'not marked'
                      return (
                        <td key={i} className="p-0.5 text-center" style={{ borderTop: '1px solid var(--border)', background: i === todayIndex ? 'var(--gold-muted)' : undefined }}>
                          <button disabled={!editable} onClick={() => setCell({ row: r, day: i + 1 })}
                            aria-label={`${r.name}, ${i + 1} ${reg.label}: ${what}${editable ? '. Change' : ''}`} title={`${i + 1}: ${what}`}
                            className="w-7 h-7 rounded-md font-bold"
                            style={{ fontSize: code.length > 1 ? 9 : 11, cursor: editable ? 'pointer' : 'default',
                              background: info ? `${info.color}1f` : code === 'X' ? 'transparent' : 'var(--bg-hover)',
                              color: info ? info.color : 'var(--text-muted)', border: code === '' ? '1px dashed var(--border-strong)' : '1px solid transparent' }}>
                            {code === 'X' ? '·' : code}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-2 text-right font-mono" style={{ borderTop: '1px solid var(--border)' }}>{r.counts.present + r.counts.wfh}</td>
                    <td className="px-2 text-right font-mono" style={{ borderTop: '1px solid var(--border)' }}>{r.counts.absent}</td>
                    <td className="px-2 text-right font-mono" style={{ borderTop: '1px solid var(--border)' }}>{r.counts.halfDays}</td>
                    <td className="px-2 text-right font-mono" style={{ borderTop: '1px solid var(--border)' }}>{r.counts.paidLeave + r.counts.unpaidLeave}</td>
                    <td className="px-2 text-right font-mono font-semibold" style={{ borderTop: '1px solid var(--border)', color: Number(r.unpaidDays) > 0 ? '#dc2626' : undefined }}>{Number(r.unpaidDays)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--text-muted)' }} aria-label="Key">
            {(Object.keys(CODES) as (keyof typeof CODES)[]).map(k => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-6 h-5 rounded font-bold" style={{ background: `${CODES[k].color}1f`, color: CODES[k].color, fontSize: 9 }}>{k}</span>{CODES[k].label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5"><span className="inline-block w-6 h-5 rounded" style={{ border: '1px dashed var(--border-strong)' }} />Not marked</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-6 text-center">·</span>Not employed that day</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Unpaid days: absent days and half days, plus approved leave without pay — paid leave cancels an absence. This is where the
            month's payroll starts; HR can still adjust it in the payroll draft.
          </p>
        </>
      )}

      {cell && reg && (
        <Modal open onClose={() => setCell(null)} title={cell.row.name} subtitle={dayLabel(reg.month, cell.day)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {CHOICES.map(c => {
                const future = `${reg.month}-${String(cell.day).padStart(2, '0')}` > today
                const current = cell.row.days[cell.day - 1] === c.code
                return (
                  <button key={c.status} disabled={set.isPending || (future && !c.ahead)} onClick={() => set.mutate({ status: c.status })}
                    className="h-10 rounded-xl text-sm font-semibold inline-flex items-center gap-2 px-3"
                    style={{ background: current ? `${CODES[c.code].color}26` : 'var(--bg-hover)', color: 'var(--text-primary)',
                      border: `1px solid ${current ? CODES[c.code].color : 'var(--border)'}`, opacity: future && !c.ahead ? 0.45 : 1 }}>
                    <span className="inline-flex items-center justify-center w-7 h-6 rounded font-bold" style={{ background: `${CODES[c.code].color}1f`, color: CODES[c.code].color, fontSize: 10 }}>{c.code}</span>
                    {CODES[c.code].label}
                  </button>
                )
              })}
            </div>
            {['L', 'U'].includes(cell.row.days[cell.day - 1]) && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This day is covered by approved leave. Leave itself is changed under Leave.</p>
            )}
            <div className="flex justify-between gap-3 pt-1">
              <PermissionGate anyOf={['ATTENDANCE_EDIT', 'ATTENDANCE_ADMIN']}>
                <button className="btn-ghost text-sm" disabled={set.isPending || cell.row.days[cell.day - 1] === ''} onClick={() => set.mutate({ status: null })}>Remove the mark</button>
              </PermissionGate>
              <button className="btn-secondary text-sm" onClick={() => setCell(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {dayOpen && reg && <MarkDay rows={reg.employees} month={reg.month} today={today} onClose={() => setDayOpen(false)} onDone={() => { setDayOpen(false); refresh() }} />}
    </div>
  )
}

/** Marks one day for many employees: by default everyone not yet marked, as present. */
function MarkDay({ rows, month, today, onClose, onDone }: { rows: AttendanceRegisterRow[]; month: string; today: string; onClose: () => void; onDone: () => void }) {
  const inMonth = today.startsWith(month)
  const [date, setDate] = useState(inMonth ? today : `${month}-01`)
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT')
  const [overwrite, setOverwrite] = useState(false)
  const day = Number(date.slice(8, 10))
  const sameMonth = date.startsWith(month)
  const eligible = rows.filter(r => !sameMonth || r.days[day - 1] !== 'X')
  const unmarked = eligible.filter(r => !sameMonth || r.days[day - 1] === '')
  const [picked, setPicked] = useState<Set<string>>(new Set(unmarked.map(r => r.employeeId)))
  const future = date > today
  const ahead = ['ON_LEAVE', 'HOLIDAY', 'WEEKEND'].includes(status)

  const run = useMutation({
    mutationFn: () => hrmsApi.attendance.markDay(date, { status, employeeIds: Array.from(picked), overwrite }),
    onSuccess: r => { toast.success(r.marked === 1 ? '1 employee marked' : `${r.marked} employees marked`); onDone() },
    onError: (e: any) => toast.error(errText(e, 'The day could not be marked')),
  })

  return (
    <Modal open onClose={onClose} title="Mark a day" subtitle="For everyone you tick. Days already marked stay as they are, unless you choose to replace them.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="md-date">Day</label>
            <input id="md-date" type="date" className="input h-10" value={date} max={ahead ? undefined : today}
              onChange={e => { setDate(e.target.value); const d = Number(e.target.value.slice(8, 10)); setPicked(new Set(rows.filter(r => !e.target.value.startsWith(month) || r.days[d - 1] === '').map(r => r.employeeId))) }} /></div>
          <div><label className="label" htmlFor="md-status">Mark as</label>
            <select id="md-status" className="input h-10" value={status} onChange={e => setStatus(e.target.value as AttendanceStatus)}>
              {CHOICES.map(c => <option key={c.status} value={c.status}>{CODES[c.code].label}</option>)}
            </select></div>
        </div>
        <div className="rounded-xl max-h-64 overflow-y-auto" style={{ border: '1px solid var(--border)' }}>
          <label className="flex items-center gap-2 px-3 py-2 text-sm font-semibold" style={{ background: 'var(--bg-hover)' }}>
            <input type="checkbox" checked={picked.size === eligible.length && eligible.length > 0}
              onChange={e => setPicked(new Set(e.target.checked ? eligible.map(r => r.employeeId) : []))} />
            Everyone ({eligible.length})
          </label>
          {eligible.map(r => {
            const now = sameMonth ? r.days[day - 1] : ''
            return (
              <label key={r.employeeId} className="flex items-center gap-2 px-3 py-1.5 text-sm" style={{ borderTop: '1px solid var(--border)' }}>
                <input type="checkbox" checked={picked.has(r.employeeId)} onChange={e => setPicked(p => { const n = new Set(p); e.target.checked ? n.add(r.employeeId) : n.delete(r.employeeId); return n })} />
                <span className="flex-1">{r.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{now && now !== 'X' ? CODES[now].label : 'not marked'}</span>
              </label>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />Replace marks already made for this day
        </label>
        {future && !ahead && <p className="text-xs" style={{ color: '#b45309' }}>That day hasn't come yet — only leave, holidays and weekly offs can be marked ahead.</p>}
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={run.isPending || picked.size === 0 || (future && !ahead)} onClick={() => run.mutate()}>
            {run.isPending ? 'Marking…' : `Mark ${picked.size} as ${CODES[CHOICES.find(c => c.status === status)!.code].label.toLowerCase()}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
