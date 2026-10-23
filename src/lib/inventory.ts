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
import type { InventoryItem, MovementType } from '@/types'

/** GST unit codes (UQC) used on invoices and in GSTR-1's HSN summary. */
export const UNITS: { value: string; label: string }[] = [
  { value: 'NOS', label: 'NOS — numbers' }, { value: 'PCS', label: 'PCS — pieces' }, { value: 'KGS', label: 'KGS — kilograms' },
  { value: 'GMS', label: 'GMS — grams' }, { value: 'MTS', label: 'MTS — tonnes' }, { value: 'QTL', label: 'QTL — quintals' },
  { value: 'LTR', label: 'LTR — litres' }, { value: 'MLT', label: 'MLT — millilitres' }, { value: 'MTR', label: 'MTR — metres' },
  { value: 'CMS', label: 'CMS — centimetres' }, { value: 'SQF', label: 'SQF — square feet' }, { value: 'SQM', label: 'SQM — square metres' },
  { value: 'BOX', label: 'BOX — boxes' }, { value: 'PAC', label: 'PAC — packs' }, { value: 'SET', label: 'SET — sets' },
  { value: 'PRS', label: 'PRS — pairs' }, { value: 'DOZ', label: 'DOZ — dozens' }, { value: 'BAG', label: 'BAG — bags' },
  { value: 'BTL', label: 'BTL — bottles' }, { value: 'CAN', label: 'CAN — cans' }, { value: 'CTN', label: 'CTN — cartons' },
  { value: 'ROL', label: 'ROL — rolls' }, { value: 'BDL', label: 'BDL — bundles' }, { value: 'TBS', label: 'TBS — tablets' },
  { value: 'HRS', label: 'HRS — hours (services)' }, { value: 'OTH', label: 'OTH — others' },
]

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  IN: 'Stock in', OUT: 'Stock out', ADJUSTMENT: 'Adjustment', OPENING: 'Opening stock', TRANSFER_IN: 'Transfer in', TRANSFER_OUT: 'Transfer out',
}

/** "12.5" → "12.5", 3 → "3" — quantities without trailing zeros, Indian grouping. */
export const qty = (x: unknown) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(x ?? 0))

/**
 * How much to order of an item at or below its reorder level: enough to bring it to twice the
 * reorder level, and at least its minimum order quantity — in whole units, never less than one.
 */
export function reorderQty(it: Pick<InventoryItem, 'currentStock' | 'reorderLevel' | 'minOrderQty'>) {
  const stock = Number(it.currentStock ?? 0), level = Number(it.reorderLevel ?? 0), min = Number(it.minOrderQty ?? 0)
  return Math.max(1, Math.ceil(Math.max(min, 2 * level - stock)))
}
