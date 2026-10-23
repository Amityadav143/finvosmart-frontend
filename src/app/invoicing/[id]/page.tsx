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

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Ban, Bell, Copy, CopyPlus, Download, ExternalLink, FileCheck2, IndianRupee, Mail, Package, Pencil, Send } from 'lucide-react'
import { invoicingApi, type InvoiceInput, type PaymentInput, type SendInput } from '@/lib/api/invoicing'
import { crmApi } from '@/lib/api/crm'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Notice } from '@/components/invoicing/InvoiceForm'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { formatDate, apiError } from '@/lib/utils'
import { DOC_LABEL, PAYMENT_MODES, STATUS_LABEL, inr, todayIST } from '@/lib/money'
import type { Invoice, InvoicePaymentRecord } from '@/types'
import { DocumentReview } from '@/components/ca/DocumentReview'

const errText = (e: any, fallback: string) => apiError(e, fallback)

/**
 * A new draft with the same customer, lines (and their links to items) and terms, dated today; a
 * fresh number is given on saving. (A quotation, proforma or challan becomes an invoice on the
 * server instead — see "Convert to invoice" — so the two stay linked.)
 */
function duplicateInvoice(src: Invoice): Promise<Invoice> {
  const lineDiscounts = (src.lineItems ?? []).some(l => Number(l.discountPct) > 0)
  const body: InvoiceInput = {
    invoiceType: src.invoiceType, invoiceDate: todayIST(), dueDate: null, customerId: src.customerId,
    customerName: src.customerName, customerGstin: src.customerGstin, billingAddress: src.billingAddress,
    shippingAddress: src.shippingAddress, placeOfSupply: src.placeOfSupply, reverseCharge: !!src.reverseCharge,
    lineItems: (src.lineItems ?? []).map(l => ({ itemId: l.itemId ?? undefined, description: l.description, hsnSacCode: l.hsnSacCode, quantity: l.quantity, unit: l.unit,
      unitPrice: l.unitPrice, discountPct: l.discountPct ?? 0, gstRate: l.gstRate })),
    paymentTerms: src.paymentTerms, notes: src.notes, terms: src.terms,
    discountAmount: !lineDiscounts && Number(src.discountAmount) > 0 ? src.discountAmount : null,
    roundOff: Number(src.totalAmount) % 1 === 0,
    customerPoNumber: src.customerPoNumber, additionalReference: src.additionalReference,
  }
  return invoicingApi.create(body)
}
const CONVERTIBLE = ['QUOTATION', 'PROFORMA', 'DELIVERY_CHALLAN']
const when = (iso?: string) => iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
const PAYABLE = ['TAX_INVOICE', 'DEBIT_NOTE', 'OPENING_BALANCE']

function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const search = useSearchParams()
  const qc = useQueryClient()
  const { can, canAny } = usePermissions()
  const [modal, setModal] = useState<'send' | 'pay' | 'cancel' | null>(null)
  const [voiding, setVoiding] = useState<InvoicePaymentRecord | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const { data: inv, isLoading, isError } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoicingApi.get(id) })
  const { data: payments = [] } = useQuery({ queryKey: ['invoice-payments', id], queryFn: () => invoicingApi.payments(id), enabled: !!inv && inv.status !== 'DRAFT' })

  // the PDF exactly as the customer gets it (refreshes when the invoice changes)
  useEffect(() => {
    if (!inv) return
    let url: string | null = null, cancelled = false
    invoicingApi.pdf(inv.id).then(blob => { if (!cancelled) { url = URL.createObjectURL(blob); setPdfUrl(url) } }).catch(() => setPdfUrl(null))
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [inv?.id, inv?.status, inv?.outstanding]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (search.get('send') === '1' && inv) setModal('send') }, [search, inv])

  const refresh = (updated?: Invoice) => {
    if (updated) qc.setQueryData(['invoice', id], updated)
    qc.invalidateQueries({ queryKey: ['invoice', id] })
    qc.invalidateQueries({ queryKey: ['invoice-payments', id] })
    qc.invalidateQueries({ queryKey: ['invoices'] })
    qc.invalidateQueries({ queryKey: ['inv-stats'] })
  }

  const issue = useMutation({ mutationFn: () => invoicingApi.issue(id), onSuccess: i => { refresh(i); toast.success(`${i.invoiceNumber} issued`) }, onError: (e: any) => toast.error(errText(e, 'Could not issue the invoice')) })
  const remind = useMutation({ mutationFn: () => invoicingApi.remind(id), onSuccess: r => { refresh(); toast.success(`Reminder emailed to ${r.emailedTo}`) }, onError: (e: any) => toast.error(errText(e, 'Could not send the reminder')) })
  const duplicate = useMutation({
    mutationFn: () => duplicateInvoice(inv!),
    onSuccess: copy => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success(`Copied as draft ${copy.invoiceNumber}`); router.push(`/invoicing/${copy.id}/edit`) },
    onError: (e: any) => toast.error(errText(e, 'The invoice could not be copied')),
  })
  const convert = useMutation({
    mutationFn: () => invoicingApi.convert(id),
    onSuccess: made => { qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['quotations'] }); qc.invalidateQueries({ queryKey: ['invoice', id] }); toast.success(`Invoice ${made.invoiceNumber} drafted from ${inv!.invoiceNumber} — check it and issue`); router.push(`/invoicing/${made.id}/edit`) },
    onError: (e: any) => { qc.invalidateQueries({ queryKey: ['invoice', id] }); toast.error(errText(e, 'The invoice could not be drafted')) },
  })
  const rzp = useMutation({ mutationFn: () => invoicingApi.paymentLink(id), onSuccess: url => { navigator.clipboard?.writeText(url).catch(() => {}); toast.success('Card / net-banking link copied'); window.open(url, '_blank', 'noopener') }, onError: (e: any) => toast.error(errText(e, 'Could not create the payment link')) })

  if (isLoading) return <SkeletonCard lines={8} />
  if (isError || !inv) return <div className="card text-sm" style={{ color: '#dc2626' }}>This invoice couldn't be loaded. It may not exist, or you may not have access.</div>

  const issued = !['DRAFT', 'CANCELLED'].includes(inv.status)
  const opening = inv.invoiceType === 'OPENING_BALANCE'
  // What this document did to stock (only tax invoices and credit notes with lines linked to items move it).
  const linked = (inv.lineItems ?? []).filter(l => l.itemId).length
  const credit = inv.invoiceType === 'CREDIT_NOTE'
  const stockNote = !inv.movesStock || linked === 0 || !['TAX_INVOICE', 'CREDIT_NOTE'].includes(inv.invoiceType) ? null
    : inv.status === 'DRAFT' ? `Issuing it ${credit ? 'puts' : 'takes'} ${linked} item${linked === 1 ? '' : 's'} ${credit ? 'back into' : 'out of'} stock`
    : inv.status === 'CANCELLED' ? 'Cancelled — its stock movements were reversed'
    : `${linked} item${linked === 1 ? '' : 's'} ${credit ? 'put back into' : 'taken out of'} stock`
  const payable = PAYABLE.includes(inv.invoiceType) && issued && Number(inv.outstanding) > 0
  const active = payments.filter(p => !p.voided)
  const download = async () => {
    try {
      const blob = await invoicingApi.pdf(inv.id, true)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${inv.invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_')}.pdf`; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { toast.error('The PDF could not be downloaded') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/invoicing" className="text-sm inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={14} />Invoices</Link>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h1 className="page-title font-mono">{inv.invoiceNumber}</h1>
            <StatusBadge status={inv.status} label={STATUS_LABEL[inv.status]} />
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {DOC_LABEL[inv.invoiceType]} · {inv.customerName} · {formatDate(inv.invoiceDate)}{inv.dueDate ? ` · due ${formatDate(inv.dueDate)}` : ''}
            {inv.customerId && <> · <Link href={`/statements/customer/${inv.customerId}`} style={{ color: 'var(--gold)' }}>customer statement</Link></>}
            {inv.sourceId && inv.sourceNumber && <> · made from {DOC_LABEL[inv.sourceType ?? 'QUOTATION']?.toLowerCase() ?? 'document'} <Link href={`/invoicing/${inv.sourceId}`} style={{ color: 'var(--gold)' }}>{inv.sourceNumber}</Link></>}
          </p>
          {inv.status !== 'CANCELLED' && <div className="mt-2"><DocumentReview type="INVOICE" id={String(id)} /></div>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary h-9" onClick={download}><Download size={15} />PDF</button>
          {inv.acceptedAt && !inv.convertedToId && inv.status !== 'CANCELLED' && (
        <Notice tone="blue">Accepted by <strong>{inv.acceptedBy}</strong> from the quotation link on {when(inv.acceptedAt)}.{can('INVOICE_CREATE') ? ' Convert it to an invoice when you’re ready.' : ''}</Notice>
      )}
      {CONVERTIBLE.includes(inv.invoiceType) && inv.convertedToId && (
            <Link className="btn-primary h-9" href={`/invoicing/${inv.convertedToId}`}><FileCheck2 size={15} />Open invoice {inv.convertedToNumber}</Link>
          )}
          {can('INVOICE_CREATE') && CONVERTIBLE.includes(inv.invoiceType) && !inv.convertedToId && inv.status !== 'CANCELLED' && (
            <button className="btn-primary h-9" disabled={convert.isPending} onClick={() => convert.mutate()} title="A tax invoice draft with the same customer and lines, linked to this document">
              <FileCheck2 size={15} />{convert.isPending ? 'Drafting…' : 'Convert to invoice'}
            </button>
          )}
          {can('INVOICE_CREATE') && !opening && (
            <button className="btn-secondary h-9" disabled={duplicate.isPending} onClick={() => duplicate.mutate()} title="A new draft with the same customer and lines, dated today">
              <CopyPlus size={15} />{duplicate.isPending ? 'Copying…' : 'Duplicate'}
            </button>
          )}
          {inv.status === 'DRAFT' && can('INVOICE_EDIT') && <button className="btn-secondary h-9" onClick={() => router.push(`/invoicing/${id}/edit`)}><Pencil size={15} />Edit</button>}
          {inv.status === 'DRAFT' && canAny('INVOICE_SEND', 'INVOICE_EDIT') && (
            <button className="btn-secondary h-9" disabled={issue.isPending} onClick={() => issue.mutate()} title="Issue without sending (e.g. handed over in person)">
              <FileCheck2 size={15} />{issue.isPending ? 'Issuing…' : 'Mark as issued'}
            </button>
          )}
          {inv.status !== 'CANCELLED' && can('INVOICE_SEND') && (
            <button className="btn-secondary h-9" onClick={() => setModal('send')}><Send size={15} />{inv.status === 'DRAFT' ? 'Issue and send' : 'Send'}</button>
          )}
          {payable && canAny('INVOICE_EDIT', 'FINANCE_CREATE') && (
            <button className="btn-primary h-9" onClick={() => setModal('pay')}><IndianRupee size={15} />Record payment</button>
          )}
        </div>
      </div>

      {inv.warning && <Notice tone="amber">{inv.warning}</Notice>}
      {inv.status === 'CANCELLED' && <Notice tone="red">Cancelled{inv.cancelledAt ? ` on ${when(inv.cancelledAt)}` : ''}{inv.cancelReason ? ` — ${inv.cancelReason}` : ''}. {opening ? 'The opening balance has been taken out of the books.' : 'The sale has been reversed in the books.'}</Notice>}
      {opening && inv.status !== 'CANCELLED' && <Notice tone="blue">An invoice from before you started using Finvosmart, carried over unpaid. It is in your books as an opening balance — not a sale, no GST — and is collected here like any invoice. Automatic reminders aren't sent for it; email one when you choose.</Notice>}
      {inv.status === 'DRAFT' && <Notice tone="blue">This is a draft: it isn't in your books and the customer can't see it yet. Issue it or send it when ready.</Notice>}
      {CONVERTIBLE.includes(inv.invoiceType) && inv.convertedToId && (
        <Notice tone="blue">Invoiced as <Link href={`/invoicing/${inv.convertedToId}`} className="underline font-semibold">{inv.convertedToNumber}</Link>{inv.convertedToStatus === 'DRAFT' ? ' (still a draft — issue it when ready)' : ''}.</Notice>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-0 overflow-hidden" style={{ minHeight: 560 }}>
          {pdfUrl ? (
            <iframe title={`${inv.invoiceNumber} PDF`} src={`${pdfUrl}#view=FitH`} className="w-full" style={{ height: 'min(80vh, 1000px)', border: 0, background: '#fff' }} />
          ) : (
            <div className="p-6 text-sm" style={{ color: 'var(--text-muted)' }}>Preparing the PDF…</div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card space-y-2 text-sm">
            <Line label="Total" value={inr(inv.totalAmount)} strong />
            {issued && <Line label="Received" value={inr(inv.paidAmount)} />}
            {issued && <Line label="Balance due" value={inr(inv.outstanding)} strong color={Number(inv.outstanding) > 0 ? undefined : '#16a34a'} />}
            {opening ? (
              <p className="pt-2 mt-1 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>Carried over as an opening balance — the GST on it was accounted for in your earlier books.</p>
            ) : <div className="pt-2 mt-1 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
              <Line label="Taxable value" value={inr(inv.taxableAmount)} />
              {inv.reverseCharge && <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>Reverse charge — your customer pays this GST to the government, so it isn't in the total:</p>}
              {Number(inv.igstAmount) > 0 ? <Line label="IGST" value={inr(inv.igstAmount)} /> : <>
                <Line label="CGST" value={inr(inv.cgstAmount)} /><Line label="SGST / UTGST" value={inr(inv.sgstAmount)} /></>}
              <Line label="Place of supply" value={inv.placeOfSupplyName ? `${inv.placeOfSupplyName} (${inv.placeOfSupply})` : '—'} />
            </div>}
          </div>

          {issued && inv.payUrl && (
            <div className="card space-y-3">
              <div>
                <h3 className="font-semibold text-sm">Customer's view-and-pay link</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>The customer sees this invoice and pays you by UPI or bank transfer. No login needed.</p>
              </div>
              <div className="flex gap-2">
                <input className="input h-9 text-xs font-mono" readOnly value={inv.payUrl} onFocus={e => e.target.select()} aria-label="Pay link" />
                <button className="btn-icon w-9 h-9" aria-label="Copy link" onClick={() => { navigator.clipboard?.writeText(inv.payUrl!); toast.success('Link copied') }}><Copy size={14} /></button>
                <a className="btn-icon w-9 h-9" aria-label="Open link" href={inv.payUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /></a>
              </div>
              <div className="flex gap-2 flex-wrap">
                {payable && can('INVOICE_SEND') && (
                  <button className="btn-secondary h-8 text-xs" disabled={remind.isPending} onClick={() => remind.mutate()}><Bell size={13} />{remind.isPending ? 'Sending…' : 'Email a reminder now'}</button>
                )}
                {payable && can('INVOICE_SEND') && (
                  <button className="btn-secondary h-8 text-xs" disabled={rzp.isPending} onClick={() => rzp.mutate()} title="Uses your own Razorpay account (Settings → Company → Payments)">
                    {rzp.isPending ? 'Creating…' : 'Card / net-banking link'}
                  </button>
                )}
              </div>
            </div>
          )}

          {issued && PAYABLE.includes(inv.invoiceType) && (
            <div className="card">
              <h3 className="font-semibold text-sm mb-2">Payments</h3>
              {payments.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No payments recorded yet.</p>}
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--bg-surface)', opacity: p.voided ? 0.6 : 1 }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold" style={{ textDecoration: p.voided ? 'line-through' : 'none' }}>{inr(p.amount)}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.paymentDate)} · {PAYMENT_MODES.find(m => m.value === p.mode)?.label ?? p.mode}</span>
                    </div>
                    {Number(p.tdsAmount) > 0 && <p className="text-xs mt-0.5">+ TDS deducted {inr(p.tdsAmount)}</p>}
                    {p.reference && <p className="text-xs mt-0.5 font-mono truncate" style={{ color: 'var(--text-muted)' }}>Ref {p.reference}</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {p.source === 'BANK' ? 'Matched from bank statement' : p.source === 'RAZORPAY' ? 'Paid online (Razorpay)' : p.source === 'LEGACY' ? 'Marked as paid earlier' : 'Recorded by hand'}
                    </p>
                    {p.voided
                      ? <p className="text-xs mt-1" style={{ color: '#dc2626' }}>Voided{p.voidReason ? ` — ${p.voidReason}` : ''}</p>
                      : can('FINANCE_EDIT') && <button className="text-xs mt-1 underline" style={{ color: 'var(--text-muted)' }} onClick={() => setVoiding(p)}>Void</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card text-sm space-y-1.5">
            <h3 className="font-semibold text-sm mb-1">Activity</h3>
            {inv.sentAt && <p><Mail size={13} className="inline mr-1.5" />Sent {when(inv.sentAt)}</p>}
            {inv.viewedAt && <p>👁 Opened by the customer {when(inv.viewedAt)}</p>}
            {(inv.reminderCount ?? 0) > 0 && <p><Bell size={13} className="inline mr-1.5" />{inv.reminderCount} reminder{inv.reminderCount === 1 ? '' : 's'} sent{inv.lastReminderAt ? `, last ${when(inv.lastReminderAt)}` : ''}</p>}
            {active.length > 0 && <p>₹ {active.length} payment{active.length === 1 ? '' : 's'} received</p>}
            {!inv.sentAt && !inv.viewedAt && !inv.reminderCount && active.length === 0 && !stockNote && <p style={{ color: 'var(--text-muted)' }}>Nothing yet.</p>}
            {stockNote && <p><Package size={13} className="inline mr-1.5" aria-hidden /><Link href="/inventory/stock" className="underline">{stockNote}</Link></p>}
          </div>

          {inv.status !== 'CANCELLED' && active.length === 0 && canAny('INVOICE_DELETE', 'FINANCE_EDIT') && (
            <button className="btn-ghost h-9 text-sm w-full" style={{ color: '#dc2626' }} onClick={() => setModal('cancel')}><Ban size={14} />Cancel this {inv.invoiceType === 'TAX_INVOICE' || opening ? 'invoice' : 'document'}</button>
          )}
        </div>
      </div>

      {modal === 'send' && <SendModal inv={inv} onClose={() => { setModal(null); if (search.get('send')) router.replace(`/invoicing/${id}`) }} onDone={i => refresh(i)} />}
      {modal === 'pay' && <PaymentModal inv={inv} onClose={() => setModal(null)} onDone={() => refresh()} />}
      {modal === 'cancel' && <CancelModal inv={inv} onClose={() => setModal(null)} onDone={i => refresh(i)} />}
      {voiding && <VoidModal payment={voiding} onClose={() => setVoiding(null)} onDone={() => refresh()} />}
    </div>
  )
}

function Line({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className={strong ? 'font-mono font-semibold' : 'font-mono'} style={{ color }}>{value}</span>
    </div>
  )
}

function SendModal({ inv, onClose, onDone }: { inv: Invoice; onClose: () => void; onDone: (i: Invoice) => void }) {
  const { data: customer } = useQuery({ queryKey: ['customer', inv.customerId], queryFn: () => crmApi.customers.get(inv.customerId) })
  const [form, setForm] = useState<SendInput>({ email: true, to: '', cc: '', message: '', whatsapp: false, phone: '' })
  useEffect(() => { if (customer) setForm(f => ({ ...f, to: f.to || customer.email || '', phone: f.phone || customer.phone || '' })) }, [customer])
  const send = useMutation({
    mutationFn: () => invoicingApi.send(inv.id, form),
    onSuccess: r => {
      onDone(r.invoice)
      toast.success(r.emailed ? `Emailed to ${r.emailedTo}` : 'Sent')
      if (r.whatsappStatus?.startsWith('NOT_SENT')) toast.error(`WhatsApp: ${r.whatsappStatus.replace('NOT_SENT: ', '')}`)
      onClose()
    },
    onError: (e: any) => toast.error(errText(e, 'The invoice could not be sent')),
  })
  return (
    <Modal open onClose={onClose} title={inv.status === 'DRAFT' ? 'Issue and send' : 'Send to the customer'}
      subtitle={inv.status === 'DRAFT' ? 'Sending issues the invoice: it gets its number in your books and a view-and-pay link.' : undefined}>
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.checked }))} />Email with the PDF attached</label>
        {form.email && (
          <div className="grid grid-cols-1 gap-3 pl-6">
            <div><label className="label label-required">To</label><input className="input h-10" type="email" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} placeholder="accounts@customer.com" /></div>
            <div><label className="label">Cc</label><input className="input h-10" value={form.cc} onChange={e => setForm(f => ({ ...f, cc: e.target.value }))} placeholder="Separate several with commas" /></div>
            <div><label className="label">Message</label><textarea className="input" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Leave empty for the standard message (amount, due date and how to pay)." /></div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.checked }))} />WhatsApp message</label>
        {form.whatsapp && (
          <div className="pl-6"><label className="label">WhatsApp number</label><input className="input h-10" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="98765 43210" /></div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={send.isPending || (!form.email && !form.whatsapp) || (form.email && !form.to)} onClick={() => send.mutate()}>
            <Send size={15} />{send.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function PaymentModal({ inv, onClose, onDone }: { inv: Invoice; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState<PaymentInput>({ amount: String(inv.outstanding), tdsAmount: '', paymentDate: todayIST(), mode: 'UPI', reference: '', notes: '' })
  const tds = Number(form.tdsAmount || 0), amount = Number(form.amount || 0)
  const left = Math.round((Number(inv.outstanding) - amount - tds) * 100) / 100
  const save = useMutation({
    mutationFn: () => invoicingApi.recordPayment(inv.id, { ...form, tdsAmount: form.tdsAmount || 0 }),
    onSuccess: () => { onDone(); toast.success('Payment recorded'); onClose() },
    onError: (e: any) => toast.error(errText(e, 'The payment could not be recorded')),
  })
  const tdsAt = (pct: number) => {
    const t = Math.round(Number(inv.taxableAmount) * pct / 100)        // TDS is rounded to the rupee (Section 288B)
    setForm(f => ({ ...f, tdsAmount: String(t), amount: String(Math.round((Number(inv.outstanding) - t) * 100) / 100) }))
  }
  return (
    <Modal open onClose={onClose} title="Record a payment" subtitle={`${inv.invoiceNumber} · balance due ${inr(inv.outstanding)}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label label-required">Amount received (₹)</label><input className="input h-10 text-right" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
          <div><label className="label label-required">Date received</label><input className="input h-10" type="date" max={todayIST()} value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} /></div>
          <div><label className="label">How</label>
            <select className="input h-10" value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
              {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></div>
          <div><label className="label">UTR / cheque / UPI ref.</label><input className="input h-10 font-mono" value={form.reference} maxLength={100} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} /></div>
        </div>
        <div>
          <label className="label">TDS deducted by the customer (₹)</label>
          <div className="flex gap-2 items-center flex-wrap">
            <input className="input h-10 w-36 text-right" inputMode="decimal" value={form.tdsAmount} placeholder="0" onChange={e => setForm(f => ({ ...f, tdsAmount: e.target.value }))} />
            {[1, 2, 10].map(p => <button key={p} type="button" className="btn-secondary h-8 text-xs" onClick={() => tdsAt(p)}>{p}% of taxable</button>)}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tax the customer kept under Section 194C/194J etc. It settles the invoice and is booked as TDS receivable — check Form 26AS.</p>
        </div>
        <div><label className="label">Note</label><input className="input h-10" value={form.notes} maxLength={1000} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        <p className="text-sm" style={{ color: left < 0 ? '#dc2626' : 'var(--text-secondary)' }}>
          {left < 0 ? `That is ${inr(-left)} more than the balance due.` : left === 0 ? 'This settles the invoice in full.' : `${inr(left)} will still be due.`}
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={save.isPending || left < 0 || amount + tds <= 0 || !form.paymentDate} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Record payment'}</button>
        </div>
      </div>
    </Modal>
  )
}

function VoidModal({ payment, onClose, onDone }: { payment: InvoicePaymentRecord; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const go = useMutation({
    mutationFn: () => invoicingApi.voidPayment(payment.id, reason),
    onSuccess: () => { onDone(); toast.success('Payment voided'); onClose() },
    onError: (e: any) => toast.error(errText(e, 'The payment could not be voided')),
  })
  return (
    <Modal open onClose={onClose} title="Void this payment?" subtitle={`${inr(payment.amount)} on ${formatDate(payment.paymentDate)}`} size="sm">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The payment stays on record, marked void, and its entry in the books is reversed. The invoice's balance goes back up.</p>
        <div><label className="label label-required">Reason</label><input className="input h-10" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="e.g. Recorded twice" /></div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Keep it</button>
          <button className="btn-danger h-10" disabled={!reason.trim() || go.isPending} onClick={() => go.mutate()}>{go.isPending ? 'Voiding…' : 'Void payment'}</button>
        </div>
      </div>
    </Modal>
  )
}

function CancelModal({ inv, onClose, onDone }: { inv: Invoice; onClose: () => void; onDone: (i: Invoice) => void }) {
  const [reason, setReason] = useState('')
  const go = useMutation({
    mutationFn: () => invoicingApi.cancel(inv.id, reason),
    onSuccess: i => { onDone(i); toast.success(`${i.invoiceNumber} cancelled`); onClose() },
    onError: (e: any) => toast.error(errText(e, 'The invoice could not be cancelled')),
  })
  return (
    <Modal open onClose={onClose} title={`Cancel ${inv.invoiceNumber}?`} size="sm">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {inv.status === 'DRAFT' ? 'The draft is kept, marked cancelled.'
            : inv.invoiceType === 'OPENING_BALANCE' ? 'The invoice is kept, marked cancelled, and its opening balance is taken out of your books (import it again if the amount was wrong).'
            : `The ${inv.invoiceType === 'TAX_INVOICE' ? 'invoice' : 'document'} is kept, marked cancelled, and ${inv.invoiceType === 'CREDIT_NOTE' ? 'the credit is' : 'the sale is'} reversed in your books${inv.movesStock && (inv.lineItems ?? []).some(l => l.itemId) ? (inv.invoiceType === 'CREDIT_NOTE' ? ' (and the returned items come out of stock again)' : ' (and its items go back into stock)') : ''}. If it was reported in GSTR-1 already, issue a ${inv.invoiceType === 'CREDIT_NOTE' ? 'debit' : 'credit'} note instead.`}
        </p>
        <div><label className="label label-required">Reason</label><input className="input h-10" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} placeholder="e.g. Order cancelled by the customer" /></div>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary h-10" onClick={onClose}>Keep it</button>
          <button className="btn-danger h-10" disabled={!reason.trim() || go.isPending} onClick={() => go.mutate()}>{go.isPending ? 'Cancelling…' : 'Cancel invoice'}</button>
        </div>
      </div>
    </Modal>
  )
}

export default function InvoiceDetailPage() {
  return <Suspense fallback={<SkeletonCard lines={8} />}><InvoiceDetail /></Suspense>
}
