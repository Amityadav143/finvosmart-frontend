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

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div
          style={{
            width:'36px', height:'36px', borderRadius:'50%',
            border:'3px solid var(--border-strong)',
            borderTopColor:'var(--gold)',
            animation:'spin 0.7s linear infinite',
          }}
        />
        <p style={{ fontSize:'13px', color:'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  )
}
