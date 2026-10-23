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
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Ban, BookCheck, IndianRupee, Package, Pencil, Receipt, Trash2 } from 'lucide-react'
import { billsApi } from '@/lib/api/purchases'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Notice } from '@/components/invoicing/InvoiceForm'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { formatDate } from '@/lib/utils'
import { PAYMENT_MODES, inr, todayIST } from '@/lib/money'
import { BILL_TYPE_LABEL, ITC_STATUS, billBadge, billStatusLabel, errText } from '@/lib/purchases'
import type { Bill, BillPaymentRecord } from '@/types/purchases'
import { DocumentReview } from '@/components/ca/DocumentReview'

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { canAny, can } = usePermissions()
  const [modal, setModal] = useState<'pay' | 'credit' | 'cancel' | 'delete' | null>(null)
  const [voiding, setVoiding] = useState<BillPaymentRecord | null>(null)

  const { data: bill, isLoading, isError } = useQuery({ queryKey: ['bill', id], queryFn: () => billsApi.get(id) })
  const { data: payments = [] } = useQuery({ queryKey: ['bill-payments', id], queryFn: () => billsApi.payments(id), enabled: !!bill && bill.status !== 'DRAFT' })
  const { data: accounts = [] } = useQuery({ queryKey: ['bill-accounts'], queryFn: billsApi.accounts, staleTime: 300_000 })
  const { data: credits = [] } = useQuery({ queryKey: ['bill-credits', id], queryFn: () => billsApi.openCreditNotes(id),
    enabled: !!bill && bill.billType !== 'CREDIT_NOTE' && ['OPEN', 'PARTIAL'].includes(bill.status) })

  const refresh = (b?: Bill) => {
    if (b) qc.setQueryData(['bill', id], b)
    qc.invalidateQueries({ queryKey: ['bill', id] })
    qc.invalidateQueries({ queryKey: ['bill-payments', id] })
    qc.invalidateQueries({ queryKey: ['bill-credits', id] })
    qc.invalidateQueries({ queryKey: ['bills'] })
    qc.invalidateQueries({ queryKey: ['payables'] })
  }
  const record = useMutation({ mutationFn: () => billsApi.record(id), onSuccess: b => { refresh(b); toast.success(`${b.referenceNumber} recorded in your books`) }, onError: (e: any) => toast.error(errText(e, 'Could not record the bill')) })

  if (isLoading) return <SkeletonCard lines={8} />
  if (isError || !bill) return <div className="card text-sm" style={{ color: '#dc2626' }}>This bill couldn't be loaded. It may not exist, or you may not have access.</div>

  const cn = bill.billType === 'CREDIT_NOTE'
  const open = bill.status === 'OPEN' || bill.status === 'PARTIAL'
  const standing = payments.filter(p => !p.voidedAt)
  const carried = bill.billType === 'OPENING_BALANCE'
  const editable = !carried && (bill.status === 'DRAFT' || (bill.status !== 'CANCELLED' && standing.length === 0))
  const canEdit = canAny('PROCUREMENT_CREATE', 'FINANCE_CREATE')
  const itc = ITC_STATUS[bill.itcStatus] ?? ITC_STATUS.NOT_CHECKED
  const intra = Number(bill.igstAmount) === 0
  // What this document did to stock (bills bring linked items in; supplier credit notes take returned goods out).
  const linkedItems = (bill.lines ?? []).filter(l => l.itemId).length
  const plural = linkedItems === 1 ? '' : 's'
  const stockNote = !bill.movesStock || linkedItems === 0 || carried ? null
    : bill.status === 'DRAFT' ? `Recording it ${cn ? 'takes' : 'brings'} ${linkedItems} item${plural} ${cn ? 'out of' : 'into'} stock`
    : bill.status === 'CANCELLED' ? 'Cancelled — its stock movements were reversed'
    : `${linkedItems} item${plural} ${cn ? 'taken out of' : 'brought into'} stock`

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/purchases" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Bills and payables</Link>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title font-mono">{bill.referenceNumber}</h1>
            <StatusBadge status={billBadge(bill)} label={billStatusLabel(bill)} />
            {bill.msmeCovered && <span className="badge s-amber">MSME supplier</span>}
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {BILL_TYPE_LABEL[bill.billType]} · {bill.vendorName}{bill.billNumber ? ` · their no. ${bill.billNumber}` : ''} · {formatDate(bill.billDate)}
            {bill.vendorId && <> · <Link href={`/statements/supplier/${bill.vendorId}`} style={{ color: 'var(--gold)' }}>supplier statement</Link></>}
            {bill.poId && bill.poNumber && <> · for <Link href={`/procurement/orders?open=${bill.poId}`} style={{ color: 'var(--gold)' }}>{bill.poNumber}</Link></>}
          </p>
          {bill.status !== 'CANCELLED' && <div className="mt-2"><DocumentReview type="BILL" id={String(id)} /></div>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {editable && canEdit && <button className="btn-secondary h-9" onClick={() => router.push(`/purchases/bills/${id}/edit`)}><Pencil size={15} />Edit</button>}
          {bill.status === 'DRAFT' && canEdit && (
            <button className="btn-primary h-9" disabled={record.isPending} onClick={() => record.mutate()}><BookCheck size={15} />{record.isPending ? 'Recording…' : 'Record in books'}</button>
          )}
          {open && !cn && credits.length > 0 && can('FINANCE_CREATE') && (
            <button className="btn-secondary h-9" onClick={() => setModal('credit')}><Receipt size={15} />Use credit note</button>
          )}
          {open && can('FINANCE_CREATE') && (
            <button className="btn-primary h-9" onClick={() => setModal('pay')}><IndianRupee size={15} />{cn ? 'Record refund' : 'Record payment'}</button>
          )}
        </div>
      </div>

      {bill.status === 'DRAFT' && <Notice tone="blue">This is a draft — it isn't in your books or payables yet. Record it when the details are final.</Notice>}
      {carried && bill.status !== 'CANCELLED' && <Notice tone="blue">A bill from before you started using Finvosmart, carried over unpaid. It is in your books as an opening balance — not a purchase, no GST credit or TDS — and is paid here like any bill.</Notice>}
      {bill.status === 'CANCELLED' && <Notice tone="red">Cancelled{bill.cancelledAt ? ` on ${formatDate(bill.cancelledAt)}` : ''}{bill.cancelReason ? ` — ${bill.cancelReason}` : ''}. Its entry in the books has been reversed.</Notice>}
      {bill.msmeLate && <Notice tone="red">Past the MSMED Act limit ({formatDate(bill.msmePayBy)}): pay {bill.vendorName} now. Interest at three times the RBI bank rate runs from the day after the limit, and the expense is deductible only in the year it is paid.</Notice>}
      {!bill.msmeLate && bill.msmeCovered && open && bill.msmePayBy && <Notice tone="blue">{bill.vendorName} is a {String(bill.vendorMsmeCategory).toLowerCase()} enterprise — pay by <strong>{formatDate(bill.msmePayBy)}</strong> (MSMED Act, Section 15).</Notice>}
      {(bill.warnings ?? []).filter(w => !w.startsWith('Past the MSMED')).map(w => <Notice key={w} tone="amber">{w}</Notice>)}
      {stockNote && <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><Package size={14} aria-hidden /><Link href="/inventory/stock" className="underline">{stockNote}</Link></p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th className="text-left font-medium px-4 py-3">Description</th>
                  <th className="text-left font-medium px-3 py-3">Account</th>
                  <th className="text-right font-medium px-3 py-3">Qty</th>
                  <th className="text-right font-medium px-3 py-3">Rate</th>
                  <th className="text-right font-medium px-3 py-3">GST</th>
                  <th className="text-right font-medium px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {bill.lines.map((l, i) => (
                  <tr key={l.id ?? i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3">
                      <p>{l.description}</p>
                      {l.hsnSacCode && <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>HSN/SAC {l.hsnSacCode}</p>}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{accounts.find(a => a.code === l.accountCode)?.name ?? l.accountCode}</td>
                    <td className="px-3 py-3 text-right font-mono">{Number(l.quantity)}{l.unit ? ` ${l.unit}` : ''}</td>
                    <td className="px-3 py-3 text-right font-mono">{inr(l.unitPrice)}{Number(l.discountPct) > 0 ? <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>less {Number(l.discountPct)}%</span> : null}</td>
                    <td className="px-3 py-3 text-right font-mono">{Number(l.gstRate)}%</td>
                    <td className="px-4 py-3 text-right font-mono">{inr(l.taxableAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-4 space-y-1.5 text-sm ml-auto" style={{ maxWidth: 380 }}>
              <Row label="Value before GST" value={inr(bill.taxableAmount)} />
              {intra ? <><Row label="CGST" value={inr(bill.cgstAmount)} /><Row label="SGST / UTGST" value={inr(bill.sgstAmount)} /></> : <Row label="IGST" value={inr(bill.igstAmount)} />}
              {bill.reverseCharge && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reverse charge: this GST is paid by you, not to the supplier.</p>}
              {Number(bill.roundOff) !== 0 && <Row label="Round off" value={(Number(bill.roundOff) > 0 ? '+' : '') + Number(bill.roundOff).toFixed(2)} />}
              <Row label={cn ? 'Credit note total' : 'Bill total'} value={inr(bill.totalAmount)} strong />
              {Number(bill.tdsAmount) > 0 && <Row label={`TDS deducted (${Number(bill.tdsRate)}%)`} value={'−' + inr(bill.tdsAmount)} />}
              {Number(bill.tdsAmount) > 0 && <Row label="Payable to the supplier" value={inr(bill.payableAmount)} strong />}
              {bill.status !== 'DRAFT' && bill.status !== 'CANCELLED' && <>
                <Row label={cn ? 'Used / refunded' : 'Paid'} value={inr(bill.paidAmount)} />
                <Row label={cn ? 'Left to use' : 'Balance to pay'} value={inr(bill.outstanding)} strong color={Number(bill.outstanding) > 0 ? undefined : '#16a34a'} />
              </>}
            </div>
          </div>
          {bill.notes && <div className="card text-sm"><h3 className="font-semibold mb-1">Notes</h3><p style={{ whiteSpace: 'pre-wrap' }}>{bill.notes}</p></div>}
        </div>

        <div className="space-y-5">
          <div className="card space-y-1.5 text-sm">
            <h3 className="font-semibold mb-1">Details</h3>
            <Row label="Supplier" value={bill.vendorName} plain />
            {bill.vendorGstin && <Row label="GSTIN" value={bill.vendorGstin} />}
            {bill.vendorPan && <Row label="PAN" value={bill.vendorPan} />}
            <Row label="Bill date" value={formatDate(bill.billDate)} plain />
            {bill.receivedDate && bill.receivedDate !== bill.billDate && <Row label="Received" value={formatDate(bill.receivedDate)} plain />}
            {bill.dueDate && !cn && <Row label="Due" value={formatDate(bill.dueDate)} plain />}
            {bill.msmePayBy && <Row label="MSMED Act limit" value={formatDate(bill.msmePayBy)} plain />}
            {bill.placeOfSupplyName && <Row label="Place of supply" value={`${bill.placeOfSupplyName} (${bill.placeOfSupply})`} plain />}
            {bill.tdsNatureLabel && <Row label="TDS" value={`${bill.tdsNatureLabel}${bill.tdsSection ? ` · ${bill.tdsSection}` : ''}`} plain />}
          </div>

          <div className="card text-sm space-y-1">
            <h3 className="font-semibold">GST credit (ITC)</h3>
            <p className="flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full" style={{ background: itc.color }} />{itc.label}{bill.itcPeriod ? ` · GSTR-2B ${bill.itcPeriod.slice(0, 2)}/${bill.itcPeriod.slice(2)}` : ''}</p>
            {bill.itcNote && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{bill.itcNote}</p>}
            {bill.itcStatus !== 'NA' && <Link href="/gst-reconciler" className="text-xs underline" style={{ color: 'var(--text-muted)' }}>Check against GSTR-2B</Link>}
          </div>

          {bill.status !== 'DRAFT' && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-2">{cn ? 'Used against bills and refunds' : 'Payments'}</h3>
              {payments.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{cn ? 'Not used yet.' : 'Nothing paid yet.'}</p>}
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--bg-surface)', opacity: p.voidedAt ? 0.6 : 1 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold" style={{ textDecoration: p.voidedAt ? 'line-through' : 'none' }}>{inr(p.amount)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.paymentDate)} · {p.mode === 'CREDIT_NOTE' ? 'Credit note' : PAYMENT_MODES.find(m => m.value === p.mode)?.label ?? p.mode}</span>
                    </div>
                    {p.mode === 'CREDIT_NOTE' && <p className="text-xs mt-0.5">{p.billReference ? `Used against ${p.billReference}` : `Credit note ${p.creditNoteReference ?? ''}`}</p>}
                    {p.reference && p.mode !== 'CREDIT_NOTE' && <p className="text-xs mt-0.5 font-mono truncate" style={{ color: 'var(--text-muted)' }}>Ref {p.reference}</p>}
                    {p.late && <p className="text-xs mt-0.5" style={{ color: '#dc2626' }}>Paid after the MSMED Act limit</p>}
                    {p.voidedAt
                      ? <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Voided{p.voidReason ? ` — ${p.voidReason}` : ''}</p>
                      : can('FINANCE_CREATE') && p.billId === bill.id && <button className="text-xs mt-1 underline" style={{ color: 'var(--text-muted)' }} onClick={() => setVoiding(p)}>Void</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canEdit && bill.status === 'DRAFT' && (
            <button className="btn-ghost h-9 text-sm w-full" style={{ color: '#dc2626' }} onClick={() => setModal('delete')}><Trash2 size={14} />Delete draft</button>
          )}
          {canEdit && bill.status !== 'DRAFT' && bill.status !== 'CANCELLED' && standing.length === 0 && (
            <button className="btn-ghost h-9 text-sm w-full" style={{ color: '#dc2626' }} onClick={() => setModal('cancel')}><Ban size={14} />Cancel this {cn ? 'credit note' : bill.billType === 'EXPENSE' ? 'expense' : 'bill'}</button>
          )}
        </div>
      </div>

      {modal === 'pay' && <PayModal bill={bill} onClose={() => setModal(null)} onDone={() => refresh()} />}
      {modal === 'credit' && <CreditModal bill={bill} credits={credits} onClose={() => setModal(null)} onDone={() => refresh()} />}
      {modal === 'cancel' && <CancelModal bill={bill} onClose={() => setModal(null)} onDone={b => refresh(b)} />}
      {modal === 'delete' && <DeleteModal bill={bill} onClose={() => setModal(null)} onDone={() => { qc.invalidateQueries({ queryKey: ['bills'] }); router.push('/purchases') }} />}
      {voiding && <VoidModal payment={voiding} onClose={() => setVoiding(null)} onDone={() => refresh()} />}
    </div>
  )
}

function Row({ label, value, strong, color, plain }: { label: string; value: string; strong?: boolean; color?: string; plain?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className={`${plain ? '' : 'font-mono'} ${strong ? 'font-semibold' : ''} text-right`} style={{ color }}>{value}</span>
    </div>
  )
}

function PayModal({ bill, onClose, onDone }: { bill: Bill; onClose: () => void; onDone: () => void }) {
  const cn = bill.billType === 'CREDIT_NOTE'
  const [form, setForm] = useState({ amount: String(bill.outstanding), paymentDate: todayIST(), mode: 'NEFT', reference: '', notes: '' })
  const amount = Number(form.amount || 0)
  const left = Math.round((Number(bill.outstanding) - amount) * 100) / 100
  const late = bill.msmeCovered && bill.msmePayBy && form.paymentDate > bill.msmePayBy
  const save = useMutation({
    mutationFn: () => billsApi.pay(bill.id, form),
    onSuccess: () => { onDone(); toast.success(cn ? 'Refund recorded' : 'Payment recorded'); onClose() },
    onError: (e: any) => toast.error(errText(e, 'The payment could not be recorded')),
  })
  return (
    <Modal open onClose={onClose} title={cn ? 'Record a refund from the supplier' : 'Record a payment'} subtitle={`${bill.referenceNumber} · ${bill.vendorName} · balance ${inr(bill.outstanding)}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label label-required">{cn ? 'Amount refunded (₹)' : 'Amount paid (₹)'}</label><input className="input h-10 text-right" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
          <div><label className="label label-required">Date</label><input className="input h-10" type="date" max={todayIST()} value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} /></div>
          <div><label className="label">How</label>
            <select className="input h-10" value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
              {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></div>
          <div><label className="label">UTR / cheque / UPI ref.</label><input className="input h-10 font-mono" value={form.reference} maxLength={100} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} /></div>
        </div>
        <div><label className="label">Note</label><input className="input h-10" value={form.notes} maxLength={1000} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        {late && !cn && <Notice tone="amber">This is after the MSMED Act limit ({formatDate(bill.msmePayBy)}) — interest is due to the supplier for the delay.</Notice>}
        <p className="text-sm" style={{ color: left < 0 ? '#dc2626' : 'var(--text-secondary)' }}>
          {left < 0 ? `That is ${inr(-left)} more than the balance.` : left === 0 ? (cn ? 'This uses up the credit note.' : 'This settles the bill in full.') : `${inr(left)} will still be ${cn ? 'left' : 'due'}.`}
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={save.isPending || left < 0 || amount <= 0 || !form.paymentDate} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : cn ? 'Record refund' : 'Record payment'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CreditModal({ bill, credits, onClose, onDone }: { bill: Bill; credits: Bill[]; onClose: () => void; onDone: () => void }) {
  const [creditNoteId, setCreditNoteId] = useState(credits[0]?.id ?? '')
  const chosen = credits.find(c => c.id === creditNoteId)
  const max = chosen ? Math.min(Number(chosen.outstanding), Number(bill.outstanding)) : 0
  const [amount, setAmount] = useState(String(max))
  const go = useMutation({
    mutationFn: () => billsApi.applyCredit(bill.id, { creditNoteId, amount }),
    onSuccess: () => { onDone(); toast.success('Credit note used'); onClose() },
    onError: (e: any) => toast.error(errText(e, 'The credit note could not be used')),
  })
  return (
    <Modal open onClose={onClose} title="Use a supplier credit note" subtitle={`${bill.referenceNumber} · balance ${inr(bill.outstanding)}`} size="sm">
      <div className="space-y-3">
        <div><label className="label">Credit note</label>
          <select className="input h-10" value={creditNoteId} onChange={e => { setCreditNoteId(e.target.value); const c = credits.find(x => x.id === e.target.value); if (c) setAmount(String(Math.min(Number(c.outstanding), Number(bill.outstanding)))) }}>
            {credits.map(c => <option key={c.id} value={c.id}>{c.referenceNumber}{c.billNumber ? ` (${c.billNumber})` : ''} — {inr(c.outstanding)} left</option>)}
          </select></div>
        <div><label className="label">Amount to use (₹)</label><input className="input h-10 text-right" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No money moves: the credit note reduces what you owe on this bill. Both stay in your books as they are.</p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={go.isPending || !creditNoteId || Number(amount) <= 0 || Number(amount) > max} onClick={() => go.mutate()}>{go.isPending ? 'Saving…' : 'Use credit note'}</button>
        </div>
      </div>
    </Modal>
  )
}

function VoidModal({ payment, onClose, onDone }: { payment: BillPaymentRecord; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const go = useMutation({
    mutationFn: () => billsApi.voidPayment(payment.id, reason),
    onSuccess: () => { onDone(); toast.success('Voided'); onClose() },
    onError: (e: any) => toast.error(errText(e, 'Could not void it')),
  })
  return (
    <Modal open onClose={onClose} title={payment.mode === 'CREDIT_NOTE' ? 'Undo using this credit note?' : 'Void this payment?'} subtitle={`${inr(payment.amount)} on ${formatDate(payment.paymentDate)}`} size="sm">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>It stays on record, marked void{payment.mode === 'CREDIT_NOTE' ? '' : ', and its entry in the books is reversed'}. The balance goes back up.</p>
        <div><label className="label label-required">Reason</label><input className="input h-10" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="e.g. Entered twice" /></div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Keep it</button>
          <button className="btn-danger h-10" disabled={!reason.trim() || go.isPending} onClick={() => go.mutate()}>{go.isPending ? 'Voiding…' : 'Void'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CancelModal({ bill, onClose, onDone }: { bill: Bill; onClose: () => void; onDone: (b: Bill) => void }) {
  const [reason, setReason] = useState('')
  const go = useMutation({
    mutationFn: () => billsApi.cancel(bill.id, reason),
    onSuccess: b => { onDone(b); toast.success(`${b.referenceNumber} cancelled`); onClose() },
    onError: (e: any) => toast.error(errText(e, 'Could not cancel it')),
  })
  return (
    <Modal open onClose={onClose} title={`Cancel ${bill.referenceNumber}?`} size="sm">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>It is kept, marked cancelled, and its entry in the books is reversed. Use this for a bill entered by mistake; for goods returned, enter the supplier's credit note instead.</p>
        <div><label className="label label-required">Reason</label><input className="input h-10" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="e.g. Entered twice" /></div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Keep it</button>
          <button className="btn-danger h-10" disabled={!reason.trim() || go.isPending} onClick={() => go.mutate()}>{go.isPending ? 'Cancelling…' : 'Cancel it'}</button>
        </div>
      </div>
    </Modal>
  )
}

function DeleteModal({ bill, onClose, onDone }: { bill: Bill; onClose: () => void; onDone: () => void }) {
  const go = useMutation({
    mutationFn: () => billsApi.remove(bill.id),
    onSuccess: () => { toast.success('Draft deleted'); onDone() },
    onError: (e: any) => toast.error(errText(e, 'Could not delete the draft')),
  })
  return (
    <Modal open onClose={onClose} title={`Delete draft ${bill.referenceNumber}?`} size="sm">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The draft was never in your books, so nothing else changes.</p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Keep it</button>
          <button className="btn-danger h-10" disabled={go.isPending} onClick={() => go.mutate()}>{go.isPending ? 'Deleting…' : 'Delete draft'}</button>
        </div>
      </div>
    </Modal>
  )
}
