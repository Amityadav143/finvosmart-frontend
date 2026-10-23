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

/**
 * Marks a feature that is still being built. Marketing pages show it next to anything the
 * product can't do yet (the app itself keeps those switched off — see lib/previews.ts), so a
 * page never sells something that isn't there.
 */
export function SoonBadge({ style }: { style?: React.CSSProperties }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '100px',
      fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap',
      color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)',
      ...style,
    }}>
      Coming soon
    </span>
  )
}
