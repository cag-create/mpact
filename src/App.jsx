import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CommunityView from './pages/CommunityView'
import AdminDashboard from './pages/AdminDashboard'

// ─── Sample Data ──────────────────────────────────────────────────────────────

const INITIAL_COMMUNITIES = [
  { id: 'c1', name: 'Digital Marketing Academy', description: 'Master digital marketing strategies and grow your online presence. From SEO to social media, paid ads to content—we cover it all.', color: '#6366f1', emoji: '🚀', memberCount: 247, category: 'Marketing', createdAt: '2026-01-15' },
  { id: 'c2', name: 'Health & Wellness Circle', description: 'Your supportive community for holistic health, fitness goals, nutrition tips, and mindful living. Together we thrive.', color: '#10b981', emoji: '💪', memberCount: 183, category: 'Health', createdAt: '2026-01-20' },
  { id: 'c3', name: 'Mindful Entrepreneurs', description: 'Where business meets balance. Build a thriving, profitable business without sacrificing your wellbeing or relationships.', color: '#8b5cf6', emoji: '🧘', memberCount: 312, category: 'Business', createdAt: '2026-02-01' },
]

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#84cc16']

const INITIAL_MEMBERS = [
  { id: 'm1',  communityId: 'c1', name: 'Sarah Johnson', title: 'Marketing Director',       bio: 'Passionate about data-driven marketing and brand storytelling. 8 years in the game.', color: '#f59e0b', joinedAt: '2026-01-20' },
  { id: 'm2',  communityId: 'c1', name: 'Mike Chen',     title: 'SEO Specialist',           bio: 'Helping businesses rank higher and convert better. Coffee addict ☕',               color: '#3b82f6', joinedAt: '2026-01-22' },
  { id: 'm3',  communityId: 'c1', name: 'Aisha Patel',   title: 'Content Creator',          bio: 'Creating content that connects, resonates, and converts across platforms.',           color: '#ec4899', joinedAt: '2026-02-01' },
  { id: 'm4',  communityId: 'c1', name: 'James Rivera',  title: 'Paid Media Manager',       bio: 'ROAS obsessed. Turned $10k ad spend into $200k revenue last quarter.',              color: '#06b6d4', joinedAt: '2026-02-10' },
  { id: 'm5',  communityId: 'c2', name: 'Jordan Lee',    title: 'Personal Trainer',         bio: 'Certified trainer specializing in functional fitness and sustainable habits.',        color: '#10b981', joinedAt: '2026-01-25' },
  { id: 'm6',  communityId: 'c2', name: 'Emma Williams', title: 'Registered Nutritionist',  bio: 'Helping you fuel your body for peak performance through whole food nutrition.',       color: '#f97316', joinedAt: '2026-02-05' },
  { id: 'm7',  communityId: 'c2', name: 'David Kim',     title: 'Yoga & Mindfulness Coach', bio: 'Bringing mindfulness and movement together for a balanced life.',                    color: '#06b6d4', joinedAt: '2026-02-10' },
  { id: 'm8',  communityId: 'c3', name: 'Rachel Torres', title: 'Business Coach',           bio: 'Helping entrepreneurs build sustainable, profitable businesses without the burnout.', color: '#8b5cf6', joinedAt: '2026-02-05' },
  { id: 'm9',  communityId: 'c3', name: 'Tom Anderson',  title: 'Startup Founder',          bio: 'Serial entrepreneur on startup #4. Failed twice, one exit, learning every day.',     color: '#ef4444', joinedAt: '2026-02-08' },
  { id: 'm10', communityId: 'c3', name: 'Lisa Zhang',    title: 'Product Designer',         bio: 'Designing products users love and businesses need. Systems thinker.',                color: '#f59e0b', joinedAt: '2026-02-12' },
]

const INITIAL_EVENTS = [
  { id: 'e1',  communityId: 'c1', title: 'SEO Deep Dive Workshop',       description: 'A 2-hour deep dive into advanced SEO techniques for 2026.',        date: '2026-03-12', time: '2:00 PM',  type: 'workshop'  },
  { id: 'e2',  communityId: 'c1', title: 'Weekly Mastermind Call',       description: 'Our weekly group call to share wins, challenges, and strategies.', date: '2026-03-19', time: '12:00 PM', type: 'call'      },
  { id: 'e3',  communityId: 'c1', title: '30-Day Social Media Sprint',   description: 'Kickoff for our 30-day social media growth challenge.',             date: '2026-03-25', time: '10:00 AM', type: 'challenge' },
  { id: 'e4',  communityId: 'c1', title: 'Weekly Mastermind Call',       description: 'Our weekly group call to share wins, challenges, and strategies.', date: '2026-03-26', time: '12:00 PM', type: 'call'      },
  { id: 'e5',  communityId: 'c2', title: '7-Day Nutrition Reset Kickoff',description: 'Start your nutrition reset journey with our guided program.',       date: '2026-03-10', time: '9:00 AM',  type: 'challenge' },
  { id: 'e6',  communityId: 'c2', title: 'Live Yoga Flow with David',    description: 'Join David for a 60-minute live yoga flow. All levels welcome.',    date: '2026-03-15', time: '7:00 AM',  type: 'workshop'  },
  { id: 'e7',  communityId: 'c2', title: 'Q&A: Ask the Nutritionist',    description: 'Ask Emma your burning nutrition questions live.',                   date: '2026-03-22', time: '6:00 PM',  type: 'call'      },
  { id: 'e8',  communityId: 'c3', title: 'Q2 Business Planning Session', description: 'Strategic Q2 planning workshop with Rachel.',                       date: '2026-03-11', time: '1:00 PM',  type: 'workshop'  },
  { id: 'e9',  communityId: 'c3', title: 'Founder Fireside Chat',        description: 'Tom shares his startup journey and lessons learned.',               date: '2026-03-18', time: '5:00 PM',  type: 'call'      },
  { id: 'e10', communityId: 'c3', title: 'Design Sprint Workshop',       description: 'Learn rapid prototyping and design thinking with Lisa.',            date: '2026-03-26', time: '2:00 PM',  type: 'workshop'  },
]

const INITIAL_POSTS = [
  { id: 'p1',  communityId: 'c1', memberId: 'm1', content: "Hey everyone! I'm Sarah from Chicago 👋 I've been in digital marketing for 8 years and I'm SO excited to be part of this community. I specialize in email marketing and brand strategy. Looking forward to learning from all of you!", type: 'introduction', likes: 18, likedBy: [], createdAt: '2026-01-20T10:00:00Z' },
  { id: 'p2',  communityId: 'c1', memberId: 'm2', content: "What's up Digital Marketers! Mike here from San Francisco 🌉 I've been obsessing over SEO for 5 years. When I'm not analyzing search data, I'm hiking or hunting for the city's best pour-over coffee. Stoked to connect!", type: 'introduction', likes: 24, likedBy: [], createdAt: '2026-01-22T14:30:00Z' },
  { id: 'p3',  communityId: 'c1', memberId: 'm3', content: "Hello! I'm Aisha, content creator and storyteller based in New York ✨ I've worked with brands from scrappy startups to Fortune 500s. I believe great content starts with deeply understanding your audience. Can't wait to create with all of you!", type: 'introduction', likes: 31, likedBy: [], createdAt: '2026-02-01T09:15:00Z' },
  { id: 'p4',  communityId: 'c1', memberId: 'm4', content: "Hey crew! James here, paid media manager from Austin, TX 🤠 Last quarter I managed $2M in ad spend across Meta, Google, and TikTok and crushed targets by 40%. Excited to share what I know about paid and soak up everything about content and SEO!", type: 'introduction', likes: 27, likedBy: [], createdAt: '2026-02-10T16:45:00Z' },
  { id: 'p5',  communityId: 'c2', memberId: 'm5', content: "Hey Health Warriors! 💪 Jordan here, personal trainer and movement coach from Austin. Fitness should feel like freedom, not punishment! I'm here to share practical, science-backed tips. What's one fitness goal you're determined to crush this year?", type: 'introduction', likes: 42, likedBy: [], createdAt: '2026-01-25T08:00:00Z' },
  { id: 'p6',  communityId: 'c2', memberId: 'm6', content: "Hello lovely community! 🥗 I'm Emma, registered nutritionist and real food advocate based in London. After struggling with my own gut health issues for years, I found healing through whole foods. Now I help make nutrition simple and sustainable!", type: 'introduction', likes: 37, likedBy: [], createdAt: '2026-02-05T11:20:00Z' },
  { id: 'p7',  communityId: 'c2', memberId: 'm7', content: "Namaste! 🙏 I'm David, yoga and mindfulness coach based in Bali. I came to yoga during one of the hardest periods of my life and it literally rewired how I experience stress. Now I teach corporate professionals how to find stillness in the chaos.", type: 'introduction', likes: 58, likedBy: [], createdAt: '2026-02-10T06:30:00Z' },
  { id: 'p8',  communityId: 'c3', memberId: 'm8', content: "Hi Mindful Entrepreneurs! 🙏 Rachel here. I spent 10 years climbing the corporate ladder—VP by 32, burnout by 33. That led me to build my coaching practice focused on sustainable success. The best businesses are built by whole humans!", type: 'introduction', likes: 55, likedBy: [], createdAt: '2026-02-05T16:00:00Z' },
  { id: 'p9',  communityId: 'c3', memberId: 'm9', content: "Hey everyone! Tom here, serial entrepreneur on startup #4 🚀 Failed twice (once spectacularly—I'll tell that story on a call), had one exit, and now building again with more wisdom and scar tissue 😂. Looking forward to deep conversations and real support!", type: 'introduction', likes: 48, likedBy: [], createdAt: '2026-02-08T13:45:00Z' },
  { id: 'p10', communityId: 'c3', memberId: 'm10', content: "Hello mindful builders! I'm Lisa, product designer from Toronto 🍁 I've spent 6 years obsessing over how products can feel intuitive and delightful. How do you all stay creative when you're stressed? Would love to hear your practices!", type: 'introduction', likes: 44, likedBy: [], createdAt: '2026-02-12T10:00:00Z' },
]

// ─── NEW: Plans ───────────────────────────────────────────────────────────────

const INITIAL_PLANS = [
  { id: 'pl1', communityId: 'c1', name: 'Monthly',  price: 47,  interval: 'month', description: 'Full access, billed monthly', features: ['Full community access', 'Weekly live calls', 'Resource library', 'Direct messaging'], isActive: true },
  { id: 'pl2', communityId: 'c1', name: 'Annual',   price: 397, interval: 'year',  description: 'Best value — save $167/yr',  features: ['Everything in Monthly', 'Annual strategy session', 'Priority support', 'Exclusive workshops'], isActive: true },
  { id: 'pl3', communityId: 'c2', name: 'Monthly',  price: 37,  interval: 'month', description: 'Full access, cancel anytime', features: ['Community access', 'Live fitness classes', 'Nutrition guides', 'Accountability partner'], isActive: true },
  { id: 'pl4', communityId: 'c2', name: 'Lifetime', price: 297, interval: 'once',  description: 'Pay once, access forever',   features: ['Everything in Monthly', 'Lifetime content updates', 'VIP member badge', 'Private coaching session'], isActive: true },
  { id: 'pl5', communityId: 'c3', name: 'Monthly',  price: 97,  interval: 'month', description: 'Full coaching access monthly', features: ['Community access', 'Group coaching calls', 'Frameworks & templates', 'Peer accountability'], isActive: true },
  { id: 'pl6', communityId: 'c3', name: 'Annual',   price: 797, interval: 'year',  description: 'Save $367 — best value',     features: ['Everything in Monthly', '1-on-1 strategy call', 'Priority review', 'Annual planning session'], isActive: true },
]

// ─── NEW: Modules ─────────────────────────────────────────────────────────────

const INITIAL_MODULES = [
  { id: 'mod1', communityId: 'c1', title: 'Getting Started',     description: 'Welcome, orientation, and essential setup', order: 1, isPublished: true  },
  { id: 'mod2', communityId: 'c1', title: 'SEO Mastery',         description: 'Master search engine optimization from the ground up', order: 2, isPublished: true  },
  { id: 'mod3', communityId: 'c1', title: 'Content Marketing',   description: 'Create content that attracts and converts', order: 3, isPublished: true  },
  { id: 'mod4', communityId: 'c1', title: 'Paid Advertising',    description: 'Run profitable ad campaigns on any platform', order: 4, isPublished: false },
  { id: 'mod5', communityId: 'c2', title: 'Fitness Foundations', description: 'Build a strong base for lifelong health', order: 1, isPublished: true  },
  { id: 'mod6', communityId: 'c2', title: 'Nutrition 101',       description: 'Fuel your body for peak performance', order: 2, isPublished: true  },
  { id: 'mod7', communityId: 'c3', title: 'Business Clarity',    description: 'Define your vision, values, and ideal client', order: 1, isPublished: true  },
  { id: 'mod8', communityId: 'c3', title: 'Growth Systems',      description: 'Build repeatable systems that scale without you', order: 2, isPublished: true  },
]

// ─── NEW: Lessons ─────────────────────────────────────────────────────────────

const INITIAL_LESSONS = [
  // mod1 — Getting Started
  { id: 'les1',  moduleId: 'mod1', communityId: 'c1', title: 'Welcome to Digital Marketing Academy', type: 'video', content: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', duration: '5:32',     order: 1, isPublished: true  },
  { id: 'les2',  moduleId: 'mod1', communityId: 'c1', title: 'Course Roadmap & What to Expect',      type: 'text',  content: 'In this course you will master the fundamentals of digital marketing. We cover SEO, content, paid ads, email, and analytics. By the end, you\'ll have a complete marketing strategy ready to execute.\n\nHere\'s how to get the most out of this community:\n- Watch each video lesson in order\n- Download the worksheets and fill them in as you go\n- Post your wins and questions in the community feed\n- Join the weekly live calls every Wednesday', duration: '4 min',    order: 2, isPublished: true  },
  { id: 'les3',  moduleId: 'mod1', communityId: 'c1', title: 'Essential Tools Setup Guide',           type: 'pdf',   content: 'tools-setup-guide.pdf',                                            duration: '',          order: 3, isPublished: true  },
  // mod2 — SEO Mastery
  { id: 'les4',  moduleId: 'mod2', communityId: 'c1', title: 'How Search Engines Work',              type: 'video', content: 'https://www.youtube.com/watch?v=BNHR6IQJGZs', duration: '12:45',    order: 1, isPublished: true  },
  { id: 'les5',  moduleId: 'mod2', communityId: 'c1', title: 'Keyword Research Masterclass',         type: 'video', content: 'https://www.youtube.com/watch?v=OMJQSbkDX3E', duration: '28:15',    order: 2, isPublished: true  },
  { id: 'les6',  moduleId: 'mod2', communityId: 'c1', title: 'On-Page SEO Checklist',                type: 'pdf',   content: 'on-page-seo-checklist.pdf',                                        duration: '',          order: 3, isPublished: true  },
  { id: 'les7',  moduleId: 'mod2', communityId: 'c1', title: 'Link Building Strategies Guide',       type: 'link',  content: 'https://ahrefs.com/blog/link-building',                            duration: '',          order: 4, isPublished: true  },
  // mod3 — Content Marketing
  { id: 'les8',  moduleId: 'mod3', communityId: 'c1', title: 'The Content Marketing Blueprint',      type: 'video', content: 'https://www.youtube.com/watch?v=5YDd4mgtNpY', duration: '18:30',    order: 1, isPublished: true  },
  { id: 'les9',  moduleId: 'mod3', communityId: 'c1', title: 'Content Calendar Template',            type: 'link',  content: 'https://docs.google.com/spreadsheets',                             duration: '',          order: 2, isPublished: true  },
  { id: 'les10', moduleId: 'mod3', communityId: 'c1', title: 'Writing for the Web',                  type: 'text',  content: 'Great web copy follows the F-pattern of reading. Users scan, not read. Here are the key principles:\n\n**Lead with value** — Put the most important information first. Never bury the lede.\n\n**Short sentences win** — Aim for under 20 words per sentence. White space is your friend.\n\n**Active voice always** — "We built the tool" beats "The tool was built by us" every time.\n\n**One idea per paragraph** — Don\'t stack multiple concepts. Give each idea room to breathe.',                                            duration: '6 min',     order: 3, isPublished: true  },
  // mod4 — Paid Advertising (draft)
  { id: 'les11', moduleId: 'mod4', communityId: 'c1', title: 'Introduction to Paid Advertising',     type: 'video', content: '',                                                                  duration: '',          order: 1, isPublished: false },
  // mod5 — Fitness Foundations
  { id: 'les12', moduleId: 'mod5', communityId: 'c2', title: 'Understanding Your Body Type',         type: 'video', content: 'https://www.youtube.com/watch?v=qORYBtnZJ6A', duration: '10:15',    order: 1, isPublished: true  },
  { id: 'les13', moduleId: 'mod5', communityId: 'c2', title: 'Beginner Workout Plan (8 Weeks)',       type: 'pdf',   content: 'beginner-workout-plan.pdf',                                         duration: '',          order: 2, isPublished: true  },
  { id: 'les14', moduleId: 'mod5', communityId: 'c2', title: 'Progressive Overload Explained',       type: 'text',  content: 'Progressive overload is the single most important principle in fitness. It means gradually increasing the stress placed on the body during training.\n\nWithout progressive overload, your body adapts and stops changing. With it, you continually improve.\n\n**Ways to apply progressive overload:**\n- Add weight (even 2.5 lbs matters)\n- Add reps\n- Add sets\n- Reduce rest time\n- Improve form and range of motion',                                            duration: '5 min',     order: 3, isPublished: true  },
  // mod6 — Nutrition 101
  { id: 'les15', moduleId: 'mod6', communityId: 'c2', title: 'Macronutrients Explained',             type: 'video', content: 'https://www.youtube.com/watch?v=H89OEWEqlgM', duration: '15:20',    order: 1, isPublished: true  },
  { id: 'les16', moduleId: 'mod6', communityId: 'c2', title: 'Weekly Meal Planning Template',        type: 'link',  content: 'https://docs.google.com/spreadsheets',                             duration: '',          order: 2, isPublished: true  },
  { id: 'les17', moduleId: 'mod6', communityId: 'c2', title: 'Foods That Heal',                      type: 'pdf',   content: 'foods-that-heal.pdf',                                              duration: '',          order: 3, isPublished: true  },
  // mod7 — Business Clarity
  { id: 'les18', moduleId: 'mod7', communityId: 'c3', title: 'Finding Your Business Model',          type: 'video', content: 'https://www.youtube.com/watch?v=QoAOzMTLP5s', duration: '22:10',    order: 1, isPublished: true  },
  { id: 'les19', moduleId: 'mod7', communityId: 'c3', title: 'Ideal Client Avatar Workbook',         type: 'pdf',   content: 'ideal-client-avatar.pdf',                                          duration: '',          order: 2, isPublished: true  },
  { id: 'les20', moduleId: 'mod7', communityId: 'c3', title: 'Crafting Your Value Proposition',      type: 'text',  content: 'A strong value proposition answers three questions clearly:\n\n1. **What do you do?** (be specific, not vague)\n2. **Who is it for?** (name a real person, not a demographic)\n3. **What\'s the outcome?** (measurable result, not a feature)\n\nWeak: "I help people grow their business"\nStrong: "I help coaches 2x their monthly revenue in 90 days without working more hours"',                                            duration: '7 min',     order: 3, isPublished: true  },
  // mod8 — Growth Systems
  { id: 'les21', moduleId: 'mod8', communityId: 'c3', title: 'Building Your First Funnel',           type: 'video', content: 'https://www.youtube.com/watch?v=Kf4kYXW9_1A', duration: '19:45',    order: 1, isPublished: true  },
  { id: 'les22', moduleId: 'mod8', communityId: 'c3', title: '90-Day Revenue Plan Template',         type: 'link',  content: 'https://docs.google.com/spreadsheets',                             duration: '',          order: 2, isPublished: true  },
]

// ─── NEW: Enrollments ─────────────────────────────────────────────────────────

const INITIAL_ENROLLMENTS = [
  { id: 'en1',  communityId: 'c1', memberId: 'm1',  planId: 'pl1', status: 'active', enrolledAt: '2026-01-20', amount: 47  },
  { id: 'en2',  communityId: 'c1', memberId: 'm2',  planId: 'pl2', status: 'active', enrolledAt: '2026-01-22', amount: 397 },
  { id: 'en3',  communityId: 'c1', memberId: 'm3',  planId: 'pl1', status: 'active', enrolledAt: '2026-02-01', amount: 47  },
  { id: 'en4',  communityId: 'c1', memberId: 'm4',  planId: 'pl1', status: 'active', enrolledAt: '2026-02-10', amount: 47  },
  { id: 'en5',  communityId: 'c2', memberId: 'm5',  planId: 'pl3', status: 'active', enrolledAt: '2026-01-25', amount: 37  },
  { id: 'en6',  communityId: 'c2', memberId: 'm6',  planId: 'pl4', status: 'active', enrolledAt: '2026-02-05', amount: 297 },
  { id: 'en7',  communityId: 'c2', memberId: 'm7',  planId: 'pl3', status: 'active', enrolledAt: '2026-02-10', amount: 37  },
  { id: 'en8',  communityId: 'c3', memberId: 'm8',  planId: 'pl6', status: 'active', enrolledAt: '2026-02-05', amount: 797 },
  { id: 'en9',  communityId: 'c3', memberId: 'm9',  planId: 'pl5', status: 'active', enrolledAt: '2026-02-08', amount: 97  },
  { id: 'en10', communityId: 'c3', memberId: 'm10', planId: 'pl5', status: 'active', enrolledAt: '2026-02-12', amount: 97  },
]

// ─── Context ──────────────────────────────────────────────────────────────────

export const AppContext = createContext()
export function useApp() { return useContext(AppContext) }

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

  useEffect(() => save('hub_communities',  communities),  [communities])
  useEffect(() => save('hub_members',      members),      [members])
  useEffect(() => save('hub_events',       events),       [events])
  useEffect(() => save('hub_posts',        posts),        [posts])
  useEffect(() => save('hub_plans',        plans),        [plans])
  useEffect(() => save('hub_modules',      modules),      [modules])
  useEffect(() => save('hub_lessons',      lessons),      [lessons])
  useEffect(() => save('hub_enrollments',  enrollments),  [enrollments])

  // Communities
  const createCommunity = (data) => {
    const c = { id: `c${Date.now()}`, ...data, memberCount: 0, createdAt: new Date().toISOString().split('T')[0] }
    setCommunities(prev => [...prev, c]); return c
  }
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
  const addEvent = (communityId, data) => {
    const e = { id: `e${Date.now()}`, communityId, ...data }
    setEvents(prev => [...prev, e]); return e
  }
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  // Posts
  const addPost = (communityId, memberId, content) => {
    const p = { id: `p${Date.now()}`, communityId, memberId, content, type: 'introduction', likes: 0, likedBy: [], createdAt: new Date().toISOString() }
    setPosts(prev => [p, ...prev]); return p
  }
  const likePost = (postId, userId = 'me') => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const already = p.likedBy.includes(userId)
      return { ...p, likes: already ? p.likes - 1 : p.likes + 1, likedBy: already ? p.likedBy.filter(u => u !== userId) : [...p.likedBy, userId] }
    }))
  }

  // Plans
  const addPlan = (communityId, data) => {
    const p = { id: `pl${Date.now()}`, communityId, ...data, isActive: true }
    setPlans(prev => [...prev, p]); return p
  }
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
  const deleteModule = (id) => {
    setModules(prev => prev.filter(m => m.id !== id))
    setLessons(prev => prev.filter(l => l.moduleId !== id))
  }
  const reorderModule = (communityId, id, dir) => {
    setModules(prev => {
      const cMods = [...prev.filter(m => m.communityId === communityId)].sort((a, b) => a.order - b.order)
      const rest = prev.filter(m => m.communityId !== communityId)
      const idx = cMods.findIndex(m => m.id === id)
      if (dir === 'up' && idx > 0) [cMods[idx - 1], cMods[idx]] = [cMods[idx], cMods[idx - 1]]
      if (dir === 'down' && idx < cMods.length - 1) [cMods[idx], cMods[idx + 1]] = [cMods[idx + 1], cMods[idx]]
      return [...rest, ...cMods.map((m, i) => ({ ...m, order: i + 1 }))]
    })
  }

  // Lessons
  const addLesson = (moduleId, communityId, data) => {
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

  return (
    <AppContext.Provider value={{
      communities, members, events, posts, plans, modules, lessons, enrollments,
      createCommunity, deleteCommunity, addMember,
      addEvent, deleteEvent,
      addPost, likePost,
      addPlan, updatePlan, deletePlan, togglePlan,
      addModule, updateModule, deleteModule, reorderModule,
      addLesson, updateLesson, deleteLesson,
      addEnrollment,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/"                      element={<Dashboard />} />
              <Route path="/admin"                 element={<AdminDashboard />} />
              <Route path="/community/:id"         element={<CommunityView />} />
              <Route path="/community/:id/:tab"    element={<CommunityView />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
