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
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'
import { CtaBand, FaqList, h2Style, narrow, pStyle, wrap } from '@/components/marketing/SolutionPage'
import { faqSchemaFor, pageMetadata, pageSchema, PAGES, PLANS, softwareSchema } from '@/lib/seo'

// The Hindi homepage. It and the English homepage name each other as language versions
// (hreflang, set in lib/seo.ts), so Google shows each to the right searchers. Same facts as
// the English pages — and it says plainly that the app itself is in English.
export const metadata: Metadata = pageMetadata('hindiHome')

const inr = (n: number) => n.toLocaleString('en-IN')

const FEATURES = [
  { title: 'GST बिलिंग', text: 'हर लाइन पर सही GST: अपने राज्य में बिक्री पर CGST + SGST, दूसरे राज्य में IGST। हर इनवॉइस पर HSN/SAC कोड, UPI QR कोड और भुगतान का लिंक, और ईमेल व WhatsApp पर भुगतान के रिमाइंडर।' },
  { title: 'GST रिटर्न', text: 'आपकी किताबों से तैयार GSTR-1 (पोर्टल की JSON फ़ाइल और Excel) और GSTR-3B। सप्लायर के इनवॉइस का GSTR-2B से मिलान, ताकि कोई इनपुट टैक्स क्रेडिट न छूटे।' },
  { title: 'अकाउंटिंग', text: 'इनवॉइस, बिल, भुगतान और पेरोल अपने-आप खातों में दर्ज होते हैं। हर खाते का लेजर, ट्रायल बैलेंस, लाभ-हानि खाता और बैलेंस शीट — किसी भी अवधि के लिए।' },
  { title: 'पेरोल', text: 'हाज़िरी और छुट्टी से वेतन की गणना; नए लेबर कोड के अनुसार PF, ESI, प्रोफ़ेशनल टैक्स और वेतन पर TDS। सैलरी स्लिप, PF की ECR फ़ाइल, ESI शीट और बैंक की फ़ाइल तैयार मिलती है।' },
  { title: 'HR', text: 'कर्मचारियों का रिकॉर्ड, महीने का हाज़िरी रजिस्टर, छुट्टी की मंज़ूरी, भर्ती और परफ़ॉर्मेंस रिव्यू। हर कर्मचारी अपनी सैलरी स्लिप और छुट्टियाँ ख़ुद देख सकता है।' },
  { title: 'ख़रीद, स्टॉक और CRM', text: 'सप्लायर बिल पर TDS, MSME सप्लायर को भुगतान की आख़िरी तारीख़, परचेज़ ऑर्डर, स्टॉक और रीऑर्डर लेवल, और लीड से ग्राहक तक बिक्री का पूरा हिसाब।' },
]

const PLAN_USERS: Record<string, string> = {
  Starter: '10 यूज़र तक · 1 ब्रांच', Growth: '50 यूज़र तक · कई ब्रांच', Enterprise: 'असीमित यूज़र और ब्रांच',
}

const FAQ = [
  { q: 'Finvosmart, Tally से कैसे अलग है?', a: 'Tally डेस्कटॉप पर चलने वाला अकाउंटिंग सॉफ़्टवेयर है। Finvosmart क्लाउड पर चलता है और अकाउंटिंग के साथ GST रिटर्न, ख़रीद, पेरोल, HR, CRM और स्टॉक भी संभालता है — सब एक-दूसरे से जुड़े हुए, और कहीं से भी खोले जा सकते हैं।' },
  { q: 'क्या Finvosmart के इनवॉइस GST नियमों के अनुसार हैं?', a: 'हाँ। हर इनवॉइस में CGST नियम 46 के सभी ज़रूरी विवरण होते हैं — आपका GSTIN, क्रमवार इनवॉइस नंबर, ग्राहक का विवरण, सप्लाई का स्थान, HSN/SAC कोड, टैक्स योग्य मूल्य और CGST, SGST या IGST की रकम। ई-इनवॉइस (IRN) और ई-वे बिल सीधे Finvosmart से बनाने की सुविधा अभी बन रही है; तब तक इन्हें सरकारी पोर्टल पर बनाएँ।' },
  { q: 'क्या सॉफ़्टवेयर हिंदी में है?', a: 'अभी Finvosmart का ऐप अंग्रेज़ी में है। हमारी टीम हिंदी और अंग्रेज़ी, दोनों में मदद करती है — डेमो, सेटअप और डेटा इम्पोर्ट में भी।' },
  { q: 'क्या मेरा डेटा सुरक्षित है?', a: 'डेटा HTTPS पर एन्क्रिप्ट होकर आता-जाता है, भुगतान-गेटवे की चाबियाँ एन्क्रिप्ट करके रखी जाती हैं, हर व्यक्ति को उसकी भूमिका के हिसाब से ही पहुँच मिलती है, और किताबों में हुए हर बदलाव का रिकॉर्ड रहता है। अपने खाते पर आप ऑथेंटिकेटर ऐप से दो-चरण वाला साइन-इन भी चालू कर सकते हैं।' },
  { q: 'Tally या Excel से डेटा कैसे लाएँ?', a: 'ग्राहक, सप्लायर, आइटम, कर्मचारी, खातों के ओपनिंग बैलेंस और बकाया इनवॉइस व बिल Excel से इम्पोर्ट करें — Tally से निकाली गई Excel फ़ाइलें भी। सेव करने से पहले हर इम्पोर्ट की जाँच और प्रीव्यू होता है।' },
  { q: 'कीमत कितनी है?', a: `प्लान ₹${inr(PLANS[0].annual)} प्रति माह से शुरू होते हैं (सालाना बिलिंग पर; मासिक बिलिंग पर ₹${inr(PLANS[0].monthly)})। 14 दिन का मुफ़्त ट्रायल है, और क्रेडिट कार्ड की ज़रूरत नहीं।` },
]

const card: React.CSSProperties = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }

export default function HindiHomePage() {
  return (
    <div lang="hi-IN" style={{ background: 'var(--bg-base)', paddingTop: '88px' }}>
      <JsonLd nodes={[...pageSchema('hindiHome', faqSchemaFor(PAGES.hindiHome.path, FAQ)), softwareSchema()]} />

      <section style={{ padding: '72px 0 56px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={wrap}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginBottom: '16px' }}>भारतीय व्यवसायों के लिए · भारत में बना</p>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(30px,4.6vw,50px)', color: 'var(--text-primary)', lineHeight: 1.25, margin: '0 auto 18px', maxWidth: '860px', fontWeight: 400 }}>
            GST बिलिंग, अकाउंटिंग, पेरोल और HR — एक ही सॉफ़्टवेयर में
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 30px', lineHeight: 1.8 }}>
            Finvosmart आपके व्यवसाय का रोज़ का काम एक ही जगह संभालता है: GST वाले इनवॉइस, GSTR-1 और GSTR-3B की फ़ाइलें, डबल-एंट्री अकाउंटिंग, PF-ESI के साथ पेरोल, कर्मचारियों की हाज़िरी और छुट्टी, CRM और स्टॉक। सब कुछ ब्राउज़र में चलता है — कुछ भी इंस्टॉल नहीं करना।
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn-primary" style={{ height: '46px', padding: '0 26px', fontSize: '15px', textDecoration: 'none' }}>14 दिन मुफ़्त आज़माएँ <ArrowRight size={16} aria-hidden /></Link>
            <Link href="/contact" className="btn-secondary" style={{ height: '46px', padding: '0 22px', fontSize: '15px', textDecoration: 'none' }}>डेमो बुक करें</Link>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px' }}>क्रेडिट कार्ड की ज़रूरत नहीं · हिंदी और अंग्रेज़ी में सहायता · <Link href="/" lang="en" hrefLang="en" className="text-link">Read in English</Link></p>
        </div>
      </section>

      <section style={{ padding: '64px 0 32px' }}>
        <div style={wrap}>
          <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '28px' }}>Finvosmart क्या-क्या करता है</h2>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {FEATURES.map(f => (
              <div key={f.title} style={card}>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0' }}>
        <div style={narrow}>
          <h2 style={h2Style}>Tally या Excel से आना आसान</h2>
          <p style={pStyle}>ग्राहक, सप्लायर, आइटम, कर्मचारी, खातों के ओपनिंग बैलेंस और बकाया इनवॉइस व बिल Excel से इम्पोर्ट करें — Tally से निकाली गई Excel फ़ाइलें भी। सेव करने से पहले हर इम्पोर्ट की जाँच और प्रीव्यू होता है, और ज़रूरत हो तो हमारी टीम मदद करती है। कई व्यवसाय एक महीने तक दोनों सिस्टम साथ चलाकर आँकड़े मिलाते हैं, फिर पूरी तरह Finvosmart पर आ जाते हैं।</p>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>कीमत</h2>
          <p style={pStyle}>एक ही सब्सक्रिप्शन में सब कुछ — हर मॉड्यूल का अलग शुल्क नहीं।</p>
          <div className="auto-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', margin: '8px 0 14px' }}>
            {PLANS.map(p => (
              <div key={p.name} style={{ ...card, padding: '20px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{PLAN_USERS[p.name]}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>₹{inr(p.annual)}<span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}> / माह</span></p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>सालाना बिलिंग · मासिक बिलिंग पर ₹{inr(p.monthly)}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Link href="/pricing" className="text-link">सभी प्लान की पूरी जानकारी (अंग्रेज़ी में) →</Link>
          </p>

          <h2 style={{ ...h2Style, marginTop: '36px' }}>मुफ़्त GST टूल</h2>
          <p style={pStyle}>बिना साइन-अप के, मुफ़्त (ये पेज अंग्रेज़ी में हैं):</p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
            {([['gstCalculator', 'GST कैलकुलेटर — GST जोड़ें या निकालें'], ['gstinChecker', 'GSTIN चेकर — GST नंबर की जाँच'],
               ['gstInvoiceFormat', 'GST इनवॉइस फ़ॉर्मेट — Excel और PDF'], ['gstDueDates', 'GST रिटर्न की आख़िरी तारीख़ें']] as const).map(([k, text]) => (
              <li key={k} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '15px' }}>
                <Check size={16} style={{ color: 'var(--ok-text)', flexShrink: 0 }} aria-hidden />
                <Link href={PAGES[k].path} className="text-link">{text}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqList items={FAQ} title="अक्सर पूछे जाने वाले सवाल" />
      <CtaBand title="आज ही शुरू करें" text="14 दिन मुफ़्त — क्रेडिट कार्ड नहीं, कुछ इंस्टॉल नहीं करना।" label="मुफ़्त ट्रायल शुरू करें" />
    </div>
  )
}
