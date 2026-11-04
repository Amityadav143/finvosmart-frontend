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

/** A template's settings, as the server stores them (invoicing/pdf/TemplateSpec). */
export interface TemplateConfig {
  version?: number
  style: string
  pageSize: 'A4' | 'A5' | 'LETTER'
  font: 'SANS' | 'SERIF' | 'MODERN' | 'HELVETICA'
  fontScale: number
  marginTop: number; marginRight: number; marginBottom: number; marginLeft: number
  primaryColor: string; accentColor: string; textColor: string
  headerLayout: 'LOGO_LEFT' | 'LOGO_RIGHT' | 'CENTERED' | 'BANNER'
  tableStyle: 'LINES' | 'GRID' | 'ZEBRA' | 'MINIMAL'
  taxColumns: 'SPLIT' | 'COMBINED'
  showLogo: boolean; logoHeightMm: number; logoAssetId: string | null; footerLogo: boolean
  showCompanyContact: boolean
  sectionOrder: string[]; hiddenSections: string[]; hiddenColumns: string[]
  columnWidthsMm: Record<string, number>
  titles: Record<string, string>
  headerText: string | null; footerText: string | null; paymentInstructions: string | null; disclaimer: string | null
  showNotes: boolean; showTerms: boolean; showBankDetails: boolean; showUpiQr: boolean; showSignature: boolean
  showPageNumbers: boolean; showAmountInWords: boolean
  signatoryName: string | null; signatoryDesignation: string | null; signatureLabel: string
  signatureAssetId: string | null
  watermarkText: string | null; watermarkOpacity: number
  customFields: { label: string; value: string }[]
}

export interface TemplateStyle {
  code: string
  name: string
  description: string
  defaults: TemplateConfig
  recommended: boolean
}

export interface TemplateLibrary {
  styles: TemplateStyle[]
  recommended: string
  /** customising (and pictures) is on the company's plan */
  paidFeatures: boolean
  pageSizes: string[]
  fonts: string[]
  headerLayouts: string[]
  tableStyles: string[]
  sections: string[]
  requiredSections: string[]
  optionalColumns: string[]
  retitlable: string[]
}

export type TemplateDocType = 'INVOICE' | 'PROFORMA' | 'QUOTATION' | 'CREDIT_NOTE' | 'DELIVERY_CHALLAN'

export interface CompanyTemplate {
  id: string
  name: string
  docType: TemplateDocType | string
  style: string
  styleName: string
  config: TemplateConfig
  /** changed from its library design (prints only on a paid plan) */
  customised: boolean
  isDefault: boolean
  isSystem: boolean
  updatedAt: string | null
}

export interface TemplateAsset {
  id: string
  kind: 'LOGO' | 'SIGNATURE'
  width: number
  height: number
  bytes: number
  createdAt: string
}

export const DOC_TYPES: { value: TemplateDocType; label: string }[] = [
  { value: 'INVOICE', label: 'Tax invoice' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'PROFORMA', label: 'Proforma invoice' },
  { value: 'CREDIT_NOTE', label: 'Credit note' },
  { value: 'DELIVERY_CHALLAN', label: 'Delivery challan' },
]

export const SECTION_LABELS: Record<string, string> = {
  META: 'Invoice details (number, dates, place of supply)',
  PARTIES: 'Bill to and ship to',
  REFERENCES: 'References (PO, e-way bill…)',
  ITEMS: 'Items and tax',
  TOTALS: 'Totals, amount in words, notes and terms',
  HSN_SUMMARY: 'HSN/SAC tax summary',
  PAYMENT: 'How to pay (UPI QR, bank, link)',
  SIGNATURE: 'Signature',
}

export const COLUMN_LABELS: Record<string, string> = { SNO: 'Serial number (#)', HSN: 'HSN/SAC', RATE: 'Rate', DISCOUNT: 'Discount %' }

export const FONT_LABELS: Record<string, string> = {
  SANS: 'Carlito — clean sans-serif', SERIF: 'DejaVu Serif — classic serif', MODERN: 'Poppins — modern geometric', HELVETICA: 'Helvetica (₹ prints as Rs.)',
}

export const LAYOUT_LABELS: Record<string, string> = {
  LOGO_LEFT: 'Logo left, title right', LOGO_RIGHT: 'Logo and title right', CENTERED: 'Centred', BANNER: 'Colour banner',
}

export const TABLE_LABELS: Record<string, string> = { LINES: 'Ruled lines', GRID: 'Full grid', ZEBRA: 'Striped rows', MINIMAL: 'Minimal' }

export const templatesApi = {
  library: () => api.get('/templates/library').then(r => r.data.data as TemplateLibrary),
  list: (docType?: string) => api.get('/templates', { params: docType ? { docType } : {} }).then(r => (r.data.data ?? []) as CompanyTemplate[]),
  get: (id: string) => api.get(`/templates/${id}`).then(r => r.data.data as CompanyTemplate),
  seed: () => api.post('/templates/seed-presets').then(r => (r.data.data ?? []) as CompanyTemplate[]),
  create: (body: { name?: string; docType: string; style: string; config?: Partial<TemplateConfig> }) =>
    api.post('/templates', body).then(r => r.data.data as CompanyTemplate),
  update: (id: string, body: { name?: string; config?: TemplateConfig }) => api.patch(`/templates/${id}`, body).then(r => r.data.data as CompanyTemplate),
  reset: (id: string) => api.post(`/templates/${id}/reset`).then(r => r.data.data as CompanyTemplate),
  duplicate: (id: string, name?: string) => api.post(`/templates/${id}/duplicate`, name ? { name } : {}).then(r => r.data.data as CompanyTemplate),
  setDefault: (id: string) => api.post(`/templates/${id}/set-default`),
  remove: (id: string) => api.delete(`/templates/${id}`),
  /** The PDF the settings make — drawn by the same renderer as the invoices. */
  preview: (config: Partial<TemplateConfig>, docType?: string, invoiceId?: string, signal?: AbortSignal) =>
    api.post('/templates/preview', { config, docType, invoiceId }, { responseType: 'blob', signal }).then(r => r.data as Blob),
  assets: () => api.get('/templates/assets').then(r => (r.data.data ?? []) as TemplateAsset[]),
  upload: (file: File, kind: 'LOGO' | 'SIGNATURE') => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/templates/assets', form, { params: { kind } }).then(r => r.data.data as TemplateAsset)
  },
  asset: (id: string) => api.get(`/templates/assets/${id}`, { responseType: 'blob' }).then(r => r.data as Blob),
  removeAsset: (id: string) => api.delete(`/templates/assets/${id}`),
}
