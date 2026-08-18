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

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { Camera, Search, Plus, Minus, Package, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface InventoryItem {
  id: string; itemCode: string; itemName: string; unit: string
  currentStock: number; reorderLevel: number; category: string; hsnSacCode?: string
}

interface ScannedEntry {
  itemCode: string; itemName: string; itemId?: string; quantity: number
  type: 'IN' | 'OUT'; unit: string; notes: string; found: boolean
}

export default function InventoryScannerPage() {
  const qc = useQueryClient()
  const [scanMode, setScanMode]     = useState<'camera' | 'manual'>('manual')
  const [scanning, setScanning]     = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [entries, setEntries]       = useState<ScannedEntry[]>([])
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Search items
  const { data: searchResults } = useQuery({
    queryKey: ['inv-search', manualCode],
    queryFn: () => api.get('/inventory/items', { params: { q: manualCode, size: 10 } })
      .then(r => r.data.data?.content ?? []),
    enabled: manualCode.length >= 2,
  })

  // Start camera scanner
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setScanning(true)
      setCameraError('')
      toast.success('Camera started — point at a barcode or QR code')
    } catch (err) {
      setCameraError('Camera access denied or not available on this device')
      setScanMode('manual')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const addEntry = (item: InventoryItem, type: 'IN' | 'OUT') => {
    setEntries(prev => {
      const existing = prev.findIndex(e => e.itemId === item.id && e.type === type)
      if (existing >= 0) {
        return prev.map((e, i) => i === existing ? { ...e, quantity: e.quantity + 1 } : e)
      }
      return [...prev, {
        itemCode: item.itemCode, itemName: item.itemName, itemId: item.id,
        quantity: 1, type, unit: item.unit, notes: '', found: true
      }]
    })
    setManualCode('')
    toast.success(`${item.itemName} added to ${type === 'IN' ? 'stock in' : 'stock out'}`)
  }

  const addManualCode = () => {
    if (!manualCode.trim()) return
    setEntries(prev => [...prev, {
      itemCode: manualCode, itemName: manualCode, quantity: 1,
      type: 'IN', unit: 'NOS', notes: '', found: false
    }])
    setManualCode('')
  }

  const removeEntry = (idx: number) => setEntries(prev => prev.filter((_, i) => i !== idx))
  const updateQty   = (idx: number, qty: number) => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, quantity: Math.max(1, qty) } : e))
  const updateType  = (idx: number, type: 'IN' | 'OUT') => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, type } : e))

  const commitMutation = useMutation({
    mutationFn: () => api.post('/inventory/stock/batch', {
      movements: entries.filter(e => e.found).map(e => ({
        itemId: e.itemId, type: e.type, quantity: e.quantity,
        unit: e.unit, notes: e.notes || `Scanner entry — ${e.type}`
      }))
    }),
    onSuccess: () => {
      toast.success(`${entries.filter(e => e.found).length} stock movements recorded`)
      setEntries([])
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Failed to record movements'),
  })

  useEffect(() => () => { stopCamera() }, [])

  const totalIn  = entries.filter(e => e.type === 'IN').reduce((s, e) => s + e.quantity, 0)
  const totalOut = entries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.quantity, 0)

  return (
    <PermissionGate permission="INVENTORY_CREATE" showDenied>
      <div style={{ maxWidth: '720px' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="page-title">Inventory Scanner</h1>
            <p className="page-subtitle">Scan barcodes or QR codes to record stock movements instantly</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ id: 'manual', label: '⌨️ Manual' }, { id: 'camera', label: '📷 Camera' }].map(m => (
              <button key={m.id} onClick={() => { setScanMode(m.id as any); if (m.id === 'camera') startCamera() }}
                style={{ padding: '7px 16px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                  background: scanMode === m.id ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
                  color: scanMode === m.id ? 'var(--text-on-gold)' : 'var(--text-secondary)' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Camera view */}
        {scanMode === 'camera' && (
          <div className="card" style={{ marginBottom: '16px' }}>
            {cameraError
              ? <div style={{ padding: '24px', textAlign: 'center' }}>
                  <AlertTriangle size={24} style={{ color: '#DC2626', margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ color: '#DC2626', fontSize: '13px' }}>{cameraError}</p>
                  <button className="btn-secondary h-9 mt-3" onClick={() => setScanMode('manual')}>Use Manual Input</button>
                </div>
              : <>
                  <video ref={videoRef} style={{ width: '100%', borderRadius: '10px', background: '#000', aspectRatio: '16/9' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input className="input h-10 flex-1" placeholder="Or type code manually while camera is active..."
                      value={manualCode} onChange={e => setManualCode(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addManualCode()} />
                    <button className="btn-secondary h-10" onClick={stopCamera}>Stop Camera</button>
                  </div>
                </>
            }
          </div>
        )}

        {/* Manual input */}
        {scanMode === 'manual' && (
          <div className="card" style={{ marginBottom: '16px' }}>
            <label className="label">Search item by code, name, or HSN</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input ref={inputRef} className="input h-10 flex-1" placeholder="e.g. ITEM-00042, Steel Rod, 7213..."
                value={manualCode} onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addManualCode()} autoFocus />
              <button aria-label="Search" className="btn-primary h-10" onClick={addManualCode}><Search size={15} /></button>
            </div>
            {manualCode.length >= 2 && (searchResults as InventoryItem[] ?? []).length > 0 && (
              <div style={{ marginTop: '8px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                {(searchResults as InventoryItem[]).slice(0, 6).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.itemName}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        {item.itemCode} · Stock: {item.currentStock} {item.unit}
                        {item.currentStock <= item.reorderLevel && <span style={{ color: '#DC2626', marginLeft: '6px' }}>⚠ Low stock</span>}
                      </p>
                    </div>
                    <button className="btn-primary h-8 text-xs" onClick={() => addEntry(item, 'IN')}>
                      <Plus size={12} /> Stock In
                    </button>
                    <button className="btn-secondary h-8 text-xs" onClick={() => addEntry(item, 'OUT')}>
                      <Minus size={12} /> Stock Out
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch entries */}
        {entries.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {[
                { label: 'Stock In', val: totalIn, color: '#059669' },
                { label: 'Stock Out', val: totalOut, color: '#DC2626' },
                { label: 'Line Items', val: entries.length, color: 'var(--gold)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ flex: 1, textAlign: 'center', padding: '12px' }}>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, fontFamily: 'serif', margin: 0 }}>{s.val}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
              {entries.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: entry.type === 'IN' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {entry.type === 'IN' ? <Plus size={15} style={{ color: '#059669' }} /> : <Minus size={15} style={{ color: '#DC2626' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: entry.found ? 'var(--text-primary)' : '#DC2626', margin: 0 }}>
                      {entry.itemName} {!entry.found && '⚠ Not found in system'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{entry.itemCode}</p>
                  </div>
                  <select value={entry.type} onChange={e => updateType(idx, e.target.value as 'IN' | 'OUT')}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: '12px', fontFamily: 'inherit', color: 'var(--text-primary)' }}>
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </select>
                  <input type="number" min={1} value={entry.quantity} onChange={e => updateQty(idx, Number(e.target.value))}
                    style={{ width: '70px', padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', textAlign: 'center', fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-primary)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px' }}>{entry.unit}</span>
                  <button className="btn-ghost w-8 h-8" onClick={() => removeEntry(idx)} style={{ color: '#DC2626' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn-primary h-11 w-full text-base" onClick={() => commitMutation.mutate()}
              disabled={entries.every(e => !e.found) || commitMutation.isPending}>
              {commitMutation.isPending ? 'Recording...' : <><CheckCircle2 size={17} /> Commit {entries.filter(e => e.found).length} Stock Movements</>}
            </button>
          </>
        )}
      </div>
    </PermissionGate>
  )
}
