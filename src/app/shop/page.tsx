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

/** /shop without a store's address: the page about the online store (each store is at /shop/<its address>). */
export default function ShopIndex() {
  redirect('/online-store-builder')
}
