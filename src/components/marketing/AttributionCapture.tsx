'use client'
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

import { useEffect } from 'react'
import { remember } from '@/lib/attribution'

/**
 * Notes, in the visitor's own browser, which campaign or site brought them (lib/attribution.ts) — once per page load:
 * moving between pages inside the site keeps the page they landed on. Renders nothing.
 */
export function AttributionCapture() {
  useEffect(() => { remember(window.location.href, document.referrer) }, [])
  return null
}
