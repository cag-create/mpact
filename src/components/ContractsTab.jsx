import React, { useState } from 'react'
import { FileText, Download, Plus, Edit3, Trash2, X, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../App'

// Crea'fi's starter contract library (hosted on the site). Always available for the Crea'fi
// community; admins can add more below (those are stored and show alongside these).
const CREAFI_DEFAULTS = [
  { id: 'cf-purchase',  title: 'Purchase Contract (Creative Financing)', category: 'Purchase & Assignment',          fileUrl: 'https://creafigenius.com/contracts/purchase-contract-creative-financing.pdf', description: 'Full purchase & escrow-instructions contract built for creative deals — cash, subject-to, or seller finance.' },
  { id: 'cf-subto',     title: 'Subject-To Addendum',                    category: 'Creative Finance (Sub-To / Wrap)', fileUrl: 'https://creafigenius.com/contracts/subject-to-addendum.pdf',               description: 'Addendum that structures taking title subject to the seller’s existing mortgage.' },
  { id: 'cf-selleracks',title: 'Seller Acknowledgements',                category: 'Creative Finance (Sub-To / Wrap)', fileUrl: 'https://creafigenius.com/contracts/seller-acknowledgements.pdf',             description: 'Seller sign-off acknowledging how a subject-to / creative sale works and protects them.' },
  { id: 'cf-novation',  title: 'Novation and Indemnification Agreement', category: 'Novation & Assignment',           fileUrl: 'https://creafigenius.com/contracts/novation-and-indemnification-agreement.pdf', description: 'Replaces the original buyer on the contract and indemnifies the parties — for novation deals.' },
]

const CATEGORY_ORDER = ['Purchase & Assignment', 'Creative Finance (Sub-To / Wrap)', 'Novation & Assignment', 'Seller Finance & Notes', 'Entity & Operating Agreements', 'Leases', 'Deeds & Transfers', 'Other']
const CATEGORIES = CATEGORY_ORDER

function ContractModal({ item, community, onSave, onClose }) {
  const isNew = !item
  const [form, setForm] = useState({ title: item?.title || '', category: item?.category || CATEGORIES[0], fileUrl: item?.fileUrl || '', description: item?.description || '', isPublished: item?.isPublished ?? true })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const cls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300'
  const canSave = form.title.trim() && form.fileUrl.trim()
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Add contract' : 'Edit contract'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label><input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Assignment of Contract" className={cls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label><select value={form.category} onChange={e => set('category', e.target.value)} className={cls}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">File link (PDF)</label><input value={form.fileUrl} onChange={e => set('fileUrl', e.target.value)} placeholder="https://creafigenius.com/contracts/..." className={cls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label><input value={form.description} onChange={e => set('description', e.target.value)} placeholder="One line on what it's for" className={cls} /></div>
          <button onClick={() => set('isPublished', !form.isPublished)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium ${form.isPublished ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>{form.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}{form.isPublished ? 'Visible to members' : 'Hidden (draft)'}</button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => canSave && onSave(form)} disabled={!canSave} className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">{isNew ? 'Add contract' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ContractsTab({ communityId, community }) {
  const { contracts, currentUser, addContract, updateContract, deleteContract } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  const defaults = communityId === 'creafi' ? CREAFI_DEFAULTS.map(d => ({ ...d, _default: true })) : []
  const custom = contracts.filter(c => c.communityId === communityId && (isAdmin || c.isPublished !== false))
  const all = [...defaults, ...custom]

  const byCategory = CATEGORY_ORDER
    .map(cat => ({ cat, items: all.filter(i => (i.category || 'Other') === cat) }))
    .filter(g => g.items.length)
  // any categories not in the fixed order
  const extra = all.filter(i => !CATEGORY_ORDER.includes(i.category || 'Other'))
  if (extra.length) byCategory.push({ cat: 'Other', items: [...(byCategory.find(g => g.cat === 'Other')?.items || []), ...extra] })

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Contracts</h2>
          <p className="text-sm text-gray-500 mt-0.5">The agreements and addendums to run your deals — download, make a copy, and fill them in.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}><Plus size={15} /> Add contract</button>
        )}
      </div>

      {all.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText size={28} className="text-indigo-400" /></div>
          <h3 className="font-bold text-gray-700 mb-2">No contracts yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">{isAdmin ? 'Add your first contract with a title, category, and a PDF link.' : 'Contracts will show up here soon.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {byCategory.map(({ cat, items }) => (
            <div key={cat}>
              <h3 className="font-grotesk font-bold text-[11px] tracking-widest uppercase text-gray-400 mb-3">{cat}</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-red-500" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 leading-snug">{item.title}</p>
                        {isAdmin && item.isPublished === false && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950">Draft</span>}
                      </div>
                    </div>
                    {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-snug">{item.description}</p>}
                    <div className="flex items-center gap-2 mt-auto pt-4">
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: community.color }}><Download size={14} /> Download</a>
                      {isAdmin && !item._default && (
                        <>
                          <button onClick={() => setEditing(item)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-50" title="Edit"><Edit3 size={14} /></button>
                          <button onClick={() => { if (window.confirm(`Delete "${item.title}"?`)) deleteContract(item.id) }} className="p-2 rounded-lg text-gray-300 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <ContractModal community={community} onSave={(f) => { addContract(communityId, f); setShowAdd(false) }} onClose={() => setShowAdd(false)} />}
      {editing && <ContractModal item={editing} community={community} onSave={(f) => { updateContract(editing.id, f); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
