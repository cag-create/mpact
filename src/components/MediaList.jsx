import React from 'react'
import { Image as ImageIcon, ChevronLeft, ChevronRight, Lock, Check, Play } from 'lucide-react'

// Shared SubTo-style media list: a thumbnail on the left, title + description in the
// middle, and a thin progress line on the right. Used for lessons inside a Capsule
// module and for replays in The Lab.

export function MediaRow({ thumb, title, description, meta, progress = null, locked = false, badge, accent = '#2563eb', onClick }) {
  const clickable = !!onClick && !locked
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={`w-full text-left grid grid-cols-[120px_1fr] sm:grid-cols-[232px_1fr_180px] gap-4 sm:gap-6 items-center py-5 px-2 sm:px-3 rounded-2xl transition-colors ${clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} ${locked ? 'opacity-60' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover" draggable={false} />
          : <ImageIcon size={26} className="text-gray-300" />}
        {badge && <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-black/70 text-white">{badge}</span>}
        {locked
          ? <span className="absolute inset-0 bg-black/30 flex items-center justify-center"><Lock size={20} className="text-white" /></span>
          : clickable && (
            <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/25">
              <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><Play size={16} className="text-gray-900 ml-0.5" /></span>
            </span>
          )}
      </div>

      {/* Title + description */}
      <div className="min-w-0 py-1">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-3">{description}</p>}
        {meta && <p className="text-xs text-gray-400 mt-2">{meta}</p>}
      </div>

      {/* Right-side progress line (hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-end gap-2">
        {progress !== null && progress >= 100 && <Check size={15} className="text-green-500 flex-shrink-0" />}
        <div className="w-full max-w-[150px] h-[3px] rounded-full bg-gray-200 overflow-hidden">
          {progress !== null && progress > 0 && <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress)}%`, background: accent }} />}
        </div>
      </div>
    </button>
  )
}

export function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 pt-6 pb-2 select-none">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronLeft size={22} /></button>
      <div className="flex items-center gap-4 sm:gap-6">
        {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => onPage(n)} className={`text-lg font-bold transition-colors ${n === page ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'}`}>{n}</button>
        ))}
      </div>
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ChevronRight size={22} /></button>
    </div>
  )
}

export const PAGE_SIZE = 10
