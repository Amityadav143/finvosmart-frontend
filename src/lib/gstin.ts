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
 * GSTIN (GST Identification Number) structure checks — offline, nothing leaves the browser.
 * Checks the length, state code, embedded PAN, registration character and check digit.
 * It can NOT tell whether a GSTIN is registered or active, or whose it is: that needs
 * the GST portal (Search Taxpayer).
 */
export const GST_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand',
  '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
  '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya',
  '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '25': 'Daman and Diu (merged into code 26 in 2020)', '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra', '28': 'Andhra Pradesh (code used before 2014)', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh', '97': 'Other Territory', '99': 'Centre Jurisdiction',
}

/** 4th character of a PAN: the type of holder. */
const PAN_HOLDER: Record<string, string> = {
  C: 'Company', P: 'Individual or proprietor', H: 'Hindu Undivided Family (HUF)', F: 'Firm or LLP',
  A: 'Association of Persons (AOP)', T: 'Trust', B: 'Body of Individuals (BOI)', L: 'Local authority',
  J: 'Artificial juridical person', G: 'Government body',
}

const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** The 15th character that the first 14 characters produce (GSTN's mod-36 check digit). */
export function gstinCheckChar(first14: string): string {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const v = CHARS.indexOf(first14[i] ?? '')
    if (v < 0) return ''
    const p = v * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(p / 36) + (p % 36)
  }
  return CHARS[(36 - (sum % 36)) % 36]
}

export interface GstinCheck {
  gstin: string              // normalised: upper-case, spaces and dashes removed
  valid: boolean
  problems: string[]
  stateCode?: string
  stateName?: string
  pan?: string
  panHolder?: string
  registrationChar?: string  // 13th character: which registration of this PAN in the state
  checkDigitOk?: boolean
}

export function checkGstin(input: string): GstinCheck {
  const gstin = (input || '').toUpperCase().replace(/[\s-]/g, '')
  const problems: string[] = []
  const out: GstinCheck = { gstin, valid: false, problems }
  if (!gstin) { problems.push('Enter a GSTIN to check'); return out }
  if (/[^0-9A-Z]/.test(gstin)) problems.push('A GSTIN contains only letters and digits')
  if (gstin.length !== 15) problems.push(`A GSTIN has 15 characters — this one has ${gstin.length}`)
  if (problems.length) return out

  out.stateCode = gstin.slice(0, 2)
  out.stateName = GST_STATES[out.stateCode]
  if (!out.stateName) problems.push(`${out.stateCode} is not a GST state code`)

  out.pan = gstin.slice(2, 12)
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(out.pan)) out.panHolder = PAN_HOLDER[out.pan[3]] ?? 'Other'
  else problems.push('Characters 3 to 12 should be a PAN: 5 letters, 4 digits, then a letter')

  out.registrationChar = gstin[12]
  if (!/^[1-9A-Z]$/.test(out.registrationChar)) problems.push('The 13th character can’t be 0')
  if (gstin[13] !== 'Z')
    problems.push('The 14th character is “Z” for regular taxpayers — this may be a special registration (such as TDS/TCS or a UIN)')

  out.checkDigitOk = gstinCheckChar(gstin.slice(0, 14)) === gstin[14]
  if (!out.checkDigitOk) problems.push('The check digit doesn’t match — a character is probably mistyped')

  out.valid = problems.length === 0
  return out
}
