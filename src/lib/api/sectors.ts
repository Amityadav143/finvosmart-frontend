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

import { api } from './client'
import type { ApiResponse } from '@/types'

/** A business sector (industry.calc.BusinessSectors on the server). */
export interface Sector { code: string; label: string; keywords: string; suggestedPack?: string | null; suggestedInvoiceStyle?: string | null }

/** The list to choose from, the company's choice, and what it suggests. */
export interface SectorChoice {
  catalog: Sector[]
  sectors: string[]
  other?: string | null
  description: string
  /** industry templates (pack codes) that fit */
  suggestedPacks: string[]
  /** the invoice design that suits the business (a template library style) */
  suggestedInvoiceStyle: string
}

export const sectorsApi = {
  get: async (): Promise<SectorChoice> => (await api.get<ApiResponse<SectorChoice>>('/admin/company/sectors')).data.data!,
  save: async (sectors: string[], other?: string): Promise<SectorChoice> =>
    (await api.put<ApiResponse<SectorChoice>>('/admin/company/sectors', { sectors, other: other?.trim() || null })).data.data!,
}

/** The industry templates' names (IndustryCatalog), for "suggested for you". */
export const PACK_NAMES: Record<string, string> = {
  CONTRACTING: 'Contracting and construction', RETAIL: 'Retail store', PHARMACY: 'Pharmacy', MEDICAL: 'Clinic or hospital',
  SOLAR: 'Solar installer or EPC', MANUFACTURING: 'Manufacturing', GENERAL: 'General business',
}
