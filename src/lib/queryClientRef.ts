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

import type { QueryClient } from '@tanstack/react-query'

/**
 * The app's query cache, set by the app's providers, for code outside React: signing out (or another person signing
 * in) empties it, so no one is shown the last person's data.
 */
export const queryClientRef: { current: QueryClient | null } = { current: null }
