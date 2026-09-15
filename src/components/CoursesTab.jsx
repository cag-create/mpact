import React, { useState } from 'react'
import { BookOpen, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, X, Play, GraduationCap } from 'lucide-react'
import { useApp } from '../App'
import ContentTab from './ContentTab'
import LessonPlayer from './LessonPlayer'

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

export default function CoursesTab({ communityId, community }) {
  const { courses, modules, lessons, progress, currentUser, addCourse, updateCourse, deleteCourse, reorderCourse } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const memberId = currentUser?.memberId || currentUser?.id
  const [mode, setMode] = useState({ view: 'list' })   // list | build | play
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [previewAsMember, setPreviewAsMember] = useState(false)

  const mine = courses.filter(c => c.communityId === communityId && (isAdmin || c.isPublished)).sort((a, b) => (a.order || 0) - (b.order || 0))
  const statsFor = (c) => {
    const mods = modules.filter(m => m.courseId === c.id)
    const less = lessons.filter(l => l.courseId === c.id && (isAdmin || l.isPublished))
    const done = less.filter(l => progress.some(p => p.memberId === memberId && p.lessonId === l.id)).length
    return { mods: mods.length, less: less.length, done, pct: less.length ? Math.round(done / less.length * 100) : 0 }
  }

  if (mode.view === 'build' && isAdmin) {
    const course = courses.find(c => c.id === mode.courseId)
    if (course) return <ContentTab communityId={communityId} community={community} course={course} onBack={() => setMode({ view: 'list' })} />
  }
  if (mode.view === 'play') {
    const course = courses.find(c => c.id === mode.courseId)
    if (course) return <LessonPlayer course={course} communityId={communityId} canEdit={isAdmin && !previewAsMember} onBack={() => setMode({ view: 'list' })} />
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Courses</h2>
          <p className="text-sm text-gray-500 mt-0.5">{mine.length} course{mine.length !== 1 ? 's' : ''}{isAdmin ? ' · drafts are hidden from members' : ''}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewAsMember(v => !v)} className={`px-3 py-2 rounded-xl text-xs font-medium border ${previewAsMember ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{previewAsMember ? 'Previewing as member' : 'Preview as member'}</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}><Plus size={15} /> New course</button>
          </div>
        )}
      </div>

      {mine.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><GraduationCap size={28} className="text-indigo-400" /></div>
          <h3 className="font-bold text-gray-700 mb-2">{isAdmin ? 'No courses yet' : 'Courses are on the way'}</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">{isAdmin ? 'Create a course, then add modules and lessons inside it. Publish it when it\'s ready for members.' : 'Chad is loading the first course now. Check back soon.'}</p>
          {isAdmin && <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: community.color }}>Create your first course</button>}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mine.map((c, i) => {
            const st = statsFor(c)
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="h-32 bg-gray-900 relative">
                  {c.coverUrl ? <img src={c.coverUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={30} className="text-white/30" /></div>}
                  {isAdmin && !previewAsMember && (
                    <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.isPublished ? 'bg-white text-gray-900' : 'bg-amber-400 text-amber-950'}`}>{c.isPublished ? 'Published' : 'Draft'}</span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900">{c.title}</h3>
                  {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
                  <p className="text-xs text-gray-400 mt-3">{st.mods} module{st.mods !== 1 ? 's' : ''} · {st.less} lesson{st.less !== 1 ? 's' : ''}</p>
                  {st.less > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${st.pct}%` }} /></div>
                      <p className="text-[11px] text-gray-400 mt-1">{st.pct}% complete</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-4">
                    <button onClick={() => setMode({ view: 'play', courseId: c.id })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"><Play size={14} /> {st.done > 0 && st.done < st.less ? 'Continue' : 'Start'}</button>
                    {isAdmin && !previewAsMember && (
                      <>
                        <button onClick={() => setMode({ view: 'build', courseId: c.id })} className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Build</button>
                        <button onClick={() => setEditing(c)} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-50" title="Edit"><Edit3 size={14} /></button>
                        <button disabled={i === 0} onClick={() => reorderCourse(communityId, c.id, 'up')} className="p-2 rounded-lg text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowUp size={13} /></button>
                        <button disabled={i === mine.length - 1} onClick={() => reorderCourse(communityId, c.id, 'down')} className="p-2 rounded-lg text-gray-300 hover:text-gray-600 disabled:opacity-20"><ArrowDown size={13} /></button>
                        <button onClick={() => { if (window.confirm(`Delete "${c.title}" and everything in it?`)) deleteCourse(c.id) }} className="p-2 rounded-lg text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </>
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
