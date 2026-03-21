import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Plus, ChevronRight, Sparkles } from 'lucide-react'
import { useApp } from '../App'
import { CreateCommunityModal } from './Modals'

function Avatar({ emoji, color, name, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-sm', md: 'w-9 h-9 text-base', lg: 'w-11 h-11 text-lg' }
  return (
    <div className={`${sizes[size]} rounded-xl flex items-center justify-center flex-shrink-0 font-medium`} style={{ backgroundColor: color + '22', border: `2px solid ${color}44` }}>
      <span>{emoji || name?.[0]?.toUpperCase()}</span>
    </div>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { communities } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-900 flex flex-col h-full transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">CommunityHub</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mx-auto">
              <Sparkles size={16} className="text-white" />
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded">
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="mx-auto mt-2 text-gray-500 hover:text-gray-300 transition-colors p-1">
            <ChevronRight size={16} className="rotate-180" />
          </button>
        )}

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
              location.pathname === '/' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} className="flex-shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </button>
        </nav>

        {/* Communities */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {!collapsed && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Communities</span>
              <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">{communities.length}</span>
            </div>
          )}

          <div className="space-y-1">
            {communities.map(community => (
              <button
                key={community.id}
                onClick={() => navigate(`/community/${community.id}`)}
                title={collapsed ? community.name : undefined}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left group ${
                  isActive(`/community/${community.id}`) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{ backgroundColor: community.color + '22', border: `1.5px solid ${community.color}55` }}
                >
                  {community.emoji}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{community.name}</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400">{community.memberCount} members</p>
                  </div>
                )}
                {!collapsed && isActive(`/community/${community.id}`) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <div className="px-3 pb-5 border-t border-gray-800 pt-4">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {!collapsed && <span>New Community</span>}
          </button>
        </div>
      </aside>

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
