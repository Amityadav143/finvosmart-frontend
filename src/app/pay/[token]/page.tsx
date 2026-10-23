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
import { useParams, useSearchParams } from 'next/navigation'

// Built from <div role="main"> / role="region" rather than <main>/<section>: the site's mobile
// rules for marketing pages restyle every "main section" and "main h2", which this page must not get.

/**
 * The page behind "View and pay" in an invoice email: the business's invoice and how to
 * pay it — UPI (QR code, or one tap on a phone), bank transfer, or card/net banking when the
 * business has connected its own payment gateway. No login; the link itself is the key.
 * A quotation's link shows the quotation instead, which the customer can accept with their name.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

interface View {
  number: string; title: string; status: string; date: string; dueDate?: string
  seller: { name: string; legalName?: string; gstin?: string; address?: string; phone?: string; email?: string; logoUrl?: string }
  customerName: string; currency?: string; taxable: number; cgst: number; sgst: number; igst: number
  total: number; paid: number; due: number; overdue: boolean
  lines: { description: string; hsn?: string; quantity: number; unit?: string; rate: number; amount: number }[]
  pay?: { upiId?: string; upiUri?: string; payeeName?: string; bankName?: string; accountName?: string; accountNumber?: string
          ifsc?: string; branch?: string; onlineAvailable: boolean }
  msmeNote?: string
  /** TAX_INVOICE, QUOTATION, PROFORMA, CREDIT_NOTE, DELIVERY_CHALLAN… (older servers leave it out: an invoice) */
  kind?: string
  /** Quotations only: can it be accepted now (and if not, why), or who accepted it and when */
  acceptance?: { open: boolean; problem?: string | null; acceptedAt?: string | null; acceptedBy?: string | null } | null
}

/** Documents the customer pays from this page; the others (quotations, challans, credit notes) are only shown. */
const PAYABLE_KINDS = ['TAX_INVOICE', 'DEBIT_NOTE', 'PROFORMA', 'OPENING_BALANCE']
const NOUN: Record<string, string> = { QUOTATION: 'quotation', PROFORMA: 'proforma invoice', CREDIT_NOTE: 'credit note', DEBIT_NOTE: 'debit note', DELIVERY_CHALLAN: 'delivery challan' }
const when = (iso?: string | null) => iso ? new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + '+05:30')
  .toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
const todayIndia = () => new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10)

const inr = (n: number | string | undefined) => n === undefined || n === null ? '—'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n))
const date = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const C = { ink: '#14161f', muted: '#5f6470', line: '#e4e6ec', bg: '#f5f6f8', card: '#ffffff', accent: '#1a1b4b', green: '#15803d', red: '#b91c1c' }

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500) }) }}
      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 8, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, cursor: 'pointer' }}
      aria-label={`Copy ${label}`}>{done ? 'Copied' : 'Copy'}</button>
  )
}

function PayPage() {
  const { token } = useParams<{ token: string }>()
  const search = useSearchParams()
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState<'idle' | 'busy' | 'error'>('idle')
  const [onlineMsg, setOnlineMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [acceptName, setAcceptName] = useState('')
  const [accepting, setAccepting] = useState<'idle' | 'busy' | 'error'>('idle')
  const [acceptMsg, setAcceptMsg] = useState('')
  const justPaid = search.get('paid') === '1'

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    let tries = 0
    const load = () => fetch(`${API}/public/invoices/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async r => {
        const body = await r.json().catch(() => null)
        if (!r.ok) throw new Error(body?.message || body?.error || 'This link isn\'t valid.')
        setView(body.data)
        // after paying online, the payment arrives a moment later: check again a few times
        if (justPaid && Number(body.data.due) > 0 && tries++ < 5) setTimeout(load, 4000)
      })
      .catch(e => setError(e.message))
    load()
    fetch(`${API}/public/invoices/${encodeURIComponent(token)}/viewed`, { method: 'POST' }).catch(() => {})
  }, [token, justPaid])

  const payOnline = async () => {
    setOnline('busy')
    try {
      const r = await fetch(`${API}/public/invoices/${encodeURIComponent(token)}/pay-online`, { method: 'POST' })
      const body = await r.json().catch(() => null)
      if (!r.ok || !body?.data?.url) throw new Error(body?.message || 'Online payment is not available right now.')
      window.location.href = body.data.url
    } catch (e: any) { setOnline('error'); setOnlineMsg(e.message) }
  }

  const accept = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccepting('busy')
    try {
      const r = await fetch(`${API}/public/invoices/${encodeURIComponent(token)}/accept`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: acceptName }),
      })
      const body = await r.json().catch(() => null)
      if (!r.ok || !body?.data) throw new Error(body?.message || body?.error || 'The quotation could not be accepted. Please try again.')
      setView(body.data); setAccepting('idle')
    } catch (err: any) { setAccepting('error'); setAcceptMsg(err.message) }
  }

  const page: React.CSSProperties = { minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif", padding: '24px 16px 48px' }
  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }

  if (error) return (
    <div role="main" style={page}><div style={{ maxWidth: 520, margin: '60px auto', ...card, textAlign: 'center' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Link not found</h1>
      <p style={{ color: C.muted, margin: 0 }}>{error} Please check the link in your email, or contact the business that sent it.</p>
    </div></div>
  )
  if (!view) return <div role="main" style={page}><p style={{ textAlign: 'center', color: C.muted, marginTop: 80 }}>Loading…</p></div>

  const kind = view.kind ?? 'TAX_INVOICE'
  const payableKind = PAYABLE_KINDS.includes(kind)
  const noun = NOUN[kind] ?? 'invoice'
  const quote = kind === 'QUOTATION'
  const acc = view.acceptance
  const expired = quote && !!view.dueDate && view.dueDate < todayIndia()
  const paidInFull = payableKind && Number(view.due) <= 0 && view.status !== 'CANCELLED'
  const statusText = quote
    ? (acc?.acceptedAt ? 'Accepted' : view.status === 'CANCELLED' ? 'Withdrawn' : expired ? `Expired ${date(view.dueDate)}` : view.dueDate ? `Valid until ${date(view.dueDate)}` : 'Open')
    : !payableKind ? (view.status === 'CANCELLED' ? 'Cancelled' : null)
    : view.status === 'CANCELLED' ? 'Cancelled' : paidInFull ? 'Paid' : view.overdue ? `Overdue — was due ${date(view.dueDate)}` : Number(view.paid) > 0 ? 'Part paid' : view.dueDate ? `Due ${date(view.dueDate)}` : 'Due on receipt'
  const statusColor = quote
    ? (acc?.acceptedAt ? C.green : view.status === 'CANCELLED' || expired ? C.muted : C.accent)
    : view.status === 'CANCELLED' ? C.muted : paidInFull ? C.green : view.overdue ? C.red : C.accent
  const amountLabel = quote ? 'Quotation total' : !payableKind ? `${noun.charAt(0).toUpperCase() + noun.slice(1)} total` : paidInFull ? 'Amount paid' : 'Amount due'
  const amount = !payableKind || paidInFull ? view.total : view.due
  const p = payableKind ? view.pay : undefined

  return (
    <div role="main" style={page}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{view.seller.name}</p>
            <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>{[view.seller.gstin && `GSTIN ${view.seller.gstin}`, view.seller.address].filter(Boolean).join(' · ')}</p>
          </div>
          <a href={`${API}/public/invoices/${encodeURIComponent(token)}/pdf?download=true`}
            style={{ fontSize: 14, padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.line}`, background: '#fff', color: C.ink, textDecoration: 'none' }}>Download PDF</a>
        </header>

        {justPaid && !paidInFull && <div style={{ ...card, borderColor: '#bfdbfe', background: '#eff6ff' }}>Thank you — your payment is being confirmed. This page updates in a few seconds.</div>}

        <div role="region" style={card} aria-label={`${noun.charAt(0).toUpperCase() + noun.slice(1)} summary`}>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{view.title} {view.number} · {date(view.date)} · for {view.customerName}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <div>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{amountLabel}</p>
              <p style={{ fontSize: 34, fontWeight: 700, margin: '2px 0 0', letterSpacing: '-0.01em' }}>{inr(amount)}</p>
            </div>
            {statusText && <span style={{ fontSize: 13, fontWeight: 600, color: statusColor, padding: '5px 12px', borderRadius: 999, background: `${statusColor}12`, border: `1px solid ${statusColor}40` }}>{statusText}</span>}
          </div>
          {payableKind && Number(view.paid) > 0 && !paidInFull && <p style={{ fontSize: 13, color: C.muted, margin: '8px 0 0' }}>Invoice total {inr(view.total)} · received {inr(view.paid)}</p>}
        </div>

        {quote && acc && (
          <div role="region" style={acc.acceptedAt ? { ...card, borderColor: '#bbf7d0', background: '#f0fdf4' } : card} aria-label="Accept this quotation">
            {acc.acceptedAt ? (
              <p style={{ margin: 0 }}>
                <strong style={{ color: C.green }}>✓ Accepted</strong> by {acc.acceptedBy} on {when(acc.acceptedAt)}. {view.seller.name} has been told and will send you the invoice.
              </p>
            ) : acc.open ? (
              <form onSubmit={accept}>
                <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>Accept this quotation</h2>
                <p style={{ fontSize: 14, color: C.muted, margin: '0 0 12px' }}>
                  Happy with the items and prices below? Accept it here and {view.seller.name} will be told straight away. This is not an invoice — they will send you one.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label style={{ flex: '1 1 220px', fontSize: 13, color: C.muted }}>
                    Your name
                    <input value={acceptName} onChange={e => setAcceptName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name"
                      style={{ display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 15, color: C.ink, background: '#fff' }} />
                  </label>
                  <button type="submit" disabled={accepting === 'busy' || acceptName.trim().length < 2}
                    style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: C.accent, color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: accepting === 'busy' || acceptName.trim().length < 2 ? 0.6 : 1 }}>
                    {accepting === 'busy' ? 'Accepting…' : 'Accept quotation'}
                  </button>
                </div>
                {accepting === 'error' && <p role="alert" style={{ color: C.red, fontSize: 13, margin: '8px 0 0' }}>{acceptMsg}</p>}
              </form>
            ) : (
              <p style={{ margin: 0, color: C.muted }}>{acc.problem} {view.seller.phone || view.seller.email ? `Contact ${view.seller.name}${view.seller.phone ? ` on ${view.seller.phone}` : ` at ${view.seller.email}`}.` : ''}</p>
            )}
          </div>
        )}

        {p && !paidInFull && view.status !== 'CANCELLED' && (
          <div role="region" style={card} aria-label="How to pay">
            <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>How to pay</h2>
            {p.upiUri && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
                {!isMobile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${API}/public/invoices/${encodeURIComponent(token)}/upi-qr.svg`} alt={`UPI QR code to pay ${inr(view.due)}`} width={176} height={176}
                    style={{ border: `1px solid ${C.line}`, borderRadius: 12, imageRendering: 'pixelated' }} />
                )}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>UPI — GPay, PhonePe, Paytm or any bank app</p>
                  <p style={{ fontSize: 14, color: C.muted, margin: '4px 0 10px' }}>
                    {isMobile ? 'Tap to open your UPI app with the amount filled in.' : 'Scan the code with your phone. The amount is filled in.'} Payment goes straight to {p.payeeName ?? view.seller.name}.
                  </p>
                  {isMobile && (
                    <a href={p.upiUri} style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 12, background: C.accent, color: '#fff', fontWeight: 600, textDecoration: 'none' }}>
                      Pay {inr(view.due)} with a UPI app
                    </a>
                  )}
                  <p style={{ fontSize: 14, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    UPI ID <code style={{ fontSize: 14 }}>{p.upiId}</code> <Copy value={p.upiId!} label="UPI ID" />
                  </p>
                </div>
              </div>
            )}
            {p.accountNumber && (
              <div style={{ padding: '16px 0', borderBottom: p.onlineAvailable ? `1px solid ${C.line}` : 'none' }}>
                <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Bank transfer — NEFT, RTGS or IMPS</p>
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '6px 12px', margin: 0, fontSize: 14, alignItems: 'center' }}>
                  {p.accountName && <><dt style={{ color: C.muted }}>Account name</dt><dd style={{ margin: 0 }}>{p.accountName}</dd><span /></>}
                  <dt style={{ color: C.muted }}>Account no.</dt><dd style={{ margin: 0, fontFamily: 'monospace' }}>{p.accountNumber}</dd><Copy value={p.accountNumber} label="account number" />
                  {p.ifsc && <><dt style={{ color: C.muted }}>IFSC</dt><dd style={{ margin: 0, fontFamily: 'monospace' }}>{p.ifsc}</dd><Copy value={p.ifsc} label="IFSC" /></>}
                  {(p.bankName || p.branch) && <><dt style={{ color: C.muted }}>Bank</dt><dd style={{ margin: 0 }}>{[p.bankName, p.branch].filter(Boolean).join(', ')}</dd><span /></>}
                </dl>
                <p style={{ fontSize: 13, color: C.muted, margin: '8px 0 0' }}>Please mention {view.number} in the remarks so the payment is matched quickly.</p>
              </div>
            )}
            {p.onlineAvailable && (
              <div style={{ paddingTop: 16 }}>
                <p style={{ fontWeight: 600, margin: '0 0 8px' }}>Card or net banking</p>
                <button type="button" onClick={payOnline} disabled={online === 'busy'}
                  style={{ padding: '11px 18px', borderRadius: 12, border: `1px solid ${C.accent}`, background: '#fff', color: C.accent, fontWeight: 600, cursor: 'pointer' }}>
                  {online === 'busy' ? 'Opening…' : `Pay ${inr(view.due)} online`}
                </button>
                {online === 'error' && <p style={{ color: C.red, fontSize: 13, margin: '8px 0 0' }}>{onlineMsg}</p>}
              </div>
            )}
            {!p.upiUri && !p.accountNumber && !p.onlineAvailable && (
              <p style={{ color: C.muted, margin: 0 }}>Please contact {view.seller.name} for payment details{view.seller.phone ? ` (${view.seller.phone})` : ''}.</p>
            )}
          </div>
        )}

        <div role="region" style={card} aria-label={`${noun.charAt(0).toUpperCase() + noun.slice(1)} details`}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>Details</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ color: C.muted, textAlign: 'left' }}>
                <th style={{ padding: '6px 0', fontWeight: 500 }}>Item</th><th style={{ padding: '6px 8px', fontWeight: 500, textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>
                {view.lines.map((l, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                    <td style={{ padding: '8px 0' }}>{l.description}{l.hsn ? <span style={{ color: C.muted, fontSize: 12 }}> · HSN {l.hsn}</span> : null}</td>
                    <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{Number(l.quantity)}{l.unit ? ` ${l.unit}` : ''}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>{inr(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, fontSize: 14, display: 'grid', gap: 4 }}>
            <Row k="Taxable value" v={inr(view.taxable)} />
            {Number(view.igst) > 0 ? <Row k="IGST" v={inr(view.igst)} /> : <><Row k="CGST" v={inr(view.cgst)} /><Row k="SGST / UTGST" v={inr(view.sgst)} /></>}
            <Row k="Total" v={inr(view.total)} bold />
          </div>
          {view.msmeNote && <p style={{ fontSize: 12, color: C.muted, margin: '12px 0 0', lineHeight: 1.5 }}>{view.msmeNote}</p>}
        </div>

        <footer style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
          Questions about this {noun}? Contact {view.seller.name}{view.seller.email ? ` at ${view.seller.email}` : ''}{view.seller.phone ? ` or ${view.seller.phone}` : ''}.
          <br /><span style={{ opacity: 0.8 }}>Sent with Finvosmart</span>
        </footer>
      </div>
    </div>
  )
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 700 : 400 }}><span style={{ color: bold ? C.ink : C.muted }}>{k}</span><span>{v}</span></div>
}

export default function Page() {
  return <Suspense fallback={null}><PayPage /></Suspense>
}
