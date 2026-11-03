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
import { api } from './client'
import type { ApiResponse } from '@/types'
import type {
  CompanyField, EntityType, ExtraFieldDef, ExtraValues, IndustryApplied, IndustryCurrent, IndustryPack, IndustryPreview, NewField, SectorTiles,
} from '@/types/industry'

export const industryApi = {
  /** Every sector template and what it switches on and adds. */
  packs: async () => (await api.get<ApiResponse<IndustryPack[]>>('/industry/packs')).data.data ?? [],
  /** How the app is lined up for this company: menu entries shown, words used, presets, tiles, steps. */
  current: async () => (await api.get<ApiResponse<IndustryCurrent>>('/industry/current')).data.data!,
  /** What applying a template would add for this company now. */
  preview: async (code: string, variant?: string | null) =>
    (await api.get<ApiResponse<IndustryPreview>>(`/industry/packs/${encodeURIComponent(code)}/preview`, { params: variant ? { variant } : {} })).data.data!,
  apply: async (code: string, body: { variant?: string | null; primary?: boolean }) =>
    (await api.post<ApiResponse<IndustryApplied>>(`/industry/packs/${encodeURIComponent(code)}/apply`, body)).data.data!,
  remove: async (code: string) => (await api.delete<ApiResponse<IndustryCurrent>>(`/industry/packs/${encodeURIComponent(code)}`)).data.data!,
  /** Menu entries on (true), off (false) or back to the templates (null). */
  modules: async (choices: Record<string, boolean | null>) => (await api.put<ApiResponse<IndustryCurrent>>('/industry/modules', choices)).data.data!,
  /** The sector tiles on the dashboard. */
  tiles: async () => (await api.get<ApiResponse<SectorTiles>>('/dashboard/sector')).data.data!,
}

export const extraFieldsApi = {
  fields: async (type: EntityType) => (await api.get<ApiResponse<ExtraFieldDef[]>>(`/custom-values/${type}/fields`)).data.data ?? [],
  get: async (type: EntityType, id: string) => (await api.get<ApiResponse<ExtraValues>>(`/custom-values/${type}/${id}`)).data.data!,
  save: async (type: EntityType, id: string, values: Record<string, string>) =>
    (await api.put<ApiResponse<ExtraValues>>(`/custom-values/${type}/${id}`, values)).data.data!,
  /** Settings: every extra field of the company, and switching one on or off. */
  all: async () => (await api.get<ApiResponse<CompanyField[]>>('/customization/fields')).data.data ?? [],
  change: async (id: string, change: { label?: string; active?: boolean; required?: boolean; print?: boolean; hint?: string }) =>
    (await api.patch<ApiResponse<CompanyField>>(`/customization/fields/${id}`, change)).data.data!,
  /** A field added by hand: its key is made from its name. */
  create: async (field: NewField) => (await api.post<ApiResponse<CompanyField>>('/customization/fields', field)).data.data!,
}
