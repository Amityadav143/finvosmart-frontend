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

import { api } from '@/lib/api/client'
import type { DocLine, MaterialIssue, Transfer } from '@/types/store'

/** The company's name, GSTIN and address for the top of a printed document (none when it can't be read). */
export interface Seller { name: string; legalName?: string | null; gstin?: string | null; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; phone?: string | null }
export async function seller(): Promise<Seller | null> {
  try { return (await api.get('/admin/company')).data?.data ?? null } catch { return null }
}

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
export const num = (n: unknown) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(n ?? 0))
export const rs = (n: unknown) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0))
export const day = (d?: string | null) => !d ? '' : new Date(d.length === 10 ? d + 'T00:00:00+05:30' : d).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })

export const PAGE = (title: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page { size: A4; margin: 14mm }
  body { font: 12px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0 }
  h1 { font-size: 18px; margin: 0 } .muted { color: #555 } .r { text-align: right }
  .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px }
  .boxes { display: flex; gap: 12px; margin: 10px 0 } .box { flex: 1; border: 1px solid #bbb; border-radius: 6px; padding: 8px 10px }
  table { width: 100%; border-collapse: collapse; margin-top: 8px } th, td { border: 1px solid #bbb; padding: 5px 7px; vertical-align: top }
  th { background: #f3f3f3; text-align: left; font-size: 11px } .sign { display: flex; justify-content: space-between; margin-top: 56px }
  .sign div { width: 30%; border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 11px }
</style></head><body>`

export function head(s: Seller | null, title: string, number: string, date: string) {
  const addr = s ? [s.address, s.city, s.state, s.pincode].filter(Boolean).join(', ') : ''
  return `<div class="top"><div><h1>${esc(s?.legalName || s?.name || '')}</h1>${addr ? `<div class="muted">${esc(addr)}</div>` : ''}
    ${s?.gstin ? `<div>GSTIN: <b>${esc(s.gstin)}</b></div>` : ''}${s?.phone ? `<div class="muted">${esc(s.phone)}</div>` : ''}</div>
    <div class="r"><h1>${esc(title)}</h1><div>No. <b>${esc(number)}</b></div><div>Date: ${esc(day(date))}</div></div></div>`
}

function rows(lines: DocLine[], value: boolean) {
  return `<table><thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Batch</th><th class="r">Quantity</th>${value ? '<th class="r">Value (₹)</th>' : ''}</tr></thead><tbody>
    ${lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.itemName)}<div class="muted">${esc(l.itemCode)}</div></td><td>${esc(l.hsn ?? '')}</td>
      <td>${esc(l.batchNo ?? '')}${l.expiry ? `<div class="muted">exp ${esc(day(l.expiry))}</div>` : ''}</td><td class="r">${num(l.quantity)} ${esc(l.unit ?? '')}</td>
      ${value ? `<td class="r">${l.value != null ? rs(l.value) : ''}</td>` : ''}</tr>`).join('')}
  </tbody></table>`
}

/** A stock transfer as a delivery challan: goods moved between the company's own godowns, not a sale. */
export function transferHtml(t: Transfer, s: Seller | null): string {
  const worth = Number(t.value ?? 0)
  return PAGE(`Transfer ${t.number}`) + head(s, 'Delivery challan — stock transfer', t.number, t.date) + `
  <div class="boxes"><div class="box"><div class="muted">From</div><b>${esc(t.fromGodown)}</b></div><div class="box"><div class="muted">To</div><b>${esc(t.toGodown)}</b></div>
  <div class="box"><div class="muted">Vehicle</div><b>${esc(t.vehicleNo ?? '—')}</b></div></div>
  <p class="muted">Goods moved between our own godowns — not a sale.${worth > 50000 ? ' The goods are worth more than ₹50,000: check whether an e-way bill is needed before they move.' : ''}</p>
  ${rows(t.lines, worth > 0)}
  ${worth > 0 ? `<p class="r">Value of the goods at cost: <b>₹${rs(worth)}</b></p>` : ''}
  ${t.notes ? `<p><span class="muted">Notes:</span> ${esc(t.notes)}</p>` : ''}
  ${t.status === 'CANCELLED' ? `<p><b>CANCELLED</b>${t.cancelReason ? ` — ${esc(t.cancelReason)}` : ''}</p>` : ''}
  <div class="sign"><div>Sent by</div><div>Driver</div><div>Received by</div></div></body></html>`
}

/** A material issue (or return) slip. */
export function issueHtml(m: MaterialIssue, s: Seller | null): string {
  const out = m.kind === 'ISSUE'
  return PAGE(`${out ? 'Issue' : 'Return'} ${m.number}`) + head(s, out ? 'Material issue slip' : 'Material return slip', m.number, m.date) + `
  <div class="boxes"><div class="box"><div class="muted">${out ? 'From' : 'Back into'}</div><b>${esc(m.godown)}</b></div>
  <div class="box"><div class="muted">${out ? 'Issued to' : 'Returned by'}</div><b>${esc(m.issuedTo || m.department || '—')}</b>${m.department && m.issuedTo ? `<div class="muted">${esc(m.department)}</div>` : ''}</div>
  <div class="box"><div class="muted">Against request</div><b>${esc(m.requestNumber ?? '—')}</b></div></div>
  ${m.purpose ? `<p><span class="muted">For:</span> ${esc(m.purpose)}</p>` : ''}
  ${rows(m.lines, Number(m.value ?? 0) > 0)}
  ${m.status === 'CANCELLED' ? `<p><b>CANCELLED</b>${m.cancelReason ? ` — ${esc(m.cancelReason)}` : ''}</p>` : ''}
  <div class="sign"><div>${out ? 'Issued by' : 'Received by'}</div><div>Approved by</div><div>${out ? 'Received by' : 'Returned by'}</div></div></body></html>`
}
