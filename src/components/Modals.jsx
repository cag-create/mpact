import React, { useState, useEffect, useRef } from 'react'
import { X, Check, Camera, Image } from 'lucide-react'
import { useApp } from '../App'
import { useNavigate } from 'react-router-dom'

// ─── Image helpers ──────────────────────────────────────────────────────────────
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function AvatarUpload({ value, onChange, size = 80 }) {
  const inputRef = useRef()
  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await readFileAsDataURL(file)
    onChange(dataUrl)
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors flex items-center justify-center bg-gray-100"
        style={{ width: size, height: size }}
      >
        {value
          ? <img src={value} alt="avatar" className="w-full h-full object-cover" />
          : <Camera size={22} className="text-gray-400" />
        }
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
          {value && <Camera size={16} className="text-white opacity-0 hover:opacity-100" />}
        </div>
      </button>
      <p className="text-xs text-gray-400">Click to upload photo</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ─── Shared ────────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function ModalCard({ title, subtitle, children, onClose }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-5 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-colors"
const textareaClass = `${inputClass} resize-none`

// ─── Create Community ──────────────────────────────────────────────────────────

const EMOJIS    = ['🚀','💪','🧘','📚','🎨','💡','🌱','🔥','⚡','🎯','🌊','✨','🏆','💎','🎵','🌸']
const COLORS    = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#14b8a6']
const CATS      = ['Business','Marketing','Health','Education','Creative','Technology','Finance','Personal Dev','Community','Other']

export function CreateCommunityModal({ onClose }) {
  const { createCommunity } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', description: '', emoji: '🚀', color: '#6366f1', category: 'Education' })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const c = createCommunity(form)
    onClose()
    navigate(`/community/${c.id}`)
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Create Community" subtitle="Set up a new learning community" onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji + Color */}
          <div className="flex gap-4">
            <Field label="Icon">
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => set('emoji', e)}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${form.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'hover:bg-gray-100'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Color */}
          <Field label="Color">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {form.color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Community Name *">
            <input type="text" placeholder="e.g. Digital Marketing Mastery" value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} required />
          </Field>

          <Field label="Description">
            <textarea rows={3} placeholder="What is this community about? Who is it for?" value={form.description} onChange={e => set('description', e.target.value)} className={textareaClass} />
          </Field>

          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>

          {/* Preview */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: form.color + '12', border: `1.5px solid ${form.color}30` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: form.color + '20' }}>{form.emoji}</div>
            <div>
              <p className="font-semibold text-gray-800">{form.name || 'Community Name'}</p>
              <p className="text-xs text-gray-400">{form.category}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: form.color }}>
              Create Community
            </button>
          </div>
        </form>
      </ModalCard>
    </Overlay>
  )
}

// ─── Add Event ─────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'call',      label: '📞 Live Call',   color: '#6366f1' },
  { value: 'workshop',  label: '🛠 Workshop',    color: '#f59e0b' },
  { value: 'challenge', label: '🏆 Challenge',   color: '#10b981' },
  { value: 'other',     label: '📌 Other',       color: '#6b7280' },
]

export function AddEventModal({ communityId, community, defaultDate, onClose }) {
  const { addEvent } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: '', description: '', date: defaultDate || today, time: '10:00 AM', type: 'workshop'
  })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    addEvent(communityId, form)
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Add Event" subtitle={`Add to ${community.name}`} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Event Type">
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all text-left ${form.type === t.value ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  style={form.type === t.value ? { backgroundColor: t.color } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Event Title *">
            <input type="text" placeholder="e.g. Weekly Mastermind Call" value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} required />
          </Field>

          <Field label="Description">
            <textarea rows={2} placeholder="What will happen at this event?" value={form.description} onChange={e => set('description', e.target.value)} className={textareaClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputClass} required />
            </Field>
            <Field label="Time">
              <input type="text" placeholder="e.g. 2:00 PM" value={form.time} onChange={e => set('time', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: community.color }}>
              Add Event
            </button>
          </div>
        </form>
      </ModalCard>
    </Overlay>
  )
}

// ─── Post Introduction ─────────────────────────────────────────────────────────

export function PostIntroModal({ communityId, community, onClose }) {
  const { members, addMember, addPost } = useApp()
  const [profile, setProfile] = useState({ name: '', email: '', title: '', bio: '' })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [content, setContent] = useState('')
  const [postImageUrl, setPostImageUrl] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const postImageRef = useRef()

  const communityMembers = members.filter(m => m.communityId === communityId)
  const setP = (k, v) => setProfile(prev => ({ ...prev, [k]: v }))

  const handlePostImageFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const dataUrl = await readFileAsDataURL(file)
    setPostImageUrl(dataUrl)
  }

  const handlePost = () => {
    if (!content.trim()) return
    let memberId = selectedMemberId
    if (!memberId && profile.name.trim()) {
      const m = addMember(communityId, { ...profile, avatarUrl })
      memberId = m.id
    }
    if (!memberId) return
    addPost(communityId, memberId, content, postImageUrl)
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard
        title="Introduce Yourself"
        subtitle={`Post your introduction in ${community.name}`}
        onClose={onClose}
      >
        <div className="space-y-4">
          {communityMembers.length > 0 && (
            <Field label="Post as">
              <select
                value={selectedMemberId || ''}
                onChange={e => setSelectedMemberId(e.target.value || null)}
                className={inputClass}
              >
                <option value="">+ Create new profile</option>
                {communityMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name} — {m.title}</option>
                ))}
              </select>
            </Field>
          )}

          {!selectedMemberId && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Profile</p>
              <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} size={72} />
              <Field label="Your Name *">
                <input type="text" placeholder="e.g. Alex Johnson" value={profile.name} onChange={e => setP('name', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Email">
                <input type="email" placeholder="e.g. alex@example.com" value={profile.email} onChange={e => setP('email', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Your Title / Role">
                <input type="text" placeholder="e.g. Marketing Manager, Yoga Teacher..." value={profile.title} onChange={e => setP('title', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Short Bio">
                <input type="text" placeholder="One sentence about what you do..." value={profile.bio} onChange={e => setP('bio', e.target.value)} className={inputClass} />
              </Field>
            </div>
          )}

          <Field label="Your Introduction *">
            <textarea
              rows={4}
              placeholder="Tell the community who you are, where you're from, what you do, and why you joined. Be yourself! 👋"
              value={content}
              onChange={e => setContent(e.target.value)}
              className={textareaClass}
            />
            <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
          </Field>

          {/* Post photo */}
          <div>
            <button
              type="button"
              onClick={() => postImageRef.current.click()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
            >
              <Image size={16} /> Add photo to post
            </button>
            <input ref={postImageRef} type="file" accept="image/*" className="hidden" onChange={handlePostImageFile} />
            {postImageUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden">
                <img src={postImageUrl} alt="post preview" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setPostImageUrl(null)}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              type="button"
              onClick={handlePost}
              disabled={!content.trim() || (!selectedMemberId && !profile.name.trim())}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: community.color }}
            >
              Post Introduction
            </button>
          </div>
        </div>
      </ModalCard>
    </Overlay>
  )
}

// ─── Add Member ────────────────────────────────────────────────────────────────

export function AddMemberModal({ communityId, community, onClose }) {
  const { addMember } = useApp()
  const [form, setForm] = useState({ name: '', email: '', title: '', bio: '' })
  const [avatarUrl, setAvatarUrl] = useState(null)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addMember(communityId, { ...form, avatarUrl })
    onClose()
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Add Member" subtitle={`Add to ${community.name}`} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AvatarUpload value={avatarUrl} onChange={setAvatarUrl} size={80} />
          <Field label="Full Name *">
            <input type="text" placeholder="e.g. Sarah Johnson" value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} required />
          </Field>
          <Field label="Email">
            <input type="email" placeholder="e.g. sarah@example.com" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Title / Role">
            <input type="text" placeholder="e.g. Marketing Manager, Coach..." value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Bio">
            <textarea rows={3} placeholder="A short bio about this member..." value={form.bio} onChange={e => set('bio', e.target.value)} className={textareaClass} />
          </Field>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: community.color }}>
              Add Member
            </button>
          </div>
        </form>
      </ModalCard>
    </Overlay>
  )
}
