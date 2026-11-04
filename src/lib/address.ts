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

import type { Customer } from '@/types'

/**
 * An address in its parts, as the server keeps it (com.finvosmart.common.text.PostalAddress): two street lines,
 * city, state, PIN code and country. An address with no country is in India.
 */
export interface AddressParts {
  line1?: string | null; line2?: string | null; city?: string | null; state?: string | null
  pincode?: string | null; country?: string | null
}
/** Where the goods go when not to the billing address: who receives them, the address and their GSTIN. */
export interface ShipToParts extends AddressParts { name?: string | null; gstin?: string | null }

export const EMPTY_ADDRESS: AddressParts = { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' }
export const EMPTY_SHIP_TO: ShipToParts = { ...EMPTY_ADDRESS, name: '', gstin: '' }

const t = (s?: string | null) => (s ?? '').trim().replace(/\s+/g, ' ')

/** No street, city or PIN code: a state or a country alone is not an address. */
export function addressEmpty(a?: AddressParts | null): boolean {
  return !a || (!t(a.line1) && !t(a.line2) && !t(a.city) && !t(a.pincode))
}

export function inIndia(a?: AddressParts | null): boolean {
  const c = t(a?.country).toLowerCase().replace(/\./g, '')
  return !c || ['india', 'in', 'ind', 'bharat'].includes(c)
}

/** The printed lines: line 1, line 2, "City, State 411001", and the country outside India (as the server prints them). */
export function addressLines(a?: AddressParts | null, withState = true): string[] {
  if (!a) return []
  const out: string[] = []
  if (t(a.line1)) out.push(t(a.line1))
  if (t(a.line2)) out.push(t(a.line2))
  let cl = t(a.city)
  if (withState && t(a.state)) cl += (cl ? ', ' : '') + t(a.state)
  if (t(a.pincode).replace(/ /g, '')) cl += (cl ? ' ' : '') + t(a.pincode).replace(/ /g, '')
  if (cl) out.push(cl)
  if (t(a.country) && !inIndia(a)) out.push(t(a.country))
  return out
}

/** The same place, once case, spaces and punctuation are set aside. */
export function sameAddress(a?: AddressParts | null, b?: AddressParts | null): boolean {
  const key = (x?: AddressParts | null) => !x ? '' : [`${t(x.line1)} ${t(x.line2)}`, t(x.city), t(x.state), t(x.pincode), inIndia(x) ? 'India' : t(x.country)]
    .join('|').toLowerCase().replace(/[\s,.;:#/\\-]+/g, '')
  return key(a) === key(b)
}

/** An address kept as one text: its first line is line 1, the others (joined with commas) line 2. */
export function fromText(text?: string | null): AddressParts {
  const lines = (text ?? '').replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
  if (!lines.length) return { ...EMPTY_ADDRESS }
  return { ...EMPTY_ADDRESS, line1: lines[0], line2: lines.slice(1).join(', ') }
}

/**
 * What is wrong with an address, in words, or null (the server checks the same: PostalAddress.problem).
 * which: "billing" or "shipping".
 */
export function addressProblem(a: AddressParts | null | undefined, which: string): string | null {
  if (addressEmpty(a)) return null
  const pin = t(a!.pincode).replace(/ /g, '')
  if (pin && inIndia(a) && !/^[1-9][0-9]{5}$/.test(pin)) return `The ${which} PIN code has 6 digits and doesn't start with 0, like 411001.`
  if (pin && !inIndia(a) && !/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(pin)) return `The ${which} postal code can have up to 10 letters and digits.`
  if (t(a!.line1).length > 500 || t(a!.line2).length > 500) return `A line of the ${which} address is too long (500 characters at most).`
  return null
}

/** A customer's billing address in parts; one saved as a single text is read from it (as the server does). */
export function customerBilling(c?: Partial<Customer> | null): AddressParts {
  if (!c) return { ...EMPTY_ADDRESS }
  const parts: AddressParts = { line1: c.billingLine1 ?? '', line2: c.billingLine2 ?? '', city: c.city ?? '', state: c.state ?? '',
    pincode: c.billingPincode ?? '', country: c.billingCountry || 'India' }
  if (!t(parts.line1) && !t(parts.line2) && t(c.billingAddress)) {
    const legacy = fromText(c.billingAddress)
    return { ...parts, line1: legacy.line1, line2: legacy.line2 }
  }
  return parts
}

/** Whether a customer's goods go to the billing address (a different saved shipping address means no). */
export function customerShipsToBilling(c?: Partial<Customer> | null): boolean {
  if (!c) return true
  if (c.shipSameAsBilling === false) return addressEmpty(customerShipping(c))
  if (c.shipSameAsBilling === true) return true
  return !t(c.shippingAddress)
}

/** A customer's own shipping address in parts (empty when the goods go to the billing address). */
export function customerShipping(c?: Partial<Customer> | null): ShipToParts {
  if (!c) return { ...EMPTY_SHIP_TO }
  const parts: ShipToParts = { name: c.shippingName ?? '', line1: c.shippingLine1 ?? '', line2: c.shippingLine2 ?? '', city: c.shippingCity ?? '',
    state: c.shippingState ?? '', pincode: c.shippingPincode ?? '', country: c.shippingCountry || 'India', gstin: c.shippingGstin ?? '' }
  if (!t(parts.line1) && !t(parts.line2) && t(c.shippingAddress)) {
    const legacy = fromText(c.shippingAddress)
    return { ...parts, line1: legacy.line1, line2: legacy.line2 }
  }
  return parts
}

/** The parts as the server takes them: trimmed, blanks left out. */
export function addressBody<T extends AddressParts>(a: T): T {
  const out: any = {}
  for (const [k, v] of Object.entries(a)) {
    const s = typeof v === 'string' ? (k === 'pincode' ? v.replace(/\s/g, '') : v.trim()) : v
    if (s !== '' && s != null) out[k] = k === 'gstin' && typeof s === 'string' ? s.toUpperCase() : s
  }
  return out as T
}
