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
import type { WarrantyClaim } from '@/types/warranty'

const signs = (...who: string[]) => `<div class="sign">${who.map(w => `<div>${esc(w)}</div>`).join('')}</div>`
const box = (label: string, value?: string | null, sub?: string | null) =>
  `<div class="box"><div class="muted">${esc(label)}</div><b>${esc(value || '—')}</b>${sub ? `<div class="muted">${esc(sub)}</div>` : ''}</div>`
const goods = (c: WarrantyClaim, value: boolean, serial?: string | null, item?: string | null) => `
  <table><thead><tr><th>Item</th><th>HSN</th><th>Serial no.</th><th>Batch</th><th class="r">Quantity</th>${value ? '<th class="r">Value (₹)</th>' : ''}</tr></thead>
  <tbody><tr><td>${esc(item || c.description)}${c.itemCode && !item ? `<div class="muted">${esc(c.itemCode)}</div>` : ''}</td><td>${esc(c.hsn ?? '')}</td>
  <td>${esc(serial ?? '')}</td><td>${esc(c.batchNo ?? '')}</td><td class="r">${num(c.quantity)} ${esc(c.unit ?? '')}</td>
  ${value ? `<td class="r">${c.claimedValue != null ? rs(c.claimedValue) : ''}</td>` : ''}</tr></tbody></table>`

/** What the customer gets when they hand in faulty goods: the claim, what was received, where it stands against the warranty. */
export function acknowledgementHtml(c: WarrantyClaim, s: Seller | null): string {
  return PAGE(`Warranty claim ${c.number}`) + head(s, 'Warranty claim — acknowledgement', c.number, c.claimDate) + `
  <div class="boxes">${box('Customer', c.partyName, [c.contactPhone, c.partyAddress].filter(Boolean).join(' · ') || null)}
  ${box('Bought on', c.invoiceNumber || c.sourceDoc, c.sourceDate ? day(c.sourceDate) : null)}
  ${box('Warranty', c.warrantyUntil ? `Till ${day(c.warrantyUntil)}` : c.warrantyMonths === 0 ? 'None given' : 'Not known', c.inWarranty === true ? 'The claim is within it' : c.inWarranty === false ? 'The claim is outside it' : null)}</div>
  ${goods(c, false, c.serialNo)}
  <p><span class="muted">Fault reported:</span> ${esc(c.complaint)}</p>
  ${c.unitReceivedOn ? `<p><span class="muted">Received on</span> ${esc(day(c.unitReceivedOn))}${c.receivedWith ? ` <span class="muted">with</span> ${esc(c.receivedWith)}` : ''}</p>`
    : '<p class="muted">The goods are still with the customer.</p>'}
  <p class="muted">Keep this note: bring it when you collect the goods or ask about the claim. The claim is checked against the warranty and
  you are told whether the goods are repaired, replaced or credited.</p>
  ${signs('Received by', 'Customer')}</body></html>`
}

/** The challan that travels with faulty goods sent back to the supplier under warranty — not a sale. */
export function supplierChallanHtml(c: WarrantyClaim, s: Seller | null): string {
  const value = c.values && c.claimedValue != null
  return PAGE(`Challan ${c.number}`) + head(s, 'Delivery challan — goods sent for warranty', c.number, c.sentOn || c.claimDate) + `
  <div class="boxes">${box('To', c.partyName, [c.partyGstin && `GSTIN ${c.partyGstin}`, c.partyAddress].filter(Boolean).join(' · ') || null)}
  ${box('Bought on', c.grnNumber || c.billNumber || c.sourceDoc, c.sourceDate ? day(c.sourceDate) : null)}
  ${box('Vehicle', c.vehicleNo, [c.transporter, c.lrNumber && 'LR ' + c.lrNumber].filter(Boolean).join(' · ') || null)}</div>
  <p class="muted">Faulty goods sent back for replacement, repair or credit under your warranty — not a sale.
  ${c.ewayBillNo ? `E-way bill ${esc(c.ewayBillNo)}.` : Number(c.claimedValue ?? 0) > 50000 ? 'Worth more than ₹50,000: check whether an e-way bill is needed before they move.' : ''}</p>
  ${goods(c, value, c.serialNo)}
  <p><span class="muted">Fault:</span> ${esc(c.complaint)}</p>
  ${c.warrantyUntil ? `<p><span class="muted">Your warranty:</span> till ${esc(day(c.warrantyUntil))}${c.warrantyFrom ? ` (from ${esc(day(c.warrantyFrom))})` : ''}</p>` : ''}
  ${c.parent ? `<p class="muted">Our customer's claim: ${esc(c.parent.number)}</p>` : ''}
  ${signs('Sent by', 'Driver', "Supplier's acknowledgement")}</body></html>`
}

/** The challan for a replacement given to the customer under warranty — no charge. */
export function replacementHtml(c: WarrantyClaim, s: Seller | null): string {
  return PAGE(`Replacement ${c.number}`) + head(s, 'Delivery challan — replacement under warranty', c.number, c.resolvedOn || c.claimDate) + `
  <div class="boxes">${box('To', c.partyName, [c.contactPhone, c.partyAddress].filter(Boolean).join(' · ') || null)}
  ${box('Claim', c.number, c.invoiceNumber ? `Against invoice ${c.invoiceNumber}` : null)}
  ${box('Faulty goods', c.description, c.serialNo ? `Serial ${c.serialNo}` : null)}</div>
  <p class="muted">Given in place of the faulty goods under warranty, without charge.</p>
  ${goods(c, false, c.replacementSerial, c.replacementItem)}
  ${c.resolutionNote ? `<p><span class="muted">Note:</span> ${esc(c.resolutionNote)}</p>` : ''}
  ${signs('Given by', 'Customer')}</body></html>`
}
