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

export const metadata: Metadata = {
  title: 'Contact Sales — Start Your Free Trial',
  description: 'Talk to the Finvosmart by Navgrow team. Get a personalised demo, start your free trial, or ask about custom enterprise plans. Support available in English and Hindi.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Finvosmart by Navgrow',
    description: 'Get a personalised demo or start your free trial. Support in English and Hindi.',
    url: 'https://finvosmart.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
