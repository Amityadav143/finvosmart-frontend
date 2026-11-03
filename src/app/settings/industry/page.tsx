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
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Briefcase, Check, Factory, HardHat, Info, LayoutGrid, ListChecks, Pill, Plus, Printer, RotateCcw, Stethoscope, Store, Sun, type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { industryApi, extraFieldsApi } from '@/lib/api/industry'
import { INDUSTRY_KEY, useIndustry } from '@/lib/hooks/useIndustry'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useAuthStore } from '@/lib/store/slices/authStore'
import { apiError } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import type { CompanyField, EntityType, FieldType, IndustryCurrent, IndustryPack, IndustryPreview, PackField } from '@/types/industry'

const ICONS: Record<string, LucideIcon> = {
  CONTRACTING: HardHat, RETAIL: Store, PHARMACY: Pill, MEDICAL: Stethoscope, SOLAR: Sun, MANUFACTURING: Factory, GENERAL: Briefcase,
}
const ENTITY_ORDER: EntityType[] = ['COMPANY', 'CUSTOMER', 'ITEM', 'PROJECT', 'VENDOR']
/** The records a document prints details of: the seller (the company), the buyer and the lines. */
const PRINTABLE = new Set<string>(['COMPANY', 'CUSTOMER', 'ITEM'])
/** Each kind of record: its menu entry (whose word the industry may change) and the usual word. */
const ENTITY_MENU: Record<string, [string, string]> = {
  COMPANY: ['/settings/company', 'Company details'], CUSTOMER: ['/crm/customers', 'Customers'], ITEM: ['/inventory/items', 'Items'],
  PROJECT: ['/projects', 'Projects'], VENDOR: ['/procurement/vendors', 'Suppliers'],
}

/**
 * Settings → Industry: pick what the business does, see exactly what that sets up, apply it; then the
 * menu entries, extra fields and templates the company has, each of which can be changed here.
 */
export default function IndustryPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const perms = usePermissions()
  // the server checks the same permission on every change (super admins pass)
  const canManage = perms.can('SETTINGS_COMPANY')
  const [welcome, setWelcome] = useState(false)
  useEffect(() => { try { setWelcome(new URLSearchParams(window.location.search).get('welcome') === '1') } catch { /* no URL */ } }, [])

  const company = user?.companyId ?? ''
  const packs = useQuery({ queryKey: ['industry-packs', company], queryFn: industryApi.packs, staleTime: 60_000 })
  const current = useQuery({ queryKey: [...INDUSTRY_KEY, company], queryFn: industryApi.current, enabled: !!user })
  // only a well-formed answer counts (an older server, or a stand-in, may answer with something else)
  const cur = current.data && Array.isArray(current.data.applied) && Array.isArray(current.data.modules) ? current.data : undefined
  const packList = Array.isArray(packs.data) ? packs.data : []

  const [picked, setPicked] = useState<string | null>(null)
  const [variant, setVariant] = useState<string | null>(null)
  const pack = packList.find(p => p.code === picked) ?? null
  // start on the main sector (or nothing) once the company's templates are known
  useEffect(() => {
    if (picked || !cur) return
    if (cur.primary) { setPicked(cur.primary.code); setVariant(cur.primary.variant ?? null) }   // (left out of the answer when there is none)
  }, [cur, picked])

  const refreshAll = (next?: IndustryCurrent) => {
    if (next) qc.setQueryData([...INDUSTRY_KEY, company], next)
    qc.invalidateQueries({ queryKey: INDUSTRY_KEY })
    for (const k of ['industry-packs', 'industry-preview', 'extra-fields', 'company-fields', 'sector-tiles', 'setup-status', 'admin-roles'])
      qc.invalidateQueries({ queryKey: [k] })
  }

  return (
    <div className="space-y-5" data-testid="industry-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Industry</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Choose what your business does. FINVOSMART then shows the menus, words, extra fields and roles that fit — and you can change any of it.
          </p>
        </div>
        {welcome && <Link href="/dashboard" className="btn-secondary h-9 text-sm">Skip for now</Link>}
      </div>

      {welcome && (
        <div className="card flex items-start gap-3" style={{ borderColor: 'var(--gold)' }} data-testid="industry-welcome">
          <Info size={18} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} aria-hidden />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your company is set up. One more step: pick your industry below and apply it. Nothing you enter later is lost if you change it.
          </p>
        </div>
      )}

      {cur && cur.applied.length > 0 && (
        <Applied current={cur} packs={packList} canManage={canManage} onChanged={refreshAll} />
      )}

      <section className="card" aria-labelledby="pick-title">
        <h2 id="pick-title" className="text-base font-semibold" style={{ margin: 0 }}>
          {cur?.primary ? 'Add or change your industry' : 'What does your business do?'}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          A clinic with its own pharmacy can apply both: you get the menus and fields of each, and where both have a word for something, the main one's is used.
        </p>
        {packs.isError && <p className="text-sm mt-3" style={{ color: '#dc2626' }}>The industries could not be loaded. Refresh the page to try again.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4" role="radiogroup" aria-label="Industry">
          {packList.map(p => {
            const Icon = ICONS[p.code] ?? Briefcase
            const on = p.code === picked
            return (
              <button key={p.code} type="button" role="radio" aria-checked={on} data-pack={p.code}
                onClick={() => { setPicked(p.code); setVariant(p.appliedVariant ?? (p.variants.length === 1 ? p.variants[0].code : null)) }}
                className="text-left rounded-xl p-3 transition-all"
                style={{ border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'var(--gold-muted)' : 'var(--bg-card)', cursor: 'pointer' }}>
                <span className="flex items-center gap-2">
                  <Icon size={16} style={{ color: on ? 'var(--gold)' : 'var(--text-muted)' }} aria-hidden />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  {p.primary ? <Badge variant="gold" className="ml-auto">Main</Badge> : p.applied ? <Badge variant="success" className="ml-auto">Applied</Badge> : null}
                </span>
                <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.forWho}</span>
              </button>
            )
          })}
        </div>

        {pack && pack.variants.length > 0 && (
          <div className="mt-4" data-testid="industry-variants">
            <p className="label">Which kind?</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Kind of ${inSentence(pack.name)}`}>
              {pack.variants.map(v => (
                <button key={v.code} type="button" role="radio" aria-checked={variant === v.code} onClick={() => setVariant(v.code)}
                  className="h-9 px-3 rounded-lg text-sm" title={v.summary}
                  style={{ border: `1px solid ${variant === v.code ? 'var(--gold)' : 'var(--border)'}`, background: variant === v.code ? 'var(--gold-muted)' : 'transparent',
                           color: variant === v.code ? 'var(--gold)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {v.name}
                </button>
              ))}
            </div>
            {variant && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{pack.variants.find(v => v.code === variant)?.summary}</p>}
          </div>
        )}

        {pack && <PackDetails pack={pack} variant={variant} canManage={canManage} hasPrimary={!!cur?.primary}
          primaryName={cur?.primary?.name ?? null} onApplied={refreshAll} />}
      </section>

      {cur && <Menu current={cur} canManage={canManage} onChanged={refreshAll} />}
      {canManage && <Fields />}
    </div>
  )
}

/** The templates the company has, with the main one first. */
function Applied({ current, packs, canManage, onChanged }: { current: IndustryCurrent; packs: IndustryPack[]; canManage: boolean; onChanged: (c?: IndustryCurrent) => void }) {
  const makeMain = useMutation({
    mutationFn: (code: string) => industryApi.apply(code, { variant: current.applied.find(a => a.code === code)?.variant ?? null, primary: true }),
    onSuccess: r => { toast.success('Main industry changed'); onChanged(r.current) },
    onError: e => toast.error(apiError(e, 'The main industry could not be changed')),
  })
  const remove = useMutation({
    mutationFn: (code: string) => industryApi.remove(code),
    onSuccess: c => { toast.success('Template taken off — its fields and roles stay, with their data'); onChanged(c) },
    onError: e => toast.error(apiError(e, 'The template could not be taken off')),
  })
  const order = [...current.applied].sort((a, b) => Number(b.primary) - Number(a.primary))
  return (
    <section className="card" aria-labelledby="applied-title" data-testid="industry-applied">
      <h2 id="applied-title" className="text-base font-semibold" style={{ margin: 0 }}>Your industry</h2>
      <ul className="mt-3 space-y-2" style={{ listStyle: 'none', padding: 0 }}>
        {order.map(a => {
          const Icon = ICONS[a.code] ?? Briefcase
          const p = packs.find(x => x.code === a.code)
          return (
            <li key={a.code} className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--border)' }}>
              <Icon size={18} style={{ color: 'var(--gold)' }} aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ margin: 0 }}>
                  {a.name}{a.variantName ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {a.variantName}</span> : null}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                  Applied {formatDate(a.appliedAt)}{a.version < a.latestVersion ? ' · a newer version is available: apply it again to add what is new' : ''}
                </p>
              </div>
              {a.primary ? <Badge variant="gold">Main industry</Badge> : canManage && (
                <button className="btn-ghost h-8 text-xs" disabled={makeMain.isPending} onClick={() => makeMain.mutate(a.code)}>Make main</button>
              )}
              {canManage && (
                <button className="btn-ghost h-8 text-xs" disabled={remove.isPending} onClick={() => remove.mutate(a.code)}
                  title={`Menus and words stop following ${a.name}; the fields and roles it added stay`}>Take off</button>
              )}
              {p?.notYet && <p className="w-full text-xs" style={{ color: 'var(--text-secondary)', margin: '2px 0 0 30px' }}>{p.notYet}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** What a template sets up — for this company now (fields and roles it already has are kept) — and applying it. */
function PackDetails({ pack, variant, canManage, hasPrimary, primaryName, onApplied }: {
  pack: IndustryPack; variant: string | null; canManage: boolean; hasPrimary: boolean; primaryName: string | null; onApplied: (c?: IndustryCurrent) => void
}) {
  const needsVariant = pack.variants.length > 0 && !variant
  const preview = useQuery({
    queryKey: ['industry-preview', pack.code, variant ?? ''],
    queryFn: () => industryApi.preview(pack.code, variant),
    enabled: canManage && !needsVariant,
    retry: false,
  })
  const [asMain, setAsMain] = useState(true)
  useEffect(() => { setAsMain(!hasPrimary || pack.primary) }, [pack.code, hasPrimary, pack.primary])

  const apply = useMutation({
    mutationFn: () => industryApi.apply(pack.code, { variant, primary: asMain }),
    onSuccess: r => {
      const added = [r.fieldsAdded && `${r.fieldsAdded} field${r.fieldsAdded === 1 ? '' : 's'}`, r.rolesAdded && `${r.rolesAdded} role${r.rolesAdded === 1 ? '' : 's'}`]
        .filter(Boolean).join(' and ')
      toast.success(`${pack.name} applied${added ? `: ${added} added` : ' — nothing new to add'}`)
      onApplied(r.current)
    },
    onError: e => toast.error(apiError(e, 'The template could not be applied')),
  })

  const v = pack.variants.find(x => x.code === variant) ?? null
  const allFields: PackField[] = useMemo(() => {
    const seen = new Set<string>(), out: PackField[] = []
    for (const f of [...pack.fields, ...(v?.fields ?? [])]) { const k = `${f.entity}:${f.key}`; if (!seen.has(k)) { seen.add(k); out.push(f) } }
    return out
  }, [pack, v])
  const p: IndustryPreview | undefined = preview.data
  const toAdd = p ? p.fieldsToAdd : allFields
  const kept = p ? p.fieldsKept : []
  const rolesToAdd = p ? p.rolesToAdd : pack.roles
  const rolesKept = p ? p.rolesKept : []
  const presets = [...pack.presets, ...(v?.presets ?? [])].filter((x, i, all) => all.findIndex(y => y.name === x.name) === i)
  const nothingNew = !!p && p.alreadyApplied && p.fieldsToAdd.length === 0 && p.rolesToAdd.length === 0 && Object.keys(p.optionsToAdd).length === 0

  return (
    <div className="mt-5 pt-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }} data-testid="industry-preview">
      <div>
        <h3 className="text-sm font-semibold" style={{ margin: 0 }}>What {inSentence(pack.name)} sets up</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{pack.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Block title="Menu">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {pack.hides.length === 0 ? 'Every menu entry stays on.' : <>On: {pack.shows.join(', ')}.<br />Off (you can switch them back on below): {pack.hides.join(', ')}.</>}
          </p>
        </Block>
        <Block title="Words used">
          {pack.labels.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>The usual words.</p> : (
            <ul className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '16px' }}>
              {pack.labels.map(l => <li key={l.key}>{usual(l.key)} → <strong style={{ color: 'var(--text-primary)' }}>{l.plural}</strong></li>)}
            </ul>
          )}
        </Block>
        <Block title={p ? `Extra fields to add (${toAdd.length})` : `Extra fields (${toAdd.length})`} testid="industry-fields">
          {toAdd.length === 0 && kept.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>None.</p> : (
            <div className="space-y-1.5">
              {ENTITY_ORDER.map(e => {
                const list = toAdd.filter(f => f.entity === e)
                if (!list.length) return null
                return <p key={e} className="text-xs" style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{list[0].entityName}:</strong> {list.map(f => f.label).join(', ')}</p>
              })}
              {toAdd.some(f => f.print) && (
                <p className="text-xs flex items-start gap-1" style={{ margin: 0, color: 'var(--text-secondary)' }} data-testid="industry-printed">
                  <Printer size={12} style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden />
                  <span>Printed on invoices: {toAdd.filter(f => f.print).map(f => f.label).join(', ')}</span>
                </p>
              )}
              {kept.length > 0 && <p className="text-xs" style={{ margin: 0, color: 'var(--text-muted)' }}>Already there, kept as they are: {kept.map(f => f.label).join(', ')}</p>}
              {p && Object.keys(p.optionsToAdd).length > 0 && <p className="text-xs" style={{ margin: 0, color: 'var(--text-muted)' }}>
                New choices for lists you have: {Object.values(p.optionsToAdd).flat().join(', ')}</p>}
            </div>
          )}
        </Block>
        <Block title={p ? `Roles to create (${rolesToAdd.length})` : `Roles (${rolesToAdd.length})`} testid="industry-roles">
          {rolesToAdd.length === 0 && rolesKept.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>None — use the usual roles.</p> : (
            <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '16px' }}>
              {rolesToAdd.map(r => <li key={r.name}><strong style={{ color: 'var(--text-primary)' }}>{r.displayName}</strong> — {r.purpose}</li>)}
              {rolesKept.map(r => <li key={r.name} style={{ color: 'var(--text-muted)' }}>{r.displayName} — you have it already; kept as it is</li>)}
            </ul>
          )}
        </Block>
        {presets.length > 0 && (
          <Block title="Item presets">
            <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '16px' }}>
              {presets.map(x => <li key={x.name}>{x.name}{x.hsn ? ` · HSN/SAC ${x.hsn}` : ''}{x.gstRate != null ? ` · GST ${x.gstRate}%` : ' · you choose the GST rate'}</li>)}
            </ul>
          </Block>
        )}
        {(pack.batches || v?.batches) && (
          <Block title="Stock" testid="industry-batches">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Kept by batch and expiry: supplier bills record each batch with its expiry and MRP; invoices bill the first to expire — never
              an expired batch — and print the batch and expiry; the dashboard shows what is about to expire. Each item can be switched to or from batches.
            </p>
          </Block>
        )}
        {pack.tiles.length > 0 && (
          <Block title="On your dashboard">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pack.tiles.join(' · ')}</p>
          </Block>
        )}
      </div>

      {pack.notYet && (
        <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', margin: 0 }} data-testid="industry-not-yet">
          <strong>Not in FINVOSMART yet:</strong> {pack.notYet.replace(/ are not in FINVOSMART yet\.?/, '.').replace(/ is not in FINVOSMART yet\.?/, '.')}
        </p>
      )}

      {canManage ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {hasPrimary && !pack.primary && (
            <label className="flex items-center gap-2 text-sm mr-auto cursor-pointer">
              <input type="checkbox" checked={asMain} onChange={e => setAsMain(e.target.checked)} />
              Make it the main industry{primaryName ? ` instead of ${primaryName}` : ''}
            </label>
          )}
          {preview.isError && <p className="text-xs mr-auto" style={{ color: '#dc2626' }}>{apiError(preview.error, 'What it adds could not be worked out')}</p>}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nothing you entered is changed or deleted. Every change goes in the audit log.</p>
          <button className="btn-primary h-10" data-testid="industry-apply"
            disabled={needsVariant || apply.isPending || nothingNew && (pack.primary || !asMain)} onClick={() => apply.mutate()}>
            <Check size={15} />{apply.isPending ? 'Applying…' : needsVariant ? 'Choose the kind first' : nothingNew && (pack.primary || !asMain) ? 'Applied' : `Apply ${inSentence(pack.name)}`}
          </button>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>Ask an administrator to apply an industry.</p>
      )}
    </div>
  )
}

/** A name inside a sentence: "Solar installer or EPC" → "solar installer or EPC" (only the capital a sentence gave it). */
function inSentence(name: string): string {
  return name.length > 1 && name[1] === name[1].toLowerCase() ? name[0].toLowerCase() + name.slice(1) : name
}

function usual(key: string): string {
  return ({ '/crm/customers': 'Customers', '/crm/leads': 'Leads', '/invoicing': 'Invoices', '/inventory/items': 'Inventory', '/projects': 'Projects',
            '/procurement/vendors': 'Suppliers' } as Record<string, string>)[key] ?? key
}

function Block({ title, children, testid }: { title: string; children: React.ReactNode; testid?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ border: '1px solid var(--border)' }} data-testid={testid}>
      <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '0 0 6px' }}>{title}</p>
      {children}
    </div>
  )
}

/** Menu entries a template can switch off, as they are now; each can be switched on or off by hand, or back to the template. */
function Menu({ current, canManage, onChanged }: { current: IndustryCurrent; canManage: boolean; onChanged: (c?: IndustryCurrent) => void }) {
  // what was just switched shows at once; the server's answer then replaces it (or, if refused, puts it back)
  const [switched, setSwitched] = useState<Record<string, boolean>>({})
  const save = useMutation({
    mutationFn: (choice: Record<string, boolean | null>) => industryApi.modules(choice),
    onSuccess: c => { toast.success('Menu updated'); onChanged(c) },
    onError: e => toast.error(apiError(e, 'The menu could not be changed')),
    onSettled: (_d, _e, choice) => setSwitched(s => { const n = { ...s }; for (const k of Object.keys(choice)) delete n[k]; return n }),
  })
  const flip = (m: IndustryCurrent['modules'][number], on: boolean) => {
    setSwitched(s => ({ ...s, [m.key]: on }))
    save.mutate({ [m.key]: on === m.byPack ? null : on })          // back to what the industry says: no choice kept
  }
  return (
    <section className="card" aria-labelledby="menu-title" data-testid="industry-menu">
      <h2 id="menu-title" className="flex items-center gap-2 text-base font-semibold" style={{ margin: 0 }}><LayoutGrid size={16} aria-hidden />Menu</h2>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        Accounts, GST, invoices, people and settings are always there. These follow your industry unless you switch them yourself; what each person sees still depends on their role.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 mt-3">
        {current.modules.map(m => (
          <div key={m.key} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)' }}>
            <label className="flex items-center gap-2 text-sm flex-1 cursor-pointer">
              <input type="checkbox" checked={switched[m.key] ?? m.visible} disabled={!canManage || save.isPending} data-module={m.key}
                onChange={e => flip(m, e.target.checked)} />
              {m.name}
            </label>
            {m.override != null && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>your choice</span>
                {canManage && <button className="btn-icon w-7 h-7" title="Back to what the industry says" aria-label={`${m.name}: back to what the industry says`}
                  onClick={() => { setSwitched(s => ({ ...s, [m.key]: m.byPack })); save.mutate({ [m.key]: null }) }} disabled={save.isPending}><RotateCcw size={13} /></button>}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

/** The company's extra fields, by record: each can be switched off (what was typed in stays), printed on invoices, or added by hand. */
function Fields() {
  const qc = useQueryClient()
  const industry = useIndustry()
  const { data: fields = [], isLoading } = useQuery<CompanyField[]>({ queryKey: ['company-fields'], queryFn: extraFieldsApi.all })
  // what was just switched shows at once (as for the menu); key: `${id}:active` or `${id}:print`
  const [switched, setSwitched] = useState<Record<string, boolean>>({})
  const [adding, setAdding] = useState(false)
  const change = useMutation({
    mutationFn: ({ id, what, on }: { id: string; what: 'active' | 'print'; on: boolean }) =>
      extraFieldsApi.change(id, what === 'active' ? { active: on } : { print: on }),
    onSuccess: (saved, v) => {
      toast.success(v.what === 'active' ? (v.on ? 'Field switched on' : 'Field switched off — what was typed in it is kept')
        : v.on ? 'It now prints on invoices' : 'It no longer prints on invoices')
      qc.setQueryData<CompanyField[]>(['company-fields'], list => list?.map(x => (x.id === v.id ? { ...x, ...saved } : x)))
      qc.invalidateQueries({ queryKey: ['extra-fields'] })                 // the forms
    },
    onError: e => toast.error(apiError(e, 'The field could not be changed')),
    onSettled: (_d, _e, v) => setSwitched(s => { const n = { ...s }; delete n[`${v.id}:${v.what}`]; return n }),
  })
  const flip = (f: CompanyField, what: 'active' | 'print', on: boolean) => {
    setSwitched(s => ({ ...s, [`${f.id}:${what}`]: on }))
    change.mutate({ id: f.id, what, on })
  }
  const active = (f: CompanyField) => switched[`${f.id}:active`] ?? f.active !== false
  const printed = (f: CompanyField) => switched[`${f.id}:print`] ?? f.showOnDocuments === true
  if (isLoading) return null
  const name = (e: string) => industry.name(...ENTITY_MENU[e])
  return (
    <section className="card" aria-labelledby="fields-title" data-testid="industry-company-fields">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="fields-title" className="flex items-center gap-2 text-base font-semibold" style={{ margin: 0 }}><ListChecks size={16} aria-hidden />Extra fields</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            They show on the add and edit forms. Switch off the ones you don't use; tick "On invoices" to print a company, customer or item detail on every invoice, quotation and challan.
          </p>
        </div>
        {!adding && <button className="btn-secondary h-9 text-sm" onClick={() => setAdding(true)} data-testid="field-add-open"><Plus size={14} />Add a field</button>}
      </div>
      {adding && <AddField onDone={() => setAdding(false)} name={name} />}
      {fields.length === 0 ? (
        <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>No extra fields yet: apply an industry above, or add your own.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          {ENTITY_ORDER.filter(e => fields.some(f => f.entityType === e)).map(e => (
            <div key={e}>
              <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '0 0 6px' }}>{name(e)}</p>
              <ul className="space-y-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {fields.filter(f => f.entityType === e).map(f => (
                  <li key={f.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm" data-field={f.fieldKey}>
                    <input type="checkbox" id={`cf-${f.id}`} checked={active(f)} disabled={change.isPending}
                      onChange={ev => flip(f, 'active', ev.target.checked)} />
                    <label htmlFor={`cf-${f.id}`} className="flex-1 cursor-pointer" style={{ color: active(f) ? 'var(--text-primary)' : 'var(--text-muted)', minWidth: '120px' }}>
                      {f.fieldLabel}{f.required ? <span style={{ color: 'var(--text-muted)' }}> · required</span> : null}
                    </label>
                    {PRINTABLE.has(e) && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }} title="Print it on invoices, quotations, notes and challans">
                        <input type="checkbox" checked={printed(f)} disabled={change.isPending || !active(f)} data-print={f.fieldKey}
                          aria-label={`${f.fieldLabel}: print on invoices`} onChange={ev => flip(f, 'print', ev.target.checked)} />
                        On invoices
                      </label>
                    )}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.packCode ? 'from your industry' : 'added by hand'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Text' }, { value: 'NUMBER', label: 'Number' }, { value: 'DATE', label: 'Date' },
  { value: 'DROPDOWN', label: 'List of choices' }, { value: 'CHECKBOX', label: 'Tick box' }, { value: 'TEXTAREA', label: 'Longer text' },
]

/** Adding a field by hand: which records, its name and kind, its choices (a list), a line under it, required, printed. */
function AddField({ onDone, name }: { onDone: () => void; name: (entity: string) => string }) {
  const qc = useQueryClient()
  const [f, setF] = useState<{ entityType: EntityType; label: string; type: FieldType; options: string; hint: string; required: boolean; print: boolean }>(
    { entityType: 'CUSTOMER', label: '', type: 'TEXT', options: '', hint: '', required: false, print: false })
  const options = f.options.split(/[,\n]/).map(o => o.trim()).filter(Boolean)
  const problem = !f.label.trim() ? 'Give the field a name.'
    : f.label.trim().length > 200 ? 'A field\'s name must be at most 200 characters.'
    : f.type === 'DROPDOWN' && options.length === 0 ? 'A list needs at least one choice: write them with commas between.'
    : f.type === 'DROPDOWN' && new Set(options.map(o => o.toLowerCase())).size !== options.length ? 'Two choices are the same.'
    : null
  const create = useMutation({
    mutationFn: () => extraFieldsApi.create({
      entityType: f.entityType, label: f.label.trim(), type: f.type, options: f.type === 'DROPDOWN' ? options : undefined,
      hint: f.hint.trim() || undefined, required: f.required, print: PRINTABLE.has(f.entityType) && f.print,
    }),
    onSuccess: c => {
      toast.success(`${c.fieldLabel} added: it's on the ${name(c.entityType).toLowerCase()} forms now`)
      qc.invalidateQueries({ queryKey: ['company-fields'] }); qc.invalidateQueries({ queryKey: ['extra-fields'] })
      onDone()
    },
    onError: e => toast.error(apiError(e, 'The field could not be added')),
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))
  return (
    <div className="rounded-xl p-3 mt-3 space-y-3" style={{ border: '1px solid var(--border)' }} data-testid="field-add">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><label className="label" htmlFor="nf-entity">For</label>
          <select id="nf-entity" className="input h-10" value={f.entityType} onChange={e => set('entityType', e.target.value as EntityType)}>
            {ENTITY_ORDER.map(e => <option key={e} value={e}>{name(e)}</option>)}
          </select></div>
        <div><label className="label label-required" htmlFor="nf-label">Name</label>
          <input id="nf-label" className="input h-10" value={f.label} maxLength={200} placeholder="For example Vehicle number" onChange={e => set('label', e.target.value)} /></div>
        <div><label className="label" htmlFor="nf-type">Kind</label>
          <select id="nf-type" className="input h-10" value={f.type} onChange={e => set('type', e.target.value as FieldType)}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select></div>
      </div>
      {f.type === 'DROPDOWN' && (
        <div><label className="label label-required" htmlFor="nf-options">Choices</label>
          <input id="nf-options" className="input h-10" value={f.options} placeholder="Comma between them, for example Cash, Card, UPI" onChange={e => set('options', e.target.value)} /></div>
      )}
      <div><label className="label" htmlFor="nf-hint">Line under the field</label>
        <input id="nf-hint" className="input h-10" value={f.hint} maxLength={500} placeholder="What to type, for example As on the RC book" onChange={e => set('hint', e.target.value)} /></div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={f.required} onChange={e => set('required', e.target.checked)} />Required</label>
        {PRINTABLE.has(f.entityType) && (
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={f.print} onChange={e => set('print', e.target.checked)} />Print on invoices</label>
        )}
        <span className="flex-1" />
        {problem && f.label && <span className="text-xs" style={{ color: '#dc2626' }}>{problem}</span>}
        <button className="btn-ghost h-9 text-sm" onClick={onDone}>Cancel</button>
        <button className="btn-primary h-9 text-sm" disabled={!!problem || create.isPending} onClick={() => create.mutate()} data-testid="field-add-save">
          {create.isPending ? 'Adding…' : 'Add field'}
        </button>
      </div>
    </div>
  )
}
