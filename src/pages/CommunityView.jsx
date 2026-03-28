import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, Calendar, MessageSquare, Heart, ChevronLeft, ChevronRight,
  Plus, Trash2, Clock, ArrowLeft, CreditCard, Check, Loader2, BookOpen,
  DollarSign, Lock, Eye, EyeOff, Link, Copy, CheckCheck, Pencil
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, getDay, isToday
} from 'date-fns'
import { useApp, getCommunityUrl, getBaseDomain } from '../App'
import { AddEventModal, PostIntroModal, AddMemberModal } from '../components/Modals'
import ContentTab from '../components/ContentTab'
import PaymentsTab from '../components/PaymentsTab'
import { MpactMIcon, MpactWordmark } from '../components/Sidebar'
import CreafiLogo from '../components/CreafiLogo'

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

function PostCard({ post, members, allMembers, onReact, onComment }) {
  const member = members.find(m => m.id === post.memberId)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  if (!member) return null

  const reactions = post.reactions || {}
  const totalReactions = Object.values(reactions).reduce((s, arr) => s + (arr?.length || 0), 0)
  const reactionSummary = REACTIONS.filter(r => (reactions[r.key]?.length || 0) > 0)

  const handleComment = () => {
    if (!commentText.trim()) return
    // Post as first member or 'me' placeholder
    const meId = members[0]?.id || 'me'
    onComment(post.id, meId, commentText.trim())
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
            const commenter = allMembers.find(m => m.id === comment.memberId) || members[0]
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
            <MemberAvatar member={members[0]} />
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
  const { members, posts, reactToPost, addComment } = useApp()
  const [showPost, setShowPost] = useState(false)

  const communityMembers = members.filter(m => m.communityId === communityId)
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
  const { events, addEvent, deleteEvent } = useApp()
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1))
  const [selectedDay, setSelectedDay] = useState(null)
  const [showAddEvent, setShowAddEvent] = useState(false)

  const communityEvents = events.filter(e => e.communityId === communityId)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = getDay(monthStart)

  const getEventsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return communityEvents.filter(e => e.date === dateStr)
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const upcomingEvents = communityEvents
    .filter(e => e.date >= format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <div className="flex gap-6">
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
                  <button onClick={() => setShowAddEvent(true)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    + Add Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(event => {
                    const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: cfg.bg }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                          {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={11} />{event.time}</p>
                        </div>
                        <button onClick={() => deleteEvent(event.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: upcoming + add */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <button
            onClick={() => setShowAddEvent(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: community.color }}
          >
            <Plus size={16} />
            Add Event
          </button>

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
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                        <span className="text-xs font-bold leading-none" style={{ color: cfg.color }}>{format(date, 'd')}</span>
                        <span className="text-xs leading-none" style={{ color: cfg.color }}>{format(date, 'MMM')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">{event.time}</p>
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <button onClick={() => deleteEvent(event.id)} className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 mt-1">
                        <Trash2 size={13} />
                      </button>
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

      {showAddEvent && (
        <AddEventModal
          communityId={communityId}
          community={community}
          defaultDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : ''}
          onClose={() => setShowAddEvent(false)}
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

function MembersTab({ communityId, community }) {
  const { members } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const communityMembers = members
    .filter(m => m.communityId === communityId)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 bg-white w-64"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: community.color }}
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {communityMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-semibold text-gray-700 mb-2">No members yet</h3>
          <p className="text-sm text-gray-400 mb-5">Add your first member to get the community started.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: community.color }}
          >
            Add Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {communityMembers.map(member => (
            <MemberCard key={member.id} member={member} joinedAt={member.joinedAt} />
          ))}
        </div>
      )}

      {showAdd && <AddMemberModal communityId={communityId} community={community} onClose={() => setShowAdd(false)} />}
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

const TABS = [
  { id: 'feed',     label: 'Community Feed', icon: MessageSquare },
  { id: 'calendar', label: 'Live Training',  icon: Calendar },
  { id: 'members',  label: 'Members',        icon: Users },
  { id: 'content',  label: 'Content',        icon: BookOpen },
  { id: 'payments', label: 'Payments',       icon: DollarSign },
]

export default function CommunityView() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const { communities, members, events, posts, plans, deleteCommunity, educatorPlan, updateCommunitySlug } = useApp()
  const [activeTab, setActiveTab] = useState(tab || 'feed')
  const [previewLock, setPreviewLock] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')

  const community = communities.find(c => c.id === id)

  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Community not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
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
      navigate('/')
    }
  }

  const isPro = educatorPlan?.tier === 'mpact'
  const communityUrl = getCommunityUrl(community, isPro)

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(communityUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSaveSlug = () => {
    if (slugDraft.trim()) updateCommunitySlug(id, slugDraft.trim())
    setEditingSlug(false)
  }

  return (
    <div className="min-h-full">
      {/* Banner */}
      <div className="relative h-40" style={{ background: `linear-gradient(135deg, ${community.color}ee, ${community.color}88)` }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25% 50%, white 1.5px, transparent 1.5px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-lg">
            <ArrowLeft size={14} />
            Back
          </button>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {community.isLocked && (
            <button
              onClick={() => setPreviewLock(true)}
              title="Preview member lock screen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white text-xs font-medium transition-colors"
            >
              <Eye size={13} /> Preview Lock Page
            </button>
          )}
          <button onClick={handleDelete} className="p-2 rounded-lg bg-black/10 hover:bg-red-500/80 text-white/70 hover:text-white transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
        <div className="absolute bottom-0 right-8 opacity-20 select-none pb-2">
          {community.id === 'creafi' ? <CreafiLogo size={80} /> : <span className="text-7xl leading-none">{community.emoji}</span>}
        </div>
      </div>

      {/* Community info */}
      <div className="bg-white border-b border-gray-100 px-8 pb-0">
        {/* Icon overlaps banner; text row stays fully on white */}
        <div className="flex items-start gap-4">
          {/* Icon — negative margin pulls it up into the banner */}
          <div
            className="-mt-9 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: community.color + '20' }}
          >
            {community.id === 'creafi'
              ? <CreafiLogo size={38} />
              : <span className="text-3xl">{community.emoji}</span>}
          </div>
          {/* Text — pt-3 ensures it starts well inside the white section */}
          <div className="flex-1 min-w-0 pt-3 pb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: community.color + '20', color: community.color }}>
                {community.category}
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1">{community.description}</p>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-6 text-center pt-4 flex-shrink-0">
            <div>
              <p className="text-xl font-bold text-gray-900">{memberCount}</p>
              <p className="text-xs text-gray-400">Members</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{eventCount}</p>
              <p className="text-xs text-gray-400">Events</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{postCount}</p>
              <p className="text-xs text-gray-400">Posts</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Community URL Banner */}
      <div className="mx-8 mt-4 mb-2 rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-gray-400">
          <Link size={15} />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Your Community Link</span>
        </div>

        {isPro ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editingSlug ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {getBaseDomain ? '' : ''}https://
                </span>
                <input
                  autoFocus
                  value={slugDraft}
                  onChange={e => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveSlug(); if (e.key === 'Escape') setEditingSlug(false) }}
                  className="border border-indigo-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40"
                  placeholder={community.slug}
                />
                <span className="text-sm text-gray-500">.{communityUrl.split('/')[2].split('.').slice(1).join('.')}</span>
                <button onClick={handleSaveSlug} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg font-medium hover:bg-indigo-700">Save</button>
                <button onClick={() => setEditingSlug(false)} className="px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg font-medium hover:bg-gray-50">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-mono text-indigo-600 truncate">{communityUrl}</span>
                <button
                  onClick={() => { setSlugDraft(community.slug || ''); setEditingSlug(true) }}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors flex-shrink-0"
                  title="Edit subdomain"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-mono text-gray-700 truncate">{communityUrl}</span>
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 flex-shrink-0 whitespace-nowrap">
              ✦ Upgrade to Pro for custom subdomain
            </span>
          </div>
        )}

        <button
          onClick={handleCopyUrl}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            copied ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
          }`}
        >
          {copied ? <><CheckCheck size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-8">
        {activeTab === 'feed'     && <FeedTab     communityId={id} community={community} />}
        {activeTab === 'calendar' && <CalendarTab communityId={id} community={community} />}
        {activeTab === 'members'  && <MembersTab  communityId={id} community={community} />}
        {activeTab === 'content'  && <ContentTab  communityId={id} community={community} />}
        {activeTab === 'payments' && <PaymentsTab communityId={id} community={community} />}
      </div>

      {/* Lock Screen Preview */}
      {previewLock && (
        <LockScreen community={community} plans={plans} onClose={() => setPreviewLock(false)} />
      )}
    </div>
  )
}
