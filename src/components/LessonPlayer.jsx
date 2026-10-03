import React, { useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Play, FileText, File, Link as LinkIcon, Circle, CheckCircle2, Lock } from 'lucide-react'
import { useApp } from '../App'
import { VideoEmbed } from '../lib/video.jsx'
import { moduleUnlocked } from '../lib/release'

const TYPE_ICON = { video: Play, text: FileText, pdf: File, link: LinkIcon }

// Member-facing course player: modules + lessons down the side, the lesson itself in the middle.
export default function LessonPlayer({ course, communityId, onBack, canEdit = false }) {
  const { modules, lessons, progress, currentUser, members, setLessonComplete } = useApp()
  const memberId = currentUser?.memberId || currentUser?.id
  const member = members?.find(m => m.id === memberId)

  const courseModules = useMemo(() => modules
    .filter(m => m.communityId === communityId && (m.courseId || null) === course.id && (canEdit || m.isPublished !== false))
    .sort((a, b) => a.order - b.order), [modules, communityId, course.id, canEdit])

  // Admin (canEdit) sees everything unlocked. For members, a module is unlocked only once released.
  const unlockedById = useMemo(() => {
    const out = {}
    for (const m of courseModules) out[m.id] = canEdit || moduleUnlocked(m, member)
    return out
  }, [courseModules, canEdit, member])

  const lessonsByModule = useMemo(() => {
    const out = {}
    for (const m of courseModules) {
      out[m.id] = unlockedById[m.id]
        ? lessons.filter(l => l.moduleId === m.id && (canEdit || l.isPublished)).sort((a, b) => a.order - b.order)
        : []   // locked module: contents are not accessible
    }
    return out
  }, [courseModules, lessons, canEdit, unlockedById])

  const flat = courseModules.flatMap(m => lessonsByModule[m.id] || [])
  const doneIds = new Set(progress.filter(p => p.memberId === memberId).map(p => p.lessonId))
  const firstUndone = flat.find(l => !doneIds.has(l.id)) || flat[0]
  const [currentId, setCurrentId] = useState(firstUndone?.id || null)
  const current = flat.find(l => l.id === currentId) || flat[0]
  const idx = flat.findIndex(l => l.id === current?.id)
  const pct = flat.length ? Math.round((flat.filter(l => doneIds.has(l.id)).length / flat.length) * 100) : 0

  const markDone = (done) => { if (current && memberId) setLessonComplete(memberId, current, done) }
  const goto = (i) => { if (flat[i]) { setCurrentId(flat[i].id); window.scrollTo({ top: 0, behavior: 'smooth' }) } }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-1"><ArrowLeft size={13} /> All courses</button>
          <h2 className="text-lg font-bold text-gray-900 truncate">{course.title}</h2>
          {course.description && <p className="text-sm text-gray-500 mt-0.5">{course.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-gray-900">{pct}%</p>
          <p className="text-xs text-gray-400">complete</p>
        </div>
      </div>

      {courseModules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">No modules in this course yet. Check back soon.</div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Lesson */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {current ? (
            <>
            {current?.type === 'video' && <VideoEmbed url={current.content} title={current.title} className="rounded-none" />}
            <div className="p-6">
              <p className="text-xs font-display uppercase tracking-wider text-fuchsia-600 mb-1">{courseModules.find(m => m.id === current?.moduleId)?.title}</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{current?.title}</h3>
              {current?.type === 'text' && <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">{current.content}</div>}
              {current?.type === 'pdf' && (
                <a href={current.content} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100"><File size={15} /> Open the PDF</a>
              )}
              {current?.type === 'link' && (
                <a href={current.content} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium hover:bg-green-100"><LinkIcon size={15} /> Open the resource</a>
              )}
              {current?.type === 'video' && current.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{current.notes}</p>}

              <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-gray-100">
                <button disabled={idx <= 0} onClick={() => goto(idx - 1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronLeft size={16} /> Previous</button>
                {doneIds.has(current?.id) ? (
                  <button onClick={() => markDone(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-semibold"><Check size={15} /> Completed</button>
                ) : (
                  <button onClick={() => markDone(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"><Check size={15} /> Mark complete</button>
                )}
                <button disabled={idx >= flat.length - 1} onClick={() => { if (!doneIds.has(current?.id)) markDone(true); goto(idx + 1) }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30">Next <ChevronRight size={16} /></button>
              </div>
            </div>
            </>
            ) : (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><Lock size={24} className="text-gray-400" /></div>
              <h3 className="font-bold text-gray-700 mb-1">Your next modules are on the way</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">The open modules have no lessons yet, or your next module hasn't been released. Check the outline — locked modules unlock as they're released.</p>
            </div>
            )}
          </div>

          {/* Outline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-4">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} /></div>
              <p className="text-xs text-gray-400 mt-2">{flat.filter(l => doneIds.has(l.id)).length} of {flat.length} lessons done</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {courseModules.map(m => {
                const locked = !unlockedById[m.id]
                return (
                  <div key={m.id} className={locked ? 'opacity-50 select-none' : ''}>
                    <p className="px-4 pt-3 pb-1 text-[11px] font-display uppercase tracking-wider text-fuchsia-600 flex items-center gap-1.5">
                      <span className="truncate">{m.title}</span>
                      {locked && <Lock size={11} className="text-gray-400 flex-shrink-0" />}
                    </p>
                    {locked ? (
                      <div className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        <Lock size={14} className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">Unlocks when released</span>
                      </div>
                    ) : (
                      (lessonsByModule[m.id] || []).map(l => {
                        const Icon = TYPE_ICON[l.type] || Play
                        const active = l.id === current?.id, done = doneIds.has(l.id)
                        return (
                          <button key={l.id} onClick={() => setCurrentId(l.id)} className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                            {done ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" /> : <Circle size={15} className="text-gray-300 flex-shrink-0" />}
                            <span className="truncate flex-1">{l.title}</span>
                            <Icon size={12} className="text-gray-300 flex-shrink-0" />
                          </button>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
