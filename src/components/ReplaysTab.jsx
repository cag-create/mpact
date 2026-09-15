import React, { useMemo, useState } from 'react'
import { Video, Plus, Edit3, Trash2, X, Search, Eye, EyeOff, Calendar } from 'lucide-react'
import { useApp } from '../App'
import { getYouTubeThumbnail, VideoEmbed } from '../lib/video.jsx'

export const SESSION_TYPES  = ['Deal Lab', 'Sales Practice', 'Office Hours', 'Training', 'Q&A', 'Guest']
export const TOPICS         = ['Creative Finance', 'Wholesale', 'Agent Outreach', 'Sales', 'Dispositions', 'Contracts', 'Mindset', 'General']
export const PROPERTY_TYPES = ['Single family', 'Multifamily', 'Land', 'Commercial', 'Mobile home', 'Mixed', 'N/A']

const fmt = (d) => d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

function Chip({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{children}</button>
}

function ReplayModal({ replay, onSave, onClose }) {
  const isNew = !replay
  const [form, setForm] = useState({
    title: replay?.title || '', date: replay?.date || new Date().toISOString().slice(0, 10), sessionType: replay?.sessionType || 'Deal Lab',
    topic: replay?.topic || 'Creative Finance', propertyType: replay?.propertyType || 'Single family', videoUrl: replay?.videoUrl || '',
    notes: replay?.notes || '', isPublished: replay?.isPublished ?? true,
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const canSave = form.title.trim() && form.videoUrl.trim()
  const sel = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Add replay' : 'Edit replay'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label><input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Deal Lab: seller-financed duplex in Gastonia" className={sel} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Video link (YouTube, Vimeo, Loom, Google Drive, or .mp4)</label><input value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} placeholder="https://youtu.be/..." className={sel} />
            {form.videoUrl && <div className="mt-2"><VideoEmbed url={form.videoUrl} title={form.title || 'Preview'} /></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Session date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={sel} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Session type</label><select value={form.sessionType} onChange={e => set('sessionType', e.target.value)} className={sel}>{SESSION_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label><select value={form.topic} onChange={e => set('topic', e.target.value)} className={sel}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Property type</label><select value={form.propertyType} onChange={e => set('propertyType', e.target.value)} className={sel}>{PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (what's covered, timestamps, links)</label><textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} className={sel + ' resize-none'} placeholder={"0:00 Intro\n4:30 The numbers\n18:00 The offer we'd make"} /></div>
          <button onClick={() => set('isPublished', !form.isPublished)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium ${form.isPublished ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>{form.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}{form.isPublished ? 'Visible to members' : 'Hidden (draft)'}</button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => canSave && onSave(form)} disabled={!canSave} className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">{isNew ? 'Add replay' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ReplaysTab({ communityId, community }) {
  const { replays, currentUser, addReplay, updateReplay, deleteReplay } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const [q, setQ] = useState('')
  const [fType, setFType] = useState(null), [fTopic, setFTopic] = useState(null), [fProp, setFProp] = useState(null)
  const [showAdd, setShowAdd] = useState(false), [editing, setEditing] = useState(null), [watching, setWatching] = useState(null)

  const list = useMemo(() => replays
    .filter(r => r.communityId === communityId && (isAdmin || r.isPublished !== false))
    .filter(r => !fType || r.sessionType === fType).filter(r => !fTopic || r.topic === fTopic).filter(r => !fProp || r.propertyType === fProp)
    .filter(r => !q || `${r.title} ${r.notes} ${r.topic} ${r.sessionType}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')), [replays, communityId, isAdmin, fType, fTopic, fProp, q])

  const clear = () => { setFType(null); setFTopic(null); setFProp(null); setQ('') }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Replays</h2>
          <p className="text-sm text-gray-500 mt-0.5">Every live session, recorded. Filter by what you're working on.</p>
        </div>
        {isAdmin && <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}><Plus size={15} /> Add replay</button>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 space-y-3">
        <div className="relative"><Search size={15} className="absolute left-3 top-3 text-gray-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search titles and notes" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
        {[['Session', SESSION_TYPES, fType, setFType], ['Topic', TOPICS, fTopic, setFTopic], ['Property', PROPERTY_TYPES, fProp, setFProp]].map(([label, opts, val, set]) => (
          <div key={label} className="flex items-center gap-2 flex-wrap"><span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-16">{label}</span>{opts.map(o => <Chip key={o} active={val === o} onClick={() => set(val === o ? null : o)}>{o}</Chip>)}</div>
        ))}
        {(fType || fTopic || fProp || q) && <button onClick={clear} className="text-xs text-indigo-600 hover:underline">Clear filters</button>}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Video size={28} className="text-indigo-400" /></div>
          <h3 className="font-bold text-gray-700 mb-1">{replays.some(r => r.communityId === communityId) ? 'Nothing matches those filters' : 'No replays yet'}</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">{isAdmin ? 'After each live session, upload the recording (YouTube unlisted works well) and add it here with the topic and property type.' : 'Recordings of the live sessions will show up here after each call.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(r => {
            const thumb = getYouTubeThumbnail(r.videoUrl)
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <button onClick={() => setWatching(r)} className="relative aspect-video bg-gray-900 w-full group">
                  {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100" /> : <div className="w-full h-full flex items-center justify-center"><Video size={28} className="text-white/40" /></div>}
                  <span className="absolute bottom-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white">{r.sessionType}</span>
                  {isAdmin && r.isPublished === false && <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">Hidden</span>}
                </button>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-semibold text-gray-900 leading-snug">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar size={11} /> {fmt(r.date)}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">{[r.topic, r.propertyType].filter(Boolean).map(t => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>)}</div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 mt-auto pt-3 justify-end">
                      <button onClick={() => setEditing(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-50"><Edit3 size={13} /></button>
                      <button onClick={() => { if (window.confirm('Delete this replay?')) deleteReplay(r.id) }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-50"><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {watching && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setWatching(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <VideoEmbed url={watching.videoUrl} title={watching.title} className="rounded-none" />
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{watching.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{watching.sessionType} · {fmt(watching.date)} · {watching.topic} · {watching.propertyType}</p>
                {watching.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap mt-3">{watching.notes}</p>}
              </div>
              <button onClick={() => setWatching(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0"><X size={18} /></button>
            </div>
          </div>
        </div>
      )}
      {showAdd && <ReplayModal onSave={(f) => { addReplay(communityId, f); setShowAdd(false) }} onClose={() => setShowAdd(false)} />}
      {editing && <ReplayModal replay={editing} onSave={(f) => { updateReplay(editing.id, f); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
