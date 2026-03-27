import React, { useState } from 'react'
import {
  DollarSign, TrendingUp, Users, CreditCard, Plus, Trash2, Edit3,
  Check, X, ToggleLeft, ToggleRight, ExternalLink, Zap, ChevronDown, Star
} from 'lucide-react'
import { useApp } from '../App'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const intervalLabel = (i) => i === 'month' ? '/mo' : i === 'year' ? '/yr' : ' one-time'
const intervalFull  = (i) => i === 'month' ? 'Monthly' : i === 'year' ? 'Annual' : 'Lifetime'

function fmtMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Feature Input ────────────────────────────────────────────────────────────

function FeatureList({ features, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    if (input.trim()) {
      onChange([...features, input.trim()])
      setInput('')
    }
  }

  return (
    <div>
      <div className="space-y-1.5 mb-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <Check size={13} className="text-green-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 flex-1">{f}</span>
            <button onClick={() => onChange(features.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 transition-colors">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add a feature..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button onClick={add} className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Plan Modal ───────────────────────────────────────────────────────────────

function PlanModal({ plan, communityId, onSave, onClose }) {
  const isNew = !plan
  const [form, setForm] = useState({
    name:        plan?.name        || '',
    price:       plan?.price       || '',
    interval:    plan?.interval    || 'month',
    description: plan?.description || '',
    features:    plan?.features    || [],
  })

  const canSave = form.name.trim() && form.price !== '' && Number(form.price) >= 0

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Create Plan' : 'Edit Plan'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Monthly, Annual"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Interval</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'month', label: 'Monthly' },
                { value: 'year',  label: 'Annual' },
                { value: 'once',  label: 'One-Time' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(p => ({ ...p, interval: opt.value }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.interval === opt.value ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Full access, billed monthly"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Features</label>
            <FeatureList
              features={form.features}
              onChange={features => setForm(p => ({ ...p, features }))}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => canSave && onSave({ ...form, price: Number(form.price) })}
            disabled={!canSave}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {isNew ? 'Create Plan' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, enrollmentCount, onEdit, onDelete, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 flex flex-col transition-all ${
      plan.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">{plan.name}</h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {intervalFull(plan.interval)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(plan)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
            <Edit3 size={13} />
          </button>
          <button onClick={() => onDelete(plan.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-black text-gray-900">${plan.price}</span>
        <span className="text-sm text-gray-400">{intervalLabel(plan.interval)}</span>
      </div>

      {plan.features?.length > 0 && (
        <ul className="space-y-1.5 mb-4 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
        <span className="text-xs text-gray-400">
          <span className="font-semibold text-gray-700">{enrollmentCount}</span> enrolled
        </span>
        <button
          onClick={() => onToggle(plan.id)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            plan.isActive
              ? 'bg-green-50 text-green-700 hover:bg-green-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {plan.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {plan.isActive ? 'Active' : 'Inactive'}
        </button>
      </div>
    </div>
  )
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

export default function PaymentsTab({ communityId, community }) {
  const { plans, enrollments, members, addPlan, updatePlan, deletePlan, togglePlan } = useApp()
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [stripeConnected] = useState(false) // UI placeholder

  const communityPlans       = plans.filter(p => p.communityId === communityId)
  const communityEnrollments = enrollments.filter(e => e.communityId === communityId)

  const totalRevenue = communityEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
  const mrr = communityEnrollments
    .filter(e => {
      const plan = plans.find(p => p.id === e.planId)
      return plan?.interval === 'month'
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const activeSubs = communityEnrollments.filter(e => {
    const plan = plans.find(p => p.id === e.planId)
    return plan?.interval === 'month' || plan?.interval === 'year'
  }).length
  const oneTimeSales = communityEnrollments.filter(e => {
    const plan = plans.find(p => p.id === e.planId)
    return plan?.interval === 'once'
  }).length

  const handleAddPlan = (form) => {
    addPlan(communityId, form)
    setShowAddPlan(false)
  }

  const handleEditPlan = (form) => {
    updatePlan(editingPlan.id, form)
    setEditingPlan(null)
  }

  const handleDeletePlan = (id) => {
    if (window.confirm('Delete this plan? Existing enrollments will not be affected.')) {
      deletePlan(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stripe banner */}
      {!stripeConnected && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Connect Stripe to Accept Payments</p>
            <p className="text-xs text-indigo-200 mt-0.5">Stripe processes your payments securely. Connect once, get paid instantly.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors flex-shrink-0 whitespace-nowrap">
            <ExternalLink size={13} />
            Connect Stripe
          </button>
        </div>
      )}

      {/* Revenue stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',    value: fmtMoney(totalRevenue), icon: DollarSign, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Monthly Recurring', value: fmtMoney(mrr),          icon: TrendingUp,  color: '#6366f1', bg: '#eef2ff' },
          { label: 'Active Subs',       value: activeSubs,              icon: Users,       color: '#3b82f6', bg: '#eff6ff' },
          { label: 'One-time Sales',    value: oneTimeSales,            icon: Star,        color: '#f59e0b', bg: '#fffbeb' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: stat.bg }}>
                  <Icon size={17} style={{ color: stat.color }} />
                </div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Pricing Plans</h3>
          <button
            onClick={() => setShowAddPlan(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: community.color }}
          >
            <Plus size={14} />
            Add Plan
          </button>
        </div>

        {communityPlans.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-gray-300" />
            </div>
            <h4 className="font-bold text-gray-700 mb-1.5">No plans yet</h4>
            <p className="text-sm text-gray-400 mb-5">Create a pricing plan to start accepting payments for this community.</p>
            <button
              onClick={() => setShowAddPlan(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: community.color }}
            >
              Create First Plan
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${communityPlans.length === 1 ? 'grid-cols-1 max-w-xs' : communityPlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {communityPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                enrollmentCount={communityEnrollments.filter(e => e.planId === plan.id).length}
                onEdit={setEditingPlan}
                onDelete={handleDeletePlan}
                onToggle={togglePlan}
              />
            ))}
          </div>
        )}
      </div>

      {/* Enrollments */}
      {communityEnrollments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Enrollments</h3>
            <span className="text-sm text-gray-400">{communityEnrollments.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Member</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {communityEnrollments.map(enrollment => {
                  const member = members.find(m => m.id === enrollment.memberId)
                  const plan   = plans.find(p => p.id === enrollment.planId)
                  const parts  = (member?.name || '?').split(' ')
                  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '?'
                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase"
                            style={{ backgroundColor: (member?.color || '#6366f1') + '25', color: member?.color || '#6366f1' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{member?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{member?.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-gray-700">{plan?.name || '—'}</span>
                        {plan && <span className="text-xs text-gray-400 ml-1">({intervalFull(plan.interval)})</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm text-gray-600">{fmtDate(enrollment.enrolledAt)}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{fmtMoney(enrollment.amount)}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          enrollment.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
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

      {showAddPlan && (
        <PlanModal communityId={communityId} onSave={handleAddPlan} onClose={() => setShowAddPlan(false)} />
      )}
      {editingPlan && (
        <PlanModal plan={editingPlan} communityId={communityId} onSave={handleEditPlan} onClose={() => setEditingPlan(null)} />
      )}
    </div>
  )
}
