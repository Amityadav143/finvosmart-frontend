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

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Banknote, CreditCard, MessageCircle, Printer, QrCode, RotateCcw, Smartphone, Wallet, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { posApi } from '@/lib/api/store'
import { apiError } from '@/lib/apiError'
import { inr } from '@/lib/money'
import { qty } from '@/lib/inventory'
import { PAY_LABEL, clientRef, printHtml, receiptHtml, shiftReportHtml, whatsapp, whatsappShare } from '@/lib/storeHelpers'
import type { Pay, PayMode, PosBill, PosQuote, Receipt, ShiftReport } from '@/types/store'

const r2 = (n: number) => Math.round(n * 100) / 100
const MODES: { mode: PayMode; icon: any }[] = [
  { mode: 'CASH', icon: Banknote }, { mode: 'UPI', icon: Smartphone }, { mode: 'CARD', icon: CreditCard }, { mode: 'CREDIT', icon: Wallet },
]

/**
 * Taking the money: cash (with the change worked out), UPI (the company's QR code for the amount), card, or — for a
 * named customer — on account; several ways for one bill. The server settles it again and refuses what doesn't add up.
 */
export function PayModal({ quote, named, upi, onClose, onPay, busy, error }: {
  quote: PosQuote; named: boolean; upi: boolean; onClose: () => void; busy: boolean; error?: string | null
  onPay: (payments: Pay[], prescription: { patientName: string; prescriberName: string; prescriberAddress: string } | null) => void
}) {
  const total = Number(quote.total)
  const needsPrescription = quote.prescriptionFor.length > 0
  const [rows, setRows] = useState<{ mode: PayMode; amount: string; reference: string }[]>([{ mode: 'CASH', amount: String(total), reference: '' }])
  const [rx, setRx] = useState({ patientName: '', prescriberName: '', prescriberAddress: '' })
  const nonCash = rows.filter(r => r.mode !== 'CASH').reduce((t, r) => t + (Number(r.amount) || 0), 0)
  const cash = rows.filter(r => r.mode === 'CASH').reduce((t, r) => t + (Number(r.amount) || 0), 0)
  const cashDue = r2(total - nonCash)
  const change = r2(cash - Math.max(cashDue, 0))
  const credit = rows.some(r => r.mode === 'CREDIT' && Number(r.amount) > 0)
  const rxMissing = needsPrescription && (!rx.patientName.trim() || !rx.prescriberName.trim() || !rx.prescriberAddress.trim())
  const problem = credit && !named ? 'Choose the customer to leave part of the bill on account.'
    : nonCash > total + 0.001 ? 'UPI, card and on account can\'t be more than the bill: no change is given on them.'
    : cash + 0.001 < cashDue ? `${inr(r2(cashDue - cash))} is still to pay.`
    : rxMissing ? "Enter the patient's name and the prescriber's name and address." : null
  const upiAmount = rows.find(r => r.mode === 'UPI')
  const { data: qr } = useQuery({
    queryKey: ['pos-upi', upiAmount?.amount],
    queryFn: () => posApi.upiQr(Number(upiAmount?.amount)),
    enabled: upi && !!upiAmount && Number(upiAmount.amount) > 0,
    staleTime: 60_000,
  })
  const set = (i: number, patch: Partial<{ mode: PayMode; amount: string; reference: string }>) =>
    setRows(rs => rs.map((r, j) => j === i ? { ...r, ...patch } : r))
  const add = (mode: PayMode) => {
    const left = r2(total - rows.reduce((t, r) => t + (Number(r.amount) || 0), 0))
    setRows(rs => [...rs, { mode, amount: String(Math.max(left, 0)), reference: '' }])
  }
  const go = () => onPay(rows.filter(r => Number(r.amount) > 0).map(r => ({ mode: r.mode, amount: Number(r.amount), reference: r.reference.trim() || null })),
    needsPrescription ? { patientName: rx.patientName.trim(), prescriberName: rx.prescriberName.trim(), prescriberAddress: rx.prescriberAddress.trim() } : null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'F9' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); if (!problem && !busy) go() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  })
  return (
    <Modal open onClose={onClose} title={`Take ${inr(total)}`} subtitle="Cash, UPI, card — or on account for a named customer. Several ways for one bill are fine." size="md">
      <div className="space-y-4" data-testid="pos-pay">
        {rows.map((r, i) => {
          const M = MODES.find(m => m.mode === r.mode)!
          return (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)' }} data-testid={`pos-pay-row-${r.mode}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <M.icon className="w-4 h-4" aria-hidden />
                <select className="input h-9 w-36" aria-label="Way to pay" value={r.mode} onChange={e => set(i, { mode: e.target.value as PayMode })}>
                  {MODES.filter(m => m.mode !== 'CREDIT' || named).map(m => <option key={m.mode} value={m.mode}>{PAY_LABEL[m.mode]}</option>)}
                </select>
                <input className="input h-9 w-36 font-mono" type="number" step="0.01" min="0" aria-label={`${PAY_LABEL[r.mode]} amount`}
                  value={r.amount} onChange={e => set(i, { amount: e.target.value })} autoFocus={i === 0} data-testid={`pos-pay-amount-${i}`} />
                {r.mode !== 'CASH' && r.mode !== 'CREDIT' && (
                  <input className="input h-9 flex-1 min-w-32" maxLength={60} placeholder={r.mode === 'UPI' ? 'UPI ref (optional)' : 'Approval code / last 4 digits'}
                    aria-label={`${PAY_LABEL[r.mode]} reference`} value={r.reference} onChange={e => set(i, { reference: e.target.value })} />
                )}
                {rows.length > 1 && <button className="btn-icon w-8 h-8" aria-label="Remove this payment" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}><X className="w-4 h-4" /></button>}
              </div>
              {r.mode === 'CASH' && (
                <div className="flex gap-1.5 flex-wrap" aria-label="Cash handed over">
                  {[cashDue, ...[100, 200, 500, 1000, 2000].filter(n => n > cashDue).slice(0, 3)].filter(n => n > 0).map(n => (
                    <button key={n} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--border)' }}
                      onClick={() => set(i, { amount: String(r2(n)) })}>{n === cashDue ? 'Exact' : inr(n)}</button>
                  ))}
                </div>
              )}
              {r.mode === 'UPI' && upi && qr && (
                <div className="flex items-center gap-3" data-testid="pos-upi-qr">
                  <div className="w-32 h-32 bg-white p-1 rounded" dangerouslySetInnerHTML={{ __html: qr }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>The customer scans this with any UPI app — the amount is filled in. Check the payment arrived before completing the bill.</p>
                </div>
              )}
              {r.mode === 'UPI' && !upi && <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><QrCode className="w-3.5 h-3.5" />Add your UPI ID under Settings → Company to show a QR code here.</p>}
            </div>
          )
        })}
        <div className="flex gap-2 flex-wrap">
          {MODES.filter(m => m.mode !== 'CREDIT' || named).map(m => (
            <button key={m.mode} className="btn-secondary h-8 text-xs" onClick={() => add(m.mode)}>+ {PAY_LABEL[m.mode]}</button>
          ))}
        </div>
        {needsPrescription && (
          <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.06)' }} data-testid="pos-prescription">
            <p className="text-xs font-semibold">Prescription — for {quote.prescriptionFor.slice(0, 3).join(', ')}{quote.prescriptionFor.length > 3 ? '…' : ''}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Schedule H1 and X medicines go in the register with the patient and the prescriber. A chemist or hospital buying with a drug licence doesn&apos;t need this — choose them as the customer.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="input h-9" placeholder="Patient's name" aria-label="Patient's name" value={rx.patientName} onChange={e => setRx({ ...rx, patientName: e.target.value })} />
              <input className="input h-9" placeholder="Prescriber's name" aria-label="Prescriber's name" value={rx.prescriberName} onChange={e => setRx({ ...rx, prescriberName: e.target.value })} />
              <input className="input h-9 sm:col-span-2" placeholder="Prescriber's address" aria-label="Prescriber's address" value={rx.prescriberAddress} onChange={e => setRx({ ...rx, prescriberAddress: e.target.value })} />
            </div>
          </div>
        )}
        {error && <p className="text-sm rounded-lg px-3 py-2" role="alert" style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>{error}</p>}
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-sm">
            {problem ? <span style={{ color: '#dc2626' }} data-testid="pos-pay-problem">{problem}</span>
              : <span data-testid="pos-change">Change: <b className="font-mono">{inr(Math.max(change, 0))}</b></span>}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary h-10" onClick={onClose}>Back</button>
            <button className="btn-primary h-10" disabled={!!problem || busy} onClick={go} data-testid="pos-complete">{busy ? 'Saving…' : 'Complete bill (F9)'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** The bill just made: print it on the receipt printer, send it on WhatsApp, start the next one. */
export function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const credit = receipt.kind === 'RETURN'
  const wa = whatsapp(receipt.customerPhone, receipt.whatsappText) ?? whatsappShare(receipt.whatsappText)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'p' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); printHtml(receiptHtml(receipt)) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [receipt])
  return (
    <Modal open onClose={onClose} title={`${credit ? 'Return' : 'Bill'} ${receipt.number}`} subtitle={`${receipt.customer} · ${inr(receipt.total)}`} size="sm">
      <div className="space-y-4" data-testid="pos-receipt">
        {!credit && Number(receipt.change) > 0 && (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(22,163,74,0.08)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Give back</p>
            <p className="text-3xl font-bold font-mono" data-testid="pos-receipt-change">{inr(receipt.change)}</p>
          </div>
        )}
        <table className="w-full text-sm">
          <tbody>
            {receipt.lines.map((l, i) => (
              <tr key={i}><td className="py-0.5">{l.name}<span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {qty(l.quantity)} × {inr(l.rate)}</span></td><td className="text-right font-mono">{inr(l.amount)}</td></tr>
            ))}
            <tr style={{ borderTop: '1px solid var(--border)' }}><td className="pt-1">GST</td><td className="pt-1 text-right font-mono">{inr(Number(receipt.cgst) + Number(receipt.sgst) + Number(receipt.igst))}</td></tr>
            <tr><td className="font-semibold">{credit ? 'Refund' : 'Total'}</td><td className="text-right font-mono font-semibold">{inr(receipt.total)}</td></tr>
            {receipt.payments.map((p, i) => <tr key={`p${i}`}><td className="text-xs" style={{ color: 'var(--text-muted)' }}>{credit ? 'Refunded · ' : ''}{PAY_LABEL[p.mode]}</td><td className="text-right font-mono text-xs">{inr(p.amount)}</td></tr>)}
          </tbody>
        </table>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-primary h-10 flex-1" onClick={() => printHtml(receiptHtml(receipt))} data-testid="pos-print"><Printer className="w-4 h-4" aria-hidden />Print receipt</button>
          <a className="btn-secondary h-10 flex-1" href={wa} target="_blank" rel="noopener noreferrer" data-testid="pos-whatsapp"><MessageCircle className="w-4 h-4" aria-hidden />WhatsApp</a>
        </div>
        <button className="btn-secondary h-10 w-full" onClick={onClose} autoFocus data-testid="pos-next">Next customer</button>
      </div>
    </Modal>
  )
}

/** Goods brought back: find the bill, choose what came back, refund it (or keep it as credit for a named customer). */
export function ReturnModal({ sessionId, onClose, onDone }: { sessionId: string; onClose: () => void; onDone: (r: Receipt) => void }) {
  const [number, setNumber] = useState('')
  const [bill, setBill] = useState<PosBill | null>(null)
  const [qtys, setQtys] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<PayMode>('CASH')
  const [reason, setReason] = useState('')
  const [ref] = useState(clientRef)
  const find = useMutation({
    mutationFn: () => posApi.find(number.trim()),
    onSuccess: b => { setBill(b); setQtys({}) },
    onError: (e: any) => toast.error(apiError(e, 'That bill could not be found')),
  })
  const lines = bill?.lines ?? []
  // the value of what comes back: the bill's own price after its discounts, with GST (the server works it out again)
  const value = useMemo(() => r2(lines.reduce((t, l) => t + (Number(qtys[l.lineId]) || 0) * (Number(l.lineTotal) / Number(l.sold || 1)), 0)), [lines, qtys])
  const chosen = lines.filter(l => Number(qtys[l.lineId]) > 0)
  const over = lines.find(l => Number(qtys[l.lineId]) > Number(l.left))
  const save = useMutation({
    mutationFn: async () => {
      // the refund is the credit note's value, which the server works out (and rounds): one way of refunding, no amount
      const lns = chosen.map(l => ({ lineId: l.lineId, quantity: Number(qtys[l.lineId]) }))
      return posApi.giveBack({ sessionId, clientRef: ref, saleId: bill!.saleId, lines: lns, refunds: [{ mode, amount: null }], reason: reason.trim() })
    },
    onSuccess: r => { toast.success(`Return ${r.number} done`); onDone(r) },
    onError: (e: any) => toast.error(apiError(e, 'The return could not be made')),
  })
  return (
    <Modal open onClose={onClose} title="Goods returned" subtitle="Find the bill by the number printed on the receipt, then choose what came back." size="lg">
      <div className="space-y-4" data-testid="pos-return">
        <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (number.trim()) find.mutate() }}>
          <input className="input h-10 flex-1 font-mono" placeholder="INV/26-27/000123" aria-label="Bill number" value={number} onChange={e => setNumber(e.target.value)} autoFocus />
          <button className="btn-secondary h-10" disabled={!number.trim() || find.isPending}>{find.isPending ? 'Finding…' : 'Find bill'}</button>
        </form>
        {bill && (
          <>
            <p className="text-sm"><b>{bill.number}</b> · {bill.customer} · {inr(bill.total)} <span style={{ color: 'var(--text-muted)' }}>· {bill.register}</span></p>
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead><tr>{['Item', 'Sold', 'Returned', 'Coming back', 'Value'].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
                <tbody>
                  {lines.map(l => (
                    <tr key={l.lineId} className="table-row">
                      <td className="table-cell">{l.name}{l.batchNo && <span className="text-xs" style={{ color: 'var(--text-muted)' }}> · {l.batchNo}</span>}</td>
                      <td className="table-cell font-mono">{qty(l.sold)}</td>
                      <td className="table-cell font-mono">{qty(l.returned)}</td>
                      <td className="table-cell"><input className="input h-8 w-24 font-mono" type="number" min="0" max={l.left} step="any" disabled={Number(l.left) <= 0}
                        aria-label={`How many ${l.name} came back`} value={qtys[l.lineId] ?? ''} onChange={e => setQtys({ ...qtys, [l.lineId]: e.target.value })} /></td>
                      <td className="table-cell font-mono">{inr((Number(qtys[l.lineId]) || 0) * (Number(l.lineTotal) / Number(l.sold || 1)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Refund as</label>
                <select className="input h-10" value={mode} onChange={e => setMode(e.target.value as PayMode)} aria-label="Refund as">
                  <option value="CASH">Cash from the drawer</option><option value="UPI">UPI</option><option value="CARD">Card</option>
                  {!bill.walkIn && <option value="CREDIT">Keep as credit on the customer&apos;s account</option>}
                </select></div>
              <div><label className="label label-required">Why it came back</label>
                <input className="input h-10" maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Damaged, wrong size…" aria-label="Why it came back" /></div>
            </div>
          </>
        )}
        <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm">{over ? <span style={{ color: '#dc2626' }}>Only {qty(over.left)} of {over.name} can still come back.</span>
            : chosen.length ? <>Refund about <b className="font-mono">{inr(Math.round(value))}</b> <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(the credit note says it exactly)</span></> : ''}</p>
          <div className="flex gap-2">
            <button className="btn-secondary h-10" onClick={onClose}>Close</button>
            <button className="btn-primary h-10" data-testid="pos-return-save" disabled={!bill || !chosen.length || !!over || !reason.trim() || save.isPending}
              onClick={() => save.mutate()}><RotateCcw className="w-4 h-4" aria-hidden />{save.isPending ? 'Saving…' : 'Make the return'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** Cash put into the drawer or taken out of it, with the reason (it stays in the shift's report). */
export function CashModal({ sessionId, onClose, onDone }: { sessionId: string; onClose: () => void; onDone: (r: ShiftReport) => void }) {
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const save = useMutation({
    mutationFn: () => posApi.cash(sessionId, direction, Number(amount), reason.trim()),
    onSuccess: r => { toast.success('Cash recorded'); onDone(r) },
    onError: (e: any) => toast.error(apiError(e, 'The cash could not be recorded')),
  })
  return (
    <Modal open onClose={onClose} title="Cash in or out of the drawer" subtitle="Change brought in, a petty expense paid, money taken to the bank. It shows in the shift's report; record an expense in the books as usual." size="sm">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="In or out">
          {(['OUT', 'IN'] as const).map(d => (
            <button key={d} role="radio" aria-checked={direction === d} onClick={() => setDirection(d)} className="rounded-xl px-2 py-2 text-sm font-semibold"
              style={{ border: `1px solid ${direction === d ? 'var(--gold)' : 'var(--border)'}`, background: direction === d ? 'var(--gold-muted)' : 'transparent' }}>
              {d === 'OUT' ? 'Taken out' : 'Put in'}
            </button>
          ))}
        </div>
        <div><label className="label label-required">Amount (₹)</label><input className="input h-10" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></div>
        <div><label className="label label-required">Reason</label><input className="input h-10" maxLength={200} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tea and snacks, bank deposit, change…" /></div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary h-10" onClick={onClose}>Cancel</button>
          <button className="btn-primary h-10" disabled={!(Number(amount) > 0) || !reason.trim() || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Record'}</button>
        </div>
      </div>
    </Modal>
  )
}

/** Closing a shift: the cash expected in the drawer, the cash counted, and the difference (a note when they differ). */
export function CloseShiftModal({ sessionId, company, width, onClose, onClosed }: {
  sessionId: string; company: string; width: 58 | 80; onClose: () => void; onClosed: (r: ShiftReport) => void
}) {
  const { data: rep } = useQuery({ queryKey: ['pos-report', sessionId], queryFn: () => posApi.report(sessionId) })
  const [counted, setCounted] = useState('')
  const [note, setNote] = useState('')
  const diff = rep && counted.trim() !== '' ? r2(Number(counted) - Number(rep.expectedCash)) : null
  const close = useMutation({
    mutationFn: () => posApi.close(sessionId, Number(counted), note.trim() || undefined),
    onSuccess: r => { toast.success('Shift closed'); onClosed(r) },
    onError: (e: any) => toast.error(apiError(e, 'The shift could not be closed')),
  })
  return (
    <Modal open onClose={onClose} title="Close the shift" subtitle="Count the cash in the drawer and enter it." size="md">
      {!rep ? <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading the shift…</p> : (
        <div className="space-y-4" data-testid="pos-close">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['Bills', String(rep.bills)], ['Sales', inr(rep.sales)], ['Returns', inr(rep.returnsTotal)], ['Net', inr(rep.net)]].map(([k, v]) => (
              <div key={k} className="card-sm rounded-xl p-3" style={{ border: '1px solid var(--border)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{k}</p><p className="font-semibold font-mono">{v}</p></div>
            ))}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {rep.byMode.filter(m => Number(m.in) > 0 || Number(m.out) > 0).map(m => (
                <tr key={m.mode}><td>{PAY_LABEL[m.mode]}</td><td className="text-right font-mono">{inr(m.in)}</td><td className="text-right font-mono" style={{ color: 'var(--text-muted)' }}>{Number(m.out) > 0 ? `−${inr(m.out)}` : ''}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm">Cash expected in the drawer: <b className="font-mono" data-testid="pos-expected">{inr(rep.expectedCash)}</b>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}> (opened with {inr(rep.session.openingCash)})</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label label-required">Cash counted (₹)</label><input className="input h-10 font-mono" type="number" min="0" step="0.01" value={counted} onChange={e => setCounted(e.target.value)} autoFocus aria-label="Cash counted" /></div>
            <div><label className={`label${diff ? ' label-required' : ''}`}>Note</label><input className="input h-10" maxLength={300} value={note} onChange={e => setNote(e.target.value)} placeholder={diff ? 'Why the cash differs' : ''} aria-label="Note" /></div>
          </div>
          {diff !== null && <p className="text-sm" data-testid="pos-difference" style={{ color: diff === 0 ? '#15803d' : '#b91c1c' }}>{diff === 0 ? 'The drawer matches.' : `The drawer is ${inr(Math.abs(diff))} ${diff < 0 ? 'short' : 'over'}.`}</p>}
          <div className="flex justify-between gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button className="btn-secondary h-10" onClick={() => printHtml(shiftReportHtml(rep, company, width))}><Printer className="w-4 h-4" aria-hidden />Print so far</button>
            <div className="flex gap-2">
              <button className="btn-secondary h-10" onClick={onClose}>Back</button>
              <button className="btn-primary h-10" data-testid="pos-close-save" disabled={counted.trim() === '' || !(Number(counted) >= 0) || (!!diff && !note.trim()) || close.isPending}
                onClick={() => close.mutate()}>{close.isPending ? 'Closing…' : 'Close shift'}</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
