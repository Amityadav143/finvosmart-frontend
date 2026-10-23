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

import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { Eyebrow, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { pageMetadata, pageSchema } from '@/lib/seo'
import reference from '@/lib/api-reference.json'

export const metadata: Metadata = pageMetadata('developers')

const BASE = 'https://app.finvosmart.com/api/v1'
const SIGN_IN = `curl -X POST ${BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"integration@yourcompany.com","password":"…","companyCode":"ACME482"}'`
const SIGN_IN_RESPONSE = `{
  "success": true,
  "data": { "accessToken": "eyJhbGciOi…", "refreshToken": "eyJhbGciOi…", "companyCode": "ACME482", … }
}`
const CALL = `curl "${BASE}/invoices?page=0&size=20" \\
  -H "Authorization: Bearer <accessToken>"`
const PAGE = `{
  "success": true,
  "data": {
    "content": [ … ],
    "currentPage": 0, "pageSize": 20, "totalElements": 134, "totalPages": 7
  }
}`
const VERIFY_NODE = `const crypto = require('crypto')

// rawBody: the request body exactly as received (before JSON parsing).
// headers: X-FINVO-Timestamp and X-FINVO-Signature from the request.
function isValid(rawBody, timestamp, signature, secret) {
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false          // older than 5 minutes: a replay
  const expected = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(timestamp + '.' + rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(signature || '')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}`
const VERIFY_PY = `import hmac, hashlib, time

def is_valid(raw_body: bytes, timestamp: str, signature: str, secret: str) -> bool:
    try:
        if abs(time.time() - int(timestamp)) > 300:   # older than 5 minutes: a replay
            return False
    except (TypeError, ValueError):
        return False
    signed = timestamp.encode() + b"." + raw_body
    expected = "sha256=" + hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")`
const DELIVERY = `POST https://your-server.example/finvosmart
Content-Type: application/json
User-Agent: Finvosmart-Webhooks/1.0
X-FINVO-Event: payment.received
X-FINVO-Delivery: 5f0c6a4e-…            (new for every attempt)
X-FINVO-Timestamp: 1792473600           (Unix seconds)
X-FINVO-Signature: sha256=9c1f…         (HMAC-SHA256 of "<timestamp>.<body>")

{
  "id": "3b1e2f7a-…",                   (the same on every attempt: use it to ignore repeats)
  "event": "payment.received",
  "createdAt": "2026-10-20T04:30:00Z",
  "company": "<your company id>",
  "data": {
    "paymentId": "…", "invoiceId": "…", "invoiceNumber": "INV/26-27/000042",
    "customerId": "…", "customerName": "Acme Traders", "amount": 59000.00, "tdsAmount": 0,
    "paymentDate": "2026-10-20", "mode": "UPI", "reference": "4183…", "balanceDue": 0
  }
}`
/** The events that are sent — the same list as the server's (WebhookRules.EVENTS). */
const EVENTS: [string, string][] = [
  ['invoice.issued', 'An invoice was issued (it left draft)'],
  ['invoice.paid', 'An invoice was paid in full'],
  ['invoice.overdue', 'An invoice passed its due date unpaid'],
  ['invoice.cancelled', 'An invoice was cancelled'],
  ['quotation.accepted', 'A customer accepted a quotation from its link'],
  ['payment.received', 'A customer payment was recorded'],
  ['customer.created', 'A customer was added'],
  ['bill.recorded', 'A supplier bill or expense was recorded'],
  ['bill.paid', 'A supplier bill was paid in full'],
  ['purchase_order.approved', 'A purchase order was approved'],
  ['leave.approved', 'A leave request was approved'],
  ['leave.rejected', 'A leave request was rejected'],
  ['payroll.paid', 'A payroll run was marked paid (totals only — never anyone\'s salary)'],
]

const code: CSSProperties = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px',
  fontSize: '13px', lineHeight: 1.6, overflowX: 'auto', color: 'var(--text-primary)', margin: '8px 0 18px',
  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', whiteSpace: 'pre',
}
const METHOD_COLOR: Record<string, string> = { GET: '#2563eb', POST: '#16a34a', PUT: '#d97706', PATCH: '#9333ea', DELETE: '#dc2626' }

export default function DevelopersPage() {
  const groups = reference.groups
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={pageSchema('developers')} />

      <section style={{ padding: '64px 0 24px' }}>
        <div style={narrow}>
          <Eyebrow>Developers</Eyebrow>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px,5vw,52px)', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '16px', fontWeight: 400 }}>Finvosmart API</h1>
          <p style={pStyle}>
            Connect your own systems to Finvosmart: create GST invoices, keep customers and items in sync, read your books
            and receive webhook notifications. Everything uses JSON over HTTPS with token-based sign-in.
          </p>
        </div>
      </section>

      <section style={{ padding: '8px 0 24px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>Quick start</h2>
          <p style={pStyle}><strong style={{ color: 'var(--text-primary)' }}>1. Sign in.</strong> Use a dedicated user for your integration, with the least-privileged role that covers what it needs. You get an access token.</p>
          <pre style={code}>{SIGN_IN}</pre>
          <pre style={code}>{SIGN_IN_RESPONSE}</pre>
          <p style={pStyle}><strong style={{ color: 'var(--text-primary)' }}>2. Call the API</strong> with the token in the <code>Authorization</code> header. When it expires, sign in again or use <code>POST /auth/refresh</code> with the refresh token.</p>
          <pre style={code}>{CALL}</pre>
        </div>
      </section>

      <section style={{ padding: '8px 0 24px' }}>
        <div style={narrow}>
          <h2 style={h2Style}>Conventions</h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '22px', margin: '0 0 12px' }}>
            {[
              <>Base URL: <code>{BASE}</code></>,
              <>Every response is wrapped as <code>{'{ success, message, data, error }'}</code>; your result is in <code>data</code>.</>,
              <>Lists that can grow are paged: pass <code>page</code> (from 0) and <code>size</code>; read <code>content</code>, <code>totalElements</code> and <code>totalPages</code>.</>,
              <>Dates are <code>YYYY-MM-DD</code>. Amounts are decimal numbers in rupees.</>,
              <>Errors use standard status codes: 400 (invalid request — see <code>message</code>), 401 (sign in again), 403 (the user&apos;s role lacks the permission listed below), 404 (not found), 429 (too many requests).</>,
              <>Rate limits: 30 requests per second per IP for the API; 5 sign-in attempts per minute per IP.</>,
            ].map((item, i) => <li key={i} style={{ ...pStyle, marginBottom: '8px' }}>{item}</li>)}
          </ul>
          <pre style={code}>{PAGE}</pre>
        </div>
      </section>

      <section style={{ padding: '8px 0 24px' }}>
        <div style={narrow}>
          <h2 style={h2Style} id="webhooks">Webhooks</h2>
          <p style={pStyle}>
            An administrator registers an HTTPS address under <strong style={{ color: 'var(--text-primary)' }}>Settings → Webhooks</strong> (or
            with <code>POST /webhooks</code>), choosing one event or <code>*</code> for all of them. The signing secret is shown once, when the
            endpoint is registered or its secret is replaced — store it then. When something happens, Finvosmart sends a JSON <code>POST</code>:
          </p>
          <pre style={code}>{DELIVERY}</pre>
          <p style={pStyle}>
            <strong style={{ color: 'var(--text-primary)' }}>Verify every delivery.</strong> The signature is <code>sha256=</code> followed by the
            HMAC-SHA256, in lowercase hex, of the timestamp header, a full stop and the raw body, keyed with your secret. Refuse deliveries whose
            timestamp is more than five minutes away from your clock, and compare in constant time:
          </p>
          <pre style={code}>{VERIFY_NODE}</pre>
          <pre style={code}>{VERIFY_PY}</pre>
          <p style={pStyle}><strong style={{ color: 'var(--text-primary)' }}>Events</strong></p>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)', margin: '0 0 18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="webhook-events">
              <tbody>
                {EVENTS.map(([type, what]) => (
                  <tr key={type} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '12.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{type}</td>
                    <td style={{ padding: '9px 12px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul style={{ listStyle: 'disc', paddingLeft: '22px', margin: '0 0 12px' }}>
            {[
              <>Answer with any 2xx status within 10 seconds; do slow work afterwards. Redirects are not followed.</>,
              <>A delivery that fails with a network error, a 5xx or a 429 is tried up to three times (at once, after 2 seconds, after 10 seconds). Other answers are not retried.</>,
              <>The same event can arrive twice — ignore an <code>id</code> you have already handled.</>,
              <>After 15 failed deliveries in a row the endpoint is switched off; Settings → Webhooks shows the last error and switches it back on.</>,
              <>The <strong style={{ color: 'var(--text-primary)' }}>Send test</strong> button there (or <code>POST /webhooks/{'{id}'}/test</code>) sends a <code>ping</code> event, signed the same way.</>,
              <>Only public HTTPS addresses are accepted: no IP addresses in private ranges, no <code>localhost</code> or internal names.</>,
            ].map((item, i) => <li key={i} style={{ ...pStyle, marginBottom: '8px' }}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section style={{ padding: '8px 0 64px' }} id="reference">
        <div style={wrap}>
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <h2 style={h2Style}>Endpoint reference</h2>
            <p style={pStyle}>Generated from the application code. Paths are relative to the site, e.g. <code>{'https://app.finvosmart.com'}</code>.</p>
            <nav aria-label="API sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '4px 0 24px' }}>
              {groups.map(g => (
                <a key={g.id} href={`#api-${g.id}`} className="btn-ghost h-8 text-xs" style={{ textDecoration: 'none' }}>{g.title}</a>
              ))}
            </nav>
          </div>
          {groups.map(g => (
            <div key={g.id} id={`api-${g.id}`} style={{ maxWidth: '980px', margin: '0 auto 34px', scrollMarginTop: '96px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{g.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{g.intro}</p>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                  <tbody>
                    {g.endpoints.map(e => (
                      <tr key={e.method + e.path} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', width: '74px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: METHOD_COLOR[e.method] ?? 'var(--text-primary)' }}>{e.method}</span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-geist-mono), monospace', fontSize: '12.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{e.path}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>{e.summary}</td>
                        <td style={{ padding: '10px 12px', fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {e.public ? 'No sign-in needed' : e.permissions.length ? e.permissions.join(' or ') : 'Signed-in user'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p style={{ ...narrow, fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Need an endpoint that isn&apos;t listed, or higher limits? <Link href="/contact" style={{ color: 'var(--gold)' }}>Contact us</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
