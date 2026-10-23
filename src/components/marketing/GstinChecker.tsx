'use client'
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

import { useMemo, useState } from 'react'
import { checkGstin } from '@/lib/gstin'

const row = { display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: '14.5px' } as const

/** Interactive GSTIN checker. Runs entirely in the browser — nothing is sent anywhere. */
export function GstinChecker() {
  const [value, setValue] = useState('27AAPFU0939F1ZV')
  const r = useMemo(() => checkGstin(value), [value])
  const rows: [string, string][] = r.gstin.length === 15 ? [
    ['State', r.stateName ? `${r.stateName} (${r.stateCode})` : `${r.stateCode} — unknown`],
    ['PAN', r.pan ?? '—'],
    ['Type of business (from PAN)', r.panHolder ?? '—'],
    ['Registration of this PAN in the state', r.registrationChar ?? '—'],
    ['Check digit', r.checkDigitOk ? 'Matches' : 'Doesn’t match'],
  ] : []
  return (
    <section style={{ padding: '8px 0 32px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '18px', padding: '24px' }}>
          <label htmlFor="gstin" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>GSTIN</label>
          <input id="gstin" value={value} onChange={e => setValue(e.target.value)} maxLength={24}
                 autoComplete="off" spellCheck={false} placeholder="e.g. 27AAPFU0939F1ZV"
                 style={{ width: '100%', height: '50px', borderRadius: '12px', border: '1px solid var(--border-strong)', background: 'var(--bg-base)',
                          color: 'var(--text-primary)', padding: '0 14px', fontSize: '19px', letterSpacing: '0.08em', textTransform: 'uppercase',
                          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }} />
          <div role="status" aria-live="polite" style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
               background: r.valid ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)', color: r.valid ? '#16a34a' : '#dc2626', fontSize: '14.5px', fontWeight: 600 }}>
            {r.valid ? '✓ Correctly formed GSTIN — the check digit matches' : r.problems.map(p => <div key={p}>✗ {p}</div>)}
          </div>
          {rows.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              {rows.map(([k, v]) => (
                <div key={k} style={row}><span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{v}</span></div>
              ))}
            </div>
          )}
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: 1.6 }}>
            This checks the number’s structure only. To see whether it is registered and active, and the business name, use{' '}
            <a href="https://services.gst.gov.in/services/searchtp" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Search Taxpayer on the GST portal</a>.
          </p>
        </div>
      </div>
    </section>
  )
}
