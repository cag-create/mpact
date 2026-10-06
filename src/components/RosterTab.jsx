import React, { useMemo, useState } from 'react'
import { useApp } from '../App'
import { CheckCircle2, Circle, Mail, ChevronDown, ChevronUp, Search, ShieldCheck, Clock, KeyRound, Loader2, FileText, FileCheck2 } from 'lucide-react'

const FORGOT_URL = (typeof window !== 'undefined' && window.__MPACT_BRAND__?.forgotUrl) || 'https://creafigenius.com/api/forgot-password'
const RULES_COPY_URL = (typeof window !== 'undefined' && window.__MPACT_BRAND__?.rulesUrl) || 'https://creafigenius.com/community-rules.pdf'
const fmtDate = (d) => d ? new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

// Admin roster: who joined, what they filled on the form, and who has signed the community rules.
export default function RosterTab({ communityId, community }) {
  const { members, enrollments, plans, currentUser, setMemberRules, setMemberW9 } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({})
  const [sending, setSending] = useState({})   // memberId -> 'sending' | 'sent'

  const roster = useMemo(() => members
    .filter(m => m.communityId === communityId && !['owner', 'admin', 'platform_admin'].includes(m.role))
    .filter(m => !q || `${m.name} ${m.email} ${m.intake?.markets || ''}`.toLowerCase().includes(q.toLowerCase()))
    .map(m => {
      const enr = enrollments.find(e => e.memberId === m.id && e.status === 'active')
      const plan = enr ? plans.find(p => p.id === enr.planId) : null
      return { ...m, planName: plan?.name || null }
    })
    .sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || '')), [members, enrollments, plans, communityId, q])

  const signed = roster.filter(m => m.rulesSignedAt).length
  const pending = roster.length - signed
  const w9Count = roster.filter(m => m.w9OnFile).length

  const resend = async (m) => {
    if (!m.email) return
    setSending(s => ({ ...s, [m.id]: 'sending' }))
    try { await fetch(FORGOT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: m.email }) }) } catch {}
    setSending(s => ({ ...s, [m.id]: 'sent' }))
    setTimeout(() => setSending(s => ({ ...s, [m.id]: undefined })), 3000)
  }

  if (!isAdmin) return null

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Roster</h2>
          <p className="text-sm text-gray-500 mt-0.5">Everyone who joined — their details from the form, their login, and who's signed the rules.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Members', value: roster.length, icon: Mail, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Rules signed', value: signed, icon: ShieldCheck, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Awaiting signature', value: pending, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'W-9 on file', value: w9Count, icon: FileCheck2, color: '#0ea5e9', bg: '#eff6ff' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}><Icon size={17} style={{ color: s.color }} /></div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-3 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, market" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {roster.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">No members yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Rules</th>
                  <th className="px-5 py-3">W-9</th>
                  <th className="px-5 py-3">Login</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {roster.map(m => {
                  const isOpen = open[m.id]
                  const parts = (m.name || '?').split(' ')
                  const initials = (parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?').toUpperCase()
                  const state = sending[m.id]
                  return (
                    <React.Fragment key={m.id}>
                      <tr className="hover:bg-gray-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase" style={{ backgroundColor: (m.color || '#6366f1') + '25', color: m.color || '#6366f1' }}>{initials}</div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 leading-tight">{m.name}</p>
                              <p className="text-xs text-gray-400 truncate">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{m.planName || <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(m.joinedAt)}</td>
                        <td className="px-5 py-3">
                          {m.rulesSignedAt ? (
                            <button onClick={() => setMemberRules(m.id, false)} title={`Signed ${fmtDate(m.rulesSignedAt)} — click to unmark`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 hover:bg-green-100">
                              <CheckCircle2 size={13} /> Signed
                            </button>
                          ) : (
                            <button onClick={() => setMemberRules(m.id, true)} title="Mark the rules as signed" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-100">
                              <Circle size={13} /> Mark signed
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {m.w9OnFile ? (
                            <button onClick={() => setMemberW9(m.id, false)} title={`On file${m.w9At ? ` ${fmtDate(m.w9At)}` : ''} — click to clear`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-1 hover:bg-sky-100">
                              <FileCheck2 size={13} /> On file
                            </button>
                          ) : (
                            <button onClick={() => setMemberW9(m.id, true)} title="Mark the W-9 as received" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-100">
                              <FileText size={13} /> Needed
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => resend(m)} disabled={state === 'sending'} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 disabled:opacity-60" title="Email this member a new password">
                              {state === 'sending' ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                              {state === 'sent' ? 'Sent' : state === 'sending' ? 'Sending' : 'Resend login'}
                            </button>
                            <button onClick={() => setOpen(o => ({ ...o, [m.id]: !o[m.id] }))} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="Form details">
                              {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={7} className="px-5 py-4">
                            {m.intake ? (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm mb-3">
                                <Detail label="Location" value={m.intake.cityStateZip} />
                                <Detail label="Markets" value={m.intake.markets} />
                                <Detail label="Shirt size" value={m.intake.tshirt} />
                                <Detail label="Paid" value={fmtDate(m.intake.paidAt)} />
                                <Detail label="Mailing address" value={m.intake.mailing} wide />
                                {m.contractId && <Detail label="Agreement ID" value={m.contractId} />}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 mb-3">No form details on file for this member yet. New members' form answers show here automatically.</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                              <a href={RULES_COPY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
                                <ShieldCheck size={13} /> Community rules {m.rulesSignedAt ? `· signed ${fmtDate(m.rulesSignedAt)}` : '(copy)'}
                              </a>
                              {m.w9Url
                                ? <a href={m.w9Url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 hover:bg-sky-50"><FileCheck2 size={13} /> View W-9 on file</a>
                                : <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5"><FileText size={13} /> {m.w9OnFile ? 'W-9 on file (no link)' : 'W-9 not received'}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">Passwords aren't stored for security — use <span className="font-medium text-gray-500">Resend login</span> to email a member a fresh one. "Rules" reflects the signed agreement; you can mark it manually for anyone who signed offline.</p>
    </div>
  )
}

function Detail({ label, value, wide }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-gray-700">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  )
}
