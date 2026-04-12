import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Plus, ChevronRight, Shield, Lock, MessageCircle, BarChart2, LogOut, User } from 'lucide-react'
import { useApp } from '../App'
import { CreateCommunityModal } from './Modals'
import CreafiLogo from './CreafiLogo'
import NotificationBell from './NotificationBell'

// ─── Mpact brand gradient ─────────────────────────────────────────────────────
const GRADIENT = 'linear-gradient(90deg, #8B2FE0 0%, #C03535 48%, #2575E8 100%)'

// The "M" icon — used in collapsed state and lock screens
export function MpactMIcon({ size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: GRADIENT,
        borderRadius: Math.round(size * 0.28),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{
        color: 'white',
        fontFamily: "'Nunito', 'Arial Black', sans-serif",
        fontWeight: 900,
        fontSize: Math.round(size * 0.6),
        lineHeight: 1,
        letterSpacing: '-1px',
        userSelect: 'none',
      }}>M</span>
    </div>
  )
}

// The full wordmark "Mpact" in gradient
export function MpactWordmark({ fontSize = 22 }) {
  return (
    <span style={{
      fontFamily: "'Nunito', 'Arial Rounded MT Bold', 'Arial Black', sans-serif",
      fontWeight: 900,
      fontSize,
      letterSpacing: '-0.5px',
      background: GRADIENT,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      lineHeight: 1,
      userSelect: 'none',
    }}>
      Mpact
    </span>
  )
}

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { communities, currentUser, logout, messages, members } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [collapsed, setCollapsed]   = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')
  const isPlatformAdmin = currentUser?.role === 'platform_admin'

  // Unread message count for current user's member
  const me = members.find(m => m.id === currentUser?.memberId)
  const unreadMessages = me ? messages.filter(msg => msg.toId === me.id && !msg.read).length : 0

  return (
    <>
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-950 flex flex-col h-full transition-all duration-300 flex-shrink-0 border-r border-white/5`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
          {!collapsed ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <MpactMIcon size={36} />
              <MpactWordmark fontSize={22} />
            </div>
          ) : (
            <div className="cursor-pointer mx-auto" onClick={() => navigate('/')}>
              <MpactMIcon size={36} />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded ml-auto">
              <ChevronRight size={15} />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="mx-auto mt-2 text-gray-600 hover:text-gray-400 transition-colors p-1">
            <ChevronRight size={15} className="rotate-180" />
          </button>
        )}

        {/* Nav */}
        <nav className="px-3 py-3 space-y-1 border-b border-white/5">
          {isPlatformAdmin && (
            <button onClick={() => navigate('/')} title={collapsed ? 'Dashboard' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${location.pathname === '/' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
              <LayoutDashboard size={16} className="flex-shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </button>
          )}
          {isPlatformAdmin && (
            <button onClick={() => navigate('/admin')} title={collapsed ? 'Admin' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/admin') ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
              <Shield size={16} className="flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </button>
          )}
          {isPlatformAdmin && (
            <button onClick={() => navigate('/analytics')} title={collapsed ? 'Analytics' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/analytics') ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
              <BarChart2 size={16} className="flex-shrink-0" />
              {!collapsed && <span>Analytics</span>}
            </button>
          )}
          <button onClick={() => navigate('/messages')} title={collapsed ? 'Messages' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/messages') ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
            <div className="relative flex-shrink-0">
              <MessageCircle size={16} />
              {unreadMessages > 0 && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center"><span className="text-[8px] text-white font-bold">{unreadMessages}</span></div>}
            </div>
            {!collapsed && <span>Messages</span>}
            {!collapsed && unreadMessages > 0 && <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unreadMessages}</span>}
          </button>
          <NotificationBell collapsed={collapsed} />
        </nav>

        {/* Communities */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {!collapsed && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Communities</span>
              <span className="text-xs text-gray-700 bg-white/5 px-1.5 py-0.5 rounded-full">{communities.length}</span>
            </div>
          )}

          <div className="space-y-1">
            {communities.map(community => (
              <button
                key={community.id}
                onClick={() => navigate(`/community/${community.id}`)}
                title={collapsed ? community.name : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left group ${
                  isActive(`/community/${community.id}`) ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base relative"
                  style={{ backgroundColor: community.color + '25', border: `1.5px solid ${community.color}45` }}
                >
                  {community.id === 'creafi'
                    ? <CreafiLogo size={22} />
                    : community.emoji}
                  {community.isLocked && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center">
                      <Lock size={7} className="text-violet-400" />
                    </div>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{community.name}</p>
                    <p className="text-xs text-gray-600 group-hover:text-gray-500">
                      {community.memberCount} members · {community.isLocked ? 'Paid' : 'Free'}
                    </p>
                  </div>
                )}
                {!collapsed && isActive(`/community/${community.id}`) && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GRADIENT }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User + Logout */}
        <div className="px-3 pb-3 pt-3 border-t border-white/5 space-y-1">
          {!collapsed && currentUser && (
            <div className="flex items-center gap-2 px-2 py-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {currentUser.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-300 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-gray-600 truncate">{currentUser.role === 'platform_admin' ? 'Platform Admin' : 'Member'}</p>
              </div>
            </div>
          )}
          {isPlatformAdmin && (
            <button onClick={() => setShowCreate(true)} title={collapsed ? 'New Community' : undefined}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-gray-950 text-sm font-bold transition-colors">
              <Plus size={15} />
              {!collapsed && <span>New Community</span>}
            </button>
          )}
          <button onClick={logout} title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-all text-sm font-medium">
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
