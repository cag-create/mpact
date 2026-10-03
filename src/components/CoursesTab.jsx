import React, { useState } from 'react'
import { BookOpen, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, X, Play, GraduationCap, Lock } from 'lucide-react'
import { useApp } from '../App'
import ContentTab from './ContentTab'
import LessonPlayer from './LessonPlayer'
import { CommunityLogo } from './CreafiLogo'
import { moduleUnlocked } from '../lib/release'

function CourseModal({ course, onSave, onClose }) {
  const isNew = !course
  const [form, setForm] = useState({ title: course?.title || '', description: course?.description || '', coverUrl: course?.coverUrl || '', isPublished: course?.isPublished ?? false })
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'New course' : 'Edit course'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course title</label>
            <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Creative Finance: Structure the Deal" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What members will be able to do after this course" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover image link (optional)</label>
            <input value={form.coverUrl} onChange={e => setForm(p => ({ ...p, coverUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <button onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium ${form.isPublished ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
            {form.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}{form.isPublished ? 'Published — members can see it' : 'Draft — only admins can see it'}
          </button>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={() => form.title.trim() && onSave(form)} disabled={!form.title.trim()} className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">{isNew ? 'Create course' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

const CARD_GRADS = [
  { panel: 'linear-gradient(135deg,#7c3aed 0%,#d946ef 55%,#fb7185 100%)', bar: 'linear-gradient(90deg,#7c3aed,#d946ef)', solid: '#7c3aed', btn: 'linear-gradient(135deg,#7c3aed,#d946ef)' },
  { panel: 'linear-gradient(135deg,#0ea5e9 0%,#2563eb 55%,#1e3a8a 100%)', bar: 'linear-gradient(90deg,#0ea5e9,#2563eb)', solid: '#2563eb', btn: 'linear-gradient(135deg,#0ea5e9,#2563eb)' },
  { panel: 'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)', bar: 'linear-gradient(90deg,#f59e0b,#ef4444)', solid: '#ea580c', btn: 'linear-gradient(135deg,#f97316,#ef4444)' },
  { panel: 'linear-gradient(135deg,#10b981 0%,#14b8a6 55%,#0891b2 100%)', bar: 'linear-gradient(90deg,#10b981,#0891b2)', solid: '#0d9488', btn: 'linear-gradient(135deg,#10b981,#0891b2)' },
  { panel: 'linear-gradient(135deg,#ec4899 0%,#d946ef 55%,#8b5cf6 100%)', bar: 'linear-gradient(90deg,#ec4899,#8b5cf6)', solid: '#db2777', btn: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { panel: 'linear-gradient(135deg,#6366f1 0%,#3b82f6 55%,#06b6d4 100%)', bar: 'linear-gradient(90deg,#6366f1,#06b6d4)', solid: '#4f46e5', btn: 'linear-gradient(135deg,#6366f1,#06b6d4)' },
]
const DOTS = 'radial-gradient(rgba(255,255,255,0.22) 1.4px, transparent 1.5px)'

export default function CoursesTab({ communityId, community }) {
  const { courses, modules, lessons, progress, currentUser, members, addCourse, updateCourse, deleteCourse, updateModule } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const memberId = currentUser?.memberId || currentUser?.id
  const member = members?.find(m => m.id === memberId)
  const [mode, setMode] = useState({ view: 'list' })   // list | build | play
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [previewAsMember, setPreviewAsMember] = useState(false)

  const myCourses = courses.filter(c => c.communityId === communityId && (isAdmin || c.isPublished)).sort((a, b) => (a.order || 0) - (b.order || 0))
  // Capsules = the modules across the community's visible courses, in order.
  const capsules = myCourses.flatMap(c =>
    modules.filter(m => m.courseId === c.id && m.communityId === communityId && (isAdmin || m.isPublished !== false))
      .sort((a, b) => a.order - b.order)
      .map(m => ({ module: m, course: c }))
  )
  const lessonsIn = (m) => lessons.filter(l => l.moduleId === m.id && (isAdmin ? true : l.isPublished))
  const unlockedFor = (m) => (isAdmin && !previewAsMember) || m.alwaysOpen || moduleUnlocked(m, member)

  if (mode.view === 'build' && isAdmin) {
    const course = courses.find(c => c.id === mode.courseId)
    if (course) return <ContentTab communityId={communityId} community={community} course={course} onBack={() => setMode({ view: 'list' })} />
  }
  if (mode.view === 'play') {
    const course = courses.find(c => c.id === mode.courseId)
    if (course) return <LessonPlayer course={course} moduleId={mode.moduleId} communityId={communityId} canEdit={isAdmin && !previewAsMember} onBack={() => setMode({ view: 'list' })} />
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Capsules</h2>
          <p className="text-sm text-gray-500 mt-0.5">{capsules.length} capsule{capsules.length !== 1 ? 's' : ''}{isAdmin ? ' · locked capsules unlock as you release them' : ''}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewAsMember(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-medium border ${previewAsMember ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{previewAsMember ? 'Previewing as member' : 'Preview as member'}</button>
            {myCourses[0] && <button onClick={() => setMode({ view: 'build', courseId: myCourses[0].id })} className="px-3 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">Build</button>}
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}><Plus size={15} /> New course</button>
          </div>
        )}
      </div>

      {capsules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><GraduationCap size={28} className="text-indigo-400" /></div>
          <h3 className="font-bold text-gray-700 mb-2">{isAdmin ? 'No capsules yet' : 'Capsules are on the way'}</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">{isAdmin ? 'Create a course, then add modules (capsules) and lessons inside it. Publish it when it\'s ready for members.' : 'Chad is loading the training now. Check back soon.'}</p>
          {isAdmin && <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}>Create your first course</button>}
        </div>
      ) : (
        <div className="space-y-5">
          {capsules.map(({ module: m, course: c }, i) => {
            const g = CARD_GRADS[i % CARD_GRADS.length]
            const less = lessonsIn(m)
            const done = less.filter(l => progress.some(p => p.memberId === memberId && p.lessonId === l.id)).length
            const pct = less.length ? Math.round(done / less.length * 100) : 0
            const locked = !unlockedFor(m)
            return (
              <div key={m.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 sm:grid-cols-[240px_1fr] transition-shadow ${locked ? '' : 'hover:shadow-md'}`}>
                {/* Branded capsule panel */}
                <div className="relative flex flex-col justify-between p-5 min-h-[150px] text-white overflow-hidden" style={{ background: g.panel }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: DOTS, backgroundSize: '12px 12px', opacity: 0.6 }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <CommunityLogo community={community} size={20} />
                      <span className="font-grotesk font-bold text-[11px] uppercase tracking-wide opacity-95 truncate">{community.name}</span>
                    </div>
                    {locked && <Lock size={15} className="text-white/90 flex-shrink-0" />}
                  </div>
                  <div className="relative">
                    <p className="font-grotesk font-semibold text-[11px] tracking-[0.18em] uppercase opacity-90">Module {m.order - 1}</p>
                    <h3 className="font-display uppercase leading-[0.95] tracking-tight text-[20px] sm:text-[24px]" style={{ textShadow: '0 2px 10px rgba(0,0,0,.18)' }}>{m.title}</h3>
                  </div>
                </div>
                {/* Content */}
                <div className="p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-lg leading-tight" style={{ color: g.solid }}>{m.title}</h4>
                    {isAdmin && !previewAsMember && (
                      m.alwaysOpen
                        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 whitespace-nowrap flex-shrink-0">Always open</span>
                        : <button onClick={() => updateModule(m.id, { released: !(m.released === true) })} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0 ${m.released ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>{m.released ? 'Lock' : 'Release'}</button>
                    )}
                  </div>
                  {m.description && <p className="font-grotesk text-sm text-gray-500 mt-1.5 line-clamp-2 leading-snug">{m.description}</p>}
                  <p className="font-grotesk font-bold text-[11px] tracking-widest uppercase text-gray-400 mt-3">{less.length} lesson{less.length !== 1 ? 's' : ''}</p>
                  {less.length > 0 && !locked && (
                    <div className="mt-2"><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.bar }} /></div></div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4">
                    {locked ? (
                      <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-bold"><Lock size={14} /> Unlocks when released</span>
                    ) : (
                      <button onClick={() => setMode({ view: 'play', courseId: c.id, moduleId: m.id })} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold font-grotesk hover:opacity-90" style={{ background: g.btn }}><Play size={14} /> {done > 0 && done < less.length ? 'Continue' : 'View training'}</button>
                    )}
                    {isAdmin && !previewAsMember && (
                      <button onClick={() => setMode({ view: 'build', courseId: c.id })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Build</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <CourseModal onSave={(f) => { const c = addCourse(communityId, f); setShowAdd(false); setMode({ view: 'build', courseId: c.id }) }} onClose={() => setShowAdd(false)} />}
      {editing && <CourseModal course={editing} onSave={(f) => { updateCourse(editing.id, f); setEditing(null) }} onClose={() => setEditing(null)} />}
    </div>
  )
}
