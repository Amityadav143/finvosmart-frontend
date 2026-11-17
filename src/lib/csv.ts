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

// On its own (no dependencies), so plain-TS checks can load it too.

/**
 * A CSV cell: quoted when it must be, and never a spreadsheet formula — text starting =, +, -, @, a tab or CR gets a
 * leading ' (a phone number such as +919876543210 then stays as typed, too). Numbers, and amounts written as text
 * ("-1250.00"), are written as they are.
 */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && !/^-\d+(\.\d+)?$/.test(s)) s = "'" + s
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
