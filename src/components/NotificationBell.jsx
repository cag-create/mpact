import React, { useState, useRef, useEffect } from 'react'
import { Bell, X, MessageCircle, Heart, MessageSquare, Users, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'

const TYPE_ICON = {
  message:  { icon: MessageCircle, color: '#6366f1', bg: '#eef2ff' },
  reaction: { icon: Heart,         color: '#ef4444', bg: '#fef2f2' },
  comment:  { icon: MessageSquare, color: '#10b981', bg: '#f0fdf4' },
  post:     { icon: MessageSquare, color: '#f59e0b', bg: '#fffbeb' },
  member:   { icon: Users,         color: '#8b5cf6', bg: '#f5f3ff' },
  default:  { icon: Star,          color: '#6366f1', bg: '#eef2ff' },
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60)   return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function NotificationBell({ collapsed }) {
  const { notifications, currentUser, members, markNotificationRead, markAllNotificationsRead } = useApp()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  const me = members.find(m => m.id === currentUser?.memberId)
  const myNotifs = notifications
    .filter(n => n.recipientId === me?.id || currentUser?.role === 'platform_admin')
    .slice(0, 30)
  const unread = myNotifs.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (notif) => {
    markNotificationRead(notif.id)
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        title="Notifications"
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
          open ? 'bg-white/10 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
      >
        <div className="relative flex-shrink-0">
          <Bell size={16} />
          {unread > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">{unread > 9 ? '9+' : unread}</span>
            </div>
          )}
        </div>
        {!collapsed && <span>Notifications</span>}
        {!collapsed && unread > 0 && (
          <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllNotificationsRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {myNotifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              myNotifs.map(notif => {
                const meta = TYPE_ICON[notif.type] || TYPE_ICON.default
                const Icon = meta.icon
                return (
                  <button key={notif.id} onClick={() => handleClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.read ? 'bg-indigo-50/40' : ''}`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: meta.bg }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!notif.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
