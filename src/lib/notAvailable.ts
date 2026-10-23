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

import toast from 'react-hot-toast'

/**
 * For buttons whose server side isn't built — or isn't wired to that screen — yet.
 * Says so plainly instead of showing a success message for something that didn't
 * happen. Replace each call with the real API call as the feature is completed.
 */
export function notAvailableYet(action: string) {
  toast(`${action} isn't available yet — nothing was saved or sent.`, { icon: 'ℹ️', duration: 5000 })
}
