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

/** Sector templates (backend: IndustryCatalog, IndustryDto). */
/** COMPANY: the company's own details (licence numbers), kept with Settings → Company. */
export type EntityType = 'COMPANY' | 'CUSTOMER' | 'ITEM' | 'PROJECT' | 'VENDOR'
export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'CHECKBOX' | 'TEXTAREA'

export interface IndustryLabel { key: string; plural: string; singular: string }
export interface ItemPreset { name: string; category: string; hsn: string | null; unit: string | null; gstRate: string | null; note: string | null; source: string | null }
export interface IndustryTile { key: string; label: string }
export interface IndustryStep { id: string; label: string; why: string; href: string; doneWhen: 'projects' | 'quotations' | 'leads' | 'purchaseOrders' | 'reorderLevels' }
/** print: shown on invoices, quotations, notes and challans. */
export interface PackField { entity: EntityType; entityName: string; key: string; label: string; type: FieldType; options: string[]; hint: string | null; print: boolean }
export interface PackRole { name: string; displayName: string; purpose: string; permissions: string[] }
/** batches: this kind of business keeps stock by batch and expiry */
export interface PackVariant { code: string; name: string; summary: string; fields: PackField[]; presets: ItemPreset[]; batches?: boolean }

export interface IndustryPack {
  code: string; name: string; summary: string; forWho: string; variants: PackVariant[]
  shows: string[]; hides: string[]; labels: IndustryLabel[]; fields: PackField[]; roles: PackRole[]; presets: ItemPreset[]
  tiles: string[]; steps: IndustryStep[]; notYet: string | null; version: number
  applied: boolean; primary: boolean; appliedVariant: string | null
  /** the whole sector keeps stock by batch and expiry (a kind of business in it may, too: PackVariant.batches) */
  batches?: boolean
}

export interface IndustryPreview {
  pack: IndustryPack; variant: PackVariant | null
  fieldsToAdd: PackField[]; fieldsKept: PackField[]; optionsToAdd: Record<string, string[]>
  rolesToAdd: PackRole[]; rolesKept: PackRole[]; shows: string[]; hides: string[]
  alreadyApplied: boolean; becomesPrimary: boolean
}

export interface AppliedPack { code: string; name: string; variant: string | null; variantName: string | null; primary: boolean; version: number; latestVersion: number; appliedAt: string }
export interface ModuleState { key: string; name: string; visible: boolean; byPack: boolean; override: boolean | null }
export interface IndustryNote { pack: string; text: string }

export interface IndustryCurrent {
  primary: AppliedPack | null; applied: AppliedPack[]
  labels: Record<string, IndustryLabel>; modules: ModuleState[]; hidden: string[]
  presets: ItemPreset[]; tiles: IndustryTile[]; steps: IndustryStep[]; notYet: IndustryNote[]
  /** a template applied keeps stock by batch and expiry: new items start kept by batch */
  batches?: boolean
  /** a template applied gives medicines a schedule, so the company keeps the Schedule H1 register */
  drugRegister?: boolean
}

export interface IndustryApplied {
  pack: string; variant: string | null; primary: boolean; fieldsAdded: number; optionsAdded: number; rolesAdded: number
  fieldLabels: string[]; roleNames: string[]; current: IndustryCurrent
}

/** An extra field as a form shows it (backend: CustomValueService.FieldDef). */
export interface ExtraFieldDef { key: string; label: string; type: FieldType; options: string[]; required: boolean; hint: string | null; pattern: string | null }
export interface ExtraValues { entityType: EntityType; entityId: string; fields: ExtraFieldDef[]; values: Record<string, string> }

/** A company's extra field as Settings lists it (backend: the CustomField entity as Jackson writes it — isActive as "active"). */
export interface CompanyField {
  id: string; entityType: EntityType; fieldKey: string; fieldLabel: string; fieldType: FieldType
  required: boolean; active: boolean; fieldOrder: number; packCode: string | null; helpText: string | null
  /** Printed on invoices (company, customer and item fields). */
  showOnDocuments: boolean
}

/** A field added by hand (backend: CustomFieldController.FieldCreate). */
export interface NewField {
  entityType: EntityType; label: string; type: FieldType; options?: string[]; required?: boolean; hint?: string; pattern?: string; print?: boolean
}

export interface SectorTile { key: string; label: string; count: number | null; amount: number | string | null; unit: 'INR' | 'KW' | null; href: string }
export interface SectorTiles { pack: string | null; packName: string | null; tiles: SectorTile[] }
