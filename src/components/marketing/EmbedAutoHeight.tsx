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

import { useEffect } from 'react'

/**
 * Inside an embedded tool: tells the host page how tall the content is, so the snippet's
 * listener can size the iframe (otherwise phones, where the layout stacks, get a scrollbar).
 */
export function EmbedAutoHeight({ id, contentId }: { id: string; contentId: string }) {
  useEffect(() => {
    const content = document.getElementById(contentId)
    if (window.parent === window || !content) return
    // Measure the content itself, not the page: the page fills the frame (min-height 100vh),
    // so its height could never report less than the frame's current height.
    // The content must contain its children's margins (display: flow-root), and the
    // page's own vertical padding is added, so the frame fits exactly without scrolling.
    const send = () => {
      const pad = getComputedStyle(content.parentElement ?? content)
      const height = Math.ceil(content.getBoundingClientRect().height + parseFloat(pad.paddingTop) + parseFloat(pad.paddingBottom))
      window.parent.postMessage({ type: 'finvosmart:height', id, height }, '*')
    }
    send()
    const ro = new ResizeObserver(send)
    ro.observe(content)
    return () => ro.disconnect()
  }, [id, contentId])
  return null
}
