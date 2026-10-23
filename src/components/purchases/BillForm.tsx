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

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { billsApi, vendorsApi } from '@/lib/api/purchases'
import { Notice } from '@/components/invoicing/InvoiceForm'
import { ItemPicker, LinkedItem, StockChoice } from '@/components/inventory/ItemPicker'
import { addMoney, computeInvoice, roundRupee, subMoney } from '@/lib/invoiceMath'
import { checkGstin } from '@/lib/gstin'
import { GST_RATE_OPTIONS, PAYMENT_MODES, PLACES_OF_SUPPLY, inr, stateName, todayIST } from '@/lib/money'
import { BILL_TYPE_LABEL, TDS_NATURES, addDays, daysBetween, errText, msmeCovered, msmePayBy, termsDays } from '@/lib/purchases'
import { useDebounce } from '@/lib/hooks'
import { formatDate } from '@/lib/utils'
import type { PurchaseOrder, Vendor } from '@/types'
import type { Bill, BillInput, BillType, ItcDocument } from '@/types/purchases'

interface Line { key: string; itemId?: string; description: string; hsnSacCode: string; accountCode: string; quantity: string; unit: string; unitPrice: string; discountPct: string; gstRate: string }

const TERMS = [
  { value: 'Due on receipt', label: 'Due on receipt' }, { value: 'Net 7', label: '7 days' }, { value: 'Net 15', label: '15 days' },
  { value: 'Net 30', label: '30 days' }, { value: 'Net 45', label: '45 days' }, { value: 'Net 60', label: '60 days' }, { value: 'Net 90', label: '90 days' },
]

let seq = 0
const newLine = (account = ''): Line => ({ key: `b${++seq}`, description: '', hsnSacCode: '', accountCode: account, quantity: '1', unit: '', unitPrice: '', discountPct: '', gstRate: '18' })

const ourStateCode = (c?: { gstin?: string; state?: string }) => {
  if (c?.gstin && /^\d{2}/.test(c.gstin)) return c.gstin.slice(0, 2)
  const s = (c?.state ?? '').trim().toLowerCase()
  return PLACES_OF_SUPPLY.find(p => p.name.toLowerCase() === s || p.code === s)?.code ?? ''
}

export function BillForm({ bill, defaultType = 'BILL', fromDocument, fromPo }: { bill?: Bill; defaultType?: BillType; fromDocument?: ItcDocument | null; fromPo?: PurchaseOrder | null }) {
  const router = useRouter()
  const qc = useQueryClient()
  const editing = !!bill
  const today = todayIST()

  const { data: company } = useQuery<{ gstin?: string; state?: string }>({ queryKey: ['company'], queryFn: () => api.get('/admin/company').then(r => r.data.data) })
  const { data: accounts = [] } = useQuery({ queryKey: ['bill-accounts'], queryFn: billsApi.accounts })

  const [type, setType] = useState<BillType>(bill?.billType ?? defaultType)
  const [vendor, setVendor] = useState<Partial<Vendor> | null>(bill?.vendorId ? { id: bill.vendorId, name: bill.vendorName, gstin: bill.vendorGstin, msmeCategory: bill.vendorMsmeCategory, msmeActivity: bill.vendorMsmeActivity } : null)
  const [paidTo, setPaidTo] = useState(bill && !bill.vendorId ? bill.vendorName : '')
  const [gstin, setGstin] = useState(bill?.vendorGstin ?? '')
  const [number, setNumber] = useState(bill?.billNumber ?? '')
  const [date, setDate] = useState(bill?.billDate ?? today)
  const [received, setReceived] = useState(bill?.receivedDate && bill.receivedDate !== bill.billDate ? bill.receivedDate : '')
  const [terms, setTerms] = useState(bill?.paymentTerms ?? '')
  const [due, setDue] = useState(bill?.dueDate ?? '')
  const [dueTouched, setDueTouched] = useState(!!bill?.dueDate)
  const [pos, setPos] = useState(bill?.placeOfSupply ?? '')
  const [rcm, setRcm] = useState(!!bill?.reverseCharge)
  const [blocked, setBlocked] = useState(bill ? !bill.itcEligible : false)
  const [lines, setLines] = useState<Line[]>(() => bill?.lines?.length
    ? bill.lines.map(l => ({ key: `b${++seq}`, itemId: l.itemId, description: l.description, hsnSacCode: l.hsnSacCode ?? '', accountCode: l.accountCode ?? '',
        quantity: String(l.quantity), unit: l.unit ?? '', unitPrice: String(l.unitPrice), discountPct: Number(l.discountPct) ? String(l.discountPct) : '', gstRate: String(Number(l.gstRate)) }))
    : [newLine()])
  // When editing, tell rounding apart from a manual adjustment by recomputing the saved lines.
  const [initialRounding] = useState(() => editedRounding(bill))
  const [roundOff, setRoundOff] = useState(initialRounding.round)
  const [adjustment, setAdjustment] = useState(initialRounding.adjustment)
  const [tdsNature, setTdsNature] = useState(bill?.tdsNature ?? '')
  const [tdsOverride, setTdsOverride] = useState(bill && Number(bill.tdsAmount) > 0 ? String(bill.tdsAmount) : '')
  const [overrideTds, setOverrideTds] = useState(!!bill && Number(bill.tdsAmount) > 0)
  const [notes, setNotes] = useState(bill?.notes ?? '')
  const [payNow, setPayNow] = useState(!editing && defaultType === 'EXPENSE')
  const [payMode, setPayMode] = useState('CASH')
  const [payRef, setPayRef] = useState('')
  // Bills and expenses bring linked items into stock; a supplier credit note takes returned goods out.
  const [updateStock, setUpdateStock] = useState(bill ? bill.movesStock !== false : true)
  // The purchase order this bill is for (filled in from the order, or kept when editing).
  const [po, setPo] = useState<{ id: string; number?: string | null } | null>(bill?.poId ? { id: bill.poId, number: bill.poNumber } : null)
  const prefilled = useRef(false)

  // A bill for a purchase order: the supplier and the order's lines (items, quantities, rates, GST) filled in.
  useEffect(() => {
    if (!fromPo || prefilled.current || editing) return
    prefilled.current = true
    setType('BILL')
    setVendor({ id: fromPo.vendorId, name: fromPo.vendorName })
    setPo({ id: fromPo.id, number: fromPo.poNumber })
    if (fromPo.paymentTerms) { setTerms(fromPo.paymentTerms); setDueTouched(false) }
    const poLines = (fromPo.lineItems ?? []).map(l => ({ ...newLine(), itemId: l.itemId ?? undefined, description: l.description,
      hsnSacCode: l.hsnSacCode ?? '', quantity: String(Number(l.quantity)), unit: l.unit ?? '', unitPrice: String(Number(l.unitPrice)),
      gstRate: String(Number(l.gstRate ?? 0)) }))
    if (poLines.length) setLines(poLines)
  }, [fromPo]) // eslint-disable-line react-hooks/exhaustive-deps

  // A bill from the GST portal's GSTR-2B: supplier, number, date and amounts filled in.
  useEffect(() => {
    if (!fromDocument || prefilled.current) return
    prefilled.current = true
    setType(fromDocument.kind === 'CREDIT_NOTE' ? 'CREDIT_NOTE' : 'BILL')
    if (fromDocument.vendorId) setVendor({ id: fromDocument.vendorId, name: fromDocument.vendorName ?? fromDocument.supplierName })
    setGstin(fromDocument.supplierGstin ?? '')
    setNumber(fromDocument.number ?? '')
    if (fromDocument.date) setDate(fromDocument.date)
    if (fromDocument.placeOfSupply) setPos(fromDocument.placeOfSupply)
    setRcm(!!fromDocument.reverseCharge)
    setLines([{ ...newLine(), description: `As per ${fromDocument.kind === 'CREDIT_NOTE' ? 'credit note' : 'invoice'} ${fromDocument.number ?? ''}`.trim(),
      unitPrice: String(fromDocument.taxable), gstRate: String(Number(fromDocument.gstRate)) }])
  }, [fromDocument])

  // the supplier's defaults: terms, TDS, account
  const { data: vendorFull } = useQuery({ queryKey: ['vendor', vendor?.id], queryFn: () => vendorsApi.get(vendor!.id!), enabled: !!vendor?.id })
  const vendorApplied = useRef<string | undefined>(editing ? bill?.vendorId : undefined)
  useEffect(() => {
    if (!vendorFull || vendorApplied.current === vendorFull.id) return
    vendorApplied.current = vendorFull.id
    setGstin(vendorFull.gstin ?? '')
    if (vendorFull.paymentTerms) { setTerms(vendorFull.paymentTerms); setDueTouched(false) }
    setTdsNature(vendorFull.tdsNature ?? '')
    if (vendorFull.expenseAccountCode) setLines(ls => ls.map(l => (l.accountCode ? l : { ...l, accountCode: vendorFull.expenseAccountCode! })))
  }, [vendorFull])

  // due date follows the terms until the user picks one; an expense is due on the day
  useEffect(() => {
    if (dueTouched) return
    const d = termsDays(terms)
    setDue(d === null ? (type === 'EXPENSE' ? date : '') : addDays(date, d))
  }, [terms, date, dueTouched, type])

  const our = ourStateCode(company)
  const supplierState = gstin && checkGstin(gstin).valid ? gstin.slice(0, 2) : vendorFull?.stateCode ?? ''
  const placeCode = pos || our || supplierState
  const interState = !!supplierState && !!placeCode && supplierState !== placeCode
  const defaultAccount = vendorFull?.expenseAccountCode || '5000'

  const totals = useMemo(() => {
    try {
      const filled = lines.filter(l => l.description.trim() || l.unitPrice !== '')
      if (filled.length === 0) return { error: null as string | null, value: null }
      const r = computeInvoice(filled.map(l => ({ quantity: l.quantity, rate: l.unitPrice === '' ? '0' : l.unitPrice, discountPct: l.discountPct || null, gstRate: l.gstRate })),
        interState, null, roundOff && !rcm)
      const adj = adjustment.trim() === '' ? '0' : adjustment
      let total: string, round: string
      if (rcm) {
        const rounded = roundOff ? roundRupee(r.taxable) : r.taxable
        round = addMoney(subMoney(rounded, r.taxable), adj)
        total = addMoney(r.taxable, round)
      } else {
        round = addMoney(r.roundOff, adj)
        total = addMoney(r.total, adj)
      }
      return { error: null, value: { ...r, roundOff: round, total } }
    } catch (e: any) {
      return { error: e.message as string, value: null }
    }
  }, [lines, interState, roundOff, rcm, adjustment])

  // TDS suggestion from the server (knows this supplier's bills so far this year)
  const taxable = totals.value?.taxable ?? '0'
  const tdsKey = useDebounce(`${vendor?.id ?? ''}|${tdsNature}|${taxable}|${date}`, 400)
  const { data: tds } = useQuery({
    queryKey: ['tds-suggestion', tdsKey, bill?.id],
    queryFn: () => billsApi.tdsSuggestion({ vendorId: vendor?.id, nature: tdsNature || 'NONE', taxable, billDate: date, billId: bill?.id }),
    enabled: type !== 'CREDIT_NOTE' && !!tdsNature && Number(taxable) > 0,
  })
  const tdsAmount = type === 'CREDIT_NOTE' || !tdsNature ? '0.00' : overrideTds ? (tdsOverride || '0') : String(tds?.amount ?? '0')
  const payable = totals.value ? safeSub(totals.value.total, tdsAmount) : null

  // MSMED Act: micro and small suppliers must be paid within 45 days of accepting the goods/services
  const category = vendorFull?.msmeCategory ?? vendor?.msmeCategory
  const activity = vendorFull?.msmeActivity ?? vendor?.msmeActivity
  const covered = type !== 'CREDIT_NOTE' && msmeCovered(category, activity)
  const acceptance = received || date
  const agreed = due ? Math.max(0, daysBetween(acceptance, due)) : termsDays(terms)
  const legalPayBy = covered && acceptance ? msmePayBy(acceptance, agreed) : null
  const beyond45 = covered && due && daysBetween(acceptance, due) > 45

  const gstinCheck = gstin ? checkGstin(gstin) : null
  const tax = totals.value ? Number(totals.value.cgst) + Number(totals.value.sgst) + Number(totals.value.igst) : 0
  const setLine = (key: string, patch: Partial<Line>) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l)))

  const linkedLines = lines.filter(l => l.itemId && l.description.trim()).length
  const problems: string[] = []
  if (type !== 'EXPENSE' && !vendor?.id) problems.push('Choose the supplier')
  if (type === 'EXPENSE' && !vendor?.id && !paidTo.trim()) problems.push('Enter who was paid')
  if (type !== 'EXPENSE' && !number.trim()) problems.push(`Enter the supplier's ${type === 'CREDIT_NOTE' ? 'credit note' : 'invoice'} number`)
  if (!lines.some(l => l.description.trim())) problems.push('Add at least one line')
  if (lines.some(l => l.description.trim() && (l.unitPrice === '' || Number(l.quantity) <= 0))) problems.push('Every line needs a quantity and a rate')
  if (totals.error) problems.push(totals.error)
  if (gstinCheck && !gstinCheck.valid) problems.push("The supplier's GSTIN isn't valid")
  if (date > today) problems.push("The bill date can't be in the future")
  if (due && due < date) problems.push("The due date can't be before the bill date")
  if (adjustment && Math.abs(Number(adjustment)) > 10) problems.push('The adjustment can be at most ₹10 either way')
  if (overrideTds && totals.value && Number(tdsOverride || 0) > Number(totals.value.taxable)) problems.push("TDS can't be more than the value of the bill")

  const save = useMutation({
    mutationFn: async (draft: boolean) => {
      const body: BillInput = {
        billType: type, vendorId: vendor?.id, vendorName: vendor?.id ? undefined : paidTo.trim(), vendorGstin: gstin || undefined,
        billNumber: number.trim() || undefined, billDate: date, receivedDate: received || null, dueDate: due || null,
        paymentTerms: terms || undefined, placeOfSupply: pos || undefined, reverseCharge: rcm, itcEligible: !blocked,
        roundToRupee: roundOff, adjustment: adjustment.trim() === '' ? null : adjustment,
        tdsNature: type === 'CREDIT_NOTE' ? 'NONE' : tdsNature || 'NONE', tdsAmount: overrideTds && tdsNature ? (tdsOverride || '0') : null,
        notes: notes.trim() || undefined, draft,
        paidNow: !draft && payNow && type !== 'CREDIT_NOTE' ? { mode: payMode, reference: payRef.trim() || undefined, date } : null,
        poId: po?.id ?? null, updateStock,
        lines: lines.filter(l => l.description.trim()).map(l => ({
          itemId: l.itemId, description: l.description.trim(), hsnSacCode: l.hsnSacCode || undefined, accountCode: l.accountCode || undefined,
          quantity: l.quantity, unit: l.unit || undefined, unitPrice: l.unitPrice === '' ? 0 : l.unitPrice, discountPct: l.discountPct || 0, gstRate: l.gstRate,
        })),
      }
      return editing ? billsApi.update(bill!.id, body) : billsApi.create(body)
    },
    onSuccess: saved => {
      qc.invalidateQueries({ queryKey: ['bills'] })
      qc.invalidateQueries({ queryKey: ['payables'] })
      qc.setQueryData(['bill', saved.id], saved)
      toast.success(saved.status === 'DRAFT' ? `Draft ${saved.referenceNumber} saved` : `${saved.referenceNumber} recorded in your books`)
      router.push(`/purchases/bills/${saved.id}`)
    },
    onError: (e: any) => toast.error(errText(e, 'The bill could not be saved')),
  })

  return (
    <div className="space-y-5">
      {po && (
        <Notice tone="blue">
          {editing ? 'For' : 'Recording the bill for'} purchase order <Link href={`/procurement/orders?open=${po.id}`} className="underline font-semibold">{po.number ?? 'linked order'}</Link>
          {editing ? '.' : ' — the order’s lines are filled in. Check the quantities and rates against the supplier’s invoice.'}
          {!editing && <> <button type="button" className="underline" onClick={() => setPo(null)}>Not for this order</button></>}
        </Notice>
      )}
      {/* ── Supplier and dates ────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Document</label>
            <select className="input h-10" value={type} disabled={editing} onChange={e => { setType(e.target.value as BillType); setPayNow(e.target.value === 'EXPENSE') }}>
              {(Object.keys(BILL_TYPE_LABEL) as BillType[]).filter(k => k !== 'OPENING_BALANCE').map(k => <option key={k} value={k}>{BILL_TYPE_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <label className={type === 'EXPENSE' ? 'label' : 'label label-required'}>{type === 'CREDIT_NOTE' ? 'Credit note no.' : type === 'EXPENSE' ? 'Bill / receipt no.' : "Supplier's invoice no."}</label>
            <input className="input h-10 font-mono" value={number} maxLength={50} placeholder={type === 'EXPENSE' ? 'Optional' : 'As printed on their document'} onChange={e => setNumber(e.target.value)} />
          </div>
          <div>
            <label className="label label-required">{type === 'EXPENSE' ? 'Date' : 'Bill date'}</label>
            <input className="input h-10" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
          </div>
          {type !== 'CREDIT_NOTE' && (
            <div>
              <label className="label">Goods / services received</label>
              <input className="input h-10" type="date" value={received} max={today} onChange={e => setReceived(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{received ? '' : 'Same as the bill date'}</p>
            </div>
          )}
        </div>

        <VendorPicker value={vendor} allowFreeText={type === 'EXPENSE'} freeText={paidTo} onFreeText={setPaidTo}
          onChange={v => { setVendor(v); vendorApplied.current = undefined; if (!v) { setGstin(''); setTdsNature('') } }} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="label">Supplier GSTIN</label>
            <input className="input h-10 font-mono uppercase" value={gstin} maxLength={15} placeholder="Unregistered supplier"
              onChange={e => setGstin(e.target.value.toUpperCase().replace(/\s/g, ''))} disabled={!!vendor?.id && !!vendorFull?.gstin} />
            {gstinCheck && !gstinCheck.valid && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{gstinCheck.problems?.[0] ?? 'Not a valid GSTIN'}</p>}
          </div>
          <div>
            <label className="label">Place of supply</label>
            <select className="input h-10" value={pos} onChange={e => setPos(e.target.value)}>
              <option value="">{placeCode ? `${stateName(placeCode)} (${placeCode})` : 'Choose the state'}</option>
              {PLACES_OF_SUPPLY.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {!supplierState ? 'Within the state: CGST + SGST' : interState ? 'Supplier in another state: IGST' : 'Supplier in the same state: CGST + SGST'}
            </p>
          </div>
          {type !== 'EXPENSE' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Payment terms</label>
                <select className="input h-10" value={TERMS.some(t => t.value === terms) ? terms : terms ? '__custom' : ''}
                  onChange={e => { setTerms(e.target.value === '__custom' ? terms : e.target.value); setDueTouched(false) }}>
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
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={rcm} onChange={e => setRcm(e.target.checked)} /> Reverse charge — I pay the GST (e.g. transport by a GTA, legal services)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={blocked} onChange={e => setBlocked(e.target.checked)} /> GST credit can't be claimed on this (blocked credit)
          </label>
        </div>
        {covered && legalPayBy && (
          <Notice tone={beyond45 ? 'amber' : 'blue'}>
            {vendorFull?.name ?? vendor?.name} is a {String(category).toLowerCase()} enterprise: pay by <strong>{formatDate(legalPayBy)}</strong> under the MSMED Act
            {agreed === null ? ' (15 days, as no credit period is agreed)' : ''}. {beyond45 ? 'The due date is more than 45 days after receipt — the law caps the credit period at 45 days.' : ''} Paying late means interest at three times the RBI bank rate, and the expense is deductible only in the year it is paid.
          </Notice>
        )}
      </div>

      {/* ── Lines ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">What was bought</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rates exclude GST</span>
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => {
            const r = totals.value?.lines[lines.filter(x => x.description.trim() || x.unitPrice !== '').indexOf(l)]
            return (
              <div key={l.key} className="grid grid-cols-12 gap-2 items-start pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="col-span-12 md:col-span-3">
                  {i === 0 && <label className="label">Description</label>}
                  <ItemPicker value={l.description} price="purchase" placeholder="Item, service or expense" label={`Line ${i + 1} description`}
                    onChange={v => setLine(l.key, { description: v })}
                    onPick={it => setLine(l.key, { itemId: it.id, description: it.itemName, hsnSacCode: it.hsnSacCode ?? '', unit: it.unit ?? '',
                      unitPrice: it.purchasePrice != null ? String(it.purchasePrice) : '', gstRate: String(it.gstRate ?? 18) })} />
                  {l.itemId && <LinkedItem itemId={l.itemId} quantity={l.quantity} onUnlink={() => setLine(l.key, { itemId: undefined })} />}
                </div>
                <div className="col-span-6 md:col-span-2">
                  {i === 0 && <label className="label">Book to</label>}
                  <select className="input h-10 text-sm" value={l.accountCode || defaultAccount} onChange={e => setLine(l.key, { accountCode: e.target.value })} aria-label="Account">
                    {accounts.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                    {!accounts.some(a => a.code === (l.accountCode || defaultAccount)) && <option value={l.accountCode || defaultAccount}>{l.accountCode || defaultAccount}</option>}
                  </select>
                </div>
                <div className="col-span-6 md:col-span-1">
                  {i === 0 && <label className="label">HSN/SAC</label>}
                  <input className="input h-10 font-mono" value={l.hsnSacCode} maxLength={8} inputMode="numeric" onChange={e => setLine(l.key, { hsnSacCode: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="col-span-3 md:col-span-1">
                  {i === 0 && <label className="label">Qty</label>}
                  <input className="input h-10 text-right" value={l.quantity} inputMode="decimal" onChange={e => setLine(l.key, { quantity: e.target.value })} />
                </div>
                <div className="col-span-3 md:col-span-1">
                  {i === 0 && <label className="label">Rate (₹)</label>}
                  <input className="input h-10 text-right" value={l.unitPrice} inputMode="decimal" placeholder="0.00" onChange={e => setLine(l.key, { unitPrice: e.target.value })} />
                </div>
                <div className="col-span-3 md:col-span-1">
                  {i === 0 && <label className="label">Disc %</label>}
                  <input className="input h-10 text-right" value={l.discountPct} inputMode="decimal" placeholder="0" onChange={e => setLine(l.key, { discountPct: e.target.value })} />
                </div>
                <div className="col-span-3 md:col-span-1">
                  {i === 0 && <label className="label">GST</label>}
                  <select className="input h-10" value={l.gstRate} onChange={e => setLine(l.key, { gstRate: e.target.value })}>
                    {GST_RATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}%</option>)}
                    {!GST_RATE_OPTIONS.some(o => o.value === l.gstRate) && <option value={l.gstRate}>{l.gstRate}%</option>}
                  </select>
                </div>
                <div className="col-span-10 md:col-span-1 text-right">
                  {i === 0 && <label className="label">Amount</label>}
                  <p className="font-mono text-sm h-10 flex items-center justify-end">{r ? inr(rcm ? r.taxable : r.total) : '—'}</p>
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
        <button type="button" className="btn-secondary h-9 mt-3" onClick={() => setLines(ls => [...ls, newLine(defaultAccount)])}><Plus size={14} />Add line</button>
        {linkedLines > 0 && (
          <StockChoice direction={type === 'CREDIT_NOTE' ? 'purchaseReturn' : 'purchase'} checked={updateStock} onChange={setUpdateStock} linked={linkedLines} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            {type !== 'CREDIT_NOTE' && (
              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <label className="label" htmlFor="tds-nature">Income tax to deduct (TDS)</label>
                <select id="tds-nature" className="input h-10" value={tdsNature} onChange={e => { setTdsNature(e.target.value); setOverrideTds(false) }}>
                  {TDS_NATURES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                {tdsNature && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{TDS_NATURES.find(n => n.value === tdsNature)?.hint}</p>}
                {tdsNature && tds && !overrideTds && (
                  <p className="text-sm">
                    {tds.applies ? <>Deduct <strong className="font-mono">{inr(tds.amount)}</strong> ({Number(tds.rate)}%{tds.section ? `, section ${tds.section}` : ''})</> : 'No TDS on this bill.'}
                    {tds.note && <span className="block text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{tds.note}</span>}
                  </p>
                )}
                {tdsNature && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={overrideTds} onChange={e => { setOverrideTds(e.target.checked); if (e.target.checked && !tdsOverride && tds) setTdsOverride(String(tds.amount)) }} />
                    Enter the TDS amount myself (lower-deduction certificate, catch-up on earlier bills)
                  </label>
                )}
                {overrideTds && (
                  <input className="input h-9 w-40 text-right" inputMode="decimal" value={tdsOverride} placeholder="0" onChange={e => setTdsOverride(e.target.value)} aria-label="TDS amount" />
                )}
              </div>
            )}
            <div>
              <label className="label">Notes (for your records)</label>
              <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} maxLength={5000} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {totals.value && (
              <>
                <Row label="Value before GST" value={inr(totals.value.taxable)} />
                {interState ? <Row label="IGST" value={inr(totals.value.igst)} /> : <>
                  <Row label="CGST" value={inr(totals.value.cgst)} />
                  <Row label="SGST / UTGST" value={inr(totals.value.sgst)} />
                </>}
                {rcm && tax > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Under reverse charge you pay this GST to the government (GSTR-3B) and claim it back; the supplier is paid the value only.</p>}
                {blocked && tax > 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>GST is added to the cost, not claimed as credit.</p>}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} /> Round off to the rupee
                  </label>
                  <span className="font-mono">{Number(totals.value.roundOff) === 0 ? '0.00' : (Number(totals.value.roundOff) > 0 ? '+' : '') + totals.value.roundOff}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm" style={{ color: 'var(--text-secondary)' }} htmlFor="bill-adj">Adjustment to match their total (±₹10)</label>
                  <input id="bill-adj" className="input h-9 w-28 text-right" value={adjustment} inputMode="decimal" placeholder="0.00" onChange={e => setAdjustment(e.target.value)} />
                </div>
                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="font-semibold">{type === 'CREDIT_NOTE' ? 'Credit note total' : 'Bill total'}</span>
                  <span className="font-serif text-2xl">{inr(totals.value.total)}</span>
                </div>
                {Number(tdsAmount) > 0 && <Row label="Less TDS deducted" value={'−' + inr(tdsAmount)} />}
                {payable && type !== 'CREDIT_NOTE' && Number(tdsAmount) > 0 && (
                  <div className="flex items-center justify-between"><span className="font-semibold">To pay the supplier</span><span className="font-mono font-semibold">{inr(payable)}</span></div>
                )}
              </>
            )}
            {totals.error && <p className="text-sm" style={{ color: '#dc2626' }}>{totals.error}</p>}
          </div>
        </div>
      </div>

      {type !== 'CREDIT_NOTE' && !editing && (
        <div className="card space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={payNow} onChange={e => setPayNow(e.target.checked)} /> {type === 'EXPENSE' ? 'Already paid' : 'Paid in full now'}
          </label>
          {payNow && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-6">
              <div>
                <label className="label">Paid by</label>
                <select className="input h-10" value={payMode} onChange={e => setPayMode(e.target.value)}>
                  {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">UTR / cheque / UPI ref.</label>
                <input className="input h-10 font-mono" value={payRef} maxLength={100} onChange={e => setPayRef(e.target.value)} placeholder="Optional" />
              </div>
              <p className="text-xs md:col-span-3" style={{ color: 'var(--text-muted)' }}>Recorded as paid on {formatDate(date)} from {payMode === 'CASH' ? 'cash in hand' : 'the bank'}.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 z-20 -mx-5 md:-mx-6 -mb-5 md:-mb-6 px-5 md:px-6 py-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <p className="text-sm" style={{ color: problems.length ? '#d97706' : 'var(--text-muted)' }}>
          {problems.length ? problems[0] : totals.value ? `${BILL_TYPE_LABEL[type]} total ${inr(totals.value.total)}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary h-10" onClick={() => router.back()}>Cancel</button>
          {(!editing || bill?.status === 'DRAFT') && (
            <button className="btn-secondary h-10" disabled={save.isPending || !!totals.error} onClick={() => save.mutate(true)}>Save as draft</button>
          )}
          <button className="btn-primary h-10" onClick={() => save.mutate(false)} disabled={problems.length !== 0 || save.isPending}>
            {save.isPending ? 'Saving…' : editing && bill?.status !== 'DRAFT' ? 'Save changes' : payNow && type !== 'CREDIT_NOTE' ? 'Record as paid' : 'Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** For a saved bill: was the total rounded to the rupee, and was there a manual adjustment on top? */
function editedRounding(bill?: Bill): { round: boolean; adjustment: string } {
  if (!bill?.lines?.length) return { round: true, adjustment: '' }
  try {
    const inputs = bill.lines.map(l => ({ quantity: String(l.quantity), rate: String(l.unitPrice), discountPct: String(l.discountPct ?? 0), gstRate: String(l.gstRate) }))
    const saved = String(bill.roundOff ?? '0')
    for (const round of [true, false]) {
      const r = computeInvoice(inputs, bill.interState, null, round && !bill.reverseCharge)
      const base = bill.reverseCharge ? subMoney(round ? roundRupee(r.taxable) : r.taxable, r.taxable) : r.roundOff
      if (subMoney(saved, base) === '0.00') return { round, adjustment: '' }
    }
    const r = computeInvoice(inputs, bill.interState, null, !bill.reverseCharge)
    const base = bill.reverseCharge ? subMoney(roundRupee(r.taxable), r.taxable) : r.roundOff
    return { round: true, adjustment: subMoney(saved, base) }
  } catch {
    return { round: true, adjustment: '' }
  }
}

/** a − b, or a when b isn't a number yet (while typing). */
function safeSub(a: string, b: string): string {
  try { return subMoney(a, b || '0') } catch { return a }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

/** Search saved suppliers; for an expense, anyone can be typed in instead. */
function VendorPicker({ value, onChange, allowFreeText, freeText, onFreeText }: {
  value: Partial<Vendor> | null; onChange: (v: Partial<Vendor> | null) => void
  allowFreeText: boolean; freeText: string; onFreeText: (s: string) => void
}) {
  const [q, setQ] = useState(allowFreeText ? freeText : '')
  const [open, setOpen] = useState(false)
  const query = useDebounce(q, 250)
  const { data, isFetching } = useQuery({ queryKey: ['vendor-search', query], queryFn: () => vendorsApi.list({ q: query || undefined, size: 8 }), enabled: open })
  const results = data?.content ?? []

  if (value?.id) {
    return (
      <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Supplier</p>
          <p className="font-semibold">{value.name}</p>
        </div>
        <button type="button" className="btn-ghost h-8 text-sm" onClick={() => { onChange(null); setQ(''); setOpen(true) }}>Change</button>
      </div>
    )
  }
  return (
    <div className="relative">
      <label className="label label-required">{allowFreeText ? 'Paid to' : 'Supplier'}</label>
      <input className="input h-10" value={q} placeholder={allowFreeText ? 'Search your suppliers, or type a name (e.g. Indian Railways)' : 'Search by name, email or GSTIN…'}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={e => { setQ(e.target.value); setOpen(true); if (allowFreeText) onFreeText(e.target.value) }} aria-autocomplete="list" />
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-modal)' }}>
          {results.map(v => (
            <button type="button" key={v.id} className="w-full text-left px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}
              onMouseDown={e => e.preventDefault()} onClick={() => { onChange(v); setOpen(false) }}>
              <p className="text-sm font-medium">{v.name}{v.msmeCategory && ['MICRO', 'SMALL'].includes(v.msmeCategory) ? <span className="ml-2 badge s-amber">MSME</span> : null}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[v.gstin, v.city, v.state].filter(Boolean).join(' · ') || v.email || '—'}</p>
            </button>
          ))}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {allowFreeText && q.trim() ? <>“{q.trim()}” will be recorded as typed. </> : 'No suppliers found. '}
              <Link href="/procurement/vendors?new=1" className="underline">Add a supplier</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
