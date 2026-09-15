import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Plus, ChevronRight, Shield, Lock, MessageCircle, BarChart2, LogOut, User, KeyRound, X } from 'lucide-react'
import { useApp } from '../App'
import { CreateCommunityModal } from './Modals'
import CreafiLogo, { CommunityLogo } from './CreafiLogo'
import NotificationBell from './NotificationBell'

function ChangePasswordModal({ onClose, changePassword, userId }) {
  const [oldPw, setOldPw] = useState(''), [newPw, setNewPw] = useState(''), [again, setAgain] = useState('')
  const [msg, setMsg] = useState(''), [ok, setOk] = useState(false), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setMsg('')
    if (newPw.length < 6) return setMsg('New password must be at least 6 characters')
    if (newPw !== again) return setMsg('New passwords do not match')
    setBusy(true)
    const good = await changePassword(userId, oldPw, newPw)
    setBusy(false)
    if (good) { setOk(true); setTimeout(onClose, 1200) } else setMsg('Current password is incorrect')
  }
  const cls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Change password</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {ok ? <p className="text-sm text-green-600 font-medium">Password updated.</p> : (
            <>
              <input type="password" autoFocus placeholder="Current password" value={oldPw} onChange={e => setOldPw(e.target.value)} className={cls} />
              <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} className={cls} />
              <input type="password" placeholder="New password again" value={again} onChange={e => setAgain(e.target.value)} className={cls} />
              {msg && <p className="text-xs text-red-600">{msg}</p>}
            </>
          )}
        </div>
        {!ok && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={busy} className="px-5 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">{busy ? 'Saving…' : 'Update password'}</button>
          </div>
        )}
      </form>
    </div>
  )
}

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
  const { communities, currentUser, logout, messages, members, changePassword } = useApp()
  const [showPw, setShowPw] = useState(false)
  // Brand the sidebar with the community when we're on its own address, or for a member of exactly that community
  const injected = typeof window !== 'undefined' ? window.__MPACT_BRAND__ : null
  const brandCommunity = (injected && (communities.find(c => c.id === injected.id) || injected))
    || (currentUser?.role === 'member' && communities.find(c => c.id === currentUser.communityId)) || null
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
            <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => navigate(brandCommunity ? `/community/${brandCommunity.id}` : '/')}>
              {brandCommunity ? <CommunityLogo community={brandCommunity} size={40} className="rounded-xl" emojiClass="text-2xl" /> : <MpactMIcon size={36} />}
              {brandCommunity
                ? <div className="min-w-0"><p className="text-white font-extrabold text-lg leading-tight truncate">{brandCommunity.name}</p><p className="text-[10px] text-gray-500 leading-tight">Powered by Mpact</p></div>
                : <MpactWordmark fontSize={22} />}
            </div>
          ) : (
            <div className="cursor-pointer mx-auto" onClick={() => navigate(brandCommunity ? `/community/${brandCommunity.id}` : '/')}>
              {brandCommunity ? <CommunityLogo community={brandCommunity} size={36} className="rounded-xl" emojiClass="text-xl" /> : <MpactMIcon size={36} />}
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
            <button onClick={() => navigate('/dashboard')} title={collapsed ? 'Dashboard' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
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
                  <CommunityLogo community={community} size={22} emojiClass="text-base" />
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

        {/* Host on Mpact — hosting plans for creators */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Host on Mpact</p>
              <p className="text-xs text-gray-400 leading-snug mb-2.5">Run your own community here. Two plans for hosting a community on Mpact:</p>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between rounded-lg bg-black/30 px-2.5 py-2">
                  <div className="min-w-0"><p className="text-xs font-semibold text-gray-200">Foundation</p><p className="text-[10px] text-gray-500">yourname.ourmpact.com address</p></div>
                  <p className="text-xs font-bold text-white whitespace-nowrap">$5.99<span className="text-gray-500 font-medium">/mo</span></p>
                </div>
                <div className="flex items-baseline justify-between rounded-lg bg-black/30 px-2.5 py-2">
                  <div className="min-w-0"><p className="text-xs font-semibold text-gray-200">Active</p><p className="text-[10px] text-gray-500">Your own custom domain + highlighted community</p></div>
                  <p className="text-xs font-bold text-white whitespace-nowrap">$49.99<span className="text-gray-500 font-medium">/mo</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <button onClick={() => setShowPw(true)} title={collapsed ? 'Change password' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-all text-sm font-medium">
            <KeyRound size={16} className="flex-shrink-0" />
            {!collapsed && <span>Change password</span>}
          </button>
          <button onClick={logout} title={collapsed ? 'Sign Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-300 transition-all text-sm font-medium">
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} changePassword={changePassword} userId={currentUser?.id} />}
    </>
  )
}
