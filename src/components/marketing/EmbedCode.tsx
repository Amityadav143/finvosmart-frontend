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

import { useState } from 'react'

/**
 * "Embed this calculator" box. The snippet puts a normal link to the tool page OUTSIDE the
 * iframe: links inside an iframe don't count for the host page, so this line is what earns
 * a backlink. The resize script only accepts messages from finvosmart.com.
 */
export function EmbedCode({ origin, pageUrl, id, title }: { origin: string; pageUrl: string; id: string; title: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [copied, setCopied] = useState(false)
  const src = `${origin}/embed/${id}${theme === 'light' ? '?theme=light' : ''}`
  const frameId = `finvosmart-${id}`
  const code =
`<iframe id="${frameId}" src="${src}" title="${title}" width="100%" height="640" loading="lazy" style="border:0;max-width:1000px"></iframe>
<p style="font-size:13px">${title} by <a href="${pageUrl}">Finvosmart</a></p>
<script>window.addEventListener('message',function(e){if(e.origin!=='${origin}'||!e.data||e.data.type!=='finvosmart:height'||e.data.id!=='${id}')return;var f=document.getElementById('${frameId}');if(f)f.style.height=e.data.height+'px'})</script>`
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* the code is selectable below */ }
  }
  const tab = (t: 'dark' | 'light') => ({
    padding: '6px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: '1px solid var(--border)', background: theme === t ? 'var(--btn-primary-bg)' : 'transparent', color: theme === t ? 'var(--text-on-gold)' : 'var(--text-secondary)',
  })
  return (
    <section style={{ padding: '24px 0 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '0 24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Add this calculator to your website</h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
          Free for CA firms, bloggers and businesses. Paste this code into your page — it works in WordPress (Custom HTML block) and most site builders.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button type="button" style={tab('light')} onClick={() => setTheme('light')}>Light</button>
          <button type="button" style={tab('dark')} onClick={() => setTheme('dark')}>Dark</button>
        </div>
        <textarea readOnly value={code} rows={5} onFocus={e => e.currentTarget.select()} aria-label="Embed code"
          style={{ width: '100%', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', fontSize: '12.5px', lineHeight: 1.5,
                   padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', resize: 'vertical' }} />
        <button type="button" onClick={copy} className="btn-primary" style={{ marginTop: '10px', height: '40px', padding: '0 18px', fontSize: '14px' }}>
          {copied ? 'Copied ✓' : 'Copy embed code'}
        </button>
      </div>
    </section>
  )
}
