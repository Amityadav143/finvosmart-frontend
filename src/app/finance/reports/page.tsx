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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { financeApi } from '@/lib/api/finance'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { BarChart2, TrendingUp, TrendingDown, Download, FileText, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts'

/** Rows of one statement section (income, expenses, assets…) with its total. */
function StatementSection({ title, rows, total }: { title: string; rows: any[]; total: any }) {
  return (
    <>
      <tr><td colSpan={2} className="table-cell font-semibold pt-4" style={{color:'var(--text-secondary)'}}>{title}</td></tr>
      {rows.length===0 && <tr><td colSpan={2} className="table-cell text-xs" style={{color:'var(--text-muted)'}}>Nothing posted</td></tr>}
      {rows.map((r:any)=>(
        <tr key={r.id ?? r.name} className="table-row">
          <td className="table-cell">{r.code ? <span className="font-mono text-xs mr-2" style={{color:'var(--gold)'}}>{r.code}</span> : null}{r.name}</td>
          <td className="table-cell font-mono text-right">{formatCurrency(Number(r.amount))}</td>
        </tr>
      ))}
      <tr>
        <td className="table-cell font-semibold">Total {title.toLowerCase()}</td>
        <td className="table-cell font-mono font-semibold text-right">{formatCurrency(Number(total??0))}</td>
      </tr>
    </>
  )
}

function EmptyBooks() {
  return <p className="text-sm py-10 text-center" style={{color:'var(--text-muted)'}}>Nothing posted for this period yet. Use “Update books from invoices”, or post a voucher.</p>
}

/** 12,50,000 → "12.5 L" for chart axes. */
const compact = (v: number) => v >= 1e7 ? `${(v/1e7).toFixed(1)} Cr` : v >= 1e5 ? `${(v/1e5).toFixed(1)} L` : v >= 1e3 ? `${Math.round(v/1e3)}K` : String(v)

export default function FinanceReportsPage(){
  const [activeTab, setActiveTab] = useState<'pl'|'bs'|'tb'>('pl')
  const {data:accounts} = useQuery({queryKey:['accounts'],queryFn:financeApi.accounts.list})
  const {data:trial} = useQuery({queryKey:['trial-balance'],queryFn:financeApi.trialBalance})
  const qc = useQueryClient()
  const sync = useMutation({
    mutationFn: financeApi.syncLedger,
    onSuccess: (r: any) => {
      toast.success(`Books updated — ${r?.invoicesChecked ?? 0} invoices checked`)
      qc.invalidateQueries({queryKey:['accounts']}); qc.invalidateQueries({queryKey:['trial-balance']}); qc.invalidateQueries({queryKey:['pl']}); qc.invalidateQueries({queryKey:['bs']})
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Could not update the books'),
  })
  // Indian financial year (April–March), from today's date.
  const today = new Date()
  const fyStart = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  const fyLabel = `FY ${fyStart}–${String((fyStart + 1) % 100).padStart(2, '0')} · As at ${today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
  // Local calendar dates (not UTC — in India "today" would be wrong before 5:30 a.m.).
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const todayIso = iso(today)
  const fyStartIso = `${fyStart}-04-01`
  const periodPresets = [
    { label: 'This FY',    from: fyStartIso, to: todayIso },
    { label: 'Last FY',    from: `${fyStart-1}-04-01`, to: `${fyStart}-03-31` },
    { label: 'This month', from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: todayIso },
    { label: 'Last month', from: iso(new Date(today.getFullYear(), today.getMonth()-1, 1)), to: iso(new Date(today.getFullYear(), today.getMonth(), 0)) },
  ]
  const [plFrom, setPlFrom] = useState(fyStartIso)
  const [plTo, setPlTo] = useState(todayIso)
  const [asOf, setAsOf] = useState(todayIso)
  const {data:pl, isLoading:plLoading} = useQuery({ queryKey:['pl',plFrom,plTo], queryFn:()=>financeApi.profitLoss(plFrom,plTo),
                                                  enabled: activeTab==='pl' && !!plFrom && !!plTo && plFrom<=plTo })
  const {data:bs, isLoading:bsLoading} = useQuery({ queryKey:['bs',asOf], queryFn:()=>financeApi.balanceSheet(asOf),
                                                  enabled: activeTab==='bs' && !!asOf })
  const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : ''

  const tabs = [{k:'pl',label:'P & L'},{k:'bs',label:'Balance Sheet'},{k:'tb',label:'Trial Balance'}]

  const totalAssets     = (accounts??[]).filter((a: any) =>a.accountType==='ASSET').reduce((s: any,a: any)=>s+(a.currentBalance??0),0)
  const totalLiabilities= (accounts??[]).filter((a: any) =>a.accountType==='LIABILITY').reduce((s: any,a: any)=>s+(a.currentBalance??0),0)
  const totalIncome     = (accounts??[]).filter((a: any) =>a.accountType==='INCOME').reduce((s: any,a: any)=>s+(a.currentBalance??0),0)
  const totalExpenses   = (accounts??[]).filter((a: any) =>a.accountType==='EXPENSE').reduce((s: any,a: any)=>s+(a.currentBalance??0),0)

  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>{fyLabel}</p>
        </div>
        <div className="flex gap-2">
        <button className="btn-secondary h-9 text-sm" disabled={sync.isPending} onClick={()=>sync.mutate()}
                title="Post any invoices the books don't reflect yet (safe to run any time)">
          <RefreshCw className={`w-4 h-4 ${sync.isPending ? 'animate-spin' : ''}`}/>{sync.isPending ? 'Updating…' : 'Update books from invoices'}
        </button>
        <button className="btn-secondary h-9 text-sm" onClick={()=>exportToCsv('financial-summary', (accounts??[]).map((a:any)=>({ Account:a.accountName, Type:a.accountType, Balance:a.currentBalance })))}><Download className="w-4 h-4"/>Export</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{background:'var(--bg-hover)',border:'1px solid var(--border)',width:'fit-content'}}>
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setActiveTab(t.k as any)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{background:activeTab===t.k?'var(--card)':'transparent',
                    color:activeTab===t.k?'var(--gold)':'var(--text-muted)',
                    boxShadow:activeTab===t.k?'var(--shadow-sm)':'none',
                    border:activeTab===t.k?'1px solid var(--border)':'1px solid transparent'}}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab==='pl' && (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>From
              <input type="date" className="input h-9 mt-1 block" value={plFrom} max={plTo} onChange={e=>setPlFrom(e.target.value)}/>
            </label>
            <label className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>To
              <input type="date" className="input h-9 mt-1 block" value={plTo} min={plFrom} onChange={e=>setPlTo(e.target.value)}/>
            </label>
            <div className="flex flex-wrap gap-1">
              {periodPresets.map(pp=>(
                <button key={pp.label} className="btn-ghost h-9 text-xs" onClick={()=>{setPlFrom(pp.from); setPlTo(pp.to)}}>{pp.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title">Profit &amp; Loss</h2>
              <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>{fmtDate(plFrom)} to {fmtDate(plTo)}</p>
              {plLoading ? <p className="text-sm" style={{color:'var(--text-muted)'}}>Loading…</p> : (
                <table className="w-full text-sm"><tbody>
                  <StatementSection title="Income" rows={pl?.income??[]} total={pl?.totalIncome}/>
                  <StatementSection title="Expenses" rows={pl?.expenses??[]} total={pl?.totalExpenses}/>
                  <tr style={{borderTop:'2px solid var(--border-strong)'}}>
                    <td className="table-cell font-bold">{Number(pl?.netProfit??0)>=0?'Net profit':'Net loss'}</td>
                    <td className="table-cell font-mono font-bold text-right" style={{color:Number(pl?.netProfit??0)>=0?'#22c55e':'#ef4444'}}>
                      {formatCurrency(Math.abs(Number(pl?.netProfit??0)))}
                    </td>
                  </tr>
                </tbody></table>
              )}
            </div>
            <div className="card">
              <h2 className="section-title mb-4">Income vs expenses</h2>
              {(pl?.income?.length || pl?.expenses?.length) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[{name:'Income',value:Number(pl?.totalIncome??0)},{name:'Expenses',value:Number(pl?.totalExpenses??0)}]}>
                    <XAxis dataKey="name" tick={{fontSize:12}}/>
                    <YAxis tick={{fontSize:11}} tickFormatter={(v:any)=>compact(Number(v))}/>
                    <Tooltip formatter={(v:any)=>formatCurrency(Number(v))}/>
                    <Bar dataKey="value" radius={[6,6,0,0]}><Cell fill="#22c55e"/><Cell fill="#ef4444"/></Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyBooks/>}
            </div>
          </div>
        </div>
      )}

      {activeTab==='bs' && (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-end gap-4">
            <label className="text-xs font-semibold" style={{color:'var(--text-muted)'}}>As at
              <input type="date" className="input h-9 mt-1 block" value={asOf} onChange={e=>setAsOf(e.target.value)}/>
            </label>
            {bs && (bs.balanced
              ? <span className="text-xs font-semibold pb-2" style={{color:'#22c55e'}}>✓ Balanced</span>
              : <span className="text-xs font-semibold pb-2" style={{color:'#ef4444'}}>Out of balance by {formatCurrency(Math.abs(Number(bs.difference??0)))} — check opening balances</span>)}
          </div>
          {bsLoading ? <p className="text-sm" style={{color:'var(--text-muted)'}}>Loading…</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="section-title mb-1">Liabilities &amp; equity</h2>
              <table className="w-full text-sm"><tbody>
                <StatementSection title="Liabilities" rows={bs?.liabilities??[]} total={bs?.totalLiabilities}/>
                <StatementSection title="Equity" rows={bs?.equity??[]} total={bs?.totalEquity}/>
                <tr style={{borderTop:'2px solid var(--border-strong)'}}>
                  <td className="table-cell font-bold">Total</td>
                  <td className="table-cell font-mono font-bold text-right">{formatCurrency(Number(bs?.totalLiabilitiesAndEquity??0))}</td>
                </tr>
              </tbody></table>
            </div>
            <div className="card">
              <h2 className="section-title mb-1">Assets</h2>
              <table className="w-full text-sm"><tbody>
                <StatementSection title="Assets" rows={bs?.assets??[]} total={bs?.totalAssets}/>
              </tbody></table>
            </div>
          </div>
          )}
        </div>
      )}

      {activeTab==='tb' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Trial Balance</h2>
            <button className="btn-secondary h-8 text-xs" onClick={()=>exportToCsv('trial-balance', (trial?.accounts??[]).map((t:any)=>({ Code:t.code, Account:t.name, Debit:t.debit, Credit:t.credit })))}><Download className="w-3.5 h-3.5"/>Export</button>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Code','Account Name','Type','Debit','Credit'].map(h=><th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {(trial?.accounts??[]).map((a: any)=>(
                  <tr key={a.id ?? a.code} className="table-row">
                    <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{a.code}</span></td>
                    <td className="table-cell font-medium">{a.name}</td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{background:`rgba(${a.type==='ASSET'?'59,130,246':a.type==='LIABILITY'?'239,68,68':a.type==='INCOME'?'34,197,94':'245,158,11'},.1)`,
                                color:a.type==='ASSET'?'#3b82f6':a.type==='LIABILITY'?'#ef4444':a.type==='INCOME'?'#22c55e':'var(--gold)'}}>
                        {a.type}
                      </span>
                    </td>
                    <td className="table-cell font-mono">{Number(a.debit)>0?formatCurrency(Number(a.debit)):'—'}</td>
                    <td className="table-cell font-mono">{Number(a.credit)>0?formatCurrency(Number(a.credit)):'—'}</td>
                  </tr>
                ))}
                {(trial?.accounts??[]).length===0&&(
                  <tr><td colSpan={5} className="table-cell text-center py-12" style={{color:'var(--text-muted)'}}>
                    No accounts yet. Open Chart of Accounts to get the standard chart, then post entries or update the books from invoices.
                  </td></tr>
                )}
              </tbody>
              {(trial?.accounts??[]).length>0&&(
                <tfoot>
                  <tr style={{borderTop:'2px solid var(--border-strong)'}}>
                    <td className="table-cell font-bold" colSpan={3}>
                      Total{' '}
                      {trial?.balanced
                        ? <span style={{color:'#22c55e',fontWeight:600,fontSize:'12px'}}>· balanced</span>
                        : <span style={{color:'#ef4444',fontWeight:600,fontSize:'12px'}}>· does not balance — check opening balances</span>}
                    </td>
                    <td className="table-cell font-mono font-bold">{formatCurrency(Number(trial?.totalDebit??0))}</td>
                    <td className="table-cell font-mono font-bold">{formatCurrency(Number(trial?.totalCredit??0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
