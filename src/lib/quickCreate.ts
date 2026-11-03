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
import {
  BookOpen, Boxes, CalendarPlus, FileText, Receipt, ShoppingCart, Truck, UserPlus, Users, Wallet, ClipboardList,
  type LucideIcon,
} from 'lucide-react'

/** Something new to create, where its form is, who may, and its keyboard shortcut ("n" then the key). */
export interface CreateAction {
  label: string; href: string; icon: LucideIcon; key: string; group: 'Sales' | 'Purchases' | 'People' | 'Books'
  /** Any one of these permissions… */
  perms: string[]
  /** …or, where the server checks a role instead, any one of these roles. */
  roles?: string[]
  /** The menu entry it belongs to: while the company's industry has that entry switched off it isn't offered,
   *  and it is called by the industry's word for it ("Patient" for a clinic's customer). */
  module?: string
}

export const CREATE_ACTIONS: CreateAction[] = [
  { label: 'Invoice',          href: '/invoicing/new',                     icon: FileText,      perms: ['INVOICE_CREATE'],                         key: 'i', group: 'Sales', module: '/invoicing' },
  { label: 'Quotation',        href: '/invoicing/new?type=QUOTATION',      icon: ClipboardList, perms: ['INVOICE_CREATE'],                         key: 'q', group: 'Sales', module: '/quotations' },
  { label: 'Customer',         href: '/crm/customers?new=1',               icon: Users,         perms: ['CRM_CREATE', 'CRM_ADMIN'],                key: 'c', group: 'Sales', module: '/crm/customers' },
  { label: 'Supplier bill',    href: '/purchases/bills/new',               icon: Receipt,       perms: ['PROCUREMENT_CREATE', 'FINANCE_CREATE'],   key: 'b', group: 'Purchases' },
  { label: 'Expense',          href: '/purchases/bills/new?type=EXPENSE',  icon: Wallet,        perms: ['PROCUREMENT_CREATE', 'FINANCE_CREATE'],   key: 'x', group: 'Purchases' },
  { label: 'Purchase order',   href: '/procurement/orders?new=1',          icon: ShoppingCart,  perms: ['PROCUREMENT_CREATE'],                     key: 'p', group: 'Purchases', module: '/procurement/orders' },
  { label: 'Supplier',         href: '/procurement/vendors?new=1',         icon: Truck,         perms: ['PROCUREMENT_CREATE'],                     key: 's', group: 'Purchases', module: '/procurement/vendors' },
  { label: 'Item',             href: '/inventory/items?new=1',             icon: Boxes,         perms: ['INVENTORY_CREATE', 'INVENTORY_ADMIN'],    key: 't', group: 'Purchases', module: '/inventory/items' },
  { label: 'Employee',         href: '/hrms/employees?new=1',              icon: UserPlus,      perms: [], roles: ['COMPANY_ADMIN', 'HR_ADMIN'],  key: 'e', group: 'People' },
  { label: 'Leave request',    href: '/hrms/leave?new=1',                  icon: CalendarPlus,  perms: ['LEAVE_APPLY'],                            key: 'l', group: 'People' },
  { label: 'Journal entry',    href: '/finance/vouchers?new=1',            icon: BookOpen,      perms: ['FINANCE_CREATE'],                         key: 'j', group: 'Books' },
]

/** "g" then the key: go to a list (module: as for CREATE_ACTIONS). */
export const GO_TO: { key: string; label: string; href: string; perms?: string[]; module?: string }[] = [
  { key: 'd', label: 'Dashboard',        href: '/dashboard' },
  { key: 'i', label: 'Invoices',         href: '/invoicing',            perms: ['INVOICE_VIEW', 'INVOICE_CREATE'], module: '/invoicing' },
  { key: 'c', label: 'Customers',        href: '/crm/customers',        perms: ['CRM_VIEW'], module: '/crm/customers' },
  { key: 'b', label: 'Bills & expenses', href: '/purchases',            perms: ['PROCUREMENT_VIEW', 'FINANCE_VIEW'] },
  { key: 'p', label: 'Purchase orders',  href: '/procurement/orders',   perms: ['PROCUREMENT_VIEW'], module: '/procurement/orders' },
  { key: 's', label: 'Suppliers',        href: '/procurement/vendors',  perms: ['PROCUREMENT_VIEW'], module: '/procurement/vendors' },
  { key: 't', label: 'Inventory',        href: '/inventory/items',      perms: ['INVENTORY_VIEW'], module: '/inventory/items' },
  { key: 'e', label: 'Employees',        href: '/hrms/employees',       perms: ['EMPLOYEE_VIEW'] },
  { key: 'l', label: 'Leave',            href: '/hrms/leave',           perms: ['LEAVE_VIEW'] },
  { key: 'r', label: 'Reports',          href: '/reports',              perms: ['REPORTS_VIEW'] },
  { key: 'n', label: 'Notifications',    href: '/notifications' },
  { key: 'm', label: 'My portal',        href: '/self-service' },
]
