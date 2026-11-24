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
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardCheck, DoorOpen, PackageCheck, Plus, RotateCcw, ShieldCheck, ShieldPlus, Truck, TrendingUp, Warehouse } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { storeReportsApi } from '@/lib/api/purchaseStore'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { StepTile } from '@/components/purchaseStore/StoreParts'

const ANY = ['GATE_ENTRY', 'PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'INVENTORY_VIEW']

/** The purchase store at a glance: what waits at each step from the gate to the shelf, and where to deal with it. */
export default function PurchaseStorePage() {
  const { canAny } = usePermissions()
  const allowed = canAny(...ANY)
  const { data: s, isLoading, isError, error } = useQuery({ queryKey: ['store-summary'], queryFn: storeReportsApi.summary, enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={ANY} showDenied><span /></PermissionGate>
  const receive = canAny('PROCUREMENT_RECEIVE')
  const gate = canAny('GATE_ENTRY', 'PROCUREMENT_RECEIVE')
  // where each figure leads, for the roles that open that page (as the menu decides)
  const to = {
    gate: canAny('GATE_ENTRY', 'PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE'),
    receipts: canAny('PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'INVENTORY_VIEW'),
    returns: canAny('PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE'),
    reports: canAny('PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT', 'FINANCE_VIEW'),
    rejections: canAny('PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'QUALITY_INSPECT'),
    notBilled: canAny('PROCUREMENT_VIEW', 'FINANCE_VIEW'),
    pending: canAny('PROCUREMENT_VIEW', 'PROCUREMENT_RECEIVE', 'GATE_ENTRY'),
    release: canAny('MATERIAL_REQUEST', 'MATERIAL_APPROVE', 'INVENTORY_VIEW', 'INVENTORY_ADJUST', 'INVENTORY_ADMIN'),
    planner: canAny('PROCUREMENT_VIEW', 'INVENTORY_VIEW'),
  }
  const link = (ok: boolean, href: string) => (ok ? href : null)
  const flow = [
    { icon: DoorOpen, title: 'Gate entry', text: 'Security records the consignment: supplier, their invoice or challan, the vehicle, LR and e-way bill.' },
    { icon: PackageCheck, title: 'Goods receipt (GRN)', text: 'The stores count it against the order: received, as per papers, damaged.' },
    { icon: ShieldCheck, title: 'Inspection', text: 'Items marked “inspect on receipt” wait for quality; only what passes goes into stock.' },
    { icon: Warehouse, title: 'Into stock', text: 'Accepted goods go into the receipt’s godown at the order’s rate; the order’s received quantities follow.' },
    { icon: RotateCcw, title: 'Rejections', text: 'What fails goes back to the supplier with a return challan; their credit note is recorded under Bills.' },
    { icon: ClipboardCheck, title: 'Bill & release', text: 'The supplier’s bill is made from the receipt and matched with the order; material is released to departments.' },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-title">Purchase store</h1>
          <p className="page-subtitle">From the gate to the shelf: consignments at the gate, goods being counted and inspected, rejected goods to send back, receipts waiting for the supplier’s bill, and deliveries due.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {gate && <Link href="/procurement/gate?new=1" className="btn-secondary h-10" data-testid="store-new-gate"><Truck className="w-4 h-4" aria-hidden />New gate entry</Link>}
          {receive && <Link href="/procurement/grn/new" className="btn-primary h-10" data-testid="store-new-grn"><Plus className="w-4 h-4" aria-hidden />New goods receipt</Link>}
        </div>
      </div>

      {isError && <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger-text)' }}>{apiError(error, 'The purchase store could not be loaded.')}</p>}

      <section aria-label="Waiting at each step">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="store-steps">
          <StepTile label="At the gate" value={isLoading ? '…' : s?.atGate ?? 0} sub="consignments waiting to be counted" href={link(to.gate, '/procurement/gate?status=AT_GATE')} tone={s?.atGate ? '#b45309' : undefined} testId="tile-gate" />
          <StepTile label="Being counted" value={isLoading ? '…' : s?.drafts ?? 0} sub="goods receipts not submitted" href={link(to.receipts, '/procurement/grn?status=DRAFT')} testId="tile-drafts" />
          <StepTile label="Awaiting inspection" value={isLoading ? '…' : s?.awaitingInspection ?? 0} sub="receipts waiting for quality" href={link(to.receipts, '/procurement/grn?status=INSPECTION')} tone={s?.awaitingInspection ? '#7c3aed' : undefined} testId="tile-inspection" />
          <StepTile label="Received today" value={isLoading ? '…' : s?.receivedToday ?? 0} sub="receipts into stock" href={link(to.receipts, `/procurement/grn?status=POSTED&from=${todayIST()}&to=${todayIST()}`)} tone={s?.receivedToday ? '#15803d' : undefined} testId="tile-today" />
        </div>
      </section>

      <section aria-label="To follow up">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="store-follow-up">
          <StepTile label="Rejected, to send back" value={isLoading ? '…' : s?.rejectedToReturn ?? 0} sub="lines waiting to go back" href={link(to.rejections, '/procurement/reports?tab=rejections')} tone={s?.rejectedToReturn ? '#b91c1c' : undefined} testId="tile-rejected" />
          <StepTile label="Received, not billed" value={isLoading ? '…' : s?.receivedNotBilled ?? 0}
            sub={s?.receivedNotBilledValue != null ? `${inr(s.receivedNotBilledValue)} with GST` : 'receipts without the supplier’s bill'} href={link(to.notBilled, '/procurement/reports?tab=not-billed')} testId="tile-not-billed" />
          <StepTile label="Deliveries overdue" value={isLoading ? '…' : s?.deliveriesOverdue ?? 0} sub={s ? `${s.deliveriesDue} due today` : 'orders past their date'} href={link(to.pending, '/procurement/pending')} tone={s?.deliveriesOverdue ? '#c2410c' : undefined} testId="tile-overdue" />
          <StepTile label="Material to release" value={isLoading ? '…' : s?.materialToIssue ?? 0} sub="approved requests to issue" href={link(to.release, '/inventory/requests')} testId="tile-release" />
        </div>
      </section>

      <section className="card" aria-label="How the purchase store works">
        <h2 className="font-semibold mb-3">How a consignment moves</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {flow.map((f, i) => (
            <li key={f.title} className="flex gap-3 rounded-xl p-3" style={{ background: 'var(--bg-surface)' }}>
              <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: 'var(--gold-muted)', color: 'var(--gold)' }}><f.icon className="w-4 h-4" aria-hidden /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{i + 1}. {f.title}</span>
                <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.text}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2 text-sm" data-testid="store-links">
        {to.pending && <Link href="/procurement/pending" className="btn-ghost h-9">Pending deliveries <ArrowRight className="w-4 h-4" aria-hidden /></Link>}
        {to.returns && <Link href="/procurement/returns" className="btn-ghost h-9">Returns to suppliers <ArrowRight className="w-4 h-4" aria-hidden /></Link>}
        {to.reports && <Link href="/procurement/reports" className="btn-ghost h-9">Purchase store reports <ArrowRight className="w-4 h-4" aria-hidden /></Link>}
        {to.planner && <Link href="/procurement/planner" className="btn-ghost h-9"><TrendingUp className="w-4 h-4" aria-hidden />Reorder planner</Link>}
        {canAny('WARRANTY_CLAIMS') && <Link href="/warranty?kind=SUPPLIER" className="btn-ghost h-9" data-testid="store-warranty"><ShieldPlus className="w-4 h-4" aria-hidden />Warranty claims on suppliers</Link>}
      </div>
    </div>
  )
}
