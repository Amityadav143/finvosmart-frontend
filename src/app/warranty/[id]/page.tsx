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

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle2, FileText, PackageCheck, Printer, RotateCcw, Send, Truck, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { warrantyApi } from '@/lib/api/warranty'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { printHtml } from '@/lib/storeHelpers'
import { fmtDate } from '@/components/godown/GodownParts'
import { seller } from '@/components/godown/print'
import { qty } from '@/components/purchaseStore/StoreParts'
import { ClaimChip, Coverage, GodownSelect, SearchPicker } from '@/components/warranty/WarrantyParts'
import { acknowledgementHtml, replacementHtml, supplierChallanHtml } from '@/components/warranty/print'
import type { ClaimAction, ClaimItem, Resolution, WarrantyClaim } from '@/types/warranty'

type Step = Exclude<ClaimAction, 'CREDIT_NOTE' | 'PASS_ON' | 'SUPPLIER_CREDIT'>

const STEP: Record<Step, { label: string; icon: typeof Send; primary?: boolean; danger?: boolean }> = {
  APPROVE: { label: 'Approve', icon: CheckCircle2, primary: true },
  REJECT: { label: 'Reject', icon: XCircle },
  REOPEN: { label: 'Reopen', icon: RotateCcw },
  RECEIVE_UNIT: { label: 'Goods received', icon: PackageCheck },
  RETURN_REPAIRED: { label: 'Returned, repaired', icon: CheckCircle2, primary: true },
  ISSUE_REPLACEMENT: { label: 'Give the replacement', icon: PackageCheck, primary: true },
  SEND: { label: 'Send to the supplier', icon: Truck, primary: true },
  ACCEPT: { label: 'They accepted', icon: CheckCircle2, primary: true },
  SUPPLIER_REJECT: { label: 'They rejected it', icon: XCircle },
  APPEAL: { label: 'Appeal', icon: Send, primary: true },
  SETTLE_GOODS: { label: 'Goods came back', icon: PackageCheck, primary: true },
  CLOSE: { label: 'Close, not recovered', icon: XCircle },
  CANCEL: { label: 'Cancel', icon: XCircle, danger: true },
}

/** One warranty claim: the goods and the fault, the warranty, the decision and what followed — with each next step. */
export default function ClaimPage() {
  const { id } = useParams<{ id: string }>()
  const { canAny } = usePermissions()
  const allowed = canAny('WARRANTY_CLAIMS')
  const [step, setStep] = useState<Step | null>(null)
  const { data: c, isLoading, isError, error } = useQuery({ queryKey: ['warranty-claim', id], queryFn: () => warrantyApi.get(id), enabled: allowed })
  if (!allowed) return <PermissionGate anyOf={['WARRANTY_CLAIMS']} showDenied><span /></PermissionGate>
  if (isLoading) return <div className="card text-sm">Loading…</div>
  if (isError || !c) return <div className="card text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'This claim could not be opened.')}</div>
  const customer = c.kind === 'CUSTOMER'
  const steps = c.actions.filter((a): a is Step => a in STEP)
  const print = async (which: 'ack' | 'challan' | 'replacement') => {
    const s = await seller()
    printHtml(which === 'ack' ? acknowledgementHtml(c, s) : which === 'challan' ? supplierChallanHtml(c, s) : replacementHtml(c, s))
  }
  const facts: [string, React.ReactNode][] = [
    [customer ? 'Customer' : 'Supplier', <>{c.partyName}{c.contactPhone && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{c.contactPhone}</span>}</>],
    ['Bought on', <>{c.invoiceNumber && c.invoiceId ? <Link href={`/invoicing/${c.invoiceId}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{c.invoiceNumber}</Link>
      : c.grnNumber && c.grnId ? <Link href={`/procurement/grn/${c.grnId}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{c.grnNumber}</Link>
      : c.billNumber && c.billId ? <Link href={`/purchases/bills/${c.billId}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{c.billNumber}</Link>
      : c.sourceDoc || '—'}{c.sourceDate && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(c.sourceDate)}</span>}</>],
    ['Goods', <>{c.description}<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{qty(c.quantity)} {c.unit ?? ''}{c.itemCode ? ` · ${c.itemCode}` : ''}{c.batchNo ? ` · batch ${c.batchNo}` : ''}</span></>],
    ['Serial number', c.serialNo || '—'],
    ...(c.values && c.claimedValue != null ? [[customer ? 'Value (as sold, before GST)' : 'Claimed (before GST)', inr(c.claimedValue)] as [string, React.ReactNode]] : []),
    ...(customer ? [['The goods', c.unitReceivedOn ? `Received ${fmtDate(c.unitReceivedOn)}${c.receivedWith ? ` with ${c.receivedWith}` : ''}` : 'Still with the customer'] as [string, React.ReactNode]]
      : [['Stock', c.fromStock ? (c.stockOut ? `Taken out of ${c.godownName ?? 'stock'} when sent` : `Leaves ${c.godownName ?? 'stock'} when sent`) : 'Not from stock'] as [string, React.ReactNode]]),
    ...(c.sentOn ? [['Sent', [fmtDate(c.sentOn), c.vehicleNo, c.transporter, c.lrNumber && `LR ${c.lrNumber}`, c.ewayBillNo && `e-way bill ${c.ewayBillNo}`].filter(Boolean).join(' · ')] as [string, React.ReactNode]] : []),
    ...(c.appeals ? [['Appeals', String(c.appeals)] as [string, React.ReactNode]] : []),
  ]
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href={`/warranty?kind=${c.kind}`} className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Warranty claims</Link>
          <h1 className="page-title flex items-center gap-2 flex-wrap">{c.number} <ClaimChip status={c.status} label={c.statusLabel} /></h1>
          <p className="page-subtitle">{customer ? 'A customer’s claim' : 'A claim on the supplier'} · {customer ? 'reported' : 'raised'} {fmtDate(c.claimDate)}{c.createdBy ? ` by ${c.createdBy}` : ''}
            {c.parent && <> · from <Link href={`/warranty/${c.parent.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{c.parent.number}</Link></>}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {customer && <button className="btn-secondary h-9" onClick={() => print('ack')} data-testid="claim-print-ack"><Printer className="w-4 h-4" aria-hidden />Acknowledgement</button>}
          {customer && c.replacementItem && <button className="btn-secondary h-9" onClick={() => print('replacement')} data-testid="claim-print-replacement"><Printer className="w-4 h-4" aria-hidden />Replacement challan</button>}
          {!customer && c.status !== 'CANCELLED' && <button className="btn-secondary h-9" onClick={() => print('challan')} data-testid="claim-print-challan"><Printer className="w-4 h-4" aria-hidden />Challan</button>}
        </div>
      </div>

      <section className="card space-y-2" aria-label="The warranty">
        <Coverage inWarranty={c.inWarranty} text={c.coverage} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[c.warrantyMonths != null && `${c.warrantyMonths} months`, c.warrantyFrom && `from ${fmtDate(c.warrantyFrom)}`,
          c.warrantyUntil && `till ${fmtDate(c.warrantyUntil)}`].filter(Boolean).join(' ') || 'No warranty period on the claim'}</p>
        <p className="text-sm"><span style={{ color: 'var(--text-muted)' }}>Fault:</span> {c.complaint}</p>
      </section>

      <dl className="card grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm" data-testid="claim-facts">
        {facts.map(([k, v]) => <div key={k}><dt className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</dt><dd className="font-medium">{v}</dd></div>)}
      </dl>

      {(c.resolution || c.decisionNote || c.status === 'REJECTED') && (
        <section className="card text-sm space-y-1" aria-label="The decision" data-testid="claim-decision">
          {c.resolutionLabel && <p><span style={{ color: 'var(--text-muted)' }}>{customer ? 'Settled by:' : 'The supplier:'}</span> <b>{c.resolutionLabel}</b>
            {c.goodwill && <span className="badge ml-2" style={{ color: '#b45309', background: 'rgba(245,158,11,0.14)' }}>Goodwill</span>}
            {c.values && c.acceptedValue != null && <> · accepted {inr(c.acceptedValue)}</>}</p>}
          {c.decisionNote && <p><span style={{ color: 'var(--text-muted)' }}>{c.status === 'REJECTED' ? 'Why rejected:' : 'Note:'}</span> {c.decisionNote}</p>}
          {c.decidedBy && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.decidedBy}{c.decidedAt ? `, ${fmtDate(c.decidedAt)}` : ''}</p>}
          {c.replacementItem && <p><span style={{ color: 'var(--text-muted)' }}>Replacement:</span> {c.replacementItem}{c.replacementSerial ? ` · serial ${c.replacementSerial}` : ''}</p>}
          {c.resolvedOn && <p><span style={{ color: 'var(--text-muted)' }}>{c.status === 'CLOSED' ? 'Closed' : customer ? 'Resolved' : 'Settled'} on</span> {fmtDate(c.resolvedOn)}{c.resolutionNote ? ` — ${c.resolutionNote}` : ''}
            {c.values && !customer && c.recoveredValue != null && c.status === 'SETTLED' && <> · recovered {inr(c.recoveredValue)}</>}</p>}
          {c.cancelReason && <p>Cancelled: {c.cancelReason}</p>}
        </section>
      )}

      {(c.creditNote || c.passedOn.length > 0) && (
        <section className="card text-sm space-y-1" aria-label="What followed">
          {c.creditNote && <p>{customer ? 'Credit note' : 'Supplier’s credit note'}: <Link href={customer ? `/invoicing/${c.creditNote.id}` : `/purchases/bills/${c.creditNote.id}`}
            className="underline font-mono" style={{ color: 'var(--gold)' }} data-testid="claim-credit-note">{c.creditNote.number}</Link> ({c.creditNote.statusLabel.toLowerCase()})</p>}
          {c.passedOn.map(p => <p key={p.id}>Claimed from the supplier: <Link href={`/warranty/${p.id}`} className="underline font-mono" style={{ color: 'var(--gold)' }}>{p.number}</Link> ({p.statusLabel.toLowerCase()})</p>)}
        </section>
      )}

      <div className="flex flex-wrap gap-2" data-testid="claim-steps">
        {c.actions.includes('CREDIT_NOTE') && canAny('INVOICE_CREATE') &&
          <Link href={`/invoicing/new?type=CREDIT_NOTE&claim=${c.id}`} className="btn-primary h-9" data-testid="claim-make-credit"><FileText className="w-4 h-4" aria-hidden />Make the credit note</Link>}
        {c.actions.includes('SUPPLIER_CREDIT') && canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') &&
          <Link href={`/purchases/bills/new?fromClaim=${c.id}`} className="btn-primary h-9" data-testid="claim-record-credit"><FileText className="w-4 h-4" aria-hidden />Record their credit note</Link>}
        {steps.map(a => {
          const S = STEP[a]
          return <button key={a} className={S.primary ? 'btn-primary h-9' : S.danger ? 'btn-ghost h-9' : 'btn-secondary h-9'} onClick={() => setStep(a)}
            data-testid={`claim-step-${a.toLowerCase()}`}><S.icon className="w-4 h-4" aria-hidden />{S.label}</button>
        })}
        {c.actions.includes('PASS_ON') && <Link href={`/warranty/new?from=${c.id}`} className="btn-secondary h-9" data-testid="claim-pass-on"><Truck className="w-4 h-4" aria-hidden />Claim it from the supplier</Link>}
      </div>
      {c.actions.includes('CREDIT_NOTE') && !canAny('INVOICE_CREATE') && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Someone who makes invoices makes the credit note from this claim.</p>}
      {c.actions.includes('SUPPLIER_CREDIT') && !canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE') && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Someone who records bills records the supplier’s credit note from this claim.</p>}

      <section className="card" aria-label="History">
        <h2 className="font-semibold mb-2">History</h2>
        <ol className="space-y-2" data-testid="claim-history">
          {c.history.map((e, i) => (
            <li key={i} className="text-sm flex gap-3"><span className="text-xs whitespace-nowrap pt-0.5" style={{ color: 'var(--text-muted)', minWidth: 92 }}>{fmtDate(e.at)}</span>
              <span><b>{e.label}</b>{e.by ? <span style={{ color: 'var(--text-muted)' }}> · {e.by}</span> : null}{e.note && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{e.note}</span>}</span></li>
          ))}
        </ol>
      </section>
      {step && <StepDialog c={c} step={step} onClose={() => setStep(null)} />}
    </div>
  )
}

/** The form each step asks for, and doing it. */
function StepDialog({ c, step, onClose }: { c: WarrantyClaim; step: Step; onClose: () => void }) {
  const qc = useQueryClient()
  const today = todayIST()
  const customer = c.kind === 'CUSTOMER'
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today)
  const [resolution, setResolution] = useState<Resolution | ''>('')
  const [goodwill, setGoodwill] = useState(false)
  const [value, setValue] = useState(c.claimedValue != null ? String(c.claimedValue) : '')
  const [godownId, setGodownId] = useState(c.godownId ?? '')
  const [other, setOther] = useState<ClaimItem | null>(null)
  const [serial, setSerial] = useState('')
  const [receivedWith, setReceivedWith] = useState('')
  const [vehicle, setVehicle] = useState(''); const [transporter, setTransporter] = useState(''); const [lr, setLr] = useState(''); const [eway, setEway] = useState('')
  const [intoStock, setIntoStock] = useState(c.resolution === 'REPLACE' || c.fromStock)
  const [batchNo, setBatchNo] = useState(''); const [expiry, setExpiry] = useState('')
  const [backIn, setBackIn] = useState(false)
  const run = useMutation({
    mutationFn: () => {
      switch (step) {
        case 'APPROVE': return warrantyApi.approve(c.id, { resolution: resolution as Resolution, note: note.trim() || null, goodwill })
        case 'REJECT': case 'SUPPLIER_REJECT': return warrantyApi.reject(c.id, note.trim())
        case 'REOPEN': return warrantyApi.reopen(c.id, note.trim() || undefined)
        case 'RECEIVE_UNIT': return warrantyApi.receive(c.id, { date, receivedWith: receivedWith.trim() || null })
        case 'RETURN_REPAIRED': return warrantyApi.returned(c.id, { date, note: note.trim() || null })
        case 'ISSUE_REPLACEMENT': return warrantyApi.replace(c.id, { godownId: godownId || null, itemId: other?.id ?? null, serial: serial.trim() || null, date, note: note.trim() || null })
        case 'SEND': return warrantyApi.send(c.id, { date, vehicleNo: vehicle || null, transporter: transporter || null, lrNumber: lr || null, ewayBillNo: eway || null, note: note.trim() || null })
        case 'ACCEPT': return warrantyApi.accept(c.id, { resolution: resolution as Resolution, acceptedValue: c.values && value !== '' ? Number(value) : null, note: note.trim() || null })
        case 'APPEAL': return warrantyApi.appeal(c.id, note.trim())
        case 'SETTLE_GOODS': return warrantyApi.goodsBack(c.id, { date, intoStock, godownId: intoStock ? godownId || null : null,
          batchNo: intoStock && c.itemByBatch ? batchNo || null : null, expiry: intoStock && c.itemByBatch && expiry ? expiry : null, serial: serial.trim() || null, note: note.trim() || null })
        case 'CLOSE': return warrantyApi.close(c.id, { note: note.trim(), backIntoStock: backIn, godownId: backIn ? godownId || null : null,
          batchNo: backIn && c.itemByBatch ? batchNo || null : null, expiry: backIn && c.itemByBatch && expiry ? expiry : null })
        case 'CANCEL': return warrantyApi.cancel(c.id, note.trim())
      }
    },
    onSuccess: () => {
      ['warranty-claim', 'warranty-claims', 'warranty-counts', 'items', 'inventory-items', 'stock-ledger'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
      toast.success(STEP[step].label === 'Cancel' ? 'Claim cancelled' : 'Done')
      onClose()
    },
    onError: (e: unknown) => toast.error(apiError(e, 'That could not be done.')),
  })
  const needNote = ['REJECT', 'SUPPLIER_REJECT', 'APPEAL', 'CLOSE', 'CANCEL'].includes(step) || (step === 'APPROVE' && goodwill)
  const needResolution = step === 'APPROVE' || step === 'ACCEPT'
  const outOfWarranty = c.inWarranty !== true
  const ready = (!needNote || note.trim()) && (!needResolution || resolution) && (step !== 'APPROVE' || !outOfWarranty || goodwill)
    && (!(step === 'SETTLE_GOODS' && intoStock && c.itemByBatch) || batchNo.trim()) && (!(step === 'CLOSE' && backIn && c.itemByBatch) || batchNo.trim())
  const titles: Record<Step, string> = {
    APPROVE: `Approve ${c.number}`, REJECT: `Reject ${c.number}`, REOPEN: `Reopen ${c.number}`, RECEIVE_UNIT: 'The goods were handed in',
    RETURN_REPAIRED: 'The repaired goods went back', ISSUE_REPLACEMENT: 'Give the replacement', SEND: `Send to ${c.partyName}`,
    ACCEPT: `${c.partyName} accepted the claim`, SUPPLIER_REJECT: `${c.partyName} rejected the claim`, APPEAL: 'Appeal the rejection',
    SETTLE_GOODS: c.resolution === 'REPLACE' ? 'Their replacement came' : 'The repaired goods came back', CLOSE: 'Close without recovering it', CANCEL: `Cancel ${c.number}`,
  }
  const choices: { value: Resolution; label: string; sub: string }[] = customer
    ? [{ value: 'REPAIR', label: 'Repair', sub: 'Repaired and given back; nothing moves in stock' },
       { value: 'REPLACE', label: 'Replace', sub: 'A replacement given from stock' },
       { value: 'CREDIT', label: 'Credit note', sub: 'What they paid credited; the faulty goods don’t go back into stock' }]
    : [{ value: 'CREDIT', label: 'Their credit note', sub: 'Recorded under Bills; it settles the claim' },
       { value: 'REPLACE', label: 'They replace it', sub: 'The replacement comes into stock when it arrives' },
       { value: 'REPAIR', label: 'They repair it', sub: 'The goods come back repaired' }]
  return (
    <Modal open onClose={onClose} title={titles[step]} subtitle={c.description + (c.serialNo ? ` · ${c.serialNo}` : '')}>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (ready) run.mutate() }} data-testid="claim-step-form">
        {needResolution && (
          <fieldset className="space-y-2"><legend className="label label-required">{customer ? 'How is it settled?' : 'How do they settle it?'}</legend>
            {choices.map(o => (
              <label key={o.value} className="flex items-start gap-2 text-sm cursor-pointer rounded-xl px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                <input type="radio" name="res" className="mt-0.5" checked={resolution === o.value} onChange={() => setResolution(o.value)} data-testid={`claim-res-${o.value.toLowerCase()}`} />
                <span><b>{o.label}</b><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{o.sub}</span></span>
              </label>
            ))}
          </fieldset>
        )}
        {step === 'APPROVE' && outOfWarranty && (
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={goodwill} onChange={e => setGoodwill(e.target.checked)} data-testid="claim-goodwill" />
            <span>Approve it as goodwill<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{c.inWarranty === false ? 'It is out of warranty' : 'Its warranty isn’t known'} — say why below.</span></span>
          </label>
        )}
        {step === 'ACCEPT' && c.values && (
          <div><label className="label" htmlFor="s-value">Value they accept, before GST (₹)</label>
            <input id="s-value" className="input h-10" inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} data-testid="claim-accepted-value" />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Claimed {c.claimedValue != null ? inr(c.claimedValue) : '—'}; less is a partly accepted claim.</p></div>
        )}
        {step === 'ISSUE_REPLACEMENT' && (
          <>
            <SearchPicker<ClaimItem> label="Another item instead (left out: the same item)" chosen={other} onChange={setOther} queryKey="items" search={q => warrantyApi.items(q)}
              title={x => x.name} sub={x => [x.code, x.keepsStock ? null : 'keeps no stock'].filter(Boolean).join(' · ')} testId="claim-replacement-item" />
            <GodownSelect value={godownId} onChange={setGodownId} label="Given from" testId="claim-godown" />
            {c.itemByBatch && !other && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kept by batch: the first batch to expire is given (never an expired one).</p>}
          </>
        )}
        {step === 'SETTLE_GOODS' && (
          <>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={intoStock} disabled={c.fromStock} onChange={e => setIntoStock(e.target.checked)} data-testid="claim-into-stock" />
              <span>Into stock<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{c.fromStock ? 'They were taken out of stock for this claim: they go back in.' : 'Untick when it goes straight to the customer whose claim it was.'}</span></span>
            </label>
            {intoStock && <GodownSelect value={godownId} onChange={setGodownId} label="Into" testId="claim-godown" />}
          </>
        )}
        {step === 'CLOSE' && c.fromStock && c.stockOut && (
          <>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={backIn} onChange={e => setBackIn(e.target.checked)} data-testid="claim-back-in" />
              <span>The goods came back: put them into stock again</span>
            </label>
            {backIn && <GodownSelect value={godownId} onChange={setGodownId} label="Into" testId="claim-godown" />}
          </>
        )}
        {((step === 'SETTLE_GOODS' && intoStock) || (step === 'CLOSE' && backIn)) && c.itemByBatch && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label label-required" htmlFor="s-batch">Batch number</label>
              <input id="s-batch" className="input h-10 font-mono uppercase" value={batchNo} onChange={e => setBatchNo(e.target.value)} maxLength={40} data-testid="claim-batch" /></div>
            <div><label className="label" htmlFor="s-exp">Expiry</label><input id="s-exp" type="date" className="input h-10" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
          </div>
        )}
        {step === 'SEND' && (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="s-veh">Vehicle</label><input id="s-veh" className="input h-10 uppercase" value={vehicle} onChange={e => setVehicle(e.target.value)} maxLength={20} data-testid="claim-vehicle" /></div>
            <div><label className="label" htmlFor="s-tr">Transporter</label><input id="s-tr" className="input h-10" value={transporter} onChange={e => setTransporter(e.target.value)} maxLength={150} /></div>
            <div><label className="label" htmlFor="s-lr">LR number</label><input id="s-lr" className="input h-10" value={lr} onChange={e => setLr(e.target.value)} maxLength={50} /></div>
            <div><label className="label" htmlFor="s-eway">E-way bill</label><input id="s-eway" className="input h-10 font-mono" value={eway} onChange={e => setEway(e.target.value)} maxLength={14} inputMode="numeric" /></div>
            {c.fromStock && <p className="col-span-2 text-xs" style={{ color: 'var(--text-muted)' }}>{qty(c.quantity)} {c.unit ?? ''} leave {c.godownName ?? 'the main godown'} now.</p>}
          </div>
        )}
        {step === 'RECEIVE_UNIT' && (
          <div><label className="label" htmlFor="s-with">Received with</label>
            <input id="s-with" className="input h-10" value={receivedWith} onChange={e => setReceivedWith(e.target.value)} maxLength={300} placeholder="Box, charger, bill copy" /></div>
        )}
        {(step === 'ISSUE_REPLACEMENT' || step === 'SETTLE_GOODS') && (
          <div><label className="label" htmlFor="s-serial">{step === 'ISSUE_REPLACEMENT' ? 'Serial number of the replacement' : 'Serial number of what came'}</label>
            <input id="s-serial" className="input h-10 font-mono uppercase" value={serial} onChange={e => setSerial(e.target.value)} maxLength={200} data-testid="claim-new-serial" /></div>
        )}
        {['RECEIVE_UNIT', 'RETURN_REPAIRED', 'ISSUE_REPLACEMENT', 'SEND', 'SETTLE_GOODS'].includes(step) && (
          <div><label className="label" htmlFor="s-date">Date</label><input id="s-date" type="date" className="input h-10" value={date} max={today} min={c.claimDate} onChange={e => setDate(e.target.value || today)} /></div>
        )}
        {step !== 'RECEIVE_UNIT' && (
          <div><label className={`label ${needNote ? 'label-required' : ''}`} htmlFor="s-note">{step === 'REJECT' ? 'Why is it rejected?' : step === 'SUPPLIER_REJECT' ? 'Why did they reject it?'
            : step === 'APPEAL' ? 'Why should they accept it?' : step === 'CLOSE' ? 'Why is it closed?' : step === 'CANCEL' ? 'Why is it cancelled?' : step === 'APPROVE' && goodwill ? 'Why as goodwill?' : 'Note'}</label>
            <input id="s-note" className="input h-10" value={note} onChange={e => setNote(e.target.value)} maxLength={500} data-testid="claim-note" /></div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary h-9" onClick={onClose}>Back</button>
          <button type="submit" className={step === 'CANCEL' ? 'btn-danger h-9' : 'btn-primary h-9'} disabled={!ready || run.isPending} data-testid="claim-step-ok">{STEP[step].label}</button>
        </div>
      </form>
    </Modal>
  )
}
