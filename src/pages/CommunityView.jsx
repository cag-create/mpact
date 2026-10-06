import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, Calendar, MessageSquare, Heart, ChevronLeft, ChevronRight,
  Plus, Trash2, Clock, ArrowLeft, CreditCard, Check, Loader2, BookOpen,
  DollarSign, Lock, Eye, EyeOff, Link, Copy, CheckCheck, Pencil, Trophy, Shield, Video, ShoppingBag,
  User, Camera, MessageCircle, LayoutDashboard, BarChart2, KeyRound, LogOut } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, getDay, isToday
} from 'date-fns'
import { useApp } from '../App'
import { occursOn, upcomingOccurrences, timeLabel, RECUR_LABEL } from '../lib/events'
import { AddEventModal, PostIntroModal, AddMemberModal } from '../components/Modals'
import CoursesTab from '../components/CoursesTab'
import ReplaysTab from '../components/ReplaysTab'
import PaymentsTab from '../components/PaymentsTab'
import MerchTab, { MerchLocked } from '../components/MerchTab'
import { MpactMIcon, MpactWordmark, ChangePasswordModal, downscaleImage } from '../components/Sidebar'
import { CommunityLogo } from '../components/CreafiLogo'

const HERO_DOTS = 'radial-gradient(rgba(255,255,255,0.18) 1.2px, transparent 1.3px)'

// Top-nav profile menu: avatar (photo or silhouette) -> dropdown with photo/admin/sign-out.
function ProfileMenu() {
  const { currentUser, members, logout, changePassword, setMemberAvatar } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const photoRef = useRef(null)
  const me = members.find(m => m.id === currentUser?.memberId)
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const go = (path) => { setOpen(false); navigate(path) }
  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
      <Icon size={15} className="flex-shrink-0" /> {label}
    </button>
  )
  return (
    <div className="relative flex-shrink-0">
      <input ref={photoRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f && me) downscaleImage(f, 256, url => setMemberAvatar(me.id, url)); e.target.value = '' }} />
      <button onClick={() => setOpen(o => !o)} className="w-9 h-9 rounded-full overflow-hidden bg-white/15 ring-2 ring-white/25 flex items-center justify-center hover:ring-white/40 transition-all">
        {me?.avatarUrl ? <img src={me.avatarUrl} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-white" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 py-2">
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
              <p className="text-xs text-gray-400">{isAdmin ? 'Platform Admin' : 'Member'}</p>
            </div>
            {me && <Item icon={Camera} label={me.avatarUrl ? 'Change photo' : 'Add photo'} onClick={() => { setOpen(false); photoRef.current?.click() }} />}
            <Item icon={MessageCircle} label="Messages" onClick={() => go('/messages')} />
            {isAdmin && (
              <>
                <div className="my-1 border-t border-gray-50" />
                <Item icon={LayoutDashboard} label="Dashboard" onClick={() => go('/dashboard')} />
                <Item icon={Shield} label="Admin Panel" onClick={() => go('/admin')} />
                <Item icon={BarChart2} label="Analytics" onClick={() => go('/analytics')} />
              </>
            )}
            <div className="my-1 border-t border-gray-50" />
            <Item icon={KeyRound} label="Change password" onClick={() => { setOpen(false); setShowPw(true) }} />
            <Item icon={LogOut} label="Sign out" onClick={logout} danger />
          </div>
        </>
      )}
      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} changePassword={changePassword} userId={currentUser?.id} />}
    </div>
  )
}

// ─── Shared Helpers ────────────────────────────────────────────────────────────

function Initials({ name, color, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-14 h-14 text-lg' }
  const parts = (name || '').split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : (name?.[0] || '?')
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 uppercase`} style={{ backgroundColor: color + '30', color }}>
      {initials}
    </div>
  )
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return format(date, 'MMM d, yyyy')
}

// ─── Feed Tab ──────────────────────────────────────────────────────────────────

const REACTIONS = [
  { key: 'love',      emoji: '❤️',  label: 'Love'      },
  { key: 'celebrate', emoji: '🎉',  label: 'Celebrate' },
  { key: 'clap',      emoji: '👏',  label: 'Great Job' },
  { key: 'fire',      emoji: '🔥',  label: 'Amazing'   },
  { key: 'star',      emoji: '⭐',  label: 'Star'      },
]

function MemberAvatar({ member }) {
  if (member?.avatarUrl) {
    return <img src={member.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt={member.name} />
  }
  return <Initials name={member?.name} color={member?.color} size="lg" />
}

function PostCard({ post, members, allMembers, me, onReact, onComment }) {
  const member = members.find(m => m.id === post.memberId)
    || (post.memberId === me?.id ? me : null)
    || (post.authorName ? { name: post.authorName, avatarUrl: post.authorAvatar } : null)
    || { name: 'Member' }
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  const reactions = post.reactions || {}
  const totalReactions = Object.values(reactions).reduce((s, arr) => s + (arr?.length || 0), 0)
  const reactionSummary = REACTIONS.filter(r => (reactions[r.key]?.length || 0) > 0)

  const handleComment = () => {
    if (!commentText.trim() || !me) return
    onComment(post.id, me.id, commentText.trim(), me)
    setCommentText('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Post header */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <MemberAvatar member={member} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900 text-sm">{member.name}</span>
              {member.title && <span className="text-xs text-gray-400 ml-2">{member.title}</span>}
            </div>
            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">Introduction</span>
        </div>
      </div>

      {/* Post content */}
      <div className="px-5 pb-3">
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="post" className="mt-3 rounded-xl w-full object-cover max-h-80" />
        )}
      </div>

      {/* Reaction summary */}
      {totalReactions > 0 && (
        <div className="px-5 pb-2 flex items-center gap-1.5">
          {reactionSummary.map(r => (
            <span key={r.key} className="text-sm">{r.emoji}</span>
          ))}
          <span className="text-xs text-gray-400">{totalReactions}</span>
        </div>
      )}

      {/* Reaction bar */}
      <div className="px-5 py-2 border-t border-gray-50 flex items-center gap-1 flex-wrap">
        {REACTIONS.map(r => {
          const active = reactions[r.key]?.includes('me')
          return (
            <button
              key={r.key}
              onClick={() => onReact(post.id, r.key)}
              title={r.label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                active
                  ? 'bg-indigo-50 text-indigo-700 scale-110'
                  : 'text-gray-500 hover:bg-gray-50 hover:scale-105'
              }`}
            >
              <span className="text-base leading-none">{r.emoji}</span>
              {(reactions[r.key]?.length || 0) > 0 && (
                <span className={active ? 'text-indigo-600' : 'text-gray-400'}>
                  {reactions[r.key].length}
                </span>
              )}
            </button>
          )
        })}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 ml-auto"
        >
          <MessageSquare size={13} />
          {(post.comments?.length || 0) > 0
            ? `${post.comments.length} comment${post.comments.length > 1 ? 's' : ''}`
            : 'Comment'}
        </button>
      </div>

      {/* Comments */}
      {(showComments || (post.comments?.length || 0) > 0) && (
        <div className="px-5 pb-4 border-t border-gray-50">
          {/* Existing comments */}
          {(post.comments || []).map(comment => {
            const commenter = allMembers.find(m => m.id === comment.memberId)
              || (comment.memberId === me?.id ? me : null)
              || (comment.authorName ? { name: comment.authorName, avatarUrl: comment.authorAvatar } : null)
              || { name: 'Member' }
            return (
              <div key={comment.id} className="flex items-start gap-2.5 mt-3">
                <MemberAvatar member={commenter} />
                <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                  <span className="text-xs font-semibold text-gray-800">{commenter?.name || 'Member'}</span>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                </div>
              </div>
            )
          })}
          {/* Add comment */}
          <div className="flex items-center gap-2.5 mt-3">
            <MemberAvatar member={me} />
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleComment())}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              {commentText.trim() && (
                <button onClick={handleComment} className="text-indigo-600 text-xs font-bold hover:text-indigo-700">
                  Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedTab({ communityId, community }) {
  const { members, posts, reactToPost, addComment, currentUser } = useApp()
  const [showPost, setShowPost] = useState(false)

  const communityMembers = members.filter(m => m.communityId === communityId)
  // Who the viewer actually is — their member record, or (for an admin with no member
  // profile here) an identity derived from their account. Used so comments are attributed
  // to the real author, not the first member in the list.
  const meMember = members.find(m => m.id === currentUser?.memberId)
  const me = meMember || (currentUser ? { id: currentUser.id, name: currentUser.name || 'You', avatarUrl: null, role: currentUser.role, communityId } : null)
  const communityPosts   = posts.filter(p => p.communityId === communityId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post CTA */}
      <div
        onClick={() => setShowPost(true)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} className="text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm flex-1">Share something with the community...</p>
        <button
          onClick={e => { e.stopPropagation(); setShowPost(true) }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white flex-shrink-0 transition-colors hover:opacity-90"
          style={{ backgroundColor: community.color || '#18181b' }}
        >
          Post
        </button>
      </div>

      {communityPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">👋</div>
          <h3 className="font-semibold text-gray-700 mb-2">Be the first to introduce yourself!</h3>
          <p className="text-sm text-gray-400">Share who you are, what you do, and why you joined this community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {communityPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              members={communityMembers}
              allMembers={members}
              me={me}
              onReact={reactToPost}
              onComment={addComment}
            />
          ))}
        </div>
      )}

      {showPost && <PostIntroModal communityId={communityId} community={community} onClose={() => setShowPost(false)} />}
    </div>
  )
}

// ─── Calendar Tab ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  call:      { label: 'Live Call',  color: '#6366f1', bg: '#6366f115' },
  workshop:  { label: 'Workshop',   color: '#f59e0b', bg: '#f59e0b15' },
  challenge: { label: 'Challenge',  color: '#10b981', bg: '#10b98115' },
  other:     { label: 'Event',      color: '#6b7280', bg: '#6b728015' },
}

function CalendarTab({ communityId, community }) {
  const { events, deleteEvent, currentUser } = useApp()
  const isAdmin = ['platform_admin', 'admin', 'owner'].includes(currentUser?.role)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const communityEvents = events.filter(e => e.communityId === communityId)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = getDay(monthStart)

  const getEventsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return communityEvents.filter(e => occursOn(e, dateStr))
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const upcomingEvents = upcomingOccurrences(communityEvents, format(new Date(), 'yyyy-MM-dd'))

  // Edit the stored series (not the expanded occurrence, whose date is an instance date).
  const openEdit = (ev) => { setEditingEvent(communityEvents.find(e => e.id === ev.id) || ev); setShowAddEvent(true) }
  const openAdd  = () => { setEditingEvent(null); setShowAddEvent(true) }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setCurrentMonth(new Date(2026, 2, 1))} className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  Today
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const dayEvents = getEventsForDay(day)
                const today = isToday(day)
                const selected = selectedDay && isSameDay(day, selectedDay)
                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={`min-h-[72px] rounded-xl p-1.5 cursor-pointer transition-all border ${
                      selected ? 'border-indigo-300 bg-indigo-50' : today ? 'border-indigo-100 bg-indigo-50/50' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto ${
                      today ? 'bg-indigo-600 text-white' : 'text-gray-600'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(event => {
                        const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                        return (
                          <div key={event.id} className="text-xs rounded px-1 py-0.5 truncate font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {event.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          {selectedDay && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-4">
              <h4 className="font-semibold text-gray-800 mb-4">{format(selectedDay, 'EEEE, MMMM d')}</h4>
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-3">No events on this day</p>
                  {isAdmin && (
                    <button onClick={openAdd} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      + Add Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(event => {
                    const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: cfg.bg }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                            {event.recur && event.recur !== 'none' && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-900/5 text-gray-500">↻ {RECUR_LABEL[event.recur]}</span>}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                          {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={11} />{timeLabel(event)}</p>
                          {event.liveUrl && (
                            <a href={event.liveUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                              🎥 Join Live Session
                            </a>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {confirmDel === event.id ? (
                              <>
                                <button onClick={() => { deleteEvent(event.id); setConfirmDel(null) }} className="text-xs font-bold text-red-500 hover:text-red-600 px-1">Delete</button>
                                <button onClick={() => setConfirmDel(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => openEdit(event)} className="text-gray-300 hover:text-indigo-500 transition-colors"><Pencil size={13} /></button>
                                <button onClick={() => setConfirmDel(event.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: upcoming + add */}
        <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
          {isAdmin && (
            <button
              onClick={openAdd}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: community.color }}
            >
              <Plus size={16} />
              Add Event
            </button>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-800 mb-4">Upcoming Events</h4>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                  const date = new Date(event.date + 'T00:00:00')
                  return (
                    <div key={event.id + event.date} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                        <span className="text-xs font-bold leading-none" style={{ color: cfg.color }}>{format(date, 'd')}</span>
                        <span className="text-xs leading-none" style={{ color: cfg.color }}>{format(date, 'MMM')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">{timeLabel(event)}</p>
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}{event.recur && event.recur !== 'none' ? ` · ${RECUR_LABEL[event.recur]}` : ''}</span>
                        {event.liveUrl && (
                          <a href={event.liveUrl} target="_blank" rel="noopener noreferrer"
                            className="block mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                            🎥 Join Live →
                          </a>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => openEdit(event)} className="text-gray-200 hover:text-indigo-500 transition-colors flex-shrink-0 mt-1">
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-800 mb-3">Event Types</h4>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="text-sm text-gray-600">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddEvent && isAdmin && (
        <AddEventModal
          communityId={communityId}
          community={community}
          event={editingEvent}
          defaultDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''}
          onClose={() => { setShowAddEvent(false); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}

// ─── Members Tab ───────────────────────────────────────────────────────────────

function MemberCard({ member, joinedAt }) {
  const parts = (member.name || '').split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : (member.name?.[0] || '?')
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 uppercase"
          style={{ backgroundColor: member.color + '25', color: member.color }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 leading-tight">{member.name}</p>
          <p className="text-sm text-gray-400">{member.title}</p>
          <p className="text-xs text-gray-300 mt-0.5">Joined {new Date(joinedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
      {member.bio && <p className="text-sm text-gray-500 leading-relaxed">{member.bio}</p>}
    </div>
  )
}

const ROLE_COLORS = { owner: '#8b5cf6', admin: '#ef4444', moderator: '#f59e0b', member: '#6b7280' }

function MembersTab({ communityId, community }) {
  const { members, currentUser, updateMemberRole } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch]   = useState('')

  const isPlatformAdmin = currentUser?.role === 'platform_admin'

  const communityMembers = members
    .filter(m => m.communityId === communityId)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.title||'').toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <input type="text" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)}
          className="pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-64" />
        {isPlatformAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: community.color }}>
            <Plus size={15} /> Add Member
          </button>
        )}
      </div>

      {communityMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-semibold text-gray-700 mb-2">No members yet</h3>
          <p className="text-sm text-gray-400 mb-5">Add your first member to get the community started.</p>
          {isPlatformAdmin && (
            <button onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
              style={{ backgroundColor: community.color }}>
              Add Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {communityMembers.map(member => (
            <div key={member.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <MemberCard member={member} joinedAt={member.joinedAt} />
              {/* Role + points row */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield size={11} style={{ color: ROLE_COLORS[member.role] || '#6b7280' }} />
                  {isPlatformAdmin ? (
                    <select value={member.role || 'member'} onChange={e => updateMemberRole(member.id, e.target.value)}
                      className="text-xs border-0 bg-transparent font-medium focus:outline-none cursor-pointer"
                      style={{ color: ROLE_COLORS[member.role] || '#6b7280' }}>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium capitalize" style={{ color: ROLE_COLORS[member.role] || '#6b7280' }}>
                      {member.role || 'member'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-indigo-600">{member.points || 0} pts</span>
              </div>
              {(member.badges||[]).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {member.badges.slice(0,3).map(b => (
                    <span key={b} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100">{b}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddMemberModal communityId={communityId} community={community} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

// ─── Leaderboard Tab ───────────────────────────────────────────────────────────

function LeaderboardTab({ communityId, community }) {
  const { members, posts, useNavigate: nav } = useApp()
  const navigate = useNavigate()
  const communityMembers = [...members.filter(m => m.communityId === communityId)]
    .sort((a,b) => (b.points||0) - (a.points||0))

  const medals = ['🥇','🥈','🥉']
  const podiumColors = ['#F59E0B','#9CA3AF','#CD7C2F']

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-900">Community Leaderboard</h2>
        <p className="text-sm text-gray-500 mt-1">Earn points by posting, commenting, and getting reactions</p>
      </div>

      {/* Point guide */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[['📝 Post','10 pts'],['💬 Comment','5 pts'],['❤️ Reaction received','2 pts']].map(([a,b]) => (
          <div key={a} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-sm font-semibold text-gray-700">{a}</p>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">{b}</p>
          </div>
        ))}
      </div>

      {communityMembers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No members yet — be the first to earn points!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {communityMembers.map((member, i) => {
            const myPosts = posts.filter(p => p.memberId === member.id).length
            return (
              <div key={member.id}
                className={`flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border transition-all ${
                  i === 0 ? 'border-amber-200 bg-amber-50/30' : i === 1 ? 'border-gray-200' : i === 2 ? 'border-orange-100' : 'border-gray-100'
                }`}>
                <span className="text-2xl w-8 text-center">{medals[i] || `${i+1}`}</span>
                {member.avatarUrl
                  ? <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                  : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: member.color || '#6366f1' }}>
                      {member.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                      style={{ backgroundColor: ROLE_COLORS[member.role]+'20', color: ROLE_COLORS[member.role] }}>
                      {member.role || 'member'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{myPosts} posts</span>
                    {(member.badges||[]).slice(0,2).map(b => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-indigo-600">{member.points || 0}</p>
                  <p className="text-[10px] text-gray-400">points</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Lock Screen ───────────────────────────────────────────────────────────────

function LockScreen({ community, plans, onClose }) {
  const communityPlans = plans.filter(p => p.communityId === community.id && p.isActive)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const handleJoin = async (plan) => {
    setLoading(plan.id)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: plan.name, price: plan.price, interval: plan.interval, communityId: community.id, communityName: community.name }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setError(data.error || 'Something went wrong.') }
    } catch { setError('Could not connect to payment server.') }
    finally { setLoading(null) }
  }

  const intervalLabel = (i) => i === 'month' ? '/mo' : i === 'year' ? '/yr' : ' one-time'

  return (
    <div className="fixed inset-0 z-30 flex flex-col overflow-auto" style={{ background: `linear-gradient(160deg, ${community.color}ee 0%, ${community.color}55 50%, #111827 100%)` }}>
      {/* Close (admin only) */}
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 flex items-center gap-1.5 text-white/70 hover:text-white text-sm bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-lg transition-colors">
          <EyeOff size={13} /> Exit Preview
        </button>
      )}

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8 text-center">
        {/* Logo: custom (Mpact tier) or Mpact M (base) */}
        {community.lockedScreenLogo ? (
          <img src={community.lockedScreenLogo} alt="logo" className="w-24 h-24 rounded-2xl object-cover mb-6 shadow-2xl" />
        ) : (
          <div className="mb-6">
            <MpactMIcon size={72} />
          </div>
        )}

        <div className="w-14 h-14 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center mb-4">
          <Lock size={24} className="text-white" />
        </div>

        <h1 className="text-3xl font-black text-white mb-2">{community.name}</h1>
        <p className="text-white/70 max-w-md text-sm leading-relaxed mb-2">{community.description}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/60 bg-black/20 px-3 py-1 rounded-full">
          <Lock size={10} /> Members Only
        </span>
      </div>

      {/* Plans */}
      <div className="bg-white rounded-t-3xl px-8 py-8">
        <h2 className="text-xl font-black text-gray-900 text-center mb-6">Join {community.name}</h2>
        {communityPlans.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No plans available yet.</p>
        ) : (
          <div className={`grid gap-4 max-w-2xl mx-auto ${communityPlans.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2'}`}>
            {communityPlans.map((plan, idx) => {
              const isPopular   = communityPlans.length > 1 && idx === 0
              const isLoading   = loading === plan.id
              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 p-5 ${isPopular ? 'border-violet-400 shadow-lg shadow-violet-100' : 'border-gray-100'}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-3xl font-black text-gray-900">${plan.price}</span>
                    <span className="text-gray-400 text-sm">{intervalLabel(plan.interval)}</span>
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleJoin(plan)}
                    disabled={!!loading}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    style={{ background: isPopular ? 'linear-gradient(90deg, #8B2FE0, #2575E8)' : community.color }}
                  >
                    {isLoading ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><CreditCard size={14} /> Join Now</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
        {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

        {/* Powered by Mpact */}
        <div className="flex items-center justify-center gap-2 mt-8 opacity-50">
          <span className="text-xs text-gray-400">Powered by</span>
          <MpactWordmark fontSize={13} />
        </div>
      </div>
    </div>
  )
}

// ─── Pricing Tab ───────────────────────────────────────────────────────────────

function PricingTab({ communityId, community }) {
  const { plans } = useApp()
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  const communityPlans = plans.filter(p => p.communityId === communityId && p.isActive)

  const handleSubscribe = async (plan) => {
    setLoading(plan.id)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price,
          interval: plan.interval,
          communityId,
          communityName: community.name,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Could not connect to payment server.')
    } finally {
      setLoading(null)
    }
  }

  const intervalLabel = (interval) => {
    if (interval === 'month') return '/month'
    if (interval === 'year') return '/year'
    return ' one-time'
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join {community.name}</h2>
        <p className="text-gray-500">Choose a plan and get instant access to the community</p>
      </div>

      {communityPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">💳</div>
          <p className="text-gray-400">No plans available yet.</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${communityPlans.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : communityPlans.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {communityPlans.map((plan, idx) => {
            const isPopular = communityPlans.length > 1 && idx === communityPlans.length - 2
            const isLoading = loading === plan.id
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 shadow-sm p-6 flex flex-col relative ${isPopular ? 'border-indigo-400 shadow-indigo-100' : 'border-gray-100'}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-400 text-sm">{intervalLabel(plan.interval)}</span>
                </div>

                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {error && loading === null && (
                  <p className="text-xs text-red-500 mb-3 text-center">{error}</p>
                )}

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={!!loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isPopular ? '#6366f1' : community.color }}
                >
                  {isLoading ? (
                    <><Loader2 size={15} className="animate-spin" /> Processing...</>
                  ) : (
                    <><CreditCard size={15} /> Get Started</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center mt-6">{error}</p>
      )}
    </div>
  )
}

// ─── Community View ─────────────────────────────────────────────────────────────

// Affiliates tab (admin-only): who's owed, who's still on a plan, and Mark-paid.
// Payout is gated — a referral only becomes payable once the referred member has PAID IN FULL (cleared).
function AffiliatesTab({ communityId, community }) {
  const token = () => { try { return JSON.parse(localStorage.getItem('hub_session') || '{}').token || '' } catch { return '' } }
  const [stats, setStats] = React.useState(null)
  const [refs, setRefs] = React.useState(null)
  const [busy, setBusy] = React.useState('')
  const loadStats = React.useCallback(() => fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.ok ? r.json() : null).then(setStats).catch(() => {}), [])
  const load = React.useCallback(() => { loadStats(); fetch('/api/admin/referrals', { headers: { Authorization: `Bearer ${token()}` } }).then(r => r.ok ? r.json() : { referrals: [] }).then(d => setRefs(d.referrals || [])).catch(() => setRefs([])) }, [loadStats])
  React.useEffect(load, [load])
  const money = n => '$' + Number(n || 0).toLocaleString()
  const mark = async (id, next) => {
    setBusy(id)
    try {
      await fetch(`/api/admin/referrals/${id}/paid`, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ status: next }) })
      setRefs(rs => rs.map(r => r.id === id ? { ...r, status: next, paid_at: next === 'paid' ? new Date().toISOString() : null } : r))
      loadStats()
    } finally { setBusy('') }
  }
  const Tile = ({ label, value, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><p className="text-xs text-gray-500 font-medium mb-1">{label}</p><p className="text-2xl font-black" style={{ color: color || '#111827' }}>{value}</p></div>
  )
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-900">Affiliates</h2>
        <p className="text-sm text-gray-500 mt-1">$75 per referral · paid by Zelle or a mailed check · a fee becomes payable only once that member has <strong>paid in full</strong>.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Members" value={stats ? stats.userCount : '—'} />
        <Tile label={`Ready to pay${stats ? ` (${stats.readyCount})` : ''}`} value={stats ? money(stats.readyAmount) : '—'} color="#10b981" />
        <Tile label={`On a plan${stats ? ` (${stats.pendingCount})` : ''}`} value={stats ? money(stats.pendingAmount) : '—'} color="#f59e0b" />
        <Tile label="Total owed" value={stats ? money(stats.owedAmount) : '—'} color="#6b7280" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Referral ledger</h3>
          <button onClick={load} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>
        {!refs ? <p className="text-sm text-gray-400">Loading…</p> : refs.length === 0 ? <p className="text-sm text-gray-400">No referrals yet. Share the affiliate links and they'll show up here.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 text-xs uppercase tracking-wider"><th className="pb-2 pr-4">Affiliate</th><th className="pb-2 pr-4">Referred</th><th className="pb-2 pr-4">Amount</th><th className="pb-2 pr-4">Plan</th><th className="pb-2 pr-4">Status</th><th className="pb-2"></th></tr></thead>
            <tbody>
              {refs.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4"><div className="font-semibold text-gray-900">{r.affiliate_name || r.affiliate_handle}</div><div className="text-xs text-gray-400">{r.affiliate_email || ''}</div></td>
                  <td className="py-2 pr-4"><div className="text-gray-900">{r.referred_name || r.referred_email}</div><div className="text-xs text-gray-400">{r.referred_email}</div></td>
                  <td className="py-2 pr-4 font-semibold">{money(r.amount)}</td>
                  <td className="py-2 pr-4 text-xs text-gray-600">{(r.installments_total || 1) > 1 ? `4-pay · ${r.installments_paid || 1}/${r.installments_total}` : 'Paid in full'}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : (r.cleared ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500')}`}>{r.status === 'paid' ? 'Paid' : (r.cleared ? 'Ready' : 'On plan')}</span></td>
                  <td className="py-2 text-right">
                    {r.status === 'paid'
                      ? <button disabled={busy === r.id} onClick={() => mark(r.id, 'owed')} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Undo</button>
                      : r.cleared
                        ? <button disabled={busy === r.id} onClick={() => mark(r.id, 'paid')} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg disabled:opacity-50">Mark paid</button>
                        : <span className="text-xs text-gray-400" title="Payable once the member has paid in full">Not due yet</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'feed',        label: "Genius's Feed",  icon: MessageSquare },
  { id: 'calendar',   label: 'Live Calls',     icon: Calendar },
  { id: 'members',    label: "Crea'fi G's",    icon: Users },
  { id: 'leaderboard',label: 'Champions',      icon: Trophy },
  { id: 'content',    label: 'Capsules',       icon: BookOpen },
  { id: 'replays',    label: 'The Lab',        icon: Video },
  { id: 'payments',   label: 'Payments',       icon: DollarSign },
  { id: 'affiliates', label: 'Affiliates',     icon: Link },
  { id: 'merch',      label: 'Merch',          icon: ShoppingBag },
]

// Tabs only the owner/admins may open (revenue, payouts). Hidden from the nav AND
// unreachable by direct URL for members.
const ADMIN_ONLY_TABS = ['payments', 'affiliates']

export default function CommunityView() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const { communities, members, events, posts, plans, deleteCommunity, updateCommunity, currentUser } = useApp()
  const [activeTab, setActiveTab] = useState(tab || 'feed')
  const [previewLock, setPreviewLock] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingSlug, setEditingSlug] = useState(null) // null | 'slug' | 'domain'
  const [slugDraft, setSlugDraft] = useState('')

  const community = communities.find(c => c.id === id)

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Community not found</h2>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const memberCount = members.filter(m => m.communityId === id).length
  const eventCount  = events.filter(e => e.communityId === id).length
  const postCount   = posts.filter(p => p.communityId === id).length

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    navigate(`/community/${id}/${tabId}`, { replace: true })
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${community.name}"? This cannot be undone.`)) {
      deleteCommunity(id)
      navigate('/dashboard')
    }
  }

  const isAdmin = currentUser?.role === 'platform_admin' || currentUser?.role === 'admin' || currentUser?.role === 'owner'
  // Members never land on an admin-only tab (e.g. a shared /payments link) — bounce them to the feed.
  React.useEffect(() => {
    if (ADMIN_ONLY_TABS.includes(activeTab) && !isAdmin) {
      setActiveTab('feed')
      navigate(`/community/${id}/feed`, { replace: true })
    }
  }, [activeTab, isAdmin, id])
  const loginUrl = community.loginUrl || `${window.location.origin}/login`
  const joinUrl = community.joinUrl || `${window.location.origin}/join/${community.slug || community.id}`

  const copyText = (text, which) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(which); setTimeout(() => setCopied(false), 2000) })
  }
  const handleSaveJoinUrl = () => {
    const v = slugDraft.trim()
    updateCommunity(id, { joinUrl: v ? (/^https?:\/\//.test(v) ? v : `https://${v}`) : null })
    setEditingSlug(false)
  }

  const navBg = community.color || '#18181b'
  const heroGrad = `linear-gradient(120deg, ${navBg} 0%, #4c1d95 50%, #7c3aed 100%)`
  const visibleTabs = TABS.filter(t => !ADMIN_ONLY_TABS.includes(t.id) || isAdmin)
  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0]

  return (
    <div className="min-h-screen" style={{ background: '#f3f1fb' }}>
      {/* Top nav — logo, tabs, profile */}
      <header className="sticky top-0 z-30 shadow-md" style={{ background: navBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => handleTabChange('feed')} className="flex items-center gap-2.5 flex-shrink-0">
            <CommunityLogo community={community} size={36} className="rounded-xl" />
            <span className="text-white font-extrabold text-lg tracking-tight hidden md:block">{community.name}</span>
          </button>
          <nav className="flex-1 flex items-center gap-0.5 overflow-x-auto px-1" style={{ scrollbarWidth: 'none' }}>
            {visibleTabs.map(t => {
              const Icon = t.icon
              const active = activeTab === t.id
              const locked = t.id === 'merch' && !isAdmin   // members see Merch but it's locked
              return (
                <button key={t.id} onClick={() => handleTabChange(t.id)} title={locked ? 'Locked — coming soon' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                  <Icon size={15} /> {t.label}
                  {locked && <Lock size={12} className="opacity-80" />}
                </button>
              )
            })}
          </nav>
          <ProfileMenu />
        </div>
      </header>

      {/* Colored hero band with the tab title */}
      <div className="relative overflow-hidden" style={{ background: heroGrad }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: HERO_DOTS, backgroundSize: '16px 16px', opacity: 0.5 }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <h1 className="font-display uppercase text-white tracking-tight leading-none text-4xl sm:text-6xl" style={{ textShadow: '0 2px 14px rgba(0,0,0,.25)' }}>{currentTab.label}</h1>
              {activeTab === 'feed' && community.description && <p className="text-white/80 mt-3 max-w-2xl text-sm sm:text-base">{community.description}</p>}
            </div>
            <div className="flex items-center gap-6 text-center flex-shrink-0">
              {[['Members', memberCount], ['Events', eventCount], ['Posts', postCount]].map(([l, v]) => (
                <div key={l}><p className="text-2xl font-bold text-white">{v}</p><p className="text-[11px] text-white/60 uppercase tracking-wide">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'feed'        && <FeedTab        communityId={id} community={community} />}
        {activeTab === 'calendar'   && <CalendarTab    communityId={id} community={community} />}
        {activeTab === 'members'    && <MembersTab     communityId={id} community={community} />}
        {activeTab === 'leaderboard'&& <LeaderboardTab communityId={id} community={community} />}
        {activeTab === 'content'    && <CoursesTab     communityId={id} community={community} />}
        {activeTab === 'replays'    && <ReplaysTab     communityId={id} community={community} />}
        {activeTab === 'payments'   && isAdmin && <PaymentsTab    communityId={id} community={community} />}
        {activeTab === 'affiliates' && isAdmin && <AffiliatesTab  communityId={id} community={community} />}
        {activeTab === 'merch'      && (isAdmin ? <MerchTab communityId={id} community={community} /> : <MerchLocked community={community} />)}
      </div>

      {previewLock && (
        <LockScreen community={community} plans={plans} onClose={() => setPreviewLock(false)} />
      )}
    </div>
  )
}
