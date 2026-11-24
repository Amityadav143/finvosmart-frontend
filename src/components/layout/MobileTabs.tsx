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

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu, Search } from 'lucide-react'
import { allowed, MENU, type NavItem } from '@/lib/navigation'
import { useIndustry } from '@/lib/hooks/useIndustry'
import { useNavAccess } from './Sidebar'

/** The pages a tab is offered for, in order: the first two this person may open get one. */
const CANDIDATES = ['/invoicing', '/purchases', '/crm/customers', '/hrms/leave', '/self-service', '/inventory/items', '/hrms/employees']

/**
 * Phones: a tab bar at the bottom — the dashboard, the two everyday pages this person may open, search and the whole
 * menu — reachable with a thumb. Wide screens have the menu at the side instead.
 */
export function MobileTabs({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const pathname = usePathname()
  const access = useNavAccess()
  const industry = useIndustry()
  const home = MENU.find(i => i.href === '/dashboard')
  const showHome = !!home && allowed(home, access)
  // two pages for the role beside Home (three when the login has no dashboard)
  const tabs = CANDIDATES.map(h => MENU.find(i => i.href === h)).filter(i => i !== undefined && allowed(i, access)).slice(0, showHome ? 2 : 3) as NavItem[]
  const here = (href: string) => pathname === href || pathname.startsWith(href + '/')
  const word = (i: NavItem) => (industry.current?.labels?.[i.href]?.plural ?? i.short ?? i.label)

  return (
    <nav className="app-tabs lg:hidden" aria-label="Quick tabs" data-testid="mobile-tabs">
      {showHome && (
        <Link href="/dashboard" className={`app-tab ${here('/dashboard') ? 'is-here' : ''}`} aria-current={here('/dashboard') ? 'page' : undefined}>
          <LayoutDashboard size={19} aria-hidden /><span>Home</span>
        </Link>
      )}
      {tabs.map(i => (
        <Link key={i.href} href={i.href} className={`app-tab ${here(i.href) ? 'is-here' : ''}`} aria-current={here(i.href) ? 'page' : undefined}
          data-tab={i.href}>
          <i.icon size={19} aria-hidden /><span>{word(i)}</span>
        </Link>
      ))}
      <button type="button" className="app-tab" onClick={onSearch} aria-label="Search"><Search size={19} aria-hidden /><span>Search</span></button>
      <button type="button" className="app-tab" onClick={onMenu} aria-label="Open the menu" data-testid="tab-menu"><Menu size={19} aria-hidden /><span>Menu</span></button>
    </nav>
  )
}
