/*
 * FINVOSMART — India's Business Operating System
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

import { redirect } from 'next/navigation'

/** The demand forecast is the reorder planner now: worked out from the company's own stock movements and receipts. */
export default function DemandForecastPage() {
  redirect('/procurement/planner')
}
