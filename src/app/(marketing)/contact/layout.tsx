/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Sales — Talk to the FINVOSMART Team',
  description: 'Get in touch with FINVOSMART. Request a demo, ask about migration from Tally or Zoho, or talk to sales about Enterprise plans. Support available in English and Hindi.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact FINVOSMART',
    description: 'Request a demo or talk to sales. Migration help from Tally, Zoho and more.',
    url: '/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
