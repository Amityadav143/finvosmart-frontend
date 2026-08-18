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
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '@/lib/api/finance'
import { formatCurrency, exportToCsv } from '@/lib/utils'
import { BarChart2, TrendingUp, TrendingDown, Download, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts'

const PL_DATA = [
  {cat:'Revenue',            amount: 5100000, type:'income'},
  {cat:'Cost of Sales',      amount:-2100000, type:'expense'},
  {cat:'Gross Profit',       amount: 3000000, type:'total'},
  {cat:'Operating Expenses', amount: -980000, type:'expense'},
  {cat:'EBITDA',             amount: 2020000, type:'total'},
  {cat:'Depreciation',       amount: -285000, type:'expense'},
  {cat:'Interest',           amount: -145000, type:'expense'},
  {cat:'Net Profit',         amount: 1590000, type:'total'},
]

const MONTHLY_PL = [
  {m:'Oct',rev:38,cogs:21,gp:17},{m:'Nov',rev:42,cogs:23,gp:19},{m:'Dec',rev:36,cogs:20,gp:16},
  {m:'Jan',rev:48,cogs:27,gp:21},{m:'Feb',rev:51,cogs:28,gp:23},{m:'Mar',rev:46,cogs:25,gp:21},
]

const EXPENSE_BREAKDOWN = [
  {name:'Salaries & Wages',  val:5820000, pct:59, color:'#3b82f6'},
  {name:'Rent & Utilities',  val:840000,  pct:9,  color:'#8b5cf6'},
  {name:'Marketing',         val:490000,  pct:5,  color:'#14b8a6'},
  {name:'Technology',        val:380000,  pct:4,  color:'#f59e0b'},
  {name:'Professional Fees', val:280000,  pct:3,  color:'#f97316'},
  {name:'Miscellaneous',     val:1960000, pct:20, color:'#64748b'},
]

function Tooltip2({active,payload,label}:any){
  if(!active||!payload?.length) return null
  return(
    <div className="rounded-xl px-3 py-2 text-xs" style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',boxShadow:'var(--shadow-md)'}}>
      <p className="font-bold mb-1" style={{color:'var(--text-secondary)'}}>{label}</p>
      {payload.map((p:any,i:number)=><p key={i} style={{color:p.color}}>₹{p.value}L</p>)}
    </div>
  )
}

export default function FinanceReportsPage(){
  const [activeTab, setActiveTab] = useState<'pl'|'bs'|'tb'>('pl')
  const {data:accounts} = useQuery({queryKey:['accounts'],queryFn:financeApi.accounts.list})
  const {data:trial} = useQuery({queryKey:['trial-balance'],queryFn:financeApi.trialBalance})

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
          <p className="text-sm mt-0.5" style={{color:'var(--text-muted)'}}>FY 2024–25 · As at 31 March 2025</p>
        </div>
        <button className="btn-secondary h-9 text-sm" onClick={()=>exportToCsv('financial-summary', (accounts??[]).map((a:any)=>({ Account:a.accountName, Type:a.accountType, Balance:a.currentBalance })))}><Download className="w-4 h-4"/>Export</button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* P&L table */}
          <div className="card">
            <h2 className="section-title mb-4">Profit & Loss Statement</h2>
            <div className="space-y-1">
              {PL_DATA.map((r,i)=>(
                <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${r.type==='total'?'font-bold':''}`}
                  style={{background:r.type==='total'?'var(--gold-muted)':i%2===0?'var(--bg-hover)':'transparent',
                          border:r.type==='total'?'1px solid rgba(245,158,11,.15)':'1px solid transparent'}}>
                  <span className={`text-sm ${r.type==='total'?'':'text-sm'}`}
                    style={{color:r.type==='total'?'var(--gold)':'var(--text-secondary)'}}>{r.cat}</span>
                  <span className={`font-mono text-sm font-semibold`}
                    style={{color:r.amount>=0?'#22c55e':'#ef4444'}}>
                    {formatCurrency(Math.abs(r.amount))}
                    {r.amount<0&&<span className="text-xs ml-1 opacity-60">(Dr)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold mb-1">Monthly Revenue vs COGS</h3>
              <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>₹ in Lakhs</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={MONTHLY_PL}>
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fontSize:10}}/>
                  <YAxis hide/>
                  <Tooltip content={<Tooltip2/>}/>
                  <Bar dataKey="rev"  name="Revenue"  fill="#f59e0b" radius={[4,4,0,0]}/>
                  <Bar dataKey="cogs" name="COGS"     fill="rgba(239,68,68,.5)" radius={[4,4,0,0]}/>
                  <Bar dataKey="gp"   name="Gross P"  fill="rgba(34,197,94,.6)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Expense Breakdown</h3>
              <div className="space-y-2.5">
                {EXPENSE_BREAKDOWN.map(e=>(
                  <div key={e.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs" style={{color:'var(--text-secondary)'}}>{e.name}</span>
                      <span className="text-xs font-mono font-semibold" style={{color:e.color}}>{e.pct}%</span>
                    </div>
                    <div style={{height:'4px',borderRadius:'4px',background:'var(--border)',overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:'4px',background:e.color,width:`${e.pct}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='bs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Assets */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500"/>Assets
            </h2>
            <div className="space-y-1">
              {(accounts??[]).filter((a: any) =>a.accountType==='ASSET').map((a: any,i: any)=>(
                <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{background:i%2===0?'var(--bg-hover)':'transparent'}}>
                  <div>
                    <span className="text-xs font-mono" style={{color:'var(--gold)'}}>{a.accountCode}</span>
                    <span className="text-sm ml-2">{a.accountName}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{color:'#3b82f6'}}>{formatCurrency(a.currentBalance)}</span>
                </div>
              ))}
              {(accounts??[]).filter((a: any) =>a.accountType==='ASSET').length===0 && (
                <p className="text-center py-6 text-sm" style={{color:'var(--text-muted)'}}>No asset accounts found. Add accounts first.</p>
              )}
              <div className="flex items-center justify-between px-3 py-3 rounded-xl mt-2 font-bold"
                style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.2)'}}>
                <span style={{color:'#3b82f6'}}>Total Assets</span>
                <span className="font-mono" style={{color:'#3b82f6'}}>{formatCurrency(totalAssets||48200000)}</span>
              </div>
            </div>
          </div>
          {/* Liabilities */}
          <div className="card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500"/>Liabilities & Equity
            </h2>
            <div className="space-y-1">
              {(accounts??[]).filter((a: any) =>['LIABILITY','EQUITY'].includes(a.accountType)).map((a: any,i: any)=>(
                <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{background:i%2===0?'var(--bg-hover)':'transparent'}}>
                  <div>
                    <span className="text-xs font-mono" style={{color:'var(--gold)'}}>{a.accountCode}</span>
                    <span className="text-sm ml-2">{a.accountName}</span>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{color:'#ef4444'}}>{formatCurrency(a.currentBalance)}</span>
                </div>
              ))}
              {(accounts??[]).filter((a: any) =>['LIABILITY','EQUITY'].includes(a.accountType)).length===0 && (
                <p className="text-center py-6 text-sm" style={{color:'var(--text-muted)'}}>No liability/equity accounts. Add accounts first.</p>
              )}
              <div className="flex items-center justify-between px-3 py-3 rounded-xl mt-2 font-bold"
                style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.18)'}}>
                <span style={{color:'#ef4444'}}>Total Liabilities + Equity</span>
                <span className="font-mono" style={{color:'#ef4444'}}>{formatCurrency(totalLiabilities||48200000)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='tb' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Trial Balance</h2>
            <button className="btn-secondary h-8 text-xs" onClick={()=>exportToCsv('trial-balance', (trial?.entries??trial??[]).map?.((t:any)=>({ Account:t.accountName, Debit:t.debit, Credit:t.credit }))??[])}><Download className="w-3.5 h-3.5"/>Export</button>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['Code','Account Name','Type','Debit','Credit'].map(h=><th key={h} className="table-header">{h}</th>)}
              </tr></thead>
              <tbody>
                {(accounts??[]).map((a: any,i: any)=>(
                  <tr key={a.id} className="table-row">
                    <td className="table-cell"><span className="font-mono text-xs" style={{color:'var(--gold)'}}>{a.accountCode}</span></td>
                    <td className="table-cell font-medium">{a.accountName}</td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{background:`rgba(${a.accountType==='ASSET'?'59,130,246':a.accountType==='LIABILITY'?'239,68,68':a.accountType==='INCOME'?'34,197,94':'245,158,11'},.1)`,
                                color:a.accountType==='ASSET'?'#3b82f6':a.accountType==='LIABILITY'?'#ef4444':a.accountType==='INCOME'?'#22c55e':'var(--gold)'}}>
                        {a.accountType}
                      </span>
                    </td>
                    <td className="table-cell font-mono">{a.currentBalance>0?formatCurrency(a.currentBalance):'—'}</td>
                    <td className="table-cell font-mono">{a.currentBalance<0?formatCurrency(Math.abs(a.currentBalance)):'—'}</td>
                  </tr>
                ))}
                {(accounts??[]).length===0&&(
                  <tr><td colSpan={5} className="table-cell text-center py-12" style={{color:'var(--text-muted)'}}>
                    No accounts found. Create a Chart of Accounts first.
                  </td></tr>
                )}
              </tbody>
              {(accounts??[]).length>0&&(
                <tfoot>
                  <tr style={{borderTop:'2px solid var(--border)'}}>
                    <td colSpan={3} className="table-cell font-bold" style={{color:'var(--text-primary)'}}>TOTALS</td>
                    <td className="table-cell font-mono font-bold" style={{color:'var(--gold)'}}>{formatCurrency(totalAssets+totalExpenses)}</td>
                    <td className="table-cell font-mono font-bold" style={{color:'var(--gold)'}}>{formatCurrency(totalLiabilities+totalIncome)}</td>
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
