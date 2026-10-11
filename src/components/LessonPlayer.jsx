import React, { useMemo, useState, useRef, useEffect } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, File, Link as LinkIcon, Lock, Play, ListChecks, BookOpen } from 'lucide-react'
import { useApp } from '../App'
import { VideoEmbed, getYouTubeThumbnail } from '../lib/video.jsx'
import { moduleUnlocked } from '../lib/release'
import { moduleGradient } from '../lib/courseTheme'
import { MediaRow, Pager, PAGE_SIZE } from './MediaList'

const TYPE_ICON = { video: Play, quiz: ListChecks, pdf: File, link: LinkIcon, text: BookOpen }
import LessonBody from './LessonBody'
import Quiz from './Quiz'

const INTRO_URL = '/creafi-intro.mp4'  // branded disclaimer intro, served same-origin from the app's public/ dir

const TYPE_LABEL = { video: 'Video', text: 'Lesson', pdf: 'PDF', link: 'Resource', quiz: 'Quiz' }

// Rich lessons store their body as a JSON string: { blocks:[...] } or { quiz:{...} }.
// Plain-text lessons store a plain string. parseRich returns the object or null.
function parseRich(s) {
  if (typeof s !== 'string' || s.charAt(0) !== '{') return null
  try { const o = JSON.parse(s); return (o && (o.blocks || o.quiz)) ? o : null } catch { return null }
}

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

  // Branded disclaimer intro: plays once when a member opens a module, then opens the course.
  const introRef = useRef(null)
  const introKey = 'creafi_intro_' + (moduleId || course.id)
  const [showIntro, setShowIntro] = useState(() => {
    try { return sessionStorage.getItem(introKey) !== '1' } catch { return true }  // once per module per session (everyone)
  })
  const [introSkippable, setIntroSkippable] = useState(false)
  const [introMuted, setIntroMuted] = useState(false)  // true only if the browser blocked sound and we fell back to muted
  const dismissIntro = () => { try { sessionStorage.setItem(introKey, '1') } catch {}; setShowIntro(false) }
  const unmuteIntro = () => { const v = introRef.current; if (!v) return; v.muted = false; setIntroMuted(false); v.play().catch(() => {}) }
  useEffect(() => {
    if (!showIntro) return
    const t = setTimeout(() => setIntroSkippable(true), 5000)
    const v = introRef.current
    if (v) {
      v.muted = false
      // Try to play with sound. If the browser blocks audio autoplay, fall back to muted so the video still runs,
      // and surface a "tap for sound" button so the voiceover can be turned on with one click.
      v.play().catch(() => { v.muted = true; setIntroMuted(true); v.play().catch(() => {}) })
    }
    return () => clearTimeout(t)
  }, [showIntro])

  const markDone = (done) => { if (current && memberId) setLessonComplete(memberId, current, done) }
  const goto = (i) => { if (flat[i]) { setPlayingId(flat[i].id); window.scrollTo({ top: 0, behavior: 'smooth' }) } }

  const totalPct = flat.length ? Math.round((flat.filter(l => doneIds.has(l.id)).length / flat.length) * 100) : 0
  const accent = '#2563eb'

  // ── Disclaimer intro (members): plays once when you open a module, then opens the course ──
  if (showIntro && flat.length > 0) {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-3"><ArrowLeft size={13} /> All capsules</button>
        <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-sm">
          <video ref={introRef} src={INTRO_URL} autoPlay playsInline preload="auto" onEnded={dismissIntro} onClick={introMuted ? unmuteIntro : (e => e.currentTarget.paused && e.currentTarget.play())} className="w-full h-full object-contain bg-black cursor-pointer" />
          {introMuted && <button onClick={unmuteIntro} className="absolute inset-x-0 top-4 mx-auto w-max px-4 py-2 rounded-full bg-white/20 hover:bg-white/35 text-white text-sm font-semibold backdrop-blur-sm transition-colors animate-pulse">🔊 Tap for sound</button>}
          {introSkippable && <button onClick={dismissIntro} className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition-colors">Skip ▸</button>}
        </div>
      </div>
    )
  }

  // ── Player view (one lesson open) ────────────────────────────────────────────
  if (current) {
    const rich = parseRich(current.content)
    const videoSrc = current.type === 'video' ? current.content : current.videoUrl  // any lesson can carry a video (Loom/YouTube/…)
    return (
      <div>
        <button onClick={() => setPlayingId(null)} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 mb-3"><ArrowLeft size={13} /> All lessons</button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-w-4xl">
          {videoSrc && <VideoEmbed url={videoSrc} title={current.title} className="rounded-none" autoPlay={!canEdit} />}
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-grotesk font-bold uppercase tracking-widest text-fuchsia-600 mb-1.5">{courseModules.find(m => m.id === current.moduleId)?.title}</p>
            <h3 className="text-2xl font-grotesk font-bold tracking-tight text-gray-900 mb-5">{current.title}</h3>
            {current.type === 'quiz' && rich?.quiz && (
              <Quiz quiz={rich.quiz} onComplete={(passed) => { if (passed) markDone(true) }} />
            )}
            {current.type === 'text' && (rich?.blocks
              ? <LessonBody blocks={rich.blocks} />
              : <div className="max-w-2xl text-gray-700 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>{current.content}</div>)}
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
              ) : current.type === 'quiz' ? (
                <span className="text-xs text-gray-400">Pass the quiz to complete</span>
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
            const desc = l.summary || (l.type === 'text' && !parseRich(l.content) ? (l.content || '').slice(0, 180) : (l.notes || ''))
            const metaBits = [TYPE_LABEL[l.type] || 'Lesson', l.duration].filter(Boolean)
            return (
              <MediaRow
                key={l.id}
                thumb={getYouTubeThumbnail(l.type === 'video' ? l.content : l.videoUrl)}
                gradient={moduleGradient(courseModules.find(m => m.id === l.moduleId))}
                icon={(l.type === 'video' || l.videoUrl) ? Play : (TYPE_ICON[l.type] || BookOpen)}
                badge={l.duration || null}
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
