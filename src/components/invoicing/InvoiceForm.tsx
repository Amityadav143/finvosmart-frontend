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

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { crmApi } from '@/lib/api/crm'
import { invoicingApi, type InvoiceInput, type InvoiceLineInput } from '@/lib/api/invoicing'
import { ItemPicker, LinkedItem, StockChoice } from '@/components/inventory/ItemPicker'
import { computeInvoice, roundRupee, subMoney } from '@/lib/invoiceMath'
import { checkGstin } from '@/lib/gstin'
import { DOC_LABEL, GST_RATE_OPTIONS, PLACES_OF_SUPPLY, inr, stateName, todayIST } from '@/lib/money'
import { useDebounce } from '@/lib/hooks'
import type { Customer, Invoice, InvoiceType } from '@/types'
import { apiError } from '@/lib/utils'

interface CompanyInfo {
  name?: string; gstin?: string; state?: string; defaultPaymentTerms?: string; invoiceTerms?: string; invoiceNotes?: string
  msmeCategory?: string
}

interface Line extends InvoiceLineInput { key: string }

const TERMS = [
  { value: 'Due on receipt', label: 'Due on receipt' }, { value: 'Net 7', label: '7 days' }, { value: 'Net 15', label: '15 days' },
  { value: 'Net 30', label: '30 days' }, { value: 'Net 45', label: '45 days' }, { value: 'Net 60', label: '60 days' }, { value: 'Net 90', label: '90 days' },
]
const REFS: { key: keyof InvoiceInput; label: string; placeholder: string }[] = [
  { key: 'customerPoNumber', label: 'Customer PO no.', placeholder: 'PO/2026/001' },
  { key: 'workOrderNumber', label: 'Work order no.', placeholder: 'WO-2026-0045' },
  { key: 'contractNumber', label: 'Contract no.', placeholder: 'AMC/2026/07' },
  { key: 'ewayBillNumber', label: 'E-way bill no.', placeholder: '451234567890' },
  { key: 'lrNumber', label: 'LR / consignment no.', placeholder: 'LR-2026-789' },
  { key: 'dcReferenceNumber', label: 'Delivery challan ref.', placeholder: 'DC/26-27/000012' },
  { key: 'rfqNumber', label: 'RFQ / tender ref.', placeholder: 'RFQ-2026-099' },
  { key: 'additionalReference', label: 'Other reference', placeholder: '' },
]

let seq = 0
const newLine = (): Line => ({ key: `l${++seq}`, description: '', hsnSacCode: '', quantity: '1', unit: '', unitPrice: '', discountPct: '', gstRate: '18' })

/** Days of credit in payment terms such as "Net 30" or "Due on receipt". */
function termsDays(terms?: string): number | null {
  if (!terms) return null
  const t = terms.trim().toLowerCase()
  if (t.includes('receipt') || t.includes('immediate') || t === 'cash' || t === 'advance') return 0
  const net = t.match(/net\s*-?\s*(\d{1,3})/)          // "2/10 net 30" → 30 (same rule as the server)
  if (net) return Number(net[1])
  const m = t.match(/(\d{1,3})/)
  return m ? Number(m[1]) : null
}
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
const sellerStateCode = (c?: CompanyInfo) => {
  if (c?.gstin && /^\d{2}/.test(c.gstin)) return c.gstin.slice(0, 2)
  const s = (c?.state ?? '').trim().toLowerCase()
  return PLACES_OF_SUPPLY.find(p => p.name.toLowerCase() === s || p.code === s)?.code ?? ''
}
const customerStateCode = (c?: Partial<Customer>, gstin?: string) => {
  if (gstin && checkGstin(gstin).valid) return gstin.slice(0, 2)
  const s = (c?.state ?? '').trim().toLowerCase()
  return PLACES_OF_SUPPLY.find(p => p.name.toLowerCase() === s || p.code === s)?.code ?? ''
}

export function InvoiceForm({ invoice, defaultType = 'TAX_INVOICE', defaultCustomerId }: { invoice?: Invoice; defaultType?: InvoiceType; defaultCustomerId?: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const editing = !!invoice

  const { data: company } = useQuery<CompanyInfo>({ queryKey: ['company'], queryFn: () => api.get('/admin/company').then(r => r.data.data) })

  const [type, setType] = useState<InvoiceType>(invoice?.invoiceType ?? defaultType)
  const [date, setDate] = useState(invoice?.invoiceDate ?? todayIST())
  const [terms, setTerms] = useState(invoice?.paymentTerms ?? '')
  const [due, setDue] = useState(invoice?.dueDate ?? '')
  const [dueTouched, setDueTouched] = useState(!!invoice?.dueDate)
  const [customer, setCustomer] = useState<Partial<Customer> | null>(invoice ? { id: invoice.customerId, name: invoice.customerName, gstin: invoice.customerGstin } : null)
  const [gstin, setGstin] = useState(invoice?.customerGstin ?? '')
  const [billing, setBilling] = useState(invoice?.billingAddress ?? '')
  const [shipDifferent, setShipDifferent] = useState(!!invoice?.shippingAddress && invoice.shippingAddress !== invoice.billingAddress)
  const [shipping, setShipping] = useState(invoice?.shippingAddress ?? '')
  const [pos, setPos] = useState(invoice?.placeOfSupply ?? '')
  const [reverseCharge, setReverseCharge] = useState(!!invoice?.reverseCharge)
  const [lines, setLines] = useState<Line[]>(() => invoice?.lineItems?.length
    ? invoice.lineItems.map(l => ({ key: `l${++seq}`, itemId: l.itemId ?? undefined, description: l.description, hsnSacCode: l.hsnSacCode ?? '',
        quantity: String(l.quantity), unit: l.unit ?? '', unitPrice: String(l.unitPrice), discountPct: l.discountPct ? String(l.discountPct) : '',
        gstRate: String(l.gstRate ?? 0) }))
    : [newLine()])
  const [discount, setDiscount] = useState(invoice?.discountAmount && Number(invoice.discountAmount) > 0 && !invoice.lineItems?.some(l => Number(l.discountPct) > 0) ? String(invoice.discountAmount) : '')
  const [roundOff, setRoundOff] = useState(true)
  const [notes, setNotes] = useState(invoice?.notes ?? '')
  const [termsText, setTermsText] = useState(invoice?.terms ?? '')
  const [refs, setRefs] = useState<Record<string, string>>(() => Object.fromEntries(REFS.map(r => [r.key, (invoice as any)?.[r.key] ?? ''])))
  const [showRefs, setShowRefs] = useState(REFS.some(r => (invoice as any)?.[r.key]))
  // Tax invoices and credit notes move the stock of linked items when issued (the user can say no).
  const [updateStock, setUpdateStock] = useState(invoice ? invoice.movesStock !== false : true)
  const defaultsApplied = useRef(editing)

  // A new document for a given customer (e.g. "New quotation" from a lead that became a customer).
  const { data: presetCustomer } = useQuery({ queryKey: ['customer', defaultCustomerId], queryFn: () => crmApi.customers.get(defaultCustomerId!), enabled: !!defaultCustomerId && !editing })
  const presetApplied = useRef(false)
  useEffect(() => {
    if (!presetCustomer || presetApplied.current || customer?.id) return
    presetApplied.current = true
    setCustomer(presetCustomer)
    setGstin(presetCustomer.gstin ?? '')
    setBilling(presetCustomer.billingAddress ?? '')
    setShipping(presetCustomer.shippingAddress ?? '')
    if (presetCustomer.paymentTerms) { setTerms(presetCustomer.paymentTerms); setDueTouched(false) }
  }, [presetCustomer]) // eslint-disable-line react-hooks/exhaustive-deps

  // company defaults for a new invoice: terms, notes, terms & conditions
  useEffect(() => {
    if (!company || defaultsApplied.current) return
    defaultsApplied.current = true
    if (!terms) setTerms(company.defaultPaymentTerms || 'Net 30')
    if (!notes && company.invoiceNotes) setNotes(company.invoiceNotes)
    if (!termsText && company.invoiceTerms) setTermsText(company.invoiceTerms)
  }, [company]) // eslint-disable-line react-hooks/exhaustive-deps

  // due date follows the terms until the user picks one
  useEffect(() => {
    if (dueTouched) return
    const d = termsDays(terms)
    setDue(d === null || !date ? '' : addDays(date, d))
  }, [terms, date, dueTouched])

  const seller = sellerStateCode(company)
  const placeCode = pos || customerStateCode(customer ?? undefined, gstin) || seller
  const interState = !!seller && !!placeCode && seller !== placeCode
  const utgst = ['04', '26', '31', '35', '38'].includes(seller)

  const totals = useMemo(() => {
    try {
      const filled = lines.filter(l => String(l.description).trim() || l.unitPrice !== '')
      if (filled.length === 0) return { error: null as string | null, value: null }
      return { error: null, value: computeInvoice(filled.map(l => ({ quantity: l.quantity, rate: l.unitPrice === '' ? '0' : l.unitPrice, discountPct: l.discountPct || null, gstRate: l.gstRate })), interState, discount || null, roundOff) }
    } catch (e: any) {
      return { error: e.message as string, value: null }
    }
  }, [lines, interState, discount, roundOff])

  // Reverse charge: the GST is shown but the customer pays it to the government, so the total is the value only.
  const charged = useMemo(() => {
    if (!totals.value) return null
    if (!reverseCharge) return { total: totals.value.total, roundOff: totals.value.roundOff }
    const total = roundOff ? roundRupee(totals.value.taxable) : totals.value.taxable
    return { total, roundOff: subMoney(total, totals.value.taxable) }
  }, [totals.value, reverseCharge, roundOff])

  const taxCharged = totals.value && Number(totals.value.tax) > 0
  const unregistered = company && !company.gstin
  const msmeDays = due && date ? daysBetween(date, due) : 0
  const msmeWarning = company && ['MICRO', 'SMALL'].includes((company.msmeCategory ?? '').toUpperCase()) && msmeDays > 45
  const gstinCheck = gstin ? checkGstin(gstin) : null

  const setLine = (key: string, patch: Partial<Line>) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l)))
  const movesStockType = type === 'TAX_INVOICE' || type === 'CREDIT_NOTE'
  const linkedLines = lines.filter(l => l.itemId && String(l.description).trim()).length

  const save = useMutation({
    mutationFn: async (then: 'view' | 'send') => {
      const body: InvoiceInput = {
        invoiceType: type, invoiceDate: date, dueDate: due || null, customerId: customer!.id!,
        customerName: customer!.name, customerGstin: gstin || undefined, billingAddress: billing || undefined,
        shippingAddress: shipDifferent ? shipping || undefined : undefined, placeOfSupply: pos || undefined, reverseCharge,
        lineItems: lines.filter(l => String(l.description).trim()).map(l => ({
          itemId: l.itemId, description: String(l.description).trim(), hsnSacCode: l.hsnSacCode || undefined, quantity: l.quantity,
          unit: l.unit || undefined, unitPrice: l.unitPrice === '' ? 0 : l.unitPrice, discountPct: l.discountPct || 0, gstRate: l.gstRate,
        })),
        paymentTerms: terms || undefined, notes, terms: termsText, discountAmount: discount || null, roundOff,
        ...Object.fromEntries(Object.entries(refs).map(([k, v]) => [k, v.trim() || undefined])),
        ...(movesStockType ? { updateStock } : {}),
      }
      const saved = editing ? await invoicingApi.update(invoice!.id, body) : await invoicingApi.create(body)
      return { saved, then }
    },
    onSuccess: ({ saved, then }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['inv-stats'] })
      qc.setQueryData(['invoice', saved.id], saved)
      toast.success(editing ? 'Draft updated' : `Draft ${saved.invoiceNumber} saved`)
      router.push(`/invoicing/${saved.id}${then === 'send' ? '?send=1' : ''}`)
    },
    onError: (e: any) => toast.error(apiError(e, 'The invoice could not be saved')),
  })

  const problems: string[] = []
  if (!customer?.id) problems.push('Choose a customer')
  if (!lines.some(l => String(l.description).trim())) problems.push('Add at least one line')
  if (lines.some(l => String(l.description).trim() && (l.unitPrice === '' || Number(l.quantity) <= 0))) problems.push('Every line needs a quantity and a rate')
  if (totals.error) problems.push(totals.error)
  if (gstinCheck && !gstinCheck.valid) problems.push("The customer's GSTIN isn't valid")
  if (due && date && due < date) problems.push("The due date can't be before the invoice date")

  return (
    <div className="space-y-5">
      {/* ── Who and when ─────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Document</label>
            <select className="input h-10" value={type} onChange={e => setType(e.target.value as InvoiceType)} disabled={editing}>
              {Object.entries(DOC_LABEL).filter(([k]) => k !== 'OPENING_BALANCE').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label label-required">Date</label>
            <input className="input h-10" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Payment terms</label>
            <select className="input h-10" value={TERMS.some(t => t.value === terms) ? terms : terms ? '__custom' : ''} onChange={e => { setTerms(e.target.value === '__custom' ? terms : e.target.value); setDueTouched(false) }}>
              <option value="">—</option>
              {TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              {terms && !TERMS.some(t => t.value === terms) && <option value="__custom">{terms}</option>}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input className="input h-10" type="date" value={due} min={date} onChange={e => { setDue(e.target.value); setDueTouched(true) }} />
          </div>
        </div>
        {msmeWarning && (
          <Notice tone="amber">As a {company!.msmeCategory!.toLowerCase()} enterprise you are entitled to be paid within 45 days (MSMED Act, Section 15). These terms allow {msmeDays} days.</Notice>
        )}

        <CustomerPicker value={customer} onChange={c => {
          setCustomer(c)
          setGstin(c?.gstin ?? '')
          setBilling(c?.billingAddress ?? '')
          setShipping(c?.shippingAddress ?? '')
          if (c?.paymentTerms && !editing) { setTerms(c.paymentTerms); setDueTouched(false) }
          setPos('')
        }} />

        {customer && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Customer GSTIN</label>
              <input className="input h-10 font-mono uppercase" value={gstin} maxLength={15} placeholder="Unregistered customer"
                onChange={e => setGstin(e.target.value.toUpperCase().replace(/\s/g, ''))} />
              {gstinCheck && !gstinCheck.valid && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{gstinCheck.problems?.[0] ?? 'Not a valid GSTIN'}</p>}
            </div>
            <div>
              <label className="label">Place of supply</label>
              <select className="input h-10" value={pos} onChange={e => setPos(e.target.value)}>
                <option value="">{placeCode ? `${stateName(placeCode)} (${placeCode}) — from ${gstin ? 'GSTIN' : 'customer'}` : 'Choose the state'}</option>
                {PLACES_OF_SUPPLY.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {!seller ? 'Add your GSTIN or state in Settings → Company to work out the tax type.'
                  : interState ? 'Inter-state supply: IGST' : `Within the state: CGST + ${utgst ? 'UTGST' : 'SGST'}`}
              </p>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={reverseCharge} onChange={e => setReverseCharge(e.target.checked)} />
                Tax payable on reverse charge
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label">Billing address</label>
              <textarea className="input" rows={2} value={billing} onChange={e => setBilling(e.target.value)} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-1.5">
                <input type="checkbox" checked={shipDifferent} onChange={e => setShipDifferent(e.target.checked)} />
                Ship to a different address
              </label>
              {shipDifferent && <textarea className="input" rows={2} value={shipping} onChange={e => setShipping(e.target.value)} placeholder="Delivery address" />}
            </div>
          </div>
        )}
      </div>

      {/* ── Lines ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items and services</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rates exclude GST</span>
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => {
            const r = totals.value?.lines[lines.filter(x => String(x.description).trim() || x.unitPrice !== '').indexOf(l)]
            return (
              <div key={l.key} className="grid grid-cols-12 gap-2 items-start pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="col-span-12 md:col-span-4">
                  {i === 0 && <label className="label">Description</label>}
                  <ItemPicker value={String(l.description)} price="selling" placeholder="Item or service" label={`Line ${i + 1} description`}
                    onChange={v => setLine(l.key, { description: v })}
                    onPick={it => setLine(l.key, { itemId: it.id, description: it.itemName, hsnSacCode: it.hsnSacCode ?? '', unit: it.unit ?? '',
                      unitPrice: it.sellingPrice != null ? String(it.sellingPrice) : '', gstRate: String(it.gstRate ?? 18) })} />
                  {l.itemId && <LinkedItem itemId={l.itemId} quantity={l.quantity} selling={type === 'TAX_INVOICE' && updateStock}
                    onUnlink={() => setLine(l.key, { itemId: undefined })} />}
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">HSN/SAC</label>}
                  <input className="input h-10 font-mono" value={l.hsnSacCode ?? ''} maxLength={8} inputMode="numeric"
                    onChange={e => setLine(l.key, { hsnSacCode: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">Qty</label>}
                  <input className="input h-10 text-right" value={l.quantity} inputMode="decimal" onChange={e => setLine(l.key, { quantity: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">Unit</label>}
                  <input className="input h-10" value={l.unit ?? ''} placeholder="nos" maxLength={20} onChange={e => setLine(l.key, { unit: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">Rate (₹)</label>}
                  <input className="input h-10 text-right" value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={e => setLine(l.key, { unitPrice: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">Disc %</label>}
                  <input className="input h-10 text-right" value={l.discountPct ?? ''} inputMode="decimal" placeholder="0" onChange={e => setLine(l.key, { discountPct: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  {i === 0 && <label className="label">GST</label>}
                  <select className="input h-10" value={String(l.gstRate)} onChange={e => setLine(l.key, { gstRate: e.target.value })}>
                    {GST_RATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}%</option>)}
                    {!GST_RATE_OPTIONS.some(o => o.value === String(l.gstRate)) && <option value={String(l.gstRate)}>{String(l.gstRate)}%</option>}
                  </select>
                </div>
                <div className="col-span-10 md:col-span-1 text-right">
                  {i === 0 && <label className="label">Amount</label>}
                  <p className="font-mono text-sm h-10 flex items-center justify-end">{r ? inr(r.total) : '—'}</p>
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {i === 0 && <label className="label">&nbsp;</label>}
                  <button type="button" className="btn-icon w-9 h-10" aria-label="Remove line" disabled={lines.length === 1}
                    onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))}><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" className="btn-secondary h-9 mt-3" onClick={() => setLines(ls => [...ls, newLine()])}><Plus size={14} />Add line</button>
        {movesStockType && linkedLines > 0 && (
          <StockChoice direction={type === 'CREDIT_NOTE' ? 'salesReturn' : 'sale'} checked={updateStock} onChange={setUpdateStock} linked={linkedLines} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <div>
              <label className="label">Notes (printed on the invoice)</label>
              <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your business." />
            </div>
            <div>
              <label className="label">Terms and conditions</label>
              <textarea className="input" rows={3} value={termsText} onChange={e => setTermsText(e.target.value)} placeholder="Interest at 18% p.a. on payments after the due date." />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm" style={{ color: 'var(--text-secondary)' }} htmlFor="inv-discount">Discount on the whole invoice (₹)</label>
              <input id="inv-discount" className="input h-9 w-36 text-right" value={discount} inputMode="decimal" placeholder="0.00" onChange={e => setDiscount(e.target.value)} />
            </div>
            {totals.value && (
              <>
                {Number(totals.value.discount) > 0 && <Row label="Value before discount" value={inr(totals.value.subtotal)} />}
                {Number(totals.value.discount) > 0 && <Row label="Discount" value={'−' + inr(totals.value.discount)} />}
                <Row label="Taxable value" value={inr(totals.value.taxable)} />
                {reverseCharge && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reverse charge: your customer pays this GST to the government — it's shown on the invoice but not added to the total.</p>}
                {interState ? <Row label="IGST" value={inr(totals.value.igst)} /> : <>
                  <Row label="CGST" value={inr(totals.value.cgst)} />
                  <Row label={utgst ? 'UTGST' : 'SGST'} value={inr(totals.value.sgst)} />
                </>}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} /> Round off to the rupee
                  </label>
                  <span className="font-mono">{Number(charged?.roundOff) === 0 ? '0.00' : (Number(charged?.roundOff) > 0 ? '+' : '') + charged?.roundOff}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="font-semibold">Total</span>
                  <span className="font-serif text-2xl">{inr(charged?.total ?? totals.value.total)}</span>
                </div>
              </>
            )}
            {totals.error && <p className="text-sm" style={{ color: '#dc2626' }}>{totals.error}</p>}
          </div>
        </div>
      </div>

      {/* ── References ────────────────────────────────────────────────── */}
      <div className="card">
        <button type="button" className="w-full flex items-center justify-between" onClick={() => setShowRefs(v => !v)}>
          <span className="font-semibold text-sm">Reference numbers <span className="font-normal" style={{ color: 'var(--text-muted)' }}>— PO, work order, e-way bill…</span></span>
          {showRefs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showRefs && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            {REFS.map(r => (
              <div key={r.key}>
                <label className="label">{r.label}</label>
                <input className="input h-9 text-sm" value={refs[r.key] ?? ''} placeholder={r.placeholder} maxLength={100}
                  onChange={e => setRefs(x => ({ ...x, [r.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </div>

      {unregistered && taxCharged && type === 'TAX_INVOICE' && (
        <Notice tone="amber">Your company has no GSTIN yet. You can save this draft, but add your GSTIN in <Link href="/settings/company" className="underline">Settings → Company</Link> before issuing invoices that charge GST.</Notice>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 -mx-5 md:-mx-6 -mb-5 md:-mb-6 px-5 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: problems.length ? '#d97706' : 'var(--text-muted)' }}>
          {problems.length ? problems[0] : totals.value ? `${type === 'TAX_INVOICE' ? 'Invoice' : DOC_LABEL[type]} total ${inr(totals.value.total)}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary h-10" onClick={() => router.back()}>Cancel</button>
          <button className="btn-secondary h-10" onClick={() => save.mutate('view')} disabled={problems.length !== 0 || save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save draft' : 'Save as draft'}
          </button>
          <button className="btn-primary h-10" onClick={() => save.mutate('send')} disabled={problems.length !== 0 || save.isPending}>Save and send</button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

export function Notice({ tone, children }: { tone: 'amber' | 'red' | 'blue'; children: React.ReactNode }) {
  const c = tone === 'red' ? '#dc2626' : tone === 'blue' ? '#2563eb' : '#d97706'
  return (
    <div className="flex items-start gap-2 text-sm rounded-xl px-3 py-2.5" style={{ background: `${c}14`, border: `1px solid ${c}40`, color: 'var(--text-primary)' }}>
      <AlertTriangle size={15} style={{ color: c, flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  )
}

/** Search the customer list; shows GSTIN and city to tell similar names apart. */
function CustomerPicker({ value, onChange }: { value: Partial<Customer> | null; onChange: (c: Partial<Customer> | null) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const query = useDebounce(q, 250)
  const { data, isFetching } = useQuery({ queryKey: ['customer-search', query], queryFn: () => crmApi.customers.list({ q: query || undefined, size: 8 }), enabled: open })
  const results = data?.content ?? []

  if (value?.id) {
    return (
      <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Bill to</p>
          <p className="font-semibold">{value.name}</p>
        </div>
        <button type="button" className="btn-ghost h-8 text-sm" onClick={() => { onChange(null); setQ(''); setOpen(true) }}>Change</button>
      </div>
    )
  }
  return (
    <div className="relative">
      <label className="label label-required">Customer</label>
      <input className="input h-10" value={q} placeholder="Search by name, email or GSTIN…" onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} onChange={e => { setQ(e.target.value); setOpen(true) }} aria-autocomplete="list" />
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
          {results.map(c => (
            <button type="button" key={c.id} className="w-full text-left px-3 py-2 hover:opacity-90" style={{ borderBottom: '1px solid var(--border)' }}
              onMouseDown={e => e.preventDefault()} onClick={() => { onChange(c); setOpen(false) }}>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[c.gstin, c.city, c.state].filter(Boolean).join(' · ') || c.email || '—'}</p>
            </button>
          ))}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              No customers found. <Link href="/crm/customers" className="underline">Add a customer</Link> first.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
