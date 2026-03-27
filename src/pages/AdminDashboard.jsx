import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, Users, TrendingUp, Star, ChevronRight, Zap,
  Check, ExternalLink, Upload, X, Crown, Mail, Send,
  AlertCircle, CheckCircle, Settings, Building2, Bell,
  Eye, EyeOff, Plus, Trash2
} from 'lucide-react'
import { useApp } from '../App'
import { MpactWordmark, MpactMIcon } from '../components/Sidebar'
import CreafiLogo from '../components/CreafiLogo'

function fmtMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function Initials({ name, color }) {
  const parts = (name || '').split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase"
      style={{ backgroundColor: (color || '#6366f1') + '20', color: color || '#6366f1', border: `1.5px solid ${color || '#6366f1'}30` }}
    >
      {initials}
    </div>
  )
}
function RevenueBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-16 text-right">{fmtMoney(value)}</span>
    </div>
  )
}
const intervalFull = (i) => i === 'month' ? 'Monthly' : i === 'year' ? 'Annual' : 'One-time'

// ─── Educator platform plans ──────────────────────────────────────────────────

const PLATFORM_PLANS = [
  {
    tier: 'base',
    name: 'Base',
    price: 7,
    fee: '7%',
    color: '#6366f1',
    features: [
      'Unlimited students',
      'Live calls & events',
      'Full course builder',
      'Community feed',
      '7% transaction fee',
      'Mpact branding on lock screens',
    ],
  },
  {
    tier: 'mpact',
    name: 'Mpact',
    price: 59,
    fee: '2.99%',
    color: '#8B2FE0',
    features: [
      'Everything in Base',
      'Custom URL',
      '2.99% transaction fee',
      'Your logo on lock screens',
      'Priority support',
      'White-label option',
    ],
  },
]

// ─── Your Plan Section ────────────────────────────────────────────────────────

function YourPlanSection({ educatorPlan, onUpgrade }) {
  const current = PLATFORM_PLANS.find(p => p.tier === educatorPlan.tier) || PLATFORM_PLANS[0]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base">Your Mpact Plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your platform subscription</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
          style={{ backgroundColor: current.color + '15', color: current.color }}
        >
          {educatorPlan.tier === 'mpact' && <Crown size={13} />}
          {current.name} Plan — ${current.price}/mo
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {PLATFORM_PLANS.map(plan => {
          const isCurrent = plan.tier === educatorPlan.tier
          return (
            <div key={plan.tier} className={`p-6 ${isCurrent ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.fee} transaction fee</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-gray-900">${plan.price}</span>
                  <span className="text-xs text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                  style={{ backgroundColor: plan.color + '15', color: plan.color }}
                >
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => onUpgrade(plan.tier)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: plan.color }}
                >
                  {plan.price > current.price ? '⬆ Upgrade to ' : '⬇ Downgrade to '}{plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Email Blast Modal ─────────────────────────────────────────────────────────

function EmailBlastModal({ onClose, educators, communities, members, brevoSettings }) {
  const [audience, setAudience]   = useState('educators') // 'educators' | 'community'
  const [communityId, setCommunityId] = useState(communities[0]?.id || '')
  const [subject, setSubject]     = useState('')
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [error, setError]         = useState('')

  const recipients = audience === 'educators'
    ? educators.map(e => ({ email: e.email, name: e.name })).filter(r => r.email)
    : members.filter(m => m.communityId === communityId && m.email)
              .map(m => ({ email: m.email, name: m.name }))

  const handleSend = async () => {
    if (!brevoSettings.apiKey) { setError('Add your Brevo API key in Email Settings first.'); return }
    if (!subject.trim())       { setError('Subject is required.'); return }
    if (!body.trim())          { setError('Message body is required.'); return }
    if (recipients.length === 0) { setError('No recipients found with email addresses.'); return }
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/send-email-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: brevoSettings.apiKey,
          senderName: brevoSettings.senderName || 'Mpact',
          senderEmail: brevoSettings.senderEmail,
          subject,
          htmlContent: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><p style="font-size:15px;line-height:1.6;color:#1f2937;">${body.replace(/\n/g, '<br/>')}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af;">Sent via <a href="#" style="color:#8B2FE0">Mpact</a></p></div>`,
          recipients,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Send failed')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">Email Blast</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {sent ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Blast Sent!</h3>
            <p className="text-sm text-gray-500">Delivered to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800">Done</button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Audience */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Send To</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAudience('educators')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${audience === 'educators' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                >
                  Platform Educators ({educators.length})
                </button>
                <button
                  onClick={() => setAudience('community')}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${audience === 'community' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'}`}
                >
                  Community Members
                </button>
              </div>
              {audience === 'community' && (
                <select
                  value={communityId}
                  onChange={e => setCommunityId(e.target.value)}
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400"
                >
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1.5">
                {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} with email addresses
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Your platform payment is due..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                placeholder={audience === 'educators'
                  ? "Hi {name},\n\nThis is a reminder that your Mpact platform subscription payment is due..."
                  : "Hi {name},\n\nHere's what's happening in the community this week..."
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                {sending ? 'Sending…' : `Send to ${recipients.length} recipients`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Educator Modal ───────────────────────────────────────────────────────

function AddEducatorModal({ onClose, onAdd, communities }) {
  const [form, setForm] = useState({ name: '', email: '', communityId: communities[0]?.id || '', plan: 'base', nextBillingDate: '' })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add Educator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-violet-400"
              placeholder="John Smith" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-violet-400"
              placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Community</label>
            <select value={form.communityId} onChange={e => set('communityId', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-violet-400">
              {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {['base', 'mpact'].map(t => (
                <button key={t} onClick={() => set('plan', t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border ${form.plan === t ? 'bg-violet-600 text-white border-violet-600' : 'text-gray-600 border-gray-200 hover:border-violet-300'}`}>
                  {t === 'base' ? 'Base $7/mo' : 'Mpact $59/mo'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Billing Date</label>
            <input type="date" value={form.nextBillingDate} onChange={e => set('nextBillingDate', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-violet-400" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => { if (form.name && form.email) { onAdd(form); onClose() } }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700"
            >Add Educator</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    communities, members, plans, enrollments,
    educatorPlan, upgradeEducatorPlan, updateCommunity,
    educators, addEducator, updateEducator, deleteEducator,
    brevoSettings, saveBrevoSettings,
  } = useApp()

  const logoRef            = useRef()
  const [showBlast,     setShowBlast]     = useState(false)
  const [showAddEdu,    setShowAddEdu]    = useState(false)
  const [showBrevo,     setShowBrevo]     = useState(false)
  const [showApiKey,    setShowApiKey]    = useState(false)
  const [brevoForm,     setBrevoForm]     = useState(brevoSettings)

  const totalRevenue  = enrollments.reduce((s, e) => s + (e.amount || 0), 0)
  const mrr           = enrollments.filter(e => plans.find(p => p.id === e.planId)?.interval === 'month').reduce((s, e) => s + (e.amount || 0), 0)
  const totalMembers  = members.length
  const totalEnrolled = enrollments.length

  // Platform MRR from educators
  const platformMRR = educators.filter(e => e.status === 'active').reduce((s, e) => {
    return s + (e.plan === 'mpact' ? 59 : 7)
  }, 0)

  const overdueCount = educators.filter(e => {
    if (e.status === 'overdue') return true
    if (e.nextBillingDate) {
      const due = new Date(e.nextBillingDate + 'T00:00:00')
      return due < new Date()
    }
    return false
  }).length

  const communityRevenue = communities.map(c => ({
    ...c,
    revenue:  enrollments.filter(e => e.communityId === c.id).reduce((s, e) => s + (e.amount || 0), 0),
    enrolled: enrollments.filter(e => e.communityId === c.id).length,
    mems:     members.filter(m => m.communityId === c.id).length,
  })).sort((a, b) => b.revenue - a.revenue)

  const maxRevenue        = Math.max(...communityRevenue.map(c => c.revenue), 1)
  const recentEnrollments = [...enrollments].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 10)

  const handleLogoUpload = (communityId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateCommunity(communityId, { lockedScreenLogo: ev.target.result })
    reader.readAsDataURL(file)
  }

  const isOverdue = (edu) => {
    if (edu.status === 'overdue') return true
    if (edu.nextBillingDate) return new Date(edu.nextBillingDate + 'T00:00:00') < new Date()
    return false
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gray-950 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform overview and settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBlast(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors"
          >
            <Mail size={14} />
            Email Blast
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
            <ExternalLink size={14} />
            Stripe Dashboard
          </button>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue',      value: fmtMoney(totalRevenue),  icon: DollarSign,  color: '#10b981', bg: '#f0fdf4', sub: 'Community sales'     },
            { label: 'Community MRR',      value: fmtMoney(mrr),           icon: TrendingUp,  color: '#6366f1', bg: '#eef2ff', sub: 'Member subscriptions' },
            { label: 'Platform MRR',       value: fmtMoney(platformMRR),   icon: Building2,   color: '#8B2FE0', bg: '#f5f3ff', sub: `${educators.length} educators`  },
            { label: 'Members',            value: totalMembers,            icon: Users,       color: '#3b82f6', bg: '#eff6ff', sub: 'Across all communities' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs text-gray-500">{stat.sub}</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Platform Subscribers */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900">Platform Subscribers</h2>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <AlertCircle size={11} />
                  {overdueCount} overdue
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddEdu(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add Educator
            </button>
          </div>

          {educators.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No platform subscribers yet</p>
              <button onClick={() => setShowAddEdu(true)} className="mt-3 text-sm font-semibold text-violet-600 hover:text-violet-700">
                Add your first educator
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    {['Educator', 'Community', 'Plan', 'Next Billing', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {educators.map(edu => {
                    const overdue = isOverdue(edu)
                    const comm = communities.find(c => c.id === edu.communityId)
                    return (
                      <tr key={edu.id} className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <Initials name={edu.name} color={overdue ? '#f59e0b' : '#8B2FE0'} />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{edu.name}</p>
                              <p className="text-xs text-gray-500">{edu.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{comm?.name || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: (edu.plan === 'mpact' ? '#8B2FE0' : '#6366f1') + '15',
                              color: edu.plan === 'mpact' ? '#8B2FE0' : '#6366f1',
                            }}
                          >
                            {edu.plan === 'mpact' && <Crown size={10} />}
                            {edu.plan === 'mpact' ? 'Mpact $59/mo' : 'Base $7/mo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${overdue ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                            {fmtDate(edu.nextBillingDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={overdue && edu.status !== 'overdue' ? 'overdue' : edu.status}
                            onChange={e => updateEducator(edu.id, { status: e.target.value, nextBillingDate: e.target.value === 'active' ? (() => { const d = new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split('T')[0] })() : edu.nextBillingDate })}
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                              (overdue || edu.status === 'overdue') ? 'bg-amber-100 text-amber-800' :
                              edu.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const plan = PLATFORM_PLANS.find(p => p.tier !== edu.plan)
                                if (plan && window.confirm(`Switch to ${plan.name} plan ($${plan.price}/mo)?`)) {
                                  updateEducator(edu.id, { plan: plan.tier })
                                }
                              }}
                              title="Switch plan"
                              className="text-xs text-gray-500 hover:text-violet-700 font-medium px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                            >
                              Switch Plan
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Remove this educator?')) deleteEducator(edu.id) }}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Your Mpact Plan */}
        <YourPlanSection educatorPlan={educatorPlan} onUpgrade={(tier) => {
          if (window.confirm(`Switch to the ${tier === 'mpact' ? 'Mpact ($59/mo)' : 'Base ($7/mo)'} plan?`)) {
            upgradeEducatorPlan(tier)
          }
        }} />

        <div className="grid grid-cols-3 gap-6">
          {/* Revenue by community */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Revenue by Community</h2>
            </div>
            <div className="px-6 py-5 space-y-6">
              {communityRevenue.map(c => (
                <div key={c.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c.color + '20' }}>
                      {c.id === 'creafi' ? <CreafiLogo size={28} /> : <span className="text-base">{c.emoji}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.enrolled} enrolled · {c.mems} members</p>
                    </div>

                    {/* Lock screen logo management */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {educatorPlan.tier === 'mpact' ? (
                        c.lockedScreenLogo ? (
                          <div className="flex items-center gap-1.5">
                            <img src={c.lockedScreenLogo} className="w-6 h-6 rounded object-cover" alt="lock logo" />
                            <button onClick={() => updateCommunity(c.id, { lockedScreenLogo: null })} className="text-gray-400 hover:text-red-500 transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { logoRef.current.dataset.cid = c.id; logoRef.current.click() }}
                            className="flex items-center gap-1 text-xs text-violet-700 hover:text-violet-800 font-medium bg-violet-50 px-2 py-1 rounded-lg"
                          >
                            <Upload size={11} />
                            Lock Logo
                          </button>
                        )
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MpactMIcon size={16} />
                          <span>Lock logo</span>
                        </span>
                      )}
                      <button
                        onClick={() => navigate(`/community/${c.id}/payments`)}
                        className="text-xs text-indigo-700 hover:text-indigo-800 font-medium flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                      >
                        Manage <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                  <RevenueBar value={c.revenue} max={maxRevenue} color={c.color} />
                </div>
              ))}
              {communityRevenue.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No communities yet</p>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Stripe connect */}
            <div className="bg-gradient-to-br from-gray-950 to-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                <Zap size={20} className="text-yellow-400" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">Connect Stripe</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Required to accept payments. Members pay to unlock your communities.
              </p>
              <button className="w-full py-2.5 bg-white text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                Connect Now
              </button>
            </div>

            {/* Brevo settings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBrevo(!showBrevo)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Email Settings</p>
                  <p className="text-xs text-gray-500">Brevo / Sendinblue integration</p>
                </div>
                <Settings size={14} className="text-gray-400" />
              </button>

              {showBrevo && (
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={brevoForm.apiKey}
                        onChange={e => setBrevoForm(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="xkeysib-..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-violet-400 pr-9"
                      />
                      <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sender Name</label>
                    <input
                      value={brevoForm.senderName}
                      onChange={e => setBrevoForm(prev => ({ ...prev, senderName: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-violet-400"
                      placeholder="Mpact"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sender Email</label>
                    <input
                      type="email"
                      value={brevoForm.senderEmail}
                      onChange={e => setBrevoForm(prev => ({ ...prev, senderEmail: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-violet-400"
                      placeholder="hello@mpact.app"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowBrevo(false)} className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                    <button
                      onClick={() => { saveBrevoSettings(brevoForm); setShowBrevo(false) }}
                      className="flex-1 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700"
                    >Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* Communities list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Communities</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {communities.map(c => (
                  <button key={c.id} onClick={() => navigate(`/community/${c.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left">
                    <span className="flex-shrink-0">{c.id === 'creafi' ? <CreafiLogo size={20} /> : <span className="text-base">{c.emoji}</span>}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">{c.name}</span>
                    <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Enrollments */}
        {recentEnrollments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Recent Enrollments</h2>
              <span className="text-sm text-gray-500">{enrollments.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    {['Member', 'Community', 'Plan', 'Date', 'Amount', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentEnrollments.map(enrollment => {
                    const member    = members.find(m => m.id === enrollment.memberId)
                    const community = communities.find(c => c.id === enrollment.communityId)
                    const plan      = plans.find(p => p.id === enrollment.planId)
                    return (
                      <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Initials name={member?.name} color={member?.color} />
                            <div>
                              <p className="text-sm font-medium text-gray-800">{member?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{member?.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {community?.id === 'creafi' ? <CreafiLogo size={20} /> : <span className="text-base">{community?.emoji}</span>}
                            <span className="text-sm text-gray-700 max-w-[120px] truncate">{community?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-sm text-gray-700">{plan?.name}</span>
                          {plan && <span className="text-xs text-gray-500 ml-1">({intervalFull(plan.interval)})</span>}
                        </td>
                        <td className="px-6 py-3.5"><span className="text-sm text-gray-700">{fmtDate(enrollment.enrolledAt)}</span></td>
                        <td className="px-6 py-3.5"><span className="text-sm font-bold text-gray-900">{fmtMoney(enrollment.amount)}</span></td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${enrollment.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {enrollment.status === 'active' ? 'Active' : enrollment.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Hidden logo upload */}
      <input ref={logoRef} type="file" accept="image/*" className="hidden"
        onChange={e => handleLogoUpload(logoRef.current.dataset.cid, e)} />

      {/* Modals */}
      {showBlast && (
        <EmailBlastModal
          onClose={() => setShowBlast(false)}
          educators={educators}
          communities={communities}
          members={members}
          brevoSettings={brevoSettings}
        />
      )}
      {showAddEdu && (
        <AddEducatorModal
          onClose={() => setShowAddEdu(false)}
          onAdd={addEducator}
          communities={communities}
        />
      )}
    </div>
  )
}
