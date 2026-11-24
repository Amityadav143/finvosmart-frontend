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

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, PackageCheck, PenLine } from 'lucide-react'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { warrantyApi } from '@/lib/api/warranty'
import { apiError } from '@/lib/apiError'
import { inr, todayIST } from '@/lib/money'
import { fmtDate } from '@/components/godown/GodownParts'
import { qty } from '@/components/purchaseStore/StoreParts'
import { Coverage, GodownSelect, SearchPicker } from '@/components/warranty/WarrantyParts'
import { warrantyUntil } from '@/lib/warranty'
import type { ClaimDocument, ClaimItem, ClaimKind, ClaimParty, ClaimStart, NewClaimInput } from '@/types/warranty'

const ID_RE = /^[A-Za-z0-9-]{1,64}$/
type Source = 'invoice' | 'receipt' | 'typed'

/** A new warranty claim: from a customer's invoice line, a goods receipt line, a customer's claim passed on — or typed in. */
export default function NewClaimPage() {
  const { canAny } = usePermissions()
  const allowed = canAny('WARRANTY_CLAIMS')
  const [kind, setKind] = useState<ClaimKind>('CUSTOMER')
  const [source, setSource] = useState<Source>('invoice')
  const [doc, setDoc] = useState<{ kind: 'invoice' | 'receipt'; id: string } | null>(null)
  const [start, setStart] = useState<{ invoiceLineId?: string; grnLineId?: string; parentClaimId?: string } | null>(null)
  // where it starts from: ?invoice=<id>, ?grn=<id>, ?from=<customer's claim> (pass on to the supplier), ?kind=SUPPLIER
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const inv = p.get('invoice'), grn = p.get('grn'), from = p.get('from')
    if (from && ID_RE.test(from)) { setKind('SUPPLIER'); setStart({ parentClaimId: from }) }
    else if (grn && ID_RE.test(grn)) { setKind('SUPPLIER'); setSource('receipt'); setDoc({ kind: 'receipt', id: grn }) }
    else if (inv && ID_RE.test(inv)) { setKind('CUSTOMER'); setSource('invoice'); setDoc({ kind: 'invoice', id: inv }) }
    else if (p.get('kind') === 'SUPPLIER') { setKind('SUPPLIER'); setSource('receipt') }
  }, [])
  if (!allowed) return <PermissionGate anyOf={['WARRANTY_CLAIMS']} showDenied><span /></PermissionGate>
  const passOn = !!start?.parentClaimId
  const choose = (k: ClaimKind, s: Source) => { setKind(k); setSource(s); setDoc(null); setStart(null) }
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <Link href="/warranty" className="text-xs inline-flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><ArrowLeft className="w-3 h-3" aria-hidden />Warranty claims</Link>
        <h1 className="page-title">{passOn ? 'Claim it from the supplier' : kind === 'CUSTOMER' ? 'New warranty claim' : 'New claim on a supplier'}</h1>
        <p className="page-subtitle">{passOn ? 'The customer’s faulty goods go back to the supplier who sold them to you, under their warranty.'
          : kind === 'CUSTOMER' ? 'Start from the customer’s invoice: the warranty is worked out from the sale, and the claim can’t be for more than was sold.'
          : 'Goods a supplier sold you that turned out faulty — from a goods receipt (they are in stock: they leave it when sent back), or typed in.'}</p>
      </div>

      {!passOn && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="What the claim is made on">
          {(kind === 'CUSTOMER'
            ? [['invoice', 'From the customer’s invoice', FileText], ['typed', 'Typed in', PenLine]]
            : [['receipt', 'From a goods receipt', PackageCheck], ['typed', 'Typed in', PenLine]]).map(([s, label, Icon]) => {
            const I = Icon as typeof FileText
            return <button key={s as string} role="tab" aria-selected={source === s} className={source === s ? 'btn-primary h-9' : 'btn-secondary h-9'}
              onClick={() => choose(kind, s as Source)} data-testid={`claim-source-${s}`}><I className="w-4 h-4" aria-hidden />{label as string}</button>
          })}
          <button className="btn-ghost h-9 ml-auto" onClick={() => choose(kind === 'CUSTOMER' ? 'SUPPLIER' : 'CUSTOMER', kind === 'CUSTOMER' ? 'receipt' : 'invoice')}
            data-testid="claim-switch-kind">{kind === 'CUSTOMER' ? 'A claim on a supplier instead' : 'A customer’s claim instead'}</button>
        </div>
      )}

      {!passOn && source !== 'typed' && !start && (
        <DocumentStep kind={source === 'receipt' ? 'receipt' : 'invoice'} chosen={doc} onChoose={setDoc} onLine={lineId => setStart(source === 'receipt' ? { grnLineId: lineId } : { invoiceLineId: lineId })} />
      )}
      {(start || source === 'typed') && <ClaimForm kind={kind} from={start} onBack={start && !passOn ? () => setStart(null) : null} />}
    </div>
  )
}

/** Find the invoice (or receipt), then choose its line. */
function DocumentStep({ kind, chosen, onChoose, onLine }: {
  kind: 'invoice' | 'receipt'; chosen: { kind: 'invoice' | 'receipt'; id: string } | null
  onChoose: (d: { kind: 'invoice' | 'receipt'; id: string } | null) => void; onLine: (lineId: string) => void
}) {
  const { data: d, isLoading, isError, error } = useQuery({ queryKey: ['warranty-document', chosen?.kind, chosen?.id],
    queryFn: () => warrantyApi.document(chosen!.kind, chosen!.id), enabled: !!chosen })
  const picked: ClaimDocument | null = d ?? null
  return (
    <section className="card space-y-4" aria-label={kind === 'invoice' ? 'The invoice' : 'The goods receipt'}>
      {!chosen ? (
        <SearchPicker<ClaimDocument> label={kind === 'invoice' ? 'The customer’s invoice' : 'The goods receipt'} chosen={null} required queryKey={`doc-${kind}`}
          onChange={x => x && onChoose({ kind, id: x.id })} search={q => warrantyApi.documents(kind, q)} testId="claim-doc"
          placeholder={kind === 'invoice' ? 'Invoice number or customer' : 'GRN number, supplier or their invoice number'}
          title={x => `${x.number} · ${x.partyName}`} sub={x => fmtDate(x.date)} />
      ) : isLoading ? <p className="text-sm">Loading…</p> : isError || !picked ? (
        <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'It could not be opened.')} <button className="underline" onClick={() => onChoose(null)}>Choose another</button></p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div><p className="font-semibold">{picked.number} · {picked.partyName}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtDate(picked.date)}</p></div>
            <button className="btn-ghost h-8 text-xs" onClick={() => onChoose(null)}>Choose another</button>
          </div>
          <p className="text-sm">Which goods are claimed?</p>
          <div className="table-wrap">
            <table className="w-full text-sm" data-testid="claim-doc-lines">
              <thead><tr>{['Goods', kind === 'invoice' ? 'Sold' : 'Accepted', 'Under claim', ''].map(h => <th key={h} className="table-header">{h}</th>)}</tr></thead>
              <tbody>{picked.lines.map(l => {
                const left = Number(l.quantity ?? 0) - Number(l.claimed)
                return (
                  <tr key={l.lineId} className="table-row">
                    <td className="table-cell">{l.description}{l.batchNo && <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Batch {l.batchNo}</span>}</td>
                    <td className="table-cell">{qty(l.quantity)} {l.unit ?? ''}</td><td className="table-cell">{Number(l.claimed) ? qty(l.claimed) : ''}</td>
                    <td className="table-cell text-right">{left > 0
                      ? <button className="btn-secondary h-8 text-xs" onClick={() => onLine(l.lineId)} data-testid="claim-line">Claim</button>
                      : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>All under claim</span>}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

/** The claim itself: what is claimed, the fault, the warranty — filled from where it starts, or typed in. */
function ClaimForm({ kind, from, onBack }: { kind: ClaimKind; from: { invoiceLineId?: string; grnLineId?: string; parentClaimId?: string } | null; onBack: (() => void) | null }) {
  const router = useRouter()
  const qc = useQueryClient()
  const { data: s, isLoading, isError, error } = useQuery({ queryKey: ['warranty-start', from], queryFn: () => warrantyApi.start(from!), enabled: !!from })
  const today = todayIST()
  const [party, setParty] = useState<ClaimParty | null>(null)
  const [item, setItem] = useState<ClaimItem | null>(null)
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [serial, setSerial] = useState('')
  const [complaint, setComplaint] = useState('')
  const [receivedWith, setReceivedWith] = useState('')
  const [handedIn, setHandedIn] = useState(true)
  const [claimDate, setClaimDate] = useState(today)
  const [bought, setBought] = useState('')
  const [sourceDoc, setSourceDoc] = useState('')
  const [rate, setRate] = useState('')
  const [months, setMonths] = useState('')
  const [warrantyFrom, setWarrantyFrom] = useState('')
  const [phone, setPhone] = useState('')
  const [fromStock, setFromStock] = useState(false)
  const [godownId, setGodownId] = useState('')
  const filledFrom = useRef<ClaimStart | null>(null)
  useEffect(() => {
    if (!s || filledFrom.current === s) return
    filledFrom.current = s
    if (s.quantity != null) setQuantity(String(Number(s.quantity)))
    if (s.serialNo) setSerial(s.serialNo)
    if (s.complaint) setComplaint(s.complaint)
    if (s.warrantyMonths != null) setMonths(String(s.warrantyMonths))
    if (s.warrantyFrom) setWarrantyFrom(s.warrantyFrom)
    if (s.contactPhone) setPhone(s.contactPhone)
    if (s.vendorId && s.partyName) setParty({ id: s.vendorId, name: s.partyName })
    setFromStock(s.fromStock)
  }, [s])
  const typed = !from
  const start: ClaimStart | null = s ?? null
  const fromDate = typed ? (warrantyFrom || bought) : (warrantyFrom || start?.warrantyFrom || '')
  const m = months === '' ? null : Number(months)
  const until = warrantyUntil(fromDate, m)
  const inWarranty = m == null || !fromDate ? null : m <= 0 ? false : until != null && claimDate <= until
  const coverText = m == null ? (start?.warrantySource ? `No warranty set (${start.warrantySource})` : 'No warranty period set — enter the months')
    : !fromDate ? 'Enter the date it was bought' : m <= 0 ? 'No warranty is given on this item'
    : inWarranty ? `In warranty till ${fmtDate(until!)}` : `Warranty ended on ${fmtDate(until!)}`
  const claimable = start?.claimable != null ? Number(start.claimable) : null

  const save = useMutation({
    mutationFn: () => {
      const body: NewClaimInput = {
        kind, invoiceLineId: from?.invoiceLineId ?? null, grnLineId: from?.grnLineId ?? null, parentClaimId: from?.parentClaimId ?? null,
        customerId: kind === 'CUSTOMER' && typed ? party?.id ?? null : null,
        vendorId: kind === 'SUPPLIER' && (typed || from?.parentClaimId) ? party?.id ?? null : null,
        contactPhone: phone.trim() || null, itemId: typed ? item?.id ?? null : null, description: typed ? (description.trim() || item?.name || null) : null,
        quantity: Number(quantity), serialNo: serial.trim() || null, unitRate: typed && rate !== '' ? Number(rate) : null,
        sourceDoc: typed ? sourceDoc.trim() || null : null, sourceDate: typed ? bought || null : null, claimDate,
        warrantyFrom: warrantyFrom || null, warrantyMonths: months === '' ? null : Number(months), complaint: complaint.trim(),
        receivedWith: receivedWith.trim() || null, unitReceived: kind === 'CUSTOMER' ? handedIn : null,
        fromStock: kind === 'SUPPLIER' ? fromStock : null, godownId: kind === 'SUPPLIER' && fromStock ? godownId || null : null,
      }
      return warrantyApi.create(body)
    },
    onSuccess: c => {
      ['warranty-claims', 'warranty-counts', 'warranty-claim', 'warranty-document'].forEach(k => qc.invalidateQueries({ queryKey: [k] }))
      toast.success(`Claim ${c.number} registered`)
      router.push(`/warranty/${c.id}`)
    },
    onError: (e: unknown) => toast.error(apiError(e, 'The claim could not be registered.')),
  })

  if (from && isLoading) return <div className="card text-sm">Loading…</div>
  if (from && (isError || !start)) return <div className="card text-sm" style={{ color: 'var(--danger-text)' }}>{apiError(error, 'This can’t be claimed.')}
    {onBack && <button className="underline ml-2" onClick={onBack}>Back</button>}</div>
  const needsParty = typed || (kind === 'SUPPLIER' && !!from?.parentClaimId)
  const problems = [
    needsParty && !party && (kind === 'CUSTOMER' ? 'Choose the customer.' : 'Choose the supplier to claim from.'),
    typed && !item && !description.trim() && 'Choose the item, or say what the goods are.',
    !(Number(quantity) > 0) && 'Enter how many are claimed.',
    claimable != null && Number(quantity) > claimable && `At most ${qty(claimable)} can be claimed on that line.`,
    !complaint.trim() && 'Describe the fault.',
  ].filter(Boolean) as string[]
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!problems.length) save.mutate() }} data-testid="claim-form">
      <section className="card space-y-4">
        {start && (
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold">{start.description}{start.batchNo ? <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}> · batch {start.batchNo}</span> : null}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{[start.invoiceNumber && `Invoice ${start.invoiceNumber}`, start.grnNumber && `Receipt ${start.grnNumber}`,
                start.billNumber && `Bill ${start.billNumber}`, start.sourceDate && fmtDate(start.sourceDate), start.parentNumber && `Customer’s claim ${start.parentNumber}`,
                start.unitRate != null && `${inr(start.unitRate)} each, before GST`].filter(Boolean).join(' · ')}</p>
            </div>
            {onBack && <button type="button" className="btn-ghost h-8 text-xs" onClick={onBack}>Another line</button>}
          </div>
        )}
        {start?.supplierFound && <p className="text-xs rounded-xl px-3 py-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} data-testid="claim-supplier-found">{start.supplierFound}</p>}
        {needsParty && (
          <SearchPicker<ClaimParty> label={kind === 'CUSTOMER' ? 'Customer' : 'Supplier to claim from'} chosen={party} onChange={setParty} required queryKey={`party-${kind}`}
            search={q => warrantyApi.parties(kind, q)} testId="claim-party" placeholder="Name, phone or GSTIN"
            title={p => p.name} sub={p => [p.city, p.phone, p.gstin].filter(Boolean).join(' · ')} />
        )}
        {typed && (
          <div className="grid sm:grid-cols-2 gap-4">
            <SearchPicker<ClaimItem> label="Item" chosen={item} onChange={x => { setItem(x); if (x) setMonths(String((kind === 'CUSTOMER' ? x.warrantyMonths : x.supplierWarrantyMonths) ?? '')) }}
              queryKey="items" search={q => warrantyApi.items(q)} testId="claim-item" placeholder="Name or code" title={x => x.name}
              sub={x => [x.code, (kind === 'CUSTOMER' ? x.warrantyMonths : x.supplierWarrantyMonths) != null ? `${kind === 'CUSTOMER' ? x.warrantyMonths : x.supplierWarrantyMonths} months’ warranty` : 'no warranty set'].filter(Boolean).join(' · ')} />
            {!item && <div><label className="label" htmlFor="c-desc">Or what the goods are</label>
              <input id="c-desc" className="input h-10" value={description} onChange={e => setDescription(e.target.value)} maxLength={300} data-testid="claim-description" /></div>}
            <div><label className="label" htmlFor="c-bought">{kind === 'CUSTOMER' ? 'Bought from you on' : 'Bought on'}</label>
              <input id="c-bought" type="date" className="input h-10" value={bought} max={claimDate} onChange={e => setBought(e.target.value)} data-testid="claim-bought" /></div>
            <div><label className="label" htmlFor="c-doc">{kind === 'CUSTOMER' ? 'Their bill number' : 'Their invoice number'}</label>
              <input id="c-doc" className="input h-10" value={sourceDoc} onChange={e => setSourceDoc(e.target.value)} maxLength={50} /></div>
            <div><label className="label" htmlFor="c-rate">Rate each, before GST (₹)</label>
              <input id="c-rate" className="input h-10" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} placeholder={kind === 'SUPPLIER' ? 'The item’s purchase price' : ''} /></div>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="label label-required" htmlFor="c-qty">Quantity{start?.unit ? ` (${start.unit})` : ''}</label>
            <input id="c-qty" className="input h-10" inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} data-testid="claim-qty" />
            {claimable != null && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{qty(claimable)} can be claimed on the line</p>}</div>
          <div><label className="label" htmlFor="c-serial">Serial number(s)</label>
            <input id="c-serial" className="input h-10 font-mono uppercase" value={serial} onChange={e => setSerial(e.target.value)} maxLength={200} data-testid="claim-serial" /></div>
          <div><label className="label" htmlFor="c-date">{kind === 'CUSTOMER' ? 'Reported on' : 'Raised on'}</label>
            <input id="c-date" type="date" className="input h-10" value={claimDate} max={today} onChange={e => setClaimDate(e.target.value || today)} /></div>
        </div>
        <div><label className="label label-required" htmlFor="c-fault">{kind === 'CUSTOMER' ? 'The fault the customer reports' : 'The fault'}</label>
          <textarea id="c-fault" className="input" rows={3} value={complaint} onChange={e => setComplaint(e.target.value)} maxLength={1000} data-testid="claim-complaint" /></div>
      </section>

      <section className="card space-y-3" aria-label="The warranty">
        <h2 className="font-semibold">The warranty</h2>
        <Coverage inWarranty={inWarranty} text={coverText} />
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="label" htmlFor="c-months">{kind === 'CUSTOMER' ? 'Months of warranty' : 'Their warranty (months)'}</label>
            <input id="c-months" className="input h-10" inputMode="numeric" value={months} onChange={e => setMonths(e.target.value.replace(/[^0-9]/g, ''))} data-testid="claim-months" />
            {start?.warrantySource && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>From {start.warrantySource}</p>}</div>
          <div><label className="label" htmlFor="c-from">Warranty from</label>
            <input id="c-from" type="date" className="input h-10" value={warrantyFrom || (typed ? bought : start?.warrantyFrom ?? '')} max={claimDate}
              onChange={e => setWarrantyFrom(e.target.value)} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{kind === 'CUSTOMER' ? 'The sale — or a later installation' : 'When the goods were received'}</p></div>
        </div>
        {inWarranty === false && kind === 'CUSTOMER' && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>It can still be registered: approving it then needs a goodwill note, or it is rejected.</p>}
      </section>

      <section className="card space-y-3" aria-label={kind === 'CUSTOMER' ? 'The goods' : 'Sending them back'}>
        {kind === 'CUSTOMER' ? (
          <>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={handedIn} onChange={e => setHandedIn(e.target.checked)} data-testid="claim-handed-in" />
              <span>The customer handed the goods in<span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Print the acknowledgement for them from the claim.</span></span>
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label" htmlFor="c-with">Received with</label>
                <input id="c-with" className="input h-10" value={receivedWith} onChange={e => setReceivedWith(e.target.value)} maxLength={300} placeholder="Box, charger, bill copy" /></div>
              <div><label className="label" htmlFor="c-phone">Contact phone</label>
                <input id="c-phone" className="input h-10" value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} inputMode="tel" /></div>
            </div>
          </>
        ) : (
          <>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={fromStock} onChange={e => setFromStock(e.target.checked)} disabled={!!from?.parentClaimId} data-testid="claim-from-stock" />
              <span>The goods are in our stock: they leave it when sent back
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{from?.parentClaimId ? 'A customer’s goods were never in stock.' : 'Untick for goods already used up or with a customer.'}</span></span>
            </label>
            {fromStock && <GodownSelect value={godownId} onChange={setGodownId} label="They are in" testId="claim-godown" />}
          </>
        )}
      </section>

      {problems.length > 0 && <ul className="text-sm space-y-0.5" style={{ color: 'var(--text-muted)' }}>{problems.map(p => <li key={p}>• {p}</li>)}</ul>}
      <div className="flex justify-end gap-2">
        <Link href="/warranty" className="btn-secondary h-10">Cancel</Link>
        <button type="submit" className="btn-primary h-10" disabled={problems.length > 0 || save.isPending} data-testid="claim-save">Register the claim</button>
      </div>
    </form>
  )
}
