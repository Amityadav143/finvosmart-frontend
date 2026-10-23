'use client'
/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import {
  ALL_STATES, AREA_LABEL, daysBetween, deadlinesBetween, forBusiness, formatDate, qrmpDay, todayInIndia, toIcs,
  type Filing,
} from '@/lib/dueDates'

const card: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '26px' }
const chip = (on: boolean): React.CSSProperties => ({
  padding: '8px 14px', borderRadius: '999px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'var(--gold-muted)' : 'var(--bg-surface)',
  color: on ? 'var(--gold)' : 'var(--text-secondary)',
})
const label: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }

const FILINGS: { id: Filing; text: string }[] = [
  { id: 'monthly', text: 'Monthly' }, { id: 'qrmp', text: 'Quarterly (QRMP)' }, { id: 'composition', text: 'Composition' }, { id: 'none', text: 'Not GST-registered' },
]

/**
 * "Your next deadlines": pick how the business files GST (and its state, for the quarterly
 * GSTR-3B date) and what else applies, and see what is due next — or download the next twelve
 * months as a calendar file. Works entirely in the browser; nothing is sent anywhere.
 */
export function DueDatePlanner() {
  const [filing, setFiling] = useState<Filing>('monthly')
  const [state, setState] = useState('')
  const [tds, setTds] = useState(true)
  const [payroll, setPayroll] = useState(true)
  const [advanceTax, setAdvanceTax] = useState(true)
  // "Today" is only known in the browser; until then nothing is listed (the page's tables cover it).
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => { setToday(todayInIndia()) }, [])

  const day = qrmpDay(state)
  const upcoming = useMemo(() => {
    if (!today) return []
    const [y, m, d] = today.split('-').map(Number)
    const yearAhead = new Date(Date.UTC(y + 1, m - 1, d)).toISOString().slice(0, 10)
    return forBusiness(deadlinesBetween(today, yearAhead, day), { filing, tds, payroll, advanceTax })
  }, [today, day, filing, tds, payroll, advanceTax])

  const download = () => {
    const ics = toIcs(upcoming, 'Tax and compliance due dates', new Date().toISOString())
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'finvosmart-due-dates.ics'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section style={{ padding: '8px 0 40px' }} aria-labelledby="planner-heading">
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
        <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '22px', alignItems: 'start' }}>
          <div style={card}>
            <h2 id="planner-heading" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '18px' }}>Your next deadlines</h2>
            <span style={label} id="filing-label">How do you file GST?</span>
            <div role="group" aria-labelledby="filing-label" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
              {FILINGS.map(f => (
                <button key={f.id} type="button" aria-pressed={filing === f.id} onClick={() => setFiling(f.id)} style={chip(filing === f.id)}>{f.text}</button>
              ))}
            </div>
            {filing === 'qrmp' && (
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="qrmp-state" style={label}>State of registration</label>
                <select id="qrmp-state" value={state} onChange={e => setState(e.target.value)} className="input" style={{ width: '100%', height: '42px' }}>
                  <option value="">Choose your state (sets the GSTR-3B date)</option>
                  {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {day && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>Quarterly GSTR-3B is due by the {day === 22 ? '22nd' : '24th'} of the month after the quarter.</p>}
              </div>
            )}
            <fieldset style={{ border: 0 }}>
              <legend style={label}>Also show</legend>
              {([['TDS deposits and returns', tds, setTds], ['PF and ESI', payroll, setPayroll], ['Advance income tax', advanceTax, setAdvanceTax]] as const).map(([text, on, set]) => (
                <label key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--gold)' }} />
                  {text}
                </label>
              ))}
            </fieldset>
          </div>

          <div style={card}>
            <div aria-live="polite">
              {!today ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Working out today&apos;s date…</p>
              ) : upcoming.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nothing to show — choose how you file GST, or tick something above.</p>
              ) : (
                <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {upcoming.slice(0, 7).map(d => {
                    const left = daysBetween(today, d.date)
                    const tone = left <= 3 ? '#DC2626' : left <= 10 ? 'var(--gold)' : 'var(--text-secondary)'
                    return (
                      <li key={d.date + d.title} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: '0 0 128px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatDate(d.date, true)}</div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: tone }}>{left === 0 ? 'Today' : left === 1 ? 'Tomorrow' : `In ${left} days`}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{AREA_LABEL[d.area]}</div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
            <button type="button" onClick={download} disabled={!today || upcoming.length === 0} className="btn-primary"
              style={{ marginTop: '16px', height: '42px', padding: '0 18px', fontSize: '14px' }}>
              <CalendarPlus size={16} aria-hidden /> Download the next 12 months (.ics)
            </button>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6 }}>
              Opens in Google Calendar, Outlook or Apple Calendar, with a reminder two days before each date. Nothing you choose here leaves your browser.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
