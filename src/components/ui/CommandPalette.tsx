'use client'
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

import { askAssistant, useAssistantStatus } from '@/components/assistant/AppAssistant'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, ArrowRight, Users, FileText, ShoppingCart, Package, TrendingUp, BarChart3, Settings, Building2, Clock, Boxes,
  Receipt, Truck, UserCheck, Plus, History, Loader2, Globe, Sparkles, type LucideIcon,
} from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { shown } from '@/lib/previews'
import { allowed, MORE_PAGES, NAV_SECTIONS, sectionOf, type NavItem } from '@/lib/navigation'
import { searchApi, type SearchHit } from '@/lib/api/search'
import { CREATE_ACTIONS } from '@/lib/quickCreate'
import { useCreateAllowed, useCreateLabel } from '@/components/layout/QuickCreate'
import { useIndustry } from '@/lib/hooks/useIndustry'
import { goTo } from '@/lib/hooks/useUrlParams'

/** when: offered only to a company whose industry needs it (drugRegister: a pharmacy's Schedule H1 register) */
/** console: the platform console's pages — offered to Finvosmart's own administrators only */
/**
 * Pages, from the app's navigation (lib/navigation.ts): each under its section, called as in the menu, found also by
 * its title, its section and its extra words ("GSTR-1" finds GST returns). The platform console's pages come first
 * for its administrators.
 */
type Command = NavItem & { group: string; words: string }
const ALL: Command[] = [
  ...NAV_SECTIONS.flatMap(s => s.items.filter(i => i.platform !== 'hint')
    .map(i => ({ ...i, group: s.id === 'platform' ? 'Platform console' : s.label, words: [i.title, s.label, i.keywords].filter(Boolean).join(' ') }))),
  ...MORE_PAGES.map(i => ({ ...i, group: sectionOf(i.section)?.label ?? 'Pages', words: [i.title, sectionOf(i.section)?.label, i.keywords].filter(Boolean).join(' ') })),
]

const KIND_ICON: Record<string, LucideIcon> = {
  invoice: FileText, customer: Users, bill: Receipt, supplier: Truck, purchase_order: ShoppingCart, item: Boxes, employee: UserCheck,
}

/** One row of the palette: a record found, a page, or something to create. */
interface Entry { key: string; section: string; label: string; sub?: string | null; badge?: string | null; href: string; icon: LucideIcon }

// Recently opened records, kept in this browser only (a convenience; nothing breaks without it).
const RECENT_KEY = 'finvo-recent-records'
function readRecent(): Entry[] {
  try { return (JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as any[]).slice(0, 6).map(r => ({ ...r, icon: KIND_ICON[r.kind] ?? History, section: 'Recently opened' })) }
  catch { return [] }
}
function remember(hit: SearchHit) {
  try {
    const now = (JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as any[]).filter(r => r.href !== hit.link)
    now.unshift({ key: 'r:' + hit.link, kind: hit.kind, label: hit.title, sub: hit.subtitle, badge: hit.badge, href: hit.link })
    localStorage.setItem(RECENT_KEY, JSON.stringify(now.slice(0, 8)))
  } catch { /* storage unavailable: nothing to remember */ }
}

interface Props { open: boolean; onClose: () => void }

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [hits, setHits] = useState<{ q: string; groups: { label: string; hits: SearchHit[] }[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const { can, isSuperAdmin, isPlatformAdmin, consoleHint } = usePermissions()
  const createAllowed = useCreateAllowed()
  const createLabel = useCreateLabel()
  const industry = useIndustry()
  const { data: assistant } = useAssistantStatus()

  useEffect(() => { if (open) { setTimeout(() => ref.current?.focus(), 40); setQ(''); setSel(0); setHits(null) } }, [open])
  // read while rendering the open palette, so recent records are there on the very first frame
  const recent = useMemo(() => (open ? readRecent() : []), [open])

  // Records: asked of the server as you type (after a short pause), only what you may see.
  const term = q.trim()
  useEffect(() => {
    if (!open || term.length < 2) { setHits(null); setLoading(false); return }
    const ctl = new AbortController()
    setLoading(true)
    const t = setTimeout(() => {
      searchApi.find(term, 5, ctl.signal)
        .then(r => setHits({ q: term, groups: Array.isArray(r?.groups) ? r.groups : [] }))
        .catch(() => { if (!ctl.signal.aborted) setHits({ q: term, groups: [] }) })
        .finally(() => { if (!ctl.signal.aborted) setLoading(false) })
    }, 180)
    return () => { clearTimeout(t); ctl.abort() }
  }, [term, open])

  const entries: Entry[] = useMemo(() => {
    // pages the company's industry has switched off aren't offered; the rest are called by its words ("Patients")
    const access = { can, isPlatformAdmin, consoleHint, shown, visible: industry.visible, has: (w: 'drugRegister') => !!industry.current?.[w] }
    const mine = ALL.filter(c => allowed(c, access)).map(c => ({ ...c, label: industry.name(c.href, c.label) }))
    const lower = term.toLowerCase()
    const pages = (lower ? mine.filter(c => c.label.toLowerCase().includes(lower) || c.words.toLowerCase().includes(lower)) : mine)
      .map(c => ({ key: 'p:' + c.href, section: lower ? 'Pages' : c.group, label: c.label, href: c.href, icon: c.icon }))
    const creates = CREATE_ACTIONS.filter(createAllowed)
      .filter(a => !lower || `new ${createLabel(a)}`.toLowerCase().includes(lower) || (lower.length >= 3 && 'create'.startsWith(lower)))
      .map(a => ({ key: 'c:' + a.href, section: 'Create', label: `New ${createLabel(a).toLowerCase()}`, href: a.href, icon: Plus }))
    const records = (hits && hits.q === term ? hits.groups : []).flatMap(g => g.hits.map(h => ({
      key: 'h:' + h.kind + h.id, section: g.label, label: h.title, sub: h.subtitle, badge: h.badge, href: h.link, icon: KIND_ICON[h.kind] ?? FileText,
    })))
    if (!lower) return [...recent, ...creates.slice(0, 4), ...pages]
    // the assistant, for what reads like a question (first) or anything else three letters or more (last)
    const asking = assistant?.available && term.length >= 3
      ? [{ key: 'a:ask', section: 'Ask Finvosmart', label: `Ask the assistant: “${term}”`, href: '', icon: Sparkles }] : []
    const question = /\?$/.test(term) || term.split(/\s+/).length >= 3
    return question ? [...asking, ...records, ...creates, ...pages] : [...records, ...creates, ...pages, ...asking]
  // eslint-disable-next-line react-hooks/exhaustive-deps -- industry.current is what its functions read
  }, [term, hits, recent, can, isSuperAdmin, isPlatformAdmin, consoleHint, createAllowed, industry.current, assistant?.available])

  useEffect(() => { setSel(s => Math.min(s, Math.max(0, entries.length - 1))) }, [entries.length])

  const go = (e: Entry) => {
    if (e.key === 'a:ask') { onClose(); askAssistant(term); return }
    if (e.key.startsWith('h:')) {
      const hit = hits?.groups.flatMap(g => g.hits).find(h => 'h:' + h.kind + h.id === e.key)
      if (hit) remember(hit)
    }
    onClose(); goTo(router, e.href)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, entries.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter' && entries[sel]) { e.preventDefault(); go(entries[sel]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sel, entries, onClose])

  useEffect(() => { list.current?.querySelector(`[data-index="${sel}"]`)?.scrollIntoView({ block: 'nearest' }) }, [sel])

  if (!open) return null

  let lastSection = ''
  return (
    // (there was no style for "cmd-overlay", so the palette used to open as a strip at the side of the page)
    <div className="cmd-overlay fixed inset-0 z-50 flex items-start justify-center px-4" onClick={onClose}
      style={{ paddingTop: 'min(14vh, 120px)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-xl animate-[scaleIn_0.18s_cubic-bezier(0.16,1,0.3,1)]"
        role="dialog" aria-modal="true" aria-label="Search"
        onClick={(e: any) => e.stopPropagation()}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '20px', boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          {loading ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: 'var(--gold)' }} /> : <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />}
          <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setSel(0) }}
            placeholder="Search invoices, customers, bills, items, people — or a page"
            aria-label="Search" data-testid="search-input"
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--text-primary)' }} />
          <kbd className="font-mono text-xs px-2 py-1 rounded-lg flex-shrink-0"
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '10px' }}>ESC</kbd>
        </div>
        <div ref={list} className="max-h-[420px] overflow-y-auto p-2" role="listbox" aria-label="Results">
          {entries.length === 0 && !loading ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Nothing found for “{term}”. Try a name, a number or a GSTIN.</p>
          ) : entries.map((e, i) => {
            const Icon = e.icon
            const isSelected = i === sel
            const header = e.section !== lastSection ? e.section : null
            lastSection = e.section
            return (
              <div key={e.key}>
                {header && <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: i === 0 ? '4px 10px 4px' : '10px 10px 4px' }}>{header}</p>}
                <button data-index={i} role="option" aria-selected={isSelected} onClick={() => go(e)}
                  onMouseEnter={() => setSel(i)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-75"
                  style={{ background: isSelected ? 'var(--gold-muted)' : 'transparent', border: `1px solid ${isSelected ? 'rgba(245,158,11,0.15)' : 'transparent'}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? 'rgba(245,158,11,0.12)' : 'var(--bg-hover)' }}>
                    <Icon className="w-4 h-4" style={{ color: isSelected ? 'var(--gold)' : 'var(--text-muted)' }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: isSelected ? 'var(--gold-light)' : 'var(--text-primary)' }}>{e.label}</p>
                    {e.sub && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{e.sub}</p>}
                  </div>
                  {e.badge && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', flexShrink: 0 }}>{e.badge}</span>}
                  {isSelected && <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          {[['↑↓', 'move'], ['↵', 'open'], ['ESC', 'close'], ['?', 'all shortcuts']].map(([key, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <kbd className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', fontSize: '10px' }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
