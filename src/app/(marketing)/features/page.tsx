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

import Link from 'next/link'
import {
  LayoutDashboard, Users, DollarSign, FileText, ShoppingCart, Boxes,
  TrendingUp, FolderOpen, Shield, Activity, Camera, Heart, RefreshCw, Mic, LineChart,
  Building2, CreditCard, Globe, PenLine, ArrowRight, Receipt, Upload, Scale, Landmark, Clock, Bell, Search,
  BookOpen, ShieldCheck, UserPlus, Gavel, Sparkles, Monitor, Store, Warehouse, PackageCheck, ShieldPlus,
} from 'lucide-react'
import { SoonBadge } from '@/components/marketing/SoonBadge'
import { PAGES } from '@/lib/seo'
import { SOLUTIONS_MENU } from '@/lib/siteNav'

// Server component: all three lists are in the page's HTML (they used to be tabs, and only the
// first was there until someone clicked). Rule for this page: describe only what the product
// does today. Anything still being built goes under "Coming soon" (the app keeps those switched
// off — lib/previews.ts).
const MODULES = [
  { icon: LayoutDashboard, color: '#E9C46A', name: 'Dashboard & Analytics',   desc: 'A home dashboard for each role: what customers owe you and what you owe, overdue amounts, GST for the month, payroll and the statutory dates coming up. Analytics over 3, 6 or 12 months — revenue, collections, ageing, top customers and headcount — with CSV export.' },
  { icon: FileText,        color: '#E9C46A', name: 'Invoicing & Getting Paid', desc: 'Tax invoices, quotations, proformas, delivery challans, credit and debit notes. CGST + SGST or IGST from the place of supply, reverse charge handled, exact to the paisa. PDF with a UPI QR code, a view-and-pay link for every invoice, part payments with the TDS your customer deducted, and email and WhatsApp reminders. Customers accept a quotation from its link, and you are told; a quotation, proforma or delivery challan becomes its invoice in one step — once, and linked both ways.' },
  { icon: Receipt,         color: '#EA580C', name: 'Purchases & Payables',     desc: 'Supplier bills, expenses and supplier credit notes that post to your books, and payments against them. Pay-by dates under the MSMED Act for micro and small suppliers, TDS on bills by section, and what you owe by supplier and age. A supplier bill already entered is refused, so nothing is paid twice.' },
  { icon: Camera,          color: '#7C3AED', name: 'Supplier invoices read for you', desc: 'Recording a bill or an expense, upload the supplier’s invoice — a PDF or a photo — and its number, date, supplier, place of supply, GST by rate and total are filled in for you to check. A GST e-invoice is read exactly from its signed QR code; a photo or a scanned page by OCR. It is read in your browser, and the file stays with the bill.' },
  { icon: DollarSign,      color: '#16A34A', name: 'Finance & Accounting',     desc: 'Double-entry books with a ready chart of accounts. Invoices, bills, payments and payroll post themselves; manual journal entries must balance and are corrected by reversal. Trial Balance, Profit & Loss for any period and Balance Sheet as at any date; closed periods stay locked.' },
  { icon: BookOpen,        color: '#16A34A', name: 'Ledgers',                  desc: 'A ledger for every account — opening balance, each entry with its running balance, and the closing balance — for any period. Open the journal entry behind a line, or the invoice, bill or payroll it came from. Download it as a PDF or CSV.' },
  { icon: ShieldCheck,     color: '#D97706', name: 'Review by your accountant', desc: 'Send an invoice, supplier bill or journal entry to your accountant (CA) for review: someone other than the sender approves it, asks for changes or rejects it, and the sender is told. Lock a period once its returns are filed, so nothing dated in it can change.' },
  { icon: LineChart,       color: '#2563EB', name: '13-week cash-flow forecast', desc: 'Cash week by week for the next 13 weeks, from your books: bank and cash today, open invoices — expected as late as each customer usually pays — supplier bills by their pay-by dates, salaries, PF, ESI, TDS and GST. It names the first week cash would run short and the late invoices to chase, and each week opens to the documents behind it.' },
  { icon: Building2,       color: '#2563EB', name: 'Bank Payment Matching',    desc: 'Upload any bank’s statement — CSV, Excel or OFX. Money in and out is matched to invoices and bills by number and amount, and recorded in one go.' },
  { icon: Users,           color: '#2563EB', name: 'HRMS & Payroll',           desc: 'Employees, a monthly attendance register and leave approvals. Payroll under the labour codes: salary set-ups, monthly runs with approval, payslips, PF (ECR), ESI and bank files — posted to the books.' },
  { icon: UserPlus,        color: '#7C3AED', name: 'Hiring & Performance Reviews', desc: 'Job postings, and candidates moved through screening, interview rounds and an offer to hired. Performance reviews scored on five areas — performance, communication, teamwork, initiative and technical skill — which the employee then acknowledges. Employees see their own payslips and apply for leave in My Portal.' },
  { icon: ShoppingCart,    color: '#EA580C', name: 'Procurement',              desc: 'Purchase orders from draft to approval and ordering, with separate rights to raise, approve and receive — started for you from the items running low or from the reorder planner, which works out from your own sales and issues what to order and how much, one draft order per supplier. An order’s received quantities and status follow its goods receipts, and the rest can be closed with the reason. Suppliers with GSTIN, PAN, MSME and TDS details.' },
  { icon: PackageCheck,    color: '#B45309', name: 'Purchase store — gate to shelf', desc: 'Every consignment recorded at the gate — supplier, invoice or challan, vehicle, LR and e-way bill — with a gate pass. Goods counted into a goods receipt (GRN) against the order, with rejections and their reasons, batches and expiry; items marked for inspection wait for quality, and only what passes goes into stock. Rejected goods go back with a return challan, and the supplier’s bill is made from the receipt and matched with the order — a bill for more than came in, or above the order’s rate, is held for payment until someone who approves purchases or finance releases it with a reason. Reports for pending deliveries, receipts not billed and rejections, and each supplier rated from 1 to 100 on quality, delivery, price and how they settle warranty claims.' },
  { icon: ShieldPlus,      color: '#16A34A', name: 'Warranty claims',          desc: 'A customer’s faulty goods registered against the invoice they were sold on, with the warranty worked out from the item’s period — in warranty and how many days are left, or not. Approve a repair, a replacement from stock on a no-charge challan or a credit note; reject it with the reason, or approve it outside the warranty as goodwill. Then pass the claim on to the supplier the goods came from (found from the batch’s receipt or bill), send the goods back with a challan, and record what they accept and their credit note. An acknowledgement for the customer, a history of every step, and what is still to recover from suppliers.' },
  { icon: Boxes,           color: '#0D9488', name: 'Inventory',                desc: 'Items with HSN/SAC, unit, prices and reorder level. Stock moves by itself as you issue invoices and credit notes and record supplier bills — cancelling or correcting one puts it right — and the stock ledger links each movement to its document. Stock value at a glance; items at their reorder level are flagged, with a purchase order ready to send. Services keep no stock.' },
  { icon: Warehouse,       color: '#0F766E', name: 'Godowns & stock control',  desc: 'Stock kept by godown — warehouses, shops, factory stores and sites. Transfers between godowns with a delivery challan to print; material asked for, approved, issued and returned with issue slips; and stock counts from a printed sheet or a barcode scanner, with the short and over value posted as adjustments. Batches go first-to-expire.' },
  { icon: Monitor,         color: '#DB2777', name: 'Counter billing (POS)',    desc: 'A fast counter for shops: scan barcodes (on Android, in Chrome, with the phone\'s camera too), take cash with the change worked out, UPI with a QR code for the exact amount, card, or part on account. Every bill is a GST invoice and the stock leaves the counter\'s godown. 58 or 80 mm receipts, bills on WhatsApp, held bills, returns with refunds, and a shift close that counts the drawer.' },
  { icon: Store,           color: '#2563EB', name: 'Online store',             desc: 'Your own store page with your items, photos, prices with GST and what is in stock. Customers order for pickup or delivery without signing up and follow the order on their phone; you confirm, pack, deliver and bill each order in a step, and share the link or a QR poster.' },
  { icon: TrendingUp,      color: '#7C3AED', name: 'CRM — Leads & Customers',  desc: 'Leads on a 7-stage board with follow-up dates and values, made customers in one step and quoted straight away; customers with GSTIN, credit limit and what they owe, and a statement of account — on screen, as a PDF or emailed — for any period. Supplier statements too, to reconcile with theirs.' },
  { icon: FolderOpen,      color: '#DB2777', name: 'Projects & Contracts',     desc: 'Projects with client, dates, budget and status, and a schedule bar that shows how much of the time is used. A contract register with value and dates: contracts expire on their end date, and ending one early records why.' },
  { icon: Gavel,           color: '#2563EB', name: 'Tender Tracker',           desc: 'The government and PSU tenders you bid on — GeM, Railways, CPWD and state portals — with their closing dates, what is closing soon and the EMD you have locked up across live bids.' },
  { icon: Upload,          color: '#64748B', name: 'Import from Excel',        desc: 'Customers, suppliers, items, employees, opening balances and unpaid invoices and bills — checked and previewed first, saved all or nothing.' },
  { icon: Shield,          color: '#E9C46A', name: 'Users, Roles & Audit Trail', desc: 'Roles with fine-grained permissions, two-step sign-in with an authenticator app, and an append-only audit trail of every change to the books.' },
  { icon: Bell,            color: '#DC2626', name: 'Notifications & Webhooks', desc: 'A notice when a customer pays, an invoice goes overdue, a supplier bill falls due (MSME pay-by dates first), stock runs low, payslips are ready or something waits for your approval. Signed, retried webhooks send the same events to your own systems.' },
  { icon: Search,          color: '#2563EB', name: 'Find anything, fast',      desc: 'One search box (Ctrl K) for invoices, customers, bills, suppliers, orders, items and people; a “+ New” menu and keyboard shortcuts for everyday work; and a getting-started checklist that ticks itself off as you set up.' },
  { icon: Sparkles,        color: '#E9C46A', name: 'Ask Finvosmart — AI assistant', desc: 'Ask in plain words — English, Hindi or Hinglish — how to do something, and get the steps with a link to the page. Once your company admin allows it, it also answers from your own books: who owes you the most, what is overdue, bills to pay, cash for the next 13 weeks, or a record by name or number — never more than the person asking may open. It only reads; it can’t change anything. A chat can be emailed to our support team in one click. Most answers come straight from Finvosmart’s own server; a question it can’t answer itself can go to Claude, from Anthropic, where that is switched on.' },
]

const COMPLIANCE = [
  { icon: Landmark,  color: '#0D9488', name: 'GST returns — GSTR-1 and GSTR-3B', desc: 'GSTR-1 section by section — B2B, B2C large and small, credit and debit notes, nil-rated, HSN summary split B2B/B2C, documents issued — as the portal’s JSON file and as Excel. GSTR-3B with input tax credit from GSTR-2B and the set-off of credit against tax.' },
  { icon: RefreshCw, color: '#14B8A6', name: 'GST credit check (GSTR-2B)',        desc: 'Upload your GSTR-2B and every supplier invoice is matched with your bills — matched, mismatched, missing from your books or from the supplier’s return — with what to do about each.' },
  { icon: DollarSign,color: '#B45309', name: 'TDS on supplier payments',          desc: 'TDS worked out on bills by nature of payment, with thresholds, a monthly register with deposit due dates and flags for missing PANs.' },
  { icon: Clock,     color: '#DC2626', name: 'MSME payment dates',                desc: 'For micro and small suppliers, the pay-by date under the MSMED Act (45 days, or the agreed term if shorter), and what is already late.' },
  { icon: Scale,     color: '#2563EB', name: 'Payroll statutory',                 desc: 'PF, ESI and professional tax each month, TDS on salary under the regime each employee chose, and the files to upload.' },
  { icon: FileText,  color: '#E9C46A', name: 'Invoices by the rules',             desc: 'Every Rule 46 field, invoice numbers of up to 16 characters, place of supply, and reverse-charge invoices that show the tax the buyer pays.' },
]

const COMING_SOON = [
  { icon: FileText,   color: '#0D9488', name: 'E-invoice (IRN) and e-way bill', desc: 'Generated from the invoice through a GST Suvidha Provider. Today, generate them on the government portals and keep the numbers with the invoice.' },
  { icon: Mic,        color: '#EA580C', name: 'BharatVoice',                  desc: 'Commands in Indian languages.' },
  { icon: CreditCard, color: '#16A34A', name: 'Expense claims',               desc: 'Employees submit expenses with receipts, for approval and reimbursement.' },
  { icon: Globe,      color: '#7C3AED', name: 'Client portal',                desc: 'Customers see all their invoices and statements in one place. (Every invoice already has its own view-and-pay link.)' },
  { icon: RefreshCw,  color: '#0D9488', name: 'Recurring billing',            desc: 'Invoices raised automatically on a schedule.' },
  { icon: PenLine,    color: '#EA580C', name: 'Aadhaar eSign',                desc: 'Contracts signed with Aadhaar OTP through a licensed provider.' },
  { icon: Activity,   color: '#64748B', name: 'Automation rules',             desc: 'If-this-then-that rules across invoices, stock and leave.' },
  { icon: Heart,      color: '#DB2777', name: 'Wellness insights',            desc: 'Signs of overwork from attendance and leave patterns.' },
  { icon: Boxes,      color: '#0D9488', name: 'Fixed assets',                 desc: 'An asset register with depreciation posted to your books.' },
]

const h2: React.CSSProperties = { fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(26px,3.6vw,38px)', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '10px' }
const lead: React.CSSProperties = { fontSize: '15.5px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '640px', marginBottom: '28px' }
const jump: React.CSSProperties = { padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }

export default function FeaturesPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>

      {/* Hero */}
      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--gold)', display: 'inline-block' }} />
            Finvosmart features
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px,5vw,52px)', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.15 }}>
            Everything an Indian SME runs on. In one place.
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 36px', lineHeight: 1.7 }}>
            GST billing, accounting, payroll, HR, CRM and inventory — what works today, the compliance it takes care of, and what is coming next, said plainly.
          </p>
          <nav aria-label="On this page" style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
            <a href="#modules" className="mk-link" style={jump}>What it does</a>
            <a href="#compliance" className="mk-link" style={jump}>Compliance</a>
            <a href="#by-need" className="mk-link" style={jump}>By business need</a>
            <a href="#coming-soon" className="mk-link" style={jump}>Coming soon</a>
          </nav>
        </div>
      </section>

      <section id="modules" style={{ padding: '64px 0 24px', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={h2}>What it does</h2>
          <p style={lead}>Every module shares one set of books and one list of customers, suppliers, items and people.</p>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {MODULES.map(m => (
              <div key={m.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', borderTop: `3px solid ${m.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${m.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }} aria-hidden="true">
                    <m.icon size={18} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</h3>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compliance" style={{ padding: '64px 0 24px', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={h2}>The compliance it takes care of</h2>
          <p style={lead}>GST, TDS, MSME payment dates and payroll statutory work, done from the same records as your books.</p>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px' }}>
            {COMPLIANCE.map(u => (
              <div key={u.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${u.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.color }} aria-hidden="true">
                    <u.icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</h3>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="by-need" style={{ padding: '64px 0 24px', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={h2}>By business need</h2>
          <p style={lead}>A closer look at each part of the product, with how it works and the questions businesses ask most.</p>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {SOLUTIONS_MENU.map(s => (
              <Link key={s.key} href={PAGES[s.key].path} className="lp-card" style={{ display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', textDecoration: 'none' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{PAGES[s.key].label} →</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.blurb}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="coming-soon" style={{ padding: '64px 0 80px', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={h2}>Coming soon</h2>
          <p style={lead}>
            Being built now. They are not part of the product yet, and they are switched off in the app until they work on your own data.
          </p>
          <div className="auto-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px' }}>
            {COMING_SOON.map(s => (
              <div key={s.name} style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: '16px', padding: '24px', display: 'flex', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0, opacity: 0.8 }} aria-hidden="true">
                  <s.icon size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</h3>
                    <SoonBadge />
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Link href="/register" className="lp-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '10px', background: 'var(--btn-primary-bg)', color: 'var(--text-on-gold)', textDecoration: 'none', fontWeight: 600, fontSize: '16px', boxShadow: 'var(--btn-primary-shadow)' }}>
              Start your free trial <ArrowRight size={16} aria-hidden />
            </Link>
            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>7-day trial · No credit card · <Link href="/pricing" className="text-link">See pricing</Link></p>
          </div>
        </div>
      </section>
    </div>
  )
}
