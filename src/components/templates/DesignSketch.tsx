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
import type { TemplateConfig } from '@/lib/api/templates'

const FAMILY: Record<string, string> = {
  SANS: 'Calibri, Carlito, "Segoe UI", sans-serif',
  SERIF: 'Georgia, "DejaVu Serif", serif',
  MODERN: 'Poppins, "Segoe UI", sans-serif',
  HELVETICA: 'Helvetica, Arial, sans-serif',
}

/**
 * A small drawing of a design for the gallery — its header layout, colours, typeface and table style at a glance.
 * It is only a sketch: the preview button shows the real PDF.
 */
export function DesignSketch({ config }: { config: TemplateConfig }) {
  const c = config
  const primary = c.primaryColor || '#1A1B4B'
  const accent = c.accentColor || primary
  const banner = c.headerLayout === 'BANNER'
  const centred = c.headerLayout === 'CENTERED'
  const right = c.headerLayout === 'LOGO_RIGHT'
  const bar = (w: string, h = 5, bg = '#e7e9ee') => <div style={{ width: w, height: h, background: bg, borderRadius: 2 }} />
  const rows = [0, 1, 2]
  return (
    <div aria-hidden="true" style={{ height: 150, background: '#fff', position: 'relative', fontFamily: FAMILY[c.font] ?? FAMILY.SANS, overflow: 'hidden' }}>
      {banner ? (
        <div style={{ background: primary, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderBottom: accent !== primary ? `3px solid ${accent}` : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, background: '#fff' }} />
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Your Company</span>
          </div>
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>TAX INVOICE</span>
        </div>
      ) : centred ? (
        <div style={{ padding: '10px 14px 4px', textAlign: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: accent, margin: '0 auto 3px', opacity: 0.85 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1f2937' }}>Your Company</div>
          <div style={{ height: 2, background: primary, margin: '4px 0' }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: primary }}>TAX INVOICE</div>
        </div>
      ) : (
        <div style={{ padding: '10px 14px 4px', display: 'flex', justifyContent: 'space-between', flexDirection: right ? 'row' : 'row' }}>
          <div>
            {!right && <div style={{ width: 22, height: 10, borderRadius: 2, background: accent, opacity: 0.85, marginBottom: 3 }} />}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1f2937' }}>Your Company</div>
            <div style={{ marginTop: 3 }}>{bar('70px', 4)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {right && <div style={{ width: 22, height: 10, borderRadius: 2, background: accent, opacity: 0.85, margin: '0 0 3px auto' }} />}
            <div style={{ fontSize: 9, fontWeight: 700, color: primary }}>TAX INVOICE</div>
          </div>
        </div>
      )}
      {!banner && !centred && <div style={{ height: 1.5, background: primary, margin: '2px 14px 0' }} />}
      <div style={{ padding: '8px 14px 0', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, border: c.tableStyle === 'MINIMAL' ? undefined : '1px solid #e2e5ea', borderTop: c.tableStyle === 'MINIMAL' ? `1.5px solid ${primary}` : undefined, padding: 4 }}>
          {bar('60%', 4, '#d9dce3')}<div style={{ marginTop: 3 }}>{bar('80%', 3)}</div>
        </div>
        <div style={{ flex: 1, border: c.tableStyle === 'MINIMAL' ? undefined : '1px solid #e2e5ea', borderTop: c.tableStyle === 'MINIMAL' ? `1.5px solid ${primary}` : undefined, padding: 4 }}>
          {bar('60%', 4, '#d9dce3')}<div style={{ marginTop: 3 }}>{bar('70%', 3)}</div>
        </div>
      </div>
      <div style={{ margin: '8px 14px 0', border: c.tableStyle === 'GRID' ? '1px solid #d5d9e0' : undefined }}>
        <div style={{ height: 8, background: c.tableStyle === 'ZEBRA' ? primary : c.tableStyle === 'MINIMAL' ? 'transparent' : '#eceef3',
                      borderBottom: c.tableStyle === 'MINIMAL' ? `1.5px solid ${primary}` : undefined }} />
        {rows.map(i => (
          <div key={i} style={{ display: 'flex', gap: 4, padding: '3px 3px', background: c.tableStyle === 'ZEBRA' && i % 2 === 1 ? '#f3f4f8' : undefined,
                                borderBottom: c.tableStyle === 'ZEBRA' ? undefined : '1px solid #eef0f3' }}>
            <div style={{ flex: 3 }}>{bar('90%', 3)}</div><div style={{ flex: 1 }}>{bar('80%', 3)}</div><div style={{ flex: 1 }}>{bar('80%', 3)}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 10, width: 70, height: 9, background: c.tableStyle === 'ZEBRA' ? primary : 'transparent',
                    borderTop: c.tableStyle === 'ZEBRA' ? undefined : '1.5px solid #1f2937' }} />
      <span style={{ position: 'absolute', left: 14, bottom: 8, fontSize: 8, color: '#9ca3af' }}>{c.pageSize}</span>
    </div>
  )
}
