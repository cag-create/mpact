import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CommunityView from './pages/CommunityView'
import AdminDashboard from './pages/AdminDashboard'
import JoinPage from './pages/JoinPage'

// ─── Clear stale localStorage from previous schema ────────────────────────────
const SCHEMA_VERSION = 'v7'
if (typeof window !== 'undefined' && localStorage.getItem('hub_schema') !== SCHEMA_VERSION) {
  ;['hub_communities','hub_members','hub_events','hub_posts',
    'hub_plans','hub_modules','hub_lessons','hub_enrollments',
    'hub_educators','hub_educator_plan','hub_brevo'].forEach(k => localStorage.removeItem(k))
  localStorage.setItem('hub_schema', SCHEMA_VERSION)
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────
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

// ─── Initial Data — clean slate, only Crea'fi ────────────────────────────────

const INITIAL_COMMUNITIES = [
  {
    id: 'creafi',
    slug: 'creafi',
    name: "Crea'fi",
    description: "Master creative finance, build wealth, and join a community of forward-thinking money builders. This is where your financial transformation begins.",
    color: '#18181b',
    emoji: '💡',
    memberCount: 0,
    category: 'Finance & Wealth',
    isLocked: false,
    lockedScreenLogo: null,
    createdAt: '2026-03-26',
  },
]

// Platform educators (businesses/creators hosting communities on Mpact)
const INITIAL_EDUCATORS = [
  {
    id: 'edu_chad',
    name: "Chad Glover",
    email: "chad@creafi.com",
    communityId: 'creafi',
    plan: 'mpact',         // 'base' ($7/mo) | 'mpact' ($59/mo)
    status: 'active',      // 'active' | 'overdue' | 'cancelled'
    nextBillingDate: '2026-04-26',
    joinedAt: '2026-03-26',
  },
]

const INITIAL_PLANS = [
  {
    id: 'pl_creafi_monthly',
    communityId: 'creafi',
    name: 'Monthly',
    price: 47,
    interval: 'month',
    description: 'Full community access, billed monthly',
    features: ['Full community access', 'Weekly live sessions', 'Course library', 'Member messaging'],
    isActive: true,
  },
  {
    id: 'pl_creafi_annual',
    communityId: 'creafi',
    name: 'Annual',
    price: 397,
    interval: 'year',
    description: 'Best value — save $167/yr',
    features: ['Everything in Monthly', 'Annual strategy call', 'Priority support', 'Exclusive workshops'],
    isActive: true,
  },
]

const INITIAL_MEMBERS     = []
const INITIAL_EVENTS      = []
const INITIAL_POSTS       = []
const INITIAL_MODULES     = []
const INITIAL_LESSONS     = []
const INITIAL_ENROLLMENTS = []
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
  const [communities,  setCommunities]  = useState(() => load('hub_communities',  INITIAL_COMMUNITIES))
  const [members,      setMembers]      = useState(() => load('hub_members',      INITIAL_MEMBERS))
  const [events,       setEvents]       = useState(() => load('hub_events',       INITIAL_EVENTS))
  const [posts,        setPosts]        = useState(() => load('hub_posts',        INITIAL_POSTS))
  const [plans,        setPlans]        = useState(() => load('hub_plans',        INITIAL_PLANS))
  const [modules,      setModules]      = useState(() => load('hub_modules',      INITIAL_MODULES))
  const [lessons,      setLessons]      = useState(() => load('hub_lessons',      INITIAL_LESSONS))
  const [enrollments,  setEnrollments]  = useState(() => load('hub_enrollments',  INITIAL_ENROLLMENTS))
  const [educators,    setEducators]    = useState(() => load('hub_educators',    INITIAL_EDUCATORS))
  const [brevoSettings, setBrevoSettings] = useState(() => load('hub_brevo',     INITIAL_BREVO))
  // Educator platform subscription: 'base' ($7/mo, 7% fee) | 'mpact' ($59/mo, 2.99% fee)
  const [educatorPlan, setEducatorPlan] = useState(() => load('hub_educator_plan', { tier: 'mpact' }))

  useEffect(() => save('hub_communities',  communities),  [communities])
  useEffect(() => save('hub_members',      members),      [members])
  useEffect(() => save('hub_events',       events),       [events])
  useEffect(() => save('hub_posts',        posts),        [posts])
  useEffect(() => save('hub_plans',        plans),        [plans])
  useEffect(() => save('hub_modules',      modules),      [modules])
  useEffect(() => save('hub_lessons',      lessons),      [lessons])
  useEffect(() => save('hub_enrollments',  enrollments),  [enrollments])
  useEffect(() => save('hub_educators',    educators),    [educators])
  useEffect(() => save('hub_brevo',        brevoSettings), [brevoSettings])
  useEffect(() => save('hub_educator_plan', educatorPlan), [educatorPlan])

  // Communities
  const createCommunity = (data) => {
    const slug = generateSlug(data.name)
    const c = { id: `c${Date.now()}`, slug, ...data, memberCount: 0, isLocked: true, lockedScreenLogo: null, createdAt: new Date().toISOString().split('T')[0] }
    setCommunities(prev => [...prev, c]); return c
  }
  const updateCommunity = (id, data) => setCommunities(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  const updateCommunitySlug = (id, newSlug) => {
    const clean = generateSlug(newSlug)
    setCommunities(prev => prev.map(c => c.id === id ? { ...c, slug: clean } : c))
  }
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

  // Members
  const addMember = (communityId, data) => {
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    const m = { id: `m${Date.now()}`, communityId, ...data, color, joinedAt: new Date().toISOString().split('T')[0] }
    setMembers(prev => [...prev, m])
    setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, memberCount: c.memberCount + 1 } : c))
    return m
  }

  // Events
  const addEvent    = (communityId, data) => { const e = { id: `e${Date.now()}`, communityId, ...data }; setEvents(prev => [...prev, e]); return e }
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  // Posts
  const EMPTY_REACTIONS = { love: [], celebrate: [], clap: [], fire: [], star: [] }
  const addPost = (communityId, memberId, content, imageUrl = null) => {
    const p = {
      id: `p${Date.now()}`, communityId, memberId, content, type: 'introduction',
      imageUrl, reactions: { ...EMPTY_REACTIONS }, comments: [],
      createdAt: new Date().toISOString()
    }
    setPosts(prev => [p, ...prev]); return p
  }
  const reactToPost = (postId, reaction, userId = 'me') => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const reactions = { ...EMPTY_REACTIONS, ...(p.reactions || {}) }
      const list = reactions[reaction] || []
      reactions[reaction] = list.includes(userId)
        ? list.filter(u => u !== userId)
        : [...list, userId]
      return { ...p, reactions }
    }))
  }
  const addComment = (postId, memberId, content) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const comment = { id: `c${Date.now()}`, memberId, content, createdAt: new Date().toISOString() }
      return { ...p, comments: [...(p.comments || []), comment] }
    }))
  }

  // Plans
  const addPlan    = (communityId, data) => { const p = { id: `pl${Date.now()}`, communityId, ...data, isActive: true }; setPlans(prev => [...prev, p]); return p }
  const updatePlan = (id, data) => setPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
  const deletePlan = (id) => setPlans(prev => prev.filter(p => p.id !== id))
  const togglePlan = (id) => setPlans(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p))

  // Modules
  const addModule = (communityId, data) => {
    const maxOrder = Math.max(0, ...modules.filter(m => m.communityId === communityId).map(m => m.order))
    const m = { id: `mod${Date.now()}`, communityId, ...data, order: maxOrder + 1, isPublished: false }
    setModules(prev => [...prev, m]); return m
  }
  const updateModule = (id, data) => setModules(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  const deleteModule = (id) => { setModules(prev => prev.filter(m => m.id !== id)); setLessons(prev => prev.filter(l => l.moduleId !== id)) }
  const reorderModule = (communityId, id, dir) => {
    setModules(prev => {
      const cMods = [...prev.filter(m => m.communityId === communityId)].sort((a, b) => a.order - b.order)
      const rest = prev.filter(m => m.communityId !== communityId)
      const idx = cMods.findIndex(m => m.id === id)
      if (dir === 'up'   && idx > 0)                  [cMods[idx-1], cMods[idx]]   = [cMods[idx], cMods[idx-1]]
      if (dir === 'down' && idx < cMods.length - 1)   [cMods[idx],   cMods[idx+1]] = [cMods[idx+1], cMods[idx]]
      return [...rest, ...cMods.map((m, i) => ({ ...m, order: i + 1 }))]
    })
  }

  // Lessons
  const addLesson    = (moduleId, communityId, data) => {
    const maxOrder = Math.max(0, ...lessons.filter(l => l.moduleId === moduleId).map(l => l.order))
    const l = { id: `les${Date.now()}`, moduleId, communityId, ...data, order: maxOrder + 1, isPublished: false }
    setLessons(prev => [...prev, l]); return l
  }
  const updateLesson = (id, data) => setLessons(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
  const deleteLesson = (id) => setLessons(prev => prev.filter(l => l.id !== id))

  // Enrollments
  const addEnrollment = (communityId, memberId, planId, amount) => {
    const e = { id: `en${Date.now()}`, communityId, memberId, planId, status: 'active', enrolledAt: new Date().toISOString().split('T')[0], amount }
    setEnrollments(prev => [...prev, e]); return e
  }

  // Educators (platform subscribers)
  const addEducator = (data) => {
    const e = { id: `edu${Date.now()}`, ...data, status: 'active', joinedAt: new Date().toISOString().split('T')[0] }
    setEducators(prev => [...prev, e]); return e
  }
  const updateEducator = (id, data) => setEducators(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteEducator = (id) => setEducators(prev => prev.filter(e => e.id !== id))

  // Brevo
  const saveBrevoSettings = (settings) => setBrevoSettings(prev => ({ ...prev, ...settings }))

  return (
    <AppContext.Provider value={{
      communities, members, events, posts, plans, modules, lessons, enrollments,
      educators, brevoSettings,
      educatorPlan, upgradeEducatorPlan,
      createCommunity, updateCommunity, updateCommunitySlug, deleteCommunity, addMember,
      addEvent, deleteEvent, addPost, reactToPost, addComment,
      addPlan, updatePlan, deletePlan, togglePlan,
      addModule, updateModule, deleteModule, reorderModule,
      addLesson, updateLesson, deleteLesson, addEnrollment,
      addEducator, updateEducator, deleteEducator, saveBrevoSettings,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// Detects subdomain (e.g. creafi.mpact.net) and auto-routes to that community
function SubdomainHandler({ communities }) {
  const navigate = useNavigate()
  useEffect(() => {
    // Injected by server.js for subdomain requests
    const slug = window.__MPACT_COMMUNITY__
    if (slug) {
      const c = communities.find(c => c.slug === slug || c.id === slug)
      if (c) navigate(`/community/${c.id}`, { replace: true })
    }
  }, []) // eslint-disable-line
  return null
}

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
  const { communities } = useContext(AppContext)
  return (
    <>
      <SubdomainHandler communities={communities} />
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"                   element={<Dashboard />} />
            <Route path="/admin"              element={<AdminDashboard />} />
            <Route path="/join/:slugOrId"     element={<JoinPage />} />
            <Route path="/community/:id"      element={<CommunityView />} />
            <Route path="/community/:id/:tab" element={<CommunityView />} />
          </Routes>
        </div>
      </div>
    </>
  )
}
