'use client'
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

import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { linkTarget } from '@/lib/assistant'

/**
 * An answer of the assistant, written with a little Markdown — paragraphs, numbered and bulleted lists, **bold** and
 * [links](/path) — turned into elements, never into HTML: whatever the text says is shown as text. A link to a page
 * of this site opens it; one to an official government site (the GST portal, income tax, PF, ESI…) opens that site
 * apart, marked as such; anything else (another website, a script) stays plain words.
 */
export function AssistantText({ text, onLink }: { text: string; onLink?: () => void }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/)
  return (
    <>
      {blocks.flatMap((block, bi) => runs(block.split('\n').filter(l => l.trim() !== '')).map((r, ri) => {
        const key = `${bi}.${ri}`
        if (r.kind === 'ul') {
          return <ul key={key} className="asst-list">{r.lines.map((l, i) => <li key={i}>{inline(l.replace(BULLET, ''), onLink)}</li>)}</ul>
        }
        if (r.kind === 'ol') {
          const start = parseInt(r.lines[0].trim(), 10) || 1
          return <ol key={key} className="asst-list" start={start}>{r.lines.map((l, i) => <li key={i}>{inline(l.replace(NUMBERED, ''), onLink)}</li>)}</ol>
        }
        return (
          <p key={key}>
            {r.lines.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{inline(l.replace(/^#{1,6}\s+/, ''), onLink)}</Fragment>)}
          </p>
        )
      }))}
    </>
  )
}

/** **bold** and [label](href) within a line. */
const BULLET = /^\s*[-*•]\s+/
const NUMBERED = /^\s*\d{1,2}[.)]\s+/

/** The lines of a paragraph in runs: a bulleted list, a numbered list, or lines of text ("To do it:" then the steps). */
function runs(lines: string[]): { kind: 'ul' | 'ol' | 'p'; lines: string[] }[] {
  const out: { kind: 'ul' | 'ol' | 'p'; lines: string[] }[] = []
  for (const l of lines) {
    const kind = BULLET.test(l) ? 'ul' : NUMBERED.test(l) ? 'ol' : 'p'
    const last = out[out.length - 1]
    if (last && last.kind === kind) last.lines.push(l)
    else out.push({ kind, lines: [l] })
  }
  return out
}

function inline(line: string, onLink?: () => void): ReactNode[] {
  const out: ReactNode[] = []
  // **bold**, [words](address), an address written out (https://www.gst.gov.in), or `code`
  const re = /\*\*([^*]+)\*\*|\[([^\]]{1,120})\]\(([^)\s]{1,300})\)|(https:\/\/[^\s<>()]{4,300}[^\s<>().,;:!?'"])|`([^`]{1,160})`/g
  let last = 0, m: RegExpExecArray | null, k = 0
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    if (m[1] !== undefined) out.push(<strong key={k++}>{m[1]}</strong>)
    else if (m[5] !== undefined) out.push(<code key={k++} className="asst-code">{m[5]}</code>)
    else {
      const words = m[2] ?? m[4]
      const to = linkTarget(m[3] ?? m[4])
      out.push(!to ? <span key={k++}>{words}</span>
        : to.external
          ? <a key={k++} href={to.href} target="_blank" rel="noopener noreferrer external" className="asst-link asst-ext">
              {words}<ExternalLink size={11} aria-hidden /><span className="sr-only"> (the government&apos;s site, opens in a new tab)</span>
            </a>
          : <Link key={k++} href={to.href} className="asst-link" onClick={onLink}>{words}</Link>)
    }
    last = m.index + m[0].length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}
