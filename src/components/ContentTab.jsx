import React, { useState, useRef } from 'react'
import {
  BookOpen, Play, FileText, File, Link as LinkIcon, Plus, Trash2,
  ChevronDown, ChevronRight, Eye, EyeOff, ArrowUp, ArrowDown,
  Edit3, Check, X, Video, Lock, Unlock, Youtube
} from 'lucide-react'
import { useApp } from '../App'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getYouTubeId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

const TYPE_META = {
  video: { icon: Play,      label: 'Video',    color: '#ef4444', bg: '#fef2f2' },
  text:  { icon: FileText,  label: 'Text',     color: '#6366f1', bg: '#eef2ff' },
  pdf:   { icon: File,      label: 'PDF',      color: '#f59e0b', bg: '#fffbeb' },
  link:  { icon: LinkIcon,  label: 'Link',     color: '#10b981', bg: '#f0fdf4' },
}

// ─── Lesson Editor Modal ──────────────────────────────────────────────────────

function LessonModal({ lesson, moduleId, communityId, onSave, onClose }) {
  const isNew = !lesson
  const [form, setForm] = useState({
    title:         lesson?.title         || '',
    type:          lesson?.type          || 'video',
    content:       lesson?.content       || '',
    duration:      lesson?.duration      || '',
    isFreePreview: lesson?.isFreePreview || false,
    isPublished:   lesson?.isPublished   || false,
  })
  const fileRef = useRef()

  const thumb = form.type === 'video' ? getYouTubeThumbnail(form.content) : null
  const ytId  = form.type === 'video' ? getYouTubeId(form.content) : null

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setForm(p => ({ ...p, content: f.name }))
  }

  const canSave = form.title.trim()

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Add Lesson' : 'Edit Lesson'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Title</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Introduction to SEO"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Content Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => {
                const Icon = meta.icon
                return (
                  <button
                    key={key}
                    onClick={() => setForm(p => ({ ...p, type: key, content: '' }))}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-medium ${
                      form.type === key ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon size={18} style={{ color: form.type === key ? '#6366f1' : meta.color }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content input */}
          {form.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Video URL (YouTube or direct link)</label>
              <input
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {thumb && (
                <div className="mt-2 relative rounded-xl overflow-hidden bg-black aspect-video">
                  <img src={thumb} alt="thumbnail" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={`https://www.youtube.com/watch?v=${ytId}`}
                      target="_blank" rel="noreferrer"
                      className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      onClick={e => e.stopPropagation()}
                    >
                      <Play size={20} className="text-white ml-1" fill="white" />
                    </a>
                  </div>
                </div>
              )}
              {form.content && !thumb && (
                <p className="text-xs text-gray-400 mt-1.5">Direct video URL saved. Preview available on member side.</p>
              )}
            </div>
          )}

          {form.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lesson Content</label>
              <textarea
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Write your lesson content here..."
                rows={6}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
          )}

          {form.type === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">PDF File</label>
              {form.content ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <File size={18} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-amber-800 flex-1 truncate">{form.content}</span>
                  <button onClick={() => setForm(p => ({ ...p, content: '' }))} className="text-amber-400 hover:text-amber-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                >
                  <File size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Click to upload PDF</p>
                  <p className="text-xs text-gray-400 mt-1">PDF files up to 100MB</p>
                </button>
              )}
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            </div>
          )}

          {form.type === 'link' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource URL</label>
              <input
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                placeholder="https://docs.google.com/..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {/* Duration */}
          {(form.type === 'video' || form.type === 'text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {form.type === 'video' ? 'Duration (e.g. 12:34)' : 'Read time (e.g. 5 min)'}
              </label>
              <input
                value={form.duration}
                onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                placeholder={form.type === 'video' ? '0:00' : '5 min'}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-3">
            <button
              onClick={() => setForm(p => ({ ...p, isFreePreview: !p.isFreePreview }))}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.isFreePreview ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              {form.isFreePreview ? <Unlock size={14} /> : <Lock size={14} />}
              {form.isFreePreview ? 'Free Preview' : 'Members Only'}
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, isPublished: !p.isPublished }))}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                form.isPublished ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              {form.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
              {form.isPublished ? 'Published' : 'Draft'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {isNew ? 'Add Lesson' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Module Modal ──────────────────────────────────────────────────────────────

function ModuleModal({ module, onSave, onClose }) {
  const isNew = !module
  const [form, setForm] = useState({ title: module?.title || '', description: module?.description || '' })

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isNew ? 'Add Module' : 'Edit Module'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Module Title</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. SEO Fundamentals"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optional)</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of this module"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40"
          >
            {isNew ? 'Add Module' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({ lesson, onEdit, onDelete }) {
  const meta = TYPE_META[lesson.type] || TYPE_META.video
  const Icon = meta.icon
  const thumb = lesson.type === 'video' ? getYouTubeThumbnail(lesson.content) : null

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 hover:bg-gray-50 rounded-xl group transition-colors">
      {/* Type icon */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: meta.bg }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>

      {/* Thumbnail for video */}
      {thumb && (
        <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${lesson.isPublished ? 'text-gray-800' : 'text-gray-400'}`}>
          {lesson.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color: meta.color }}>{meta.label}</span>
          {lesson.duration && <span className="text-xs text-gray-400">· {lesson.duration}</span>}
          {lesson.isFreePreview && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Free Preview</span>
          )}
        </div>
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
        lesson.isPublished ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {lesson.isPublished ? 'Live' : 'Draft'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(lesson)} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-indigo-600 transition-colors">
          <Edit3 size={13} />
        </button>
        <button onClick={() => onDelete(lesson.id)} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Module Row ───────────────────────────────────────────────────────────────

function ModuleRow({ module, lessons, isFirst, isLast, communityId, onReorder, onEditModule, onDeleteModule }) {
  const { addLesson, updateLesson, deleteLesson } = useApp()
  const [expanded, setExpanded] = useState(true)
  const [editingLesson, setEditingLesson] = useState(null)
  const [addingLesson, setAddingLesson] = useState(false)

  const moduleLessons = lessons
    .filter(l => l.moduleId === module.id)
    .sort((a, b) => a.order - b.order)

  const handleAddLesson = (form) => {
    addLesson(module.id, communityId, form)
    setAddingLesson(false)
  }

  const handleEditLesson = (form) => {
    updateLesson(editingLesson.id, form)
    setEditingLesson(null)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Module header */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{module.order}</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{module.title}</p>
            {module.description && (
              <p className="text-xs text-gray-400 mt-0.5">{module.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              module.isPublished ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {module.isPublished ? 'Live' : 'Draft'}
            </span>
          </div>

          {/* Reorder + actions */}
          <div className="flex items-center gap-0.5 ml-2" onClick={e => e.stopPropagation()}>
            <button disabled={isFirst} onClick={() => onReorder(module.id, 'up')} className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
              <ArrowUp size={13} />
            </button>
            <button disabled={isLast} onClick={() => onReorder(module.id, 'down')} className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
              <ArrowDown size={13} />
            </button>
            <button onClick={() => onEditModule(module)} className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-indigo-500 transition-colors">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onDeleteModule(module.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>

          <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`} />
        </div>

        {/* Lessons */}
        {expanded && (
          <div className="border-t border-gray-50">
            {moduleLessons.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No lessons yet</p>
            )}
            {moduleLessons.map(lesson => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onEdit={setEditingLesson}
                onDelete={(id) => {
                  if (window.confirm('Delete this lesson?')) deleteLesson(id)
                }}
              />
            ))}
            <div className="px-4 py-3 border-t border-gray-50">
              <button
                onClick={() => setAddingLesson(true)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                <Plus size={14} />
                Add Lesson
              </button>
            </div>
          </div>
        )}
      </div>

      {addingLesson && (
        <LessonModal moduleId={module.id} communityId={communityId} onSave={handleAddLesson} onClose={() => setAddingLesson(false)} />
      )}
      {editingLesson && (
        <LessonModal lesson={editingLesson} moduleId={module.id} communityId={communityId} onSave={handleEditLesson} onClose={() => setEditingLesson(null)} />
      )}
    </>
  )
}

// ─── Content Tab ──────────────────────────────────────────────────────────────

export default function ContentTab({ communityId, community }) {
  const { modules, lessons, addModule, updateModule, deleteModule, reorderModule } = useApp()
  const [showAddModule, setShowAddModule] = useState(false)
  const [editingModule, setEditingModule] = useState(null)

  const communityModules = modules
    .filter(m => m.communityId === communityId)
    .sort((a, b) => a.order - b.order)

  const communityLessons = lessons.filter(l => l.communityId === communityId)

  const totalPublished = communityLessons.filter(l => l.isPublished).length
  const totalDraft     = communityLessons.length - totalPublished

  const handleAddModule = (form) => {
    addModule(communityId, form)
    setShowAddModule(false)
  }

  const handleEditModule = (form) => {
    updateModule(editingModule.id, form)
    setEditingModule(null)
  }

  const handleDeleteModule = (id) => {
    const count = communityLessons.filter(l => l.moduleId === id).length
    if (window.confirm(`Delete this module${count > 0 ? ` and its ${count} lesson${count !== 1 ? 's' : ''}` : ''}? This cannot be undone.`)) {
      deleteModule(id)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Course Content</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {communityModules.length} modules · {communityLessons.length} lessons
            {totalDraft > 0 && <span className="text-amber-500"> · {totalDraft} draft</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddModule(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: community.color }}
        >
          <Plus size={15} />
          Add Module
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Modules',   value: communityModules.length, color: '#6366f1' },
          { label: 'Lessons',   value: communityLessons.length, color: '#10b981' },
          { label: 'Published', value: totalPublished,          color: '#3b82f6' },
          { label: 'Draft',     value: totalDraft,              color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Modules */}
      {communityModules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-bold text-gray-700 mb-2">No modules yet</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">
            Build your course curriculum by creating modules with video lessons, text, PDFs, and resource links.
          </p>
          <button
            onClick={() => setShowAddModule(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: community.color }}
          >
            Add Your First Module
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {communityModules.map((module, idx) => (
            <ModuleRow
              key={module.id}
              module={module}
              lessons={communityLessons}
              isFirst={idx === 0}
              isLast={idx === communityModules.length - 1}
              communityId={communityId}
              onReorder={(id, dir) => reorderModule(communityId, id, dir)}
              onEditModule={setEditingModule}
              onDeleteModule={handleDeleteModule}
            />
          ))}
        </div>
      )}

      {showAddModule && (
        <ModuleModal onSave={handleAddModule} onClose={() => setShowAddModule(false)} />
      )}
      {editingModule && (
        <ModuleModal module={editingModule} onSave={handleEditModule} onClose={() => setEditingModule(null)} />
      )}
    </div>
  )
}
