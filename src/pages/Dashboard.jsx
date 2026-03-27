import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, MessageSquare, ArrowRight, Plus, Sparkles, Lock } from 'lucide-react'
import { useApp } from '../App'
import { CreateCommunityModal } from '../components/Modals'
import CreafiLogo from '../components/CreafiLogo'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: color + '15' }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

function CommunityCard({ community, memberCount, eventCount, postCount }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/community/${community.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Cover banner */}
      <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${community.color}dd, ${community.color}88)` }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute bottom-0 right-0 p-4 opacity-25 select-none">
          {community.id === 'creafi' ? <CreafiLogo size={52} /> : <span className="text-4xl">{community.emoji}</span>}
        </div>
        {/* Lock badge */}
        {community.isLocked && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Lock size={11} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Members Only</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="-mt-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border-2 border-white flex-shrink-0"
            style={{ backgroundColor: community.color + '22', borderColor: 'white' }}
          >
            {community.id === 'creafi'
              ? <CreafiLogo size={44} />
              : <span className="text-2xl">{community.emoji}</span>}
          </div>
          <div className="pt-1 min-w-0">
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-1" style={{ backgroundColor: community.color + '15', color: community.color }}>
              {community.category}
            </span>
            <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{community.name}</h3>
          </div>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{community.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {memberCount} members
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {eventCount} events
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare size={12} />
            {postCount} posts
          </span>
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors text-white group-hover:opacity-90" style={{ backgroundColor: community.color }}>
          Enter Community
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { communities, members, events, posts } = useApp()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  const totalMembers = members.length
  const totalEvents  = events.length
  const totalPosts   = posts.length

  const upcomingEvents = events
    .filter(e => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  const getCommunity = (id) => communities.find(c => c.id === id)

  const typeColors = { call: '#6366f1', workshop: '#f59e0b', challenge: '#10b981', other: '#6b7280' }
  const typeLabels = { call: 'Live Call', workshop: 'Workshop', challenge: 'Challenge', other: 'Event' }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your Mpact communities</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Community
          </button>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard icon={Sparkles} label="Total Communities" value={communities.length} color="#6366f1" />
          <StatCard icon={Users} label="Total Members" value={totalMembers} color="#10b981" />
          <StatCard icon={Calendar} label="Upcoming Events" value={totalEvents} color="#f59e0b" />
          <StatCard icon={MessageSquare} label="Introductions" value={totalPosts} color="#8b5cf6" />
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Communities */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Your Communities</h2>
              {communities.length > 0 && (
                <span className="text-sm text-gray-500">{communities.length} total</span>
              )}
            </div>

            {communities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">Create your first community</h3>
                <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">Bring your students, clients, or audience together in one beautiful space.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Create Community
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {communities.map(c => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    memberCount={members.filter(m => m.communityId === c.id).length}
                    eventCount={events.filter(e => e.communityId === c.id).length}
                    postCount={posts.filter(p => p.communityId === c.id).length}
                  />
                ))}
                <div
                  onClick={() => setShowCreate(true)}
                  className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Plus size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">Add Community</p>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5">Upcoming Events</h2>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-sm text-gray-400">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map(event => {
                  const community = getCommunity(event.communityId)
                  return (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/community/${event.communityId}/calendar`)}
                      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center flex-shrink-0">
                          <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: community?.color + '15' }}>
                            <span className="text-xs font-bold leading-none" style={{ color: community?.color }}>
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric' })}
                            </span>
                            <span className="text-xs leading-none" style={{ color: community?.color }}>
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{community?.name}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: typeColors[event.type] + '15', color: typeColors[event.type] }}>
                              {typeLabels[event.type]}
                            </span>
                            <span className="text-xs text-gray-400">{event.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
