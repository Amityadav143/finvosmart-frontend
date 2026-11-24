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

import type { GodownKind, OrderStatus, PayMode, Receipt, ShiftReport } from '@/types/store'

/** The store module's words and the receipt a counter prints. */

export const PAY_LABEL: Record<PayMode, string> = { CASH: 'Cash', UPI: 'UPI', CARD: 'Card', CREDIT: 'On account' }

export const KIND_LABEL: Record<GodownKind, string> = {
  WAREHOUSE: 'Warehouse', SHOP: 'Shop', FACTORY: 'Factory', SITE: 'Site', OTHER: 'Other',
}

export const ORDER_TONE: Record<OrderStatus, { color: string; bg: string }> = {
  NEW:              { color: '#b45309', bg: 'rgba(245,158,11,0.14)' },
  CONFIRMED:        { color: '#1d4ed8', bg: 'rgba(37,99,235,0.12)' },
  READY:            { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  OUT_FOR_DELIVERY: { color: '#0e7490', bg: 'rgba(14,116,144,0.12)' },
  COMPLETED:        { color: '#15803d', bg: 'rgba(22,163,74,0.12)' },
  CANCELLED:        { color: '#b91c1c', bg: 'rgba(220,38,38,0.10)' },
}

export const STEP_LABEL: Record<string, string> = {
  confirm: 'Confirm', ready: 'Mark ready', dispatch: 'Out for delivery', complete: 'Complete', cancel: 'Cancel order',
}

/** A fresh reference for a bill, so the same bill sent twice (a second tap, a retry) is made once. */
export function clientRef(): string {
  try { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID() } catch { /* older browser */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/** A WhatsApp link to an Indian mobile number with a message (null without a 10-digit mobile). */
export function whatsapp(phone: string | null | undefined, text: string): string | null {
  let d = (phone ?? '').replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  if (d.length !== 10 || d[0] < '6') return null
  return `https://wa.me/91${d}?text=${encodeURIComponent(text)}`
}

/** A WhatsApp link without a number: the customer chooses who to send it to. */
export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const rs = (n: number | null | undefined) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0))
const num = (n: number | null | undefined) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(n ?? 0))
const when = (iso: string) => new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const PAGE = (width: 58 | 80) => `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>
  @page { size: ${width}mm auto; margin: 0 }
  * { box-sizing: border-box }
  body { margin: 0; padding: 2mm 2.5mm; width: ${width}mm; font: ${width === 58 ? 10 : 11}px/1.35 "Courier New", ui-monospace, monospace; color: #000 }
  h1 { font-size: ${width === 58 ? 13 : 15}px; margin: 0 0 1mm; text-align: center } .c { text-align: center } .r { text-align: right }
  .muted { font-size: 0.9em } hr { border: 0; border-top: 1px dashed #000; margin: 1.5mm 0 }
  table { width: 100%; border-collapse: collapse } td { vertical-align: top; padding: 0.3mm 0 } .big { font-size: 1.25em; font-weight: bold }
  .qr { display: flex; justify-content: center; margin: 2mm 0 } .qr svg { width: ${width === 58 ? 26 : 30}mm; height: auto }
</style></head><body>`

/** A counter bill's (or return's) receipt as a page for a 58 or 80 mm receipt printer: every GST detail a tax invoice needs. */
export function receiptHtml(r: Receipt): string {
  const credit = r.kind === 'RETURN'
  const inter = Number(r.igst) > 0
  const lines = r.lines.map(l => `<tr><td colspan="2">${esc(l.name)}${l.batchNo ? ` <span class="muted">(${esc(l.batchNo)})</span>` : ''}${l.hsn ? `<br><span class="muted">HSN ${esc(l.hsn)} · GST ${num(l.gstRate)}%</span>` : `<br><span class="muted">GST ${num(l.gstRate)}%</span>`}</td></tr>
    <tr><td class="muted">${num(l.quantity)} ${esc(l.unit ?? '')} × ${rs(l.rate)}${l.discountPct && Number(l.discountPct) > 0 ? ` −${num(l.discountPct)}%` : ''}</td><td class="r">${rs(l.amount)}</td></tr>`).join('')
  const taxes = r.taxes.map(t => `<tr><td>${num(t.rate)}%</td><td class="r">${rs(t.taxable)}</td>${inter ? `<td class="r">${rs(t.igst)}</td>` : `<td class="r">${rs(t.cgst)}</td><td class="r">${rs(t.sgst)}</td>`}</tr>`).join('')
  const pays = r.payments.map(p => `<tr><td>${credit ? 'Refund — ' : ''}${esc(PAY_LABEL[p.mode] ?? p.mode)}${p.reference ? ` <span class="muted">${esc(p.reference)}</span>` : ''}</td><td class="r">${rs(p.amount)}</td></tr>`).join('')
  return PAGE(r.width) + `
  <h1>${esc(r.seller.name)}</h1>
  <div class="c muted">${esc(r.seller.legalName && r.seller.legalName !== r.seller.name ? r.seller.legalName : '')}</div>
  <div class="c muted">${esc(r.seller.address ?? '')}</div>
  <div class="c muted">${r.seller.phone ? 'Ph ' + esc(r.seller.phone) : ''}</div>
  ${r.seller.gstin ? `<div class="c">GSTIN ${esc(r.seller.gstin)}</div>` : ''}
  <hr><div class="c big">${credit ? 'CREDIT NOTE' : 'TAX INVOICE'}</div>
  <table><tr><td>${esc(r.number)}</td><td class="r">${esc(when(r.at))}</td></tr>
  ${credit && r.originalNumber ? `<tr><td colspan="2">Against bill ${esc(r.originalNumber)}</td></tr>` : ''}
  <tr><td colspan="2" class="muted">${esc(r.register)}${r.cashier ? ' · ' + esc(r.cashier) : ''}</td></tr>
  <tr><td colspan="2">To: ${esc(r.customer)}${r.customerPhone ? ' · ' + esc(r.customerPhone) : ''}</td></tr>
  ${r.customerGstin ? `<tr><td colspan="2">GSTIN ${esc(r.customerGstin)}</td></tr>` : ''}
  ${inter && r.placeOfSupply ? `<tr><td colspan="2">Place of supply: ${esc(r.placeOfSupply)}</td></tr>` : ''}</table>
  <hr><table>${lines}</table><hr>
  <table>
    ${Number(r.discount) > 0 ? `<tr><td>Discount</td><td class="r">−${rs(r.discount)}</td></tr>` : ''}
    <tr><td>Taxable value</td><td class="r">${rs(r.taxable)}</td></tr>
    ${inter ? `<tr><td>IGST</td><td class="r">${rs(r.igst)}</td></tr>` : `<tr><td>CGST</td><td class="r">${rs(r.cgst)}</td></tr><tr><td>SGST</td><td class="r">${rs(r.sgst)}</td></tr>`}
    ${Number(r.roundOff) !== 0 ? `<tr><td>Round off</td><td class="r">${rs(r.roundOff)}</td></tr>` : ''}
    <tr><td class="big">${credit ? 'Refund' : 'Total'}</td><td class="r big">₹${rs(r.total)}</td></tr>
  </table>
  <hr><table class="muted"><tr><td>GST</td><td class="r">Taxable</td>${inter ? '<td class="r">IGST</td>' : '<td class="r">CGST</td><td class="r">SGST</td>'}</tr>${taxes}</table>
  <hr><table>${pays}
    ${!credit && Number(r.change) > 0 ? `<tr><td>Cash given</td><td class="r">${rs(r.cashGiven)}</td></tr><tr><td>Change</td><td class="r">${rs(r.change)}</td></tr>` : ''}
    ${!credit && Number(r.onAccount) > 0 ? `<tr><td colspan="2" class="muted">₹${rs(r.onAccount)} is left on your account.</td></tr>` : ''}
  </table>
  ${r.qrSvg ? `<div class="qr">${r.qrSvg}</div><div class="c muted">Scan for this bill online</div>` : ''}
  ${r.footer ? `<hr><div class="c">${esc(r.footer)}</div>` : '<hr><div class="c">Thank you!</div>'}
  </body></html>`
}

/** A shift's day-end report (Z report) for the receipt printer. */
export function shiftReportHtml(rep: ShiftReport, company: string, width: 58 | 80 = 80): string {
  const s = rep.session
  const modes = rep.byMode.filter(m => Number(m.in) > 0 || Number(m.out) > 0)
    .map(m => `<tr><td>${esc(PAY_LABEL[m.mode] ?? m.mode)}</td><td class="r">${rs(m.in)}</td><td class="r">${Number(m.out) > 0 ? '−' + rs(m.out) : ''}</td></tr>`).join('')
  const moves = rep.cashMoves.map(m => `<tr><td>${m.direction === 'IN' ? 'In' : 'Out'}: ${esc(m.reason)}</td><td class="r">${m.direction === 'IN' ? '' : '−'}${rs(m.amount)}</td></tr>`).join('')
  return PAGE(width) + `
  <h1>${esc(company)}</h1><div class="c big">${s.status === 'CLOSED' ? 'SHIFT CLOSED' : 'SHIFT SO FAR'}</div>
  <table><tr><td colspan="2">${esc(s.register)}</td></tr>
  <tr><td>Opened</td><td class="r">${esc(when(s.openedAt))}</td></tr><tr><td colspan="2" class="muted">by ${esc(s.openedBy ?? '')}</td></tr>
  ${s.closedAt ? `<tr><td>Closed</td><td class="r">${esc(when(s.closedAt))}</td></tr><tr><td colspan="2" class="muted">by ${esc(s.closedBy ?? '')}</td></tr>` : ''}</table>
  <hr><table><tr><td>Bills</td><td class="r">${rep.bills}</td></tr><tr><td>Sales</td><td class="r">${rs(rep.sales)}</td></tr>
  <tr><td>Returns (${rep.returns})</td><td class="r">−${rs(rep.returnsTotal)}</td></tr><tr><td class="big">Net</td><td class="r big">${rs(rep.net)}</td></tr>
  <tr><td>GST in it</td><td class="r">${rs(rep.tax)}</td></tr></table>
  <hr><table><tr><td>By</td><td class="r">In</td><td class="r">Out</td></tr>${modes}</table>
  ${moves ? `<hr><table>${moves}</table>` : ''}
  <hr><table><tr><td>Opening cash</td><td class="r">${rs(s.openingCash)}</td></tr><tr><td>Cash expected</td><td class="r">${rs(rep.expectedCash)}</td></tr>
  ${s.countedCash != null ? `<tr><td>Cash counted</td><td class="r">${rs(s.countedCash)}</td></tr><tr><td class="big">Difference</td><td class="r big">${rs(s.difference)}</td></tr>` : ''}
  ${s.closeNote ? `<tr><td colspan="2" class="muted">${esc(s.closeNote)}</td></tr>` : ''}</table>
  <hr><div class="c muted">Printed ${esc(when(new Date().toISOString()))}</div></body></html>`
}

/** Prints a page through a hidden frame (the receipt printer is the browser's printer), then removes the frame. */
export function printHtml(html: string) {
  const f = document.createElement('iframe')
  f.setAttribute('aria-hidden', 'true')
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(f)
  const doc = f.contentWindow?.document
  if (!doc) { f.remove(); return }
  doc.open(); doc.write(html); doc.close()
  const go = () => { try { f.contentWindow?.focus(); f.contentWindow?.print() } finally { setTimeout(() => f.remove(), 1500) } }
  // the QR code is inline SVG: nothing to wait for but layout
  setTimeout(go, 120)
}
