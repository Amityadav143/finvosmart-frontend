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

/**
 * Statutory due dates for Indian businesses — GST returns, TDS, PF, ESI and advance tax — as
 * the law sets them (a holiday does not move them here; the government announces any
 * extension by notification). Used by the free "GST due dates" page and its planner, so the
 * tables, the month-by-month calendar and the downloadable calendar file can't disagree.
 * The same rules drive the app's dashboard (backend: dashboard/ComplianceCalendar.java).
 *
 * Plain TypeScript with no imports: it runs on the server and in the browser alike.
 */

export type Area = 'gst-monthly' | 'gst-qrmp' | 'gst-composition' | 'gst-annual' | 'gst-other' | 'tds' | 'payroll' | 'advance-tax'

export interface Deadline {
  date: string        // YYYY-MM-DD
  area: Area
  form: string        // "GSTR-1", "PMT-06", "TDS"…
  title: string       // "GSTR-1 for October 2026"
  detail: string
}

export const AREA_LABEL: Record<Area, string> = {
  'gst-monthly': 'GST · monthly', 'gst-qrmp': 'GST · quarterly (QRMP)', 'gst-composition': 'GST · composition',
  'gst-annual': 'GST · annual', 'gst-other': 'GST · other returns', tds: 'TDS', payroll: 'PF & ESI', 'advance-tax': 'Advance tax',
}

/** QRMP filers pay GSTR-3B by the 22nd or the 24th after the quarter, depending on the state of registration. */
export const QRMP_22 = [
  'Andhra Pradesh', 'Chhattisgarh', 'Goa', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Tamil Nadu',
  'Telangana', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry',
] as const
export const QRMP_24 = [
  'Arunachal Pradesh', 'Assam', 'Bihar', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Chandigarh', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
] as const
export const ALL_STATES: string[] = [...QRMP_22, ...QRMP_24].sort((a, b) => a.localeCompare(b))

/** 22 or 24 for a state's QRMP GSTR-3B; null when the state is unknown. */
export function qrmpDay(state?: string | null): 22 | 24 | null {
  if (!state) return null
  if ((QRMP_22 as readonly string[]).includes(state)) return 22
  if ((QRMP_24 as readonly string[]).includes(state)) return 24
  return null
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MON = MONTHS.map(m => m.slice(0, 3))
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
const nextMonth = (y: number, m: number): [number, number] => (m === 12 ? [y + 1, 1] : [y, m + 1])

/** The financial year (April–March) a date falls in, by its starting year, in India's time zone. */
export function fyStartOf(at: Date): number {
  const ist = new Date(at.getTime() + 330 * 60_000)
  return ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
}
export const fyName = (start: number) => `${start}-${pad((start + 1) % 100)}`

/** Today's date in India as YYYY-MM-DD. */
export function todayInIndia(at: Date = new Date()): string {
  return new Date(at.getTime() + 330 * 60_000).toISOString().slice(0, 10)
}

/** "11 Nov 2026" / "Wed, 11 Nov 2026" from YYYY-MM-DD, without time-zone surprises. */
export function formatDate(isoDate: string, weekday = false): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const s = `${d} ${MON[m - 1]} ${y}`
  if (!weekday) return s
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${wd}, ${s}`
}
export const monthTitle = (isoDate: string) => {
  const [y, m] = isoDate.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** Whole days from one YYYY-MM-DD to another. */
export function daysBetween(from: string, to: string): number {
  const t = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) }
  return Math.round((t(to) - t(from)) / 86_400_000)
}

/**
 * Every deadline arising from the tax periods of one financial year (April `fy` to March
 * `fy + 1`), including the filings for that year due after it ends — the March TDS deposit,
 * the fourth-quarter TDS statement, GSTR-4 and GSTR-9.
 * @param qrmp3b the QRMP GSTR-3B day for the business's state; null gives both dates.
 */
export function deadlinesForFy(fy: number, qrmp3b: 22 | 24 | null = null): Deadline[] {
  const out: Deadline[] = []
  for (let i = 0; i < 12; i++) {
    const m = ((3 + i) % 12) + 1                    // April … March
    const y = m >= 4 ? fy : fy + 1
    const [ny, nm] = nextMonth(y, m)
    const period = `${MONTHS[m - 1]} ${y}`
    const quarterEnd = i % 3 === 2
    const q = Math.floor(i / 3) + 1
    const quarter = `Q${q} (${MON[(3 + (q - 1) * 3) % 12]}–${MON[(5 + (q - 1) * 3) % 12]} ${q === 4 ? fy + 1 : fy})`

    out.push({ date: iso(ny, nm, 11), area: 'gst-monthly', form: 'GSTR-1', title: `GSTR-1 for ${period}`,
      detail: 'Details of sales (outward supplies) for monthly filers.' })
    out.push({ date: iso(ny, nm, 20), area: 'gst-monthly', form: 'GSTR-3B', title: `GSTR-3B for ${period}`,
      detail: 'Summary return and payment of GST for monthly filers.' })

    if (!quarterEnd) {
      out.push({ date: iso(ny, nm, 13), area: 'gst-qrmp', form: 'IFF', title: `IFF for ${period} (optional)`,
        detail: 'QRMP filers may upload B2B invoices for the month, so their buyers get credit sooner.' })
      out.push({ date: iso(ny, nm, 25), area: 'gst-qrmp', form: 'PMT-06', title: `PMT-06 for ${period}`,
        detail: 'QRMP filers pay the month’s GST in challan PMT-06 (by the fixed-sum or self-assessment method).' })
    } else {
      out.push({ date: iso(ny, nm, 13), area: 'gst-qrmp', form: 'GSTR-1', title: `GSTR-1 for ${quarter}`,
        detail: 'Quarterly GSTR-1 for QRMP filers.' })
      const days: (22 | 24)[] = qrmp3b ? [qrmp3b] : [22, 24]
      for (const d of days) out.push({ date: iso(ny, nm, d), area: 'gst-qrmp', form: 'GSTR-3B',
        title: `GSTR-3B for ${quarter}${qrmp3b ? '' : d === 22 ? ' — 22nd-day states' : ' — 24th-day states'}`,
        detail: qrmp3b ? 'Quarterly GSTR-3B for QRMP filers.' : `Quarterly GSTR-3B for QRMP filers registered in ${d === 22 ? 'the states that file by the 22nd (Maharashtra, Karnataka, Gujarat, Tamil Nadu and others)' : 'the states that file by the 24th (Delhi, Uttar Pradesh, West Bengal, Punjab and others)'}.` })
      out.push({ date: iso(ny, nm, 18), area: 'gst-composition', form: 'CMP-08', title: `CMP-08 for ${quarter}`,
        detail: 'Composition taxpayers pay the quarter’s tax.' })
      const tdsReturn = [iso(fy, 7, 31), iso(fy, 10, 31), iso(fy + 1, 1, 31), iso(fy + 1, 5, 31)][q - 1]
      out.push({ date: tdsReturn, area: 'tds', form: '24Q / 26Q', title: `TDS statements for ${quarter}`,
        detail: 'Quarterly TDS returns: 24Q for salaries, 26Q for other payments to residents.' })
    }

    out.push({ date: iso(ny, nm, 10), area: 'gst-other', form: 'GSTR-7', title: `GSTR-7 for ${period}`,
      detail: 'GST deducted at source by government departments and other notified deductors.' })
    out.push({ date: iso(ny, nm, 10), area: 'gst-other', form: 'GSTR-8', title: `GSTR-8 for ${period}`,
      detail: 'Tax collected at source by e-commerce operators.' })
    out.push({ date: iso(ny, nm, 13), area: 'gst-other', form: 'GSTR-5', title: `GSTR-5 for ${period}`,
      detail: 'Non-resident taxable persons.' })
    out.push({ date: iso(ny, nm, 13), area: 'gst-other', form: 'GSTR-6', title: `GSTR-6 for ${period}`,
      detail: 'Input service distributors.' })

    out.push({ date: m === 3 ? iso(y, 4, 30) : iso(ny, nm, 7), area: 'tds', form: 'TDS', title: `Deposit TDS deducted in ${period}`,
      detail: m === 3 ? 'Tax deducted in March is deposited by 30 April.' : 'Tax deducted on salaries and on payments to suppliers, by the 7th.' })
    out.push({ date: iso(ny, nm, 15), area: 'payroll', form: 'PF & ESI', title: `PF and ESI for ${period} wages`,
      detail: 'File the ECR and pay PF on the EPFO portal; pay ESI on the ESIC portal.' })

    const advance = { 6: 15, 9: 45, 12: 75, 3: 100 }[m as 6 | 9 | 12 | 3]
    if (advance) out.push({ date: iso(y, m, 15), area: 'advance-tax', form: 'Advance tax',
      title: `Advance income tax: ${advance}% of the year’s tax`, detail: `By now, at least ${advance}% of the estimated income tax for FY ${fyName(fy)} should be paid.` })
  }
  out.push({ date: iso(fy + 1, 4, 30), area: 'gst-composition', form: 'GSTR-4', title: `GSTR-4 for FY ${fyName(fy)}`,
    detail: 'Annual return for composition taxpayers.' })
  out.push({ date: iso(fy + 1, 12, 31), area: 'gst-annual', form: 'GSTR-9 / 9C', title: `GSTR-9 and GSTR-9C for FY ${fyName(fy)}`,
    detail: 'Annual return; GSTR-9C (reconciliation statement) where turnover is above ₹5 crore.' })
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.form.localeCompare(b.form))
}

/** Every deadline that falls between two dates (inclusive), whichever year's tax period it is for. */
export function deadlinesBetween(from: string, to: string, qrmp3b: 22 | 24 | null = null): Deadline[] {
  const fyFrom = Number(from.slice(0, 4)) - 2, fyTo = Number(to.slice(0, 4))
  const all: Deadline[] = []
  for (let fy = fyFrom; fy <= fyTo; fy++) all.push(...deadlinesForFy(fy, qrmp3b))
  return all.filter(d => d.date >= from && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.form.localeCompare(b.form))
}

/** How a business files GST, for the planner. */
export type Filing = 'monthly' | 'qrmp' | 'composition' | 'none'

/** The deadlines that concern a business, given how it files and what else it deals with. */
export function forBusiness(list: Deadline[], o: { filing: Filing; tds: boolean; payroll: boolean; advanceTax: boolean }): Deadline[] {
  return list.filter(d => {
    switch (d.area) {
      case 'gst-monthly': return o.filing === 'monthly'
      case 'gst-qrmp': return o.filing === 'qrmp'
      case 'gst-composition': return o.filing === 'composition'
      case 'gst-annual': return o.filing === 'monthly' || o.filing === 'qrmp'
      case 'gst-other': return false
      case 'tds': return o.tds
      case 'payroll': return o.payroll
      case 'advance-tax': return o.advanceTax
    }
  })
}

/**
 * The deadlines as an iCalendar (.ics) file: all-day events, each with a reminder two days
 * before. Google Calendar, Outlook and Apple Calendar import it.
 */
export function toIcs(list: Deadline[], name: string, stampIso: string): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  const fold = (line: string) => {
    // RFC 5545: lines longer than 75 octets continue on the next line after a space.
    const bytes = new TextEncoder().encode(line)
    if (bytes.length <= 75) return line
    const parts: string[] = []
    let cur = ''
    for (const ch of line) {
      if (new TextEncoder().encode(cur + ch).length > (parts.length ? 74 : 75)) { parts.push(cur); cur = '' }
      cur += ch
    }
    parts.push(cur)
    return parts.join('\r\n ')
  }
  const day = (d: string) => d.replace(/-/g, '')
  const stamp = stampIso.replace(/[-:]/g, '').replace(/\.\d+/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Finvosmart//Compliance due dates//EN', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`, 'X-WR-TIMEZONE:Asia/Kolkata']
  for (const d of list) {
    const [y, m, dd] = d.date.split('-').map(Number)
    const end = new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10)
    const uid = `${day(d.date)}-${d.form.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}@finvosmart.com`
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${day(d.date)}`, `DTEND;VALUE=DATE:${day(end)}`,
      `SUMMARY:${esc(d.title)}`, `DESCRIPTION:${esc(`${d.detail} Due dates as set by law; check gst.gov.in and incometax.gov.in for any extension. — finvosmart.com/gst-due-dates`)}`,
      'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(d.title)}`, 'TRIGGER:-P2D', 'END:VALARM', 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
