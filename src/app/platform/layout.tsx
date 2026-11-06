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

import { AppLayout } from '@/components/layout/AppLayout'
import { PlatformGate } from '@/components/platform/PlatformGate'

/** The platform console: Finvosmart's own administrators only (the server checks every call as well). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppLayout><PlatformGate>{children}</PlatformGate></AppLayout>
}
