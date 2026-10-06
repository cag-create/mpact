import React, { useMemo, useState, useRef, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, File, Link as LinkIcon, Lock } from 'lucide-react'
import { useApp } from '../App'
import { VideoEmbed, getYouTubeThumbnail } from '../lib/video.jsx'
import { moduleUnlocked } from '../lib/release'
import { MediaRow, Pager, PAGE_SIZE } from './MediaList'

const INTRO_URL = 'https://creafigenius.com/assets/creafi-intro.mp4'  // branded pre-roll before every lesson video

const TYPE_LABEL = { video: 'Video', text: 'Lesson', pdf: 'PDF', link: 'Resource' }

// Member-facing course player.
// Default view = the lessons inside the module as a clean list (thumbnail + title +
// description + progress line). Clicking a lesson opens the player for it.
export default function LessonPlayer({ course, communityId, onBack, canEdit = false, moduleId = null }) {
  const { modules, lessons, progress, currentUser, members, setLessonComplete } = useApp()
  const memberId = currentUser?.memberId || currentUser?.id
  const member = members?.find(m => m.id === memberId)

  const courseModules = useMemo(() => modules
    .filter(m => m.communityId === communityId && (m.courseId || null) === course.id && (canEdit || m.isPublished !== false) && (!moduleId || m.id === moduleId))
    .sort((a, b) => a.order - b.order), [modules, communityId, course.id, canEdit, moduleId])

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

  const [playingId, setPlayingId] = useState(null)
  const current = flat.find(l => l.id === playingId) || null
  const idx = flat.findIndex(l => l.id === current?.id)

  // Pagination for the lesson list (single module usually, but supports more).
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(flat.length / PAGE_SIZE))
  useEffect(() => { setPage(1) }, [moduleId, course.id])

  // Branded intro pre-roll: plays before a video lesson (members), then rolls the lesson video.
  const introRef = useRef(null)
  const [introDone, setIntroDone] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  useEffect(() => {
    if (current && !canEdit && current.type === 'video') {
      setIntroDone(false); setShowSkip(false)
      const t = setTimeout(() => setShowSkip(true), 4000)
      return () => clearTimeout(t)
    }
    setIntroDone(true)
  }, [current?.id, current?.type, canEdit])
  useEffect(() => {
    if (current && !introDone && introRef.current) {
      const v = introRef.current
      v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    }
  }, [introDone, current?.id])

  const markDone = (done) => { if (current && memberId) setLessonComplete(memberId, current, done) }
  const goto = (i) => { if (flat[i]) { setPlayingId(flat[i].id); window.scrollTo({ top: 0, behavior: 'smooth' }) } }

  const totalPct = flat.length ? Math.round((flat.filter(l => doneIds.has(l.id)).length / flat.length) * 100) : 0
  const accent = '#2563eb'

  // ── Player view (one lesson open) ────────────────────────────────────────────
  if (current) {
    return (
      <div>
        <button onClick={() => setPlayingId(null)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-3"><ArrowLeft size={13} /> All lessons</button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl">
          {current.type === 'video' && (!introDone ? (
            <div className="relative w-full aspect-video bg-black">
              <video ref={introRef} src={INTRO_URL} autoPlay playsInline onEnded={() => setIntroDone(true)} className="w-full h-full object-contain bg-black" />
              {showSkip && <button onClick={() => setIntroDone(true)} className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors">Skip intro ▸</button>}
            </div>
          ) : (
            <VideoEmbed url={current.content} title={current.title} className="rounded-none" autoPlay={!canEdit} />
          ))}
          <div className="p-6">
            <p className="text-xs font-display uppercase tracking-wider text-fuchsia-600 mb-1">{courseModules.find(m => m.id === current.moduleId)?.title}</p>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h3>
            {current.type === 'text' && <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">{current.content}</div>}
            {current.type === 'pdf' && (
              <a href={current.content} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium hover:bg-amber-100"><File size={15} /> Open the PDF</a>
            )}
            {current.type === 'link' && (
              <a href={current.content} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium hover:bg-green-100"><LinkIcon size={15} /> Open the resource</a>
            )}
            {current.type === 'video' && current.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{current.notes}</p>}

            <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-gray-100">
              <button disabled={idx <= 0} onClick={() => goto(idx - 1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronLeft size={16} /> Previous</button>
              {doneIds.has(current.id) ? (
                <button onClick={() => markDone(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-semibold"><Check size={15} /> Completed</button>
              ) : (
                <button onClick={() => markDone(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"><Check size={15} /> Mark complete</button>
              )}
              <button disabled={idx >= flat.length - 1} onClick={() => { if (!doneIds.has(current.id)) markDone(true); goto(idx + 1) }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 disabled:opacity-30">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── List view (lessons inside the module) ────────────────────────────────────
  const soleModule = courseModules.length === 1 ? courseModules[0] : null
  const pageLessons = flat.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-1"><ArrowLeft size={13} /> All capsules</button>
          <h2 className="text-xl font-bold text-gray-900 truncate">{soleModule ? soleModule.title : course.title}</h2>
          {soleModule?.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{soleModule.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-gray-900">{flat.length}</p>
          <p className="text-xs text-gray-400">lesson{flat.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {flat.length > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${totalPct}%`, background: accent }} /></div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{totalPct}% complete</span>
        </div>
      )}

      {flat.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center mt-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><Lock size={24} className="text-gray-400" /></div>
          <h3 className="font-bold text-gray-700 mb-1">No lessons here yet</h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">This module has no lessons yet, or your next module hasn't been released. Check back soon.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 px-2 sm:px-4 py-2 mt-2">
          {pageLessons.map(l => {
            const done = doneIds.has(l.id)
            const desc = l.type === 'text' ? (l.content || '').slice(0, 180) : (l.notes || '')
            const metaBits = [TYPE_LABEL[l.type] || 'Lesson', l.duration].filter(Boolean)
            return (
              <MediaRow
                key={l.id}
                thumb={l.type === 'video' ? getYouTubeThumbnail(l.content) : null}
                badge={l.type === 'video' ? l.duration : null}
                title={l.title}
                description={desc}
                meta={metaBits.join(' · ')}
                progress={done ? 100 : 0}
                accent={accent}
                onClick={() => { setPlayingId(l.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            )
          })}
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  )
}
