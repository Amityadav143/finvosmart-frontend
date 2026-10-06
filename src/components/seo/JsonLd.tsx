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

import { jsonLdGraph, type JsonLdNode } from '@/lib/seo'

/** Renders schema.org JSON-LD. Server component — the data is in the initial HTML. */
export function JsonLd({ nodes }: { nodes: JsonLdNode[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }} />
}
