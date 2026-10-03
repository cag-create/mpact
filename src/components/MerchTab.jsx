import React, { useState } from 'react'
import { ShoppingBag, Plus, Edit3, Trash2, X, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../App'

function MerchModal({ item, community, onSave, onClose }) {
  const isNew = !item
  const [form, setForm] = useState({
    title: item?.title || '', description: item?.description || '', price: item?.price || '',
    imageUrl: item?.imageUrl || '', buyUrl: item?.buyUrl || '', isPublished: item?.isPublished ?? false,
    sizesText: (item?.sizes || []).join(', '),
  })
  const save = () => {
    if (!form.title.trim()) return
    const sizes = form.sizesText.split(',').map(s => s.trim()).filter(Boolean)
    onSave({ ...form, sizes })
  }
  const cls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Add product' : 'Edit product'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product name</label>
            <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Crea'fi Tee — Black" className={cls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
              <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="$35" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image link</label>
              <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://…" className={cls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" className={cls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sizes (comma-separated, optional)</label>
            <input value={form.sizesText} onChange={e => setForm(p => ({ ...p, sizesText: e.target.value }))} placeholder="XS, S, M, L, XL, XXL" className={cls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Buy link (Stripe link, Shopify, print-on-demand…)</label>
            <input value={form.buyUrl} onChange={e => setForm(p => ({ ...p, buyUrl: e.target.value }))} placeholder="https://buy.stripe.com/…" className={cls} />
          </div>
          <button onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium ${form.isPublished ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
            {form.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}{form.isPublished ? 'Live — members can see it' : 'Draft — hidden from members'}
          </button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={save} disabled={!form.title.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">{isNew ? 'Add product' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function MerchTab({ communityId, community }) {
  const { merch, currentUser, addMerchItem, updateMerchItem, deleteMerchItem } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [spin, setSpin] = useState({})   // tap-to-spin: product id -> accumulated degrees

  const items = merch
    .filter(m => m.communityId === communityId && (isAdmin || m.isPublished))
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Merch</h2>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} product{items.length !== 1 ? 's' : ''}{isAdmin ? ' · drafts are hidden from members' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}>
            <Plus size={15} /> Add product
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShoppingBag size={28} className="text-indigo-400" /></div>
          <h3 className="font-bold text-gray-700 mb-2">{isAdmin ? 'No products yet' : 'Merch is coming soon'}</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">{isAdmin ? 'Add your first product with a photo, price, and a buy link (Stripe, Shopify, or print-on-demand). Publish it when it’s ready.' : 'Crea’fi gear is on the way. Check back soon.'}</p>
          {isAdmin && <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}>Add your first product</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="aspect-square bg-gray-100 relative" style={{ perspective: '900px' }} title={item.imageUrl ? 'Tap to spin' : undefined}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title}
                      onClick={() => setSpin(s => ({ ...s, [item.id]: (s[item.id] || 0) + 360 }))}
                      className="w-full h-full object-cover cursor-pointer select-none"
                      style={{ transform: `rotateY(${spin[item.id] || 0}deg)`, transformStyle: 'preserve-3d', transition: 'transform .9s cubic-bezier(.2,.8,.2,1)' }}
                      draggable={false} />
                  : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={34} className="text-gray-300" /></div>}
                {isAdmin && (
                  <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.isPublished ? 'bg-white text-gray-900' : 'bg-amber-400 text-amber-950'}`}>{item.isPublished ? 'Live' : 'Draft'}</span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base text-gray-900 leading-tight">{item.title}</h3>
                  {item.price && <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{item.price}</span>}
                </div>
                {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                {Array.isArray(item.sizes) && item.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.sizes.map(sz => (
                      <span key={sz} className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-200 text-gray-600">{sz}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto pt-4">
                  {item.buyUrl
                    ? <a href={item.buyUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: community.color }}><ExternalLink size={14} /> Buy</a>
                    : <span className="flex-1 text-center px-3 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold">Coming soon</span>}
                  {isAdmin && (
                    <>
                      <button onClick={() => setEditing(item)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-50" title="Edit"><Edit3 size={14} /></button>
                      <button onClick={() => { if (window.confirm(`Delete "${item.title}"?`)) deleteMerchItem(item.id) }} className="p-2 rounded-lg text-gray-300 hover:text-red-500" title="Delete"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <MerchModal community={community} onSave={(f) => { addMerchItem(communityId, f); setShowAdd(false) }} onClose={() => setShowAdd(false)} />}
      {editing && <MerchModal item={editing} community={community} onSave={(f) => { updateMerchItem(editing.id, f); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
