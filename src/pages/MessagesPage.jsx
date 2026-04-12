import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Search, ArrowLeft, MessageCircle } from 'lucide-react'
import { useApp } from '../App'

function Avatar({ member, size = 36 }) {
  if (member?.avatarUrl) return (
    <img src={member.avatarUrl} alt={member.name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  )
  const initials = (member?.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{ width: size, height: size, backgroundColor: member?.color || '#6366f1', fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

export default function MessagesPage() {
  const { memberId: paramMemberId } = useParams()
  const navigate = useNavigate()
  const { members, messages, sendMessage, markConversationRead, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [newMsg, setNewMsg] = useState('')
  const [activeMemberId, setActiveMemberId] = useState(paramMemberId || null)
  const messagesEndRef = useRef(null)

  // Get current member from logged-in user
  const me = members.find(m => m.id === currentUser?.memberId) || members[0]

  // Build conversation list: unique partners
  const partners = React.useMemo(() => {
    if (!me) return []
    const seen = new Set()
    const result = []
    messages.forEach(msg => {
      const partnerId = msg.fromId === me.id ? msg.toId : msg.fromId
      if ((msg.fromId === me.id || msg.toId === me.id) && !seen.has(partnerId)) {
        seen.add(partnerId)
        result.push(partnerId)
      }
    })
    return result
  }, [messages, me])

  const activeMember = members.find(m => m.id === activeMemberId)

  // Messages in active conversation
  const conversation = React.useMemo(() => {
    if (!me || !activeMemberId) return []
    return messages
      .filter(m => (m.fromId === me.id && m.toId === activeMemberId) || (m.fromId === activeMemberId && m.toId === me.id))
      .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [messages, me, activeMemberId])

  // Unread count per partner
  const unreadCount = (partnerId) => messages.filter(m => m.fromId === partnerId && m.toId === me?.id && !m.read).length

  useEffect(() => {
    if (activeMemberId && me) markConversationRead(activeMemberId, me.id)
  }, [activeMemberId, conversation.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !me || !activeMemberId) return
    sendMessage(me.id, activeMemberId, newMsg.trim())
    setNewMsg('')
  }

  const allMembers = members.filter(m => m.id !== me?.id && m.name.toLowerCase().includes(search.toLowerCase()))

  const formatTime = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday'
    return d.toLocaleDateString()
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-100 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search members…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allMembers.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No members found</p>
          )}
          {allMembers.map(member => {
            const lastMsg = messages
              .filter(m => (m.fromId === me?.id && m.toId === member.id) || (m.fromId === member.id && m.toId === me?.id))
              .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
            const unread = unreadCount(member.id)
            return (
              <button key={member.id}
                onClick={() => setActiveMemberId(member.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${activeMemberId === member.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                <div className="relative">
                  <Avatar member={member} size={40} />
                  {unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{unread}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className={`text-sm font-semibold truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{member.name}</p>
                    {lastMsg && <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{formatTime(lastMsg.createdAt)}</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{lastMsg ? lastMsg.content : member.title || 'Start a conversation'}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {!activeMemberId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <MessageCircle size={28} className="text-indigo-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-700">Select a conversation</h3>
            <p className="text-sm text-gray-400">Choose a member from the list to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100">
              <button onClick={() => setActiveMemberId(null)} className="text-gray-400 hover:text-gray-600 mr-1 lg:hidden">
                <ArrowLeft size={18} />
              </button>
              <Avatar member={activeMember} size={36} />
              <div>
                <p className="text-sm font-bold text-gray-900">{activeMember?.name}</p>
                <p className="text-xs text-gray-400">{activeMember?.title || activeMember?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {conversation.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No messages yet — say hello! 👋</p>
              )}
              {conversation.map(msg => {
                const isMe = msg.fromId === me?.id
                const sender = members.find(m => m.id === msg.fromId)
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && <Avatar member={sender} size={28} />}
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-3 px-5 py-4 bg-white border-t border-gray-100">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder={`Message ${activeMember?.name}…`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              <button type="submit" disabled={!newMsg.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
