import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { api, getSession, setSession, clearSession } from './lib/api'
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CommunityView from './pages/CommunityView'
import AdminDashboard from './pages/AdminDashboard'
import JoinPage from './pages/JoinPage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import AnalyticsPage from './pages/AnalyticsPage'

// ─── Schema v8 — clears stale localStorage ────────────────────────────────────
const SCHEMA_VERSION = 'v10-server'
if (typeof window !== 'undefined' && localStorage.getItem('hub_schema') !== SCHEMA_VERSION) {
  ;['hub_communities','hub_members','hub_events','hub_posts',
    'hub_plans','hub_modules','hub_lessons','hub_enrollments',
    'hub_educators','hub_educator_plan','hub_brevo',
    'hub_users','hub_session','hub_messages','hub_notifications','hub_sequences',
  ].forEach(k => localStorage.removeItem(k))
  localStorage.setItem('hub_schema', SCHEMA_VERSION)
}

// ─── Slug / domain helpers ────────────────────────────────────────────────────
export function generateSlug(name) {
  return name.toLowerCase().replace(/'/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}
export function getBaseDomain() {
  if (typeof window === 'undefined') return 'mpact.net'
  const h = window.location.hostname
  if (h === 'localhost' || h === '127.0.0.1') return window.location.host
  const parts = h.split('.')
  return parts.length >= 2 ? parts.slice(-2).join('.') : h
}
export function getCommunityUrl(community, isPro) {
  const base = getBaseDomain()
  if (isPro && community.slug) return `https://${community.slug}.${base}`
  return `https://${base}/join/${community.id}`
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_COMMUNITIES = [
  {
    id: 'creafi', slug: 'creafi',
    name: "Crea'fi",
    description: "Master creative finance, build wealth, and join a community of forward-thinking money builders. This is where your financial transformation begins.",
    color: '#18181b', emoji: '💡', memberCount: 0, joinUrl: 'https://creafigenius.com',
    category: 'Finance & Wealth', isLocked: false, lockedScreenLogo: null, createdAt: '2026-03-26',
  },
]

const INITIAL_USERS = [] // accounts live on the server now (hub_users)

const INITIAL_EDUCATORS = [
  { id: 'edu_chad', name: 'Chad Glover', email: 'chad@creafi.com', communityId: 'creafi',
    plan: 'mpact', status: 'active', nextBillingDate: '2026-04-26', joinedAt: '2026-03-26' },
]

const INITIAL_PLANS = [
  { id: 'pl_creafi_annual', communityId: 'creafi', name: "Crea'fi", price: 497, interval: 'year',
    description: 'Full membership, billed once a year',
    features: ['Private members community','Live sessions every week: Deal Lab, Sales Practice, Office Hours','Replays by topic and property type','Creative finance, wholesale, agent outreach, and sales tracks','Contracts and agreements','Work reviews on your real deals','Crea\'fi shirt mailed to you'], isActive: true },
]

const INITIAL_SEQUENCES = [
  { id: 'seq_welcome', name: 'Welcome Series', trigger: 'join', delayDays: 0,
    subject: 'Welcome to {{community}}!', body: 'Hi {{name}},\n\nWelcome to {{community}}! We\'re thrilled to have you. Here\'s what you can do first:\n\n1. Introduce yourself in the Community Feed\n2. Check out the course content\n3. Join our next live session\n\nLet\'s build something great together!\n\n— The Team', isActive: true },
  { id: 'seq_day3', name: 'Day 3 Check-in', trigger: 'join', delayDays: 3,
    subject: 'How\'s it going, {{name}}?', body: 'Hi {{name}},\n\nYou\'ve been a member of {{community}} for 3 days now. Have you had a chance to explore everything?\n\nDon\'t forget to:\n• Post your introduction\n• Attend the next live session\n• Start the first lesson\n\nWe\'re here if you need anything!\n\n— The Team', isActive: true },
  { id: 'seq_day7', name: 'Week 1 Win', trigger: 'join', delayDays: 7,
    subject: 'One week in — what\'s your win?', body: 'Hi {{name}},\n\nOne full week! Congrats on sticking with it.\n\nShare your Week 1 win in the Community Feed — big or small, it matters.\n\nKeep going!\n\n— The Team', isActive: false },
]

const INITIAL_MEMBERS     = []
const INITIAL_EVENTS      = []
const INITIAL_POSTS       = []
const INITIAL_MODULES     = []
const INITIAL_LESSONS     = []
const INITIAL_ENROLLMENTS = []
const INITIAL_MESSAGES    = []
const INITIAL_NOTIFICATIONS = []
const INITIAL_BREVO       = { apiKey: '', senderName: 'Mpact', senderEmail: '' }

// ─── Context ──────────────────────────────────────────────────────────────────
export const AppContext = createContext()
export function useApp() { return useContext(AppContext) }

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#84cc16']

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

function AppProvider({ children }) {
  const [communities,    setCommunities]    = useState(() => load('hub_communities',    INITIAL_COMMUNITIES))
  const [members,        setMembers]        = useState(() => load('hub_members',        INITIAL_MEMBERS))
  const [events,         setEvents]         = useState(() => load('hub_events',         INITIAL_EVENTS))
  const [posts,          setPosts]          = useState(() => load('hub_posts',          INITIAL_POSTS))
  const [plans,          setPlans]          = useState(() => load('hub_plans',          INITIAL_PLANS))
  const [modules,        setModules]        = useState(() => load('hub_modules',        INITIAL_MODULES))
  const [lessons,        setLessons]        = useState(() => load('hub_lessons',        INITIAL_LESSONS))
  const [enrollments,    setEnrollments]    = useState(() => load('hub_enrollments',    INITIAL_ENROLLMENTS))
  const [educators,      setEducators]      = useState(() => load('hub_educators',      INITIAL_EDUCATORS))
  const [brevoSettings,  setBrevoSettings]  = useState(() => load('hub_brevo',          INITIAL_BREVO))
  const [educatorPlan,   setEducatorPlan]   = useState(() => load('hub_educator_plan',  { tier: 'mpact' }))
  const [users]                               = useState(INITIAL_USERS)
  const [messages,       setMessages]       = useState(() => load('hub_messages',       INITIAL_MESSAGES))
  const [notifications,  setNotifications]  = useState(() => load('hub_notifications',  INITIAL_NOTIFICATIONS))
  const [sequences,      setSequences]      = useState(() => load('hub_sequences',      INITIAL_SEQUENCES))
  const [currentUser,    setCurrentUser]    = useState(() => getSession()?.user || null)
  const [hydrated,       setHydrated]       = useState(false)
  const lastServer = useRef({})   // key -> JSON of last value seen from/sent to the server
  const timers     = useRef({})

  const setters = { communities: setCommunities, members: setMembers, events: setEvents, posts: setPosts, plans: setPlans,
    modules: setModules, lessons: setLessons, enrollments: setEnrollments, educators: setEducators, educatorPlan: setEducatorPlan,
    messages: setMessages, notifications: setNotifications, sequences: setSequences }

  // ── Server hydration: everything shared lives on the server (Railway MySQL); localStorage is only a cache ──
  const pull = async () => {
    if (!getSession()?.token) return
    try {
      const data = await api.getState()
      for (const [k, v] of Object.entries(data)) {
        if (v == null || !setters[k]) continue
        lastServer.current[k] = JSON.stringify(v)
        setters[k](v)
      }
    } catch (e) { if (e.status === 401) { clearSession(); setCurrentUser(null) } }
  }
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (getSession()?.token) {
        try { const { user } = await api.me(); if (alive) { setCurrentUser(user); setSession({ ...getSession(), user }) } }
        catch (e) { if (e.status === 401) { clearSession(); if (alive) setCurrentUser(null) } }
        await pull()
      }
      if (alive) setHydrated(true)
    })()
    const onFocus = () => pull()
    window.addEventListener('focus', onFocus)
    const iv = setInterval(pull, 60000)
    return () => { alive = false; window.removeEventListener('focus', onFocus); clearInterval(iv) }
  }, [currentUser?.id]) // eslint-disable-line

  const sync = (key, data) => {
    save(`hub_${key === 'educatorPlan' ? 'educator_plan' : key}`, data)
    if (!hydrated || !getSession()?.token) return
    const json = JSON.stringify(data)
    if (lastServer.current[key] === json) return
    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(async () => {
      try { await api.putState(key, data); lastServer.current[key] = json }
      catch (e) { if (e.status !== 403) console.warn('sync failed', key, e.message) }
    }, 400)
  }

  useEffect(() => sync('communities', communities), [communities])
  useEffect(() => sync('members', members), [members])
  useEffect(() => sync('events', events), [events])
  useEffect(() => sync('posts', posts), [posts])
  useEffect(() => sync('plans', plans), [plans])
  useEffect(() => sync('modules', modules), [modules])
  useEffect(() => sync('lessons', lessons), [lessons])
  useEffect(() => sync('enrollments', enrollments), [enrollments])
  useEffect(() => sync('educators', educators), [educators])
  useEffect(() => save('hub_brevo',         brevoSettings), [brevoSettings])
  useEffect(() => sync('educatorPlan', educatorPlan), [educatorPlan])
  useEffect(() => sync('messages', messages), [messages])
  useEffect(() => sync('notifications', notifications), [notifications])
  useEffect(() => sync('sequences', sequences), [sequences])

  // ── Auth (server-backed) ──────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { token, user } = await api.login(email, password)
      setSession({ token, user }); setCurrentUser(user)
      return user
    } catch (e) { return null }
  }
  const logout = () => { clearSession(); setCurrentUser(null); lastServer.current = {} }
  const register = async (communityId, data) => {
    try {
      const { token, user, member } = await api.register({ communityId, name: data.name, email: data.email, password: data.password, title: data.title, bio: data.bio, avatarUrl: data.avatarUrl })
      setMembers(prev => prev.some(m => m.id === member.id) ? prev : [...prev, member])
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, memberCount: c.memberCount + 1 } : c))
      setSession({ token, user }); setCurrentUser(user)
      return user
    } catch (e) { return { error: e.message } }
  }
  const changePassword = async (_userId, oldPassword, newPassword) => {
    try { await api.changePassword(oldPassword, newPassword); return true } catch { return false }
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  const pushNotification = (recipientId, type, message, link = '/') => {
    const notif = { id: `n${Date.now()}${Math.random()}`, recipientId, type, message, link, read: false, createdAt: new Date().toISOString() }
    setNotifications(prev => [notif, ...prev].slice(0, 100))
  }
  const markNotificationRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const clearNotifications = () => setNotifications([])

  // ── Points / Gamification ─────────────────────────────────────────────────
  const _awardBadge = (memberId, badge) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m
      const badges = m.badges || []
      if (badges.includes(badge)) return m
      return { ...m, badges: [...badges, badge] }
    }))
  }
  const awardPoints = (memberId, amount) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m
      const newPoints = (m.points || 0) + amount
      const badges = [...(m.badges || [])]
      if (newPoints >= 50  && !badges.includes('Active Member'))    badges.push('Active Member')
      if (newPoints >= 200 && !badges.includes('Top Contributor'))  badges.push('Top Contributor')
      if (newPoints >= 500 && !badges.includes('Community Legend')) badges.push('Community Legend')
      return { ...m, points: newPoints, badges }
    }))
  }
  const updateMemberRole = (memberId, role) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m))
    if (role === 'admin')     _awardBadge(memberId, 'Admin')
    if (role === 'moderator') _awardBadge(memberId, 'Moderator')
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  const sendMessage = (fromId, toId, content) => {
    const msg = { id: `msg${Date.now()}`, fromId, toId, content, createdAt: new Date().toISOString(), read: false }
    setMessages(prev => [...prev, msg])
    const sender = members.find(m => m.id === fromId)
    pushNotification(toId, 'message', `New message from ${sender?.name || 'Someone'}`, '/messages')
    return msg
  }
  const markMessageRead = (id) => setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
  const markConversationRead = (fromId, toId) => {
    setMessages(prev => prev.map(m => (m.fromId === fromId && m.toId === toId) ? { ...m, read: true } : m))
  }

  // ── Communities ───────────────────────────────────────────────────────────
  const createCommunity = (data) => {
    const c = { id: `c${Date.now()}`, slug: generateSlug(data.name), ...data,
      memberCount: 0, isLocked: true, lockedScreenLogo: null, createdAt: new Date().toISOString().split('T')[0] }
    setCommunities(prev => [...prev, c]); return c
  }
  const updateCommunity = (id, data) => setCommunities(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  const updateCommunitySlug = (id, slug) => setCommunities(prev => prev.map(c => c.id === id ? { ...c, slug } : c))
  const upgradeEducatorPlan = (tier) => setEducatorPlan({ tier })
  const deleteCommunity = (id) => {
    setCommunities(prev => prev.filter(c => c.id !== id))
    setMembers(prev => prev.filter(m => m.communityId !== id))
    setEvents(prev => prev.filter(e => e.communityId !== id))
    setPosts(prev => prev.filter(p => p.communityId !== id))
    setPlans(prev => prev.filter(p => p.communityId !== id))
    setModules(prev => prev.filter(m => m.communityId !== id))
    setLessons(prev => prev.filter(l => l.communityId !== id))
    setEnrollments(prev => prev.filter(e => e.communityId !== id))
  }

  // ── Members ───────────────────────────────────────────────────────────────
  const addMember = (communityId, data) => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    const m = { id: `m${Date.now()}`, communityId, ...data,
      role: data.role || 'member', points: data.points || 0, badges: data.badges || [],
      color, joinedAt: new Date().toISOString().split('T')[0] }
    setMembers(prev => [...prev, m])
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, memberCount: c.memberCount + 1 } : c))
    return m
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const addEvent    = (communityId, data) => { const e = { id: `e${Date.now()}`, communityId, ...data }; setEvents(prev => [...prev, e]); return e }
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  // ── Posts ─────────────────────────────────────────────────────────────────
  const EMPTY_REACTIONS = { love: [], celebrate: [], clap: [], fire: [], star: [] }
  const addPost = (communityId, memberId, content, imageUrl = null) => {
    const p = {
      id: `p${Date.now()}`, communityId, memberId, content, type: 'introduction',
      imageUrl, reactions: { ...EMPTY_REACTIONS }, comments: [], createdAt: new Date().toISOString(),
    }
    setPosts(prev => [p, ...prev])
    awardPoints(memberId, 10)
    _awardBadge(memberId, 'First Post')
    // Notify community admins
    const admins = members.filter(m => m.communityId === communityId && (m.role === 'admin' || m.role === 'owner') && m.id !== memberId)
    const poster = members.find(m => m.id === memberId)
    admins.forEach(a => pushNotification(a.id, 'post', `${poster?.name || 'Someone'} posted in the community`, `/community/${communityId}`))
    return p
  }
  const reactToPost = (postId, reaction, userId = 'me') => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const reactions = { ...EMPTY_REACTIONS, ...(p.reactions || {}) }
      const list = reactions[reaction] || []
      const adding = !list.includes(userId)
      reactions[reaction] = adding ? [...list, userId] : list.filter(u => u !== userId)
      if (adding) {
        awardPoints(p.memberId, 2)
        const reactor = members.find(m => m.id === userId)
        if (reactor && p.memberId !== userId) {
          pushNotification(p.memberId, 'reaction', `${reactor.name} reacted to your post`, `/community/${p.communityId}`)
        }
      }
      return { ...p, reactions }
    }))
  }
  const addComment = (postId, memberId, content) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const comment = { id: `c${Date.now()}`, memberId, content, createdAt: new Date().toISOString() }
      awardPoints(memberId, 5)
      if (p.memberId !== memberId) {
        const commenter = members.find(m => m.id === memberId)
        pushNotification(p.memberId, 'comment', `${commenter?.name || 'Someone'} commented on your post`, `/community/${p.communityId}`)
      }
      return { ...p, comments: [...(p.comments || []), comment] }
    }))
  }
  const deletePost = (postId) => setPosts(prev => prev.filter(p => p.id !== postId))

  // ── Plans ─────────────────────────────────────────────────────────────────
  const addPlan    = (communityId, data) => { const p = { id: `pl${Date.now()}`, communityId, ...data, isActive: true }; setPlans(prev => [...prev, p]); return p }
  const updatePlan = (id, data) => setPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  const deletePlan = (id) => setPlans(prev => prev.filter(p => p.id !== id))
  const togglePlan = (id) => setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))

  // ── Modules ───────────────────────────────────────────────────────────────
  const addModule = (communityId, data) => {
    const maxOrder = Math.max(0, ...modules.filter(m => m.communityId === communityId).map(m => m.order))
    const m = { id: `mod${Date.now()}`, communityId, ...data, order: maxOrder + 1, isPublished: false }
    setModules(prev => [...prev, m]); return m
  }
  const updateModule  = (id, data) => setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  const deleteModule  = (id) => { setModules(prev => prev.filter(m => m.id !== id)); setLessons(prev => prev.filter(l => l.moduleId !== id)) }
  const reorderModule = (communityId, id, dir) => {
    setModules(prev => {
      const cMods = [...prev.filter(m => m.communityId === communityId)].sort((a,b) => a.order - b.order)
      const rest  = prev.filter(m => m.communityId !== communityId)
      const idx   = cMods.findIndex(m => m.id === id)
      if (dir === 'up'   && idx > 0)               [cMods[idx-1], cMods[idx]]   = [cMods[idx], cMods[idx-1]]
      if (dir === 'down' && idx < cMods.length - 1) [cMods[idx],   cMods[idx+1]] = [cMods[idx+1], cMods[idx]]
      return [...rest, ...cMods.map((m,i) => ({ ...m, order: i+1 }))]
    })
  }

  // ── Lessons ───────────────────────────────────────────────────────────────
  const addLesson    = (moduleId, communityId, data) => {
    const maxOrder = Math.max(0, ...lessons.filter(l => l.moduleId === moduleId).map(l => l.order))
    const l = { id: `les${Date.now()}`, moduleId, communityId, ...data, order: maxOrder + 1, isPublished: false }
    setLessons(prev => [...prev, l]); return l
  }
  const updateLesson = (id, data) => setLessons(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
  const deleteLesson = (id) => setLessons(prev => prev.filter(l => l.id !== id))

  // ── Enrollments ───────────────────────────────────────────────────────────
  const addEnrollment = (communityId, memberId, planId, amount) => {
    const e = { id: `en${Date.now()}`, communityId, memberId, planId, status: 'active',
      enrolledAt: new Date().toISOString().split('T')[0], amount }
    setEnrollments(prev => [...prev, e]); return e
  }

  // ── Educators ─────────────────────────────────────────────────────────────
  const addEducator    = (data) => { const e = { id: `edu${Date.now()}`, ...data, status: 'active', joinedAt: new Date().toISOString().split('T')[0] }; setEducators(prev => [...prev, e]); return e }
  const updateEducator = (id, data) => setEducators(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteEducator = (id) => setEducators(prev => prev.filter(e => e.id !== id))

  // ── Brevo ─────────────────────────────────────────────────────────────────
  const saveBrevoSettings = (settings) => setBrevoSettings(prev => ({ ...prev, ...settings }))

  // ── Email Sequences ───────────────────────────────────────────────────────
  const addSequence    = (data) => { const s = { id: `seq${Date.now()}`, ...data, isActive: true }; setSequences(prev => [...prev, s]); return s }
  const updateSequence = (id, data) => setSequences(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  const deleteSequence = (id) => setSequences(prev => prev.filter(s => s.id !== id))

  return (
    <AppContext.Provider value={{
      // State
      communities, members, events, posts, plans, modules, lessons, enrollments,
      educators, brevoSettings, educatorPlan, users, messages, notifications, sequences, currentUser,
      // Auth
      login, logout, register, changePassword,
      // Notifications
      pushNotification, markNotificationRead, markAllNotificationsRead, clearNotifications,
      // Points
      awardPoints, updateMemberRole,
      // Messages
      sendMessage, markMessageRead, markConversationRead,
      // Communities
      createCommunity, updateCommunity, updateCommunitySlug, deleteCommunity, upgradeEducatorPlan,
      // Members
      addMember,
      // Events
      addEvent, deleteEvent,
      // Posts
      addPost, reactToPost, addComment, deletePost,
      // Plans
      addPlan, updatePlan, deletePlan, togglePlan,
      // Modules
      addModule, updateModule, deleteModule, reorderModule,
      // Lessons
      addLesson, updateLesson, deleteLesson,
      // Enrollments
      addEnrollment,
      // Educators
      addEducator, updateEducator, deleteEducator,
      // Brevo
      saveBrevoSettings,
      // Sequences
      addSequence, updateSequence, deleteSequence,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── Subdomain handler ────────────────────────────────────────────────────────
function SubdomainHandler({ communities }) {
  const navigate = useNavigate()
  useEffect(() => {
    const injected = window.__MPACT_COMMUNITY__
    if (injected) {
      const c = communities.find(c => c.slug === injected || c.id === injected || c.customDomain === injected)
      if (c) { navigate(`/community/${c.id}`, { replace: true }); return }
    }
    const hostname = window.location.hostname
    const base = getBaseDomain()
    if (hostname !== 'localhost' && hostname !== base && !hostname.endsWith('.' + base)) {
      const c = communities.find(c => c.customDomain === hostname)
      if (c) navigate(`/community/${c.id}`, { replace: true })
    }
  }, []) // eslint-disable-line
  return null
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { currentUser } = useContext(AppContext)
  if (!currentUser) return <Navigate to="/login" replace />
  return children
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <InnerApp />
      </BrowserRouter>
    </AppProvider>
  )
}

function InnerApp() {
  const { communities, currentUser } = useContext(AppContext)
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/join/:slugOrId" element={<JoinPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }
  return (
    <>
      <SubdomainHandler communities={communities} />
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"                   element={<Dashboard />} />
            <Route path="/admin"              element={<AdminDashboard />} />
            <Route path="/analytics"          element={<AnalyticsPage />} />
            <Route path="/messages"           element={<MessagesPage />} />
            <Route path="/messages/:memberId" element={<MessagesPage />} />
            <Route path="/join/:slugOrId"     element={<JoinPage />} />
            <Route path="/community/:id"      element={<CommunityView />} />
            <Route path="/community/:id/:tab" element={<CommunityView />} />
            <Route path="*"                   element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  )
}
