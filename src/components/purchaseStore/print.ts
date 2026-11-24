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

import { PAGE, day, esc, head, num, rs, type Seller } from '@/components/godown/print'
import type { GateEntry, GoodsReceipt, PurchaseReturn } from '@/types/purchaseStore'

const signs = (...who: string[]) => `<div class="sign">${who.map(w => `<div>${esc(w)}</div>`).join('')}</div>`
const box = (label: string, value?: string | null, sub?: string | null) =>
  `<div class="box"><div class="muted">${esc(label)}</div><b>${esc(value || '—')}</b>${sub ? `<div class="muted">${esc(sub)}</div>` : ''}</div>`

/** The gate pass for a consignment: what came, on which vehicle, against which papers. */
export function gateHtml(e: GateEntry, s: Seller | null): string {
  const doc = e.docType === 'NONE' ? 'No document' : `${e.docType === 'CHALLAN' ? 'Delivery challan' : 'Invoice'} ${e.docNumber ?? ''}`
  return PAGE(`Gate entry ${e.number}`) + head(s, 'Gate entry — goods inward', e.number, e.date) + `
  <div class="boxes">${box('From', e.partyName, e.poNumber ? `Against ${e.poNumber}` : null)}${box('Their papers', doc, e.docDate ? day(e.docDate) : null)}
  ${box('Vehicle', e.vehicleNo, e.driverName ? `${e.driverName}${e.driverPhone ? ' · ' + e.driverPhone : ''}` : null)}</div>
  <div class="boxes">${box('Transporter', e.transporter, e.lrNumber ? `LR ${e.lrNumber}` : null)}${box('E-way bill', e.ewayBillNo)}
  ${box('Packages', e.packages != null ? String(e.packages) : null, e.weightKg != null ? `${num(e.weightKg)} kg` : null)}</div>
  <p>Arrived: <b>${esc(new Date(e.arrivedAt + (e.arrivedAt.includes('+') ? '' : '+05:30')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }))}</b>
  ${e.godown ? ` · unloaded at <b>${esc(e.godown)}</b>` : ''}</p>
  ${e.remarks ? `<p><span class="muted">Remarks:</span> ${esc(e.remarks)}</p>` : ''}
  ${e.status === 'TURNED_AWAY' ? `<p><b>TURNED AWAY</b>${e.statusNote ? ` — ${esc(e.statusNote)}` : ''}</p>` : ''}
  ${e.status === 'CANCELLED' ? `<p><b>CANCELLED</b>${e.statusNote ? ` — ${esc(e.statusNote)}` : ''}</p>` : ''}
  ${signs('Security', 'Driver', 'Stores')}</body></html>`
}

/** The goods receipt note: what was received, accepted and rejected, line by line, with the papers it came with. */
export function grnHtml(g: GoodsReceipt, s: Seller | null): string {
  const value = g.rates
  const rows = g.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.description)}${l.itemCode ? `<div class="muted">${esc(l.itemCode)}</div>` : ''}</td>
    <td>${esc(l.hsn ?? '')}</td><td>${esc(l.batchNo ?? '')}${l.expiry ? `<div class="muted">exp ${esc(day(l.expiry))}</div>` : ''}</td>
    <td class="r">${l.ordered != null ? num(l.ordered) : ''}</td><td class="r">${l.challanQty != null ? num(l.challanQty) : ''}</td>
    <td class="r">${num(l.received)}</td><td class="r"><b>${num(l.accepted)}</b></td>
    <td class="r">${Number(l.rejected) ? num(l.rejected) : ''}${l.rejectReason ? `<div class="muted">${esc(l.rejectReason)}</div>` : ''}</td>
    <td>${esc(l.unit ?? '')}</td>${value ? `<td class="r">${l.rate != null ? rs(l.rate) : ''}</td><td class="r">${l.value != null ? rs(l.value) : ''}</td>` : ''}</tr>`).join('')
  return PAGE(`GRN ${g.number}`) + head(s, 'Goods receipt note', g.number, g.receivedDate) + `
  <div class="boxes">${box('Supplier', g.vendorName, g.vendorGstin ? `GSTIN ${g.vendorGstin}` : null)}${box('Against order', g.poNumber, g.gateEntryNumber ? `Gate entry ${g.gateEntryNumber}` : null)}
  ${box('Into', g.godown)}</div>
  <div class="boxes">${box('Their invoice', g.invoiceNumber, g.invoiceDate ? day(g.invoiceDate) : null)}${box('Their challan', g.challanNumber, g.challanDate ? day(g.challanDate) : null)}
  ${box('Vehicle / LR', [g.vehicleNo, g.lrNumber && 'LR ' + g.lrNumber].filter(Boolean).join(' · ') || null, g.transporter)}</div>
  <table><thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Batch</th><th class="r">Ordered</th><th class="r">As per papers</th><th class="r">Received</th>
  <th class="r">Accepted</th><th class="r">Rejected</th><th>Unit</th>${value ? '<th class="r">Rate (₹)</th><th class="r">Value (₹)</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>
  ${value && g.acceptedValue != null ? `<p class="r">Accepted, before GST: <b>₹${rs(g.acceptedValue)}</b></p>` : ''}
  ${g.inspectedBy ? `<p><span class="muted">Inspected by</span> ${esc(g.inspectedBy)}${g.inspectionNote ? ` — ${esc(g.inspectionNote)}` : ''}</p>` : ''}
  ${g.remarks ? `<p><span class="muted">Remarks:</span> ${esc(g.remarks)}</p>` : ''}
  ${g.status === 'CANCELLED' ? `<p><b>CANCELLED</b>${g.cancelReason ? ` — ${esc(g.cancelReason)}` : ''}</p>` : g.status !== 'POSTED' ? `<p><b>${esc(g.statusLabel.toUpperCase())}</b> — not in stock yet</p>` : ''}
  ${signs('Received by', 'Inspected by', 'Store keeper')}</body></html>`
}

/** Rejected goods going back: the challan that travels with them (they were never taken into stock — not a sale). */
export function returnHtml(r: PurchaseReturn, s: Seller | null): string {
  const value = r.rates
  const rows = r.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.itemName)}${l.itemCode ? `<div class="muted">${esc(l.itemCode)}</div>` : ''}</td>
    <td>${esc(l.hsn ?? '')}</td><td>${esc(l.batchNo ?? '')}</td><td class="r">${num(l.quantity)} ${esc(l.unit ?? '')}</td><td>${esc(l.reason ?? '')}</td>
    ${value ? `<td class="r">${l.rate != null ? rs(l.rate) : ''}</td><td class="r">${l.gstRate != null ? num(l.gstRate) + '%' : ''}</td><td class="r">${l.value != null ? rs(l.value) : ''}</td>` : ''}</tr>`).join('')
  return PAGE(`Return ${r.number}`) + head(s, 'Delivery challan — goods returned to supplier', r.number, r.date) + `
  <div class="boxes">${box('To', r.vendorName, [r.vendorGstin && `GSTIN ${r.vendorGstin}`, r.vendorAddress].filter(Boolean).join(' · ') || null)}
  ${box('Received on', r.grnNumber, r.poNumber ? `Order ${r.poNumber}` : null)}${box('Vehicle', r.vehicleNo, [r.transporter, r.lrNumber && 'LR ' + r.lrNumber].filter(Boolean).join(' · ') || null)}</div>
  <p class="muted">Goods rejected on receipt, going back to the supplier. ${r.ewayBillNo ? `E-way bill ${esc(r.ewayBillNo)}.` : Number(r.total ?? 0) > 50000 ? 'Worth more than ₹50,000: check whether an e-way bill is needed before they move.' : ''}</p>
  <table><thead><tr><th>#</th><th>Item</th><th>HSN</th><th>Batch</th><th class="r">Quantity</th><th>Why</th>${value ? '<th class="r">Rate (₹)</th><th class="r">GST</th><th class="r">Value (₹)</th>' : ''}</tr></thead>
  <tbody>${rows}</tbody></table>
  ${value && r.total != null ? `<p class="r">Value with GST: <b>₹${rs(r.total)}</b></p>` : ''}
  ${r.notes ? `<p><span class="muted">Notes:</span> ${esc(r.notes)}</p>` : ''}
  ${r.status === 'CANCELLED' ? `<p><b>CANCELLED</b>${r.cancelReason ? ` — ${esc(r.cancelReason)}` : ''}</p>` : ''}
  ${signs('Sent by', 'Driver', "Supplier's acknowledgement")}</body></html>`
}
