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

import { Modal } from '@/components/ui/Modal'
import { CREATE_ACTIONS, GO_TO } from '@/lib/quickCreate'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { useCreateAllowed } from './QuickCreate'

const Key = ({ k }: { k: string }) => (
  <kbd className="font-mono" style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '6px', border: '1px solid var(--border-strong)', background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>{k}</kbd>
)

function Row({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
      <span className="flex items-center gap-1">{keys.map((k, i) => <span key={i} className="flex items-center gap-1">{i > 0 && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>then</span>}<Key k={k} /></span>)}</span>
    </div>
  )
}

/** The "?" overlay: every keyboard shortcut this person can use. */
export function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { canAny, isSuperAdmin } = usePermissions()
  const allowed = useCreateAllowed()
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const goto = GO_TO.filter(g => !g.perms || isSuperAdmin || canAny(...g.perms))
  const create = CREATE_ACTIONS.filter(allowed)
  const h = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: '0 0 6px' }
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" subtitle="They work anywhere except while you are typing in a box." size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <div>
          <p style={h}>Anywhere</p>
          <Row keys={[mac ? '⌘ K' : 'Ctrl K']} label="Search records and pages" />
          <Row keys={['/']} label="Search" />
          <Row keys={['?']} label="This list" />
          <Row keys={['Esc']} label="Close a window or menu" />
        </div>
        {goto.length > 0 && (
          <div>
            <p style={h}>Go to</p>
            {goto.map(g => <Row key={g.key} keys={['G', g.key.toUpperCase()]} label={g.label} />)}
          </div>
        )}
        {create.length > 0 && (
          <div>
            <p style={h}>Create</p>
            {create.map(a => <Row key={a.key} keys={['N', a.key.toUpperCase()]} label={`New ${a.label.toLowerCase()}`} />)}
          </div>
        )}
      </div>
    </Modal>
  )
}
