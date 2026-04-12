import React, { useMemo } from 'react'
import { useApp } from '../App'
import { Users, MessageSquare, Heart, TrendingUp, Star, Award } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl" style={{ backgroundColor: color + '15' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { communities, members, posts, events, enrollments, plans, educators } = useApp()

  const stats = useMemo(() => {
    const totalRevenue = enrollments.reduce((s, e) => s + (e.amount || 0), 0)
    const totalReactions = posts.reduce((s, p) => {
      const r = p.reactions || {}
      return s + Object.values(r).reduce((a, arr) => a + (arr?.length || 0), 0)
    }, 0)
    const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0)
    const avgPoints = members.length > 0
      ? Math.round(members.reduce((s, m) => s + (m.points || 0), 0) / members.length)
      : 0

    // Posts per community
    const postsByCommunity = communities.map(c => ({
      name: c.name, color: c.color,
      posts: posts.filter(p => p.communityId === c.id).length,
      members: members.filter(m => m.communityId === c.id).length,
      revenue: enrollments.filter(e => e.communityId === c.id).reduce((s,e) => s + (e.amount||0), 0),
    }))

    // Top members by points
    const topMembers = [...members].sort((a,b) => (b.points||0) - (a.points||0)).slice(0, 5)

    // Member growth (last 7 days rough buckets)
    const now = Date.now()
    const weekAgo = now - 7 * 86400000
    const newThisWeek = members.filter(m => new Date(m.joinedAt).getTime() > weekAgo).length

    // Engagement rate
    const engagementRate = posts.length > 0 ? Math.round(((totalReactions + totalComments) / posts.length) * 10) / 10 : 0

    return { totalRevenue, totalReactions, totalComments, avgPoints, postsByCommunity, topMembers, newThisWeek, engagementRate }
  }, [communities, members, posts, enrollments])

  const maxPosts   = Math.max(1, ...stats.postsByCommunity.map(c => c.posts))
  const maxMembers = Math.max(1, ...stats.postsByCommunity.map(c => c.members))

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide insights and community metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Members"      value={members.length}           sub={`+${stats.newThisWeek} this week`} color="#6366f1" />
        <StatCard icon={MessageSquare} label="Total Posts"       value={posts.length}             sub={`${stats.engagementRate} avg reactions` } color="#10b981" />
        <StatCard icon={Heart}         label="Total Reactions"   value={stats.totalReactions}     sub={`${stats.totalComments} comments`}         color="#ef4444" />
        <StatCard icon={TrendingUp}    label="Total Revenue"     value={`$${stats.totalRevenue}`} sub={`${enrollments.length} enrollments`}        color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts by community */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Posts by Community</h3>
          {stats.postsByCommunity.length === 0
            ? <p className="text-sm text-gray-400">No communities yet</p>
            : <div className="space-y-3">
                {stats.postsByCommunity.map(c => (
                  <MiniBar key={c.name} label={c.name} value={c.posts} max={maxPosts} color={c.color || '#6366f1'} />
                ))}
              </div>
          }
        </div>

        {/* Members by community */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4">Members by Community</h3>
          {stats.postsByCommunity.length === 0
            ? <p className="text-sm text-gray-400">No communities yet</p>
            : <div className="space-y-3">
                {stats.postsByCommunity.map(c => (
                  <MiniBar key={c.name} label={c.name} value={c.members} max={maxMembers} color="#6366f1" />
                ))}
              </div>
          }
        </div>

        {/* Top members leaderboard */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Top Members (Platform-wide)
          </h3>
          {stats.topMembers.length === 0
            ? <p className="text-sm text-gray-400">No members yet</p>
            : <div className="space-y-3">
                {stats.topMembers.map((m, i) => {
                  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣']
                  const community = communities.find(c => c.id === m.communityId)
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <span className="text-lg w-6">{medals[i]}</span>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: m.color || '#6366f1' }}>
                        {m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-400">{community?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">{m.points || 0} pts</p>
                        {(m.badges||[]).slice(0,1).map(b => (
                          <span key={b} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </div>

        {/* Revenue by community */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-500" /> Revenue by Community
          </h3>
          {stats.postsByCommunity.filter(c => c.revenue > 0).length === 0
            ? <p className="text-sm text-gray-400">No revenue recorded yet</p>
            : <div className="space-y-3">
                {stats.postsByCommunity.filter(c => c.revenue > 0).map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{c.name}</span>
                    <span className="text-sm font-bold text-gray-900">${c.revenue.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-sm font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
          }
        </div>
      </div>

      {/* Platform subscribers */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-base font-bold text-gray-900 mb-4">Platform Subscribers</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-indigo-50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-700">{educators.length}</p>
            <p className="text-xs text-indigo-500 mt-1">Total Educators</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{educators.filter(e=>e.status==='active').length}</p>
            <p className="text-xs text-green-500 mt-1">Active</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <p className="text-2xl font-bold text-amber-700">{educators.filter(e=>e.plan==='mpact').length}</p>
            <p className="text-xs text-amber-500 mt-1">Pro ($59)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
