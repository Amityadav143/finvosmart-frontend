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

import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

// The login page is linked from the homepage, so it gets its own title and
// description instead of inheriting the homepage's (which made two URLs show
// identical snippets). People do search "finvosmart login".
export const metadata: Metadata = pageMetadata('login')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
