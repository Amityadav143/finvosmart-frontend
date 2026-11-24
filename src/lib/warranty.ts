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
 * The last day of a warranty of `months` from `from` (YYYY-MM-DD), as the server works it out: the same day so many
 * months on, less a day (12 months from 15 Jan run to 14 Jan) — or, when that month is shorter than the day it began on,
 * its last day (a month from 31 Jan runs to 28 Feb). Null without a date, or with no warranty (0 months).
 */
export function warrantyUntil(from?: string | null, months?: number | null): string | null {
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || months == null || !(months > 0)) return null
  const [y, m, d] = from.split('-').map(Number)
  const target = new Date(Date.UTC(y, m - 1 + months, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  const end = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, last)))
  if (last >= d) end.setUTCDate(end.getUTCDate() - 1)
  return end.toISOString().slice(0, 10)
}
