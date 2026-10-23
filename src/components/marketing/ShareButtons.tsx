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

const btn = {
  display: 'inline-flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px', borderRadius: '999px',
  border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)',
  fontSize: '14px', fontWeight: 600, textDecoration: 'none', cursor: 'pointer',
} as const

/**
 * "Share this tool" row. WhatsApp first: it's how Indian businesses and their accountants
 * pass links around. Shared links carry utm_source so analytics can count them; the page's
 * canonical tag keeps the tagged URLs out of search results.
 */
export function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const tagged = (source: string) => `${url}?utm_source=${source}&utm_medium=social&utm_campaign=share`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${tagged('whatsapp')}`)}`
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(tagged('linkedin'))}`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)   // clipboard blocked (e.g. inside some in-app browsers)
    }
  }
  return (
    <section aria-label="Share" style={{ padding: '8px 0 28px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', alignItems: 'center', padding: '0 20px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginRight: '4px' }}>Useful? Share it:</span>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={btn}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="#25D366"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>
          WhatsApp
        </a>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" style={btn}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="#0A66C2"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13.1H3.5V9h3.6v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/></svg>
          LinkedIn
        </a>
        <button type="button" onClick={copy} style={btn} aria-live="polite">{copied ? 'Link copied ✓' : 'Copy link'}</button>
      </div>
    </section>
  )
}
