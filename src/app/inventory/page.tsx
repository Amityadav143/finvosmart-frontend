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

import { redirect } from 'next/navigation'

// Fallback only: next.config.js redirects /inventory → /inventory/items at the routing level
// (a real HTTP redirect; the root loading.tsx makes in-page redirect() stream a 200 first).
export default function InventoryIndex() {
  redirect('/inventory/items')
}
