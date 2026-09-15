import express from 'express'
import Stripe from 'stripe'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const app = express()
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const __dirname = dirname(fileURLToPath(import.meta.url))
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
const PUBLIC_URL = (process.env.PUBLIC_URL || 'https://mpact-production.up.railway.app').replace(/\/$/, '')

// ─── Database (Railway MySQL via DATABASE_URL) ─────────────────────────────────
// All shared app state lives in hub_state (one JSON blob per collection) and
// accounts live in hub_users. This replaces the browser-only localStorage the
// app started with, so members share one community from any device.
const pool = process.env.DATABASE_URL ? mysql.createPool(process.env.DATABASE_URL) : null

async function initDb() {
  if (!pool) { console.warn('DATABASE_URL not set — running without persistence'); return }
  await pool.query(`CREATE TABLE IF NOT EXISTS hub_state (
    k VARCHAR(64) PRIMARY KEY, v LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS hub_users (
    id VARCHAR(40) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(255), role VARCHAR(32) NOT NULL DEFAULT 'member', community_id VARCHAR(64), member_id VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login_at DATETIME NULL)`)
  // Seed the platform admin from env the first time.
  const [admins] = await pool.query(`SELECT id FROM hub_users WHERE role='platform_admin' LIMIT 1`)
  if (!admins.length && process.env.MPACT_ADMIN_EMAIL && process.env.MPACT_ADMIN_PASSWORD) {
    await pool.query(`INSERT INTO hub_users (id,email,password_hash,name,role) VALUES (?,?,?,?,?)`,
      ['u_admin', process.env.MPACT_ADMIN_EMAIL.toLowerCase(), await bcrypt.hash(process.env.MPACT_ADMIN_PASSWORD, 10), 'Chad Glover', 'platform_admin'])
    console.log('Seeded platform admin', process.env.MPACT_ADMIN_EMAIL)
  }
}

const SHARED_KEYS = ['communities','members','events','posts','plans','modules','lessons','enrollments','educators','educatorPlan','messages','notifications','sequences','courses','replays','progress']
const ADMIN_KEYS  = new Set(['communities','plans','modules','lessons','educators','educatorPlan','sequences','events','courses','replays'])
const MERGE_KEYS  = new Set(['members','posts','messages','notifications','enrollments','progress'])
const isAdmin = (u) => u && (u.role === 'platform_admin' || u.role === 'admin' || u.role === 'owner')

async function getState(key) {
  const [rows] = await pool.query('SELECT v FROM hub_state WHERE k=?', [key])
  return rows.length ? JSON.parse(rows[0].v) : null
}
async function setState(key, value) {
  await pool.query('INSERT INTO hub_state (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [key, JSON.stringify(value)])
}
function mergeById(serverList, clientList) {
  const out = new Map((serverList || []).map(x => [x.id, x]))
  for (const item of clientList || []) if (item && item.id) out.set(item.id, item)
  return [...out.values()]
}
const publicUser = (r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, communityId: r.community_id, memberId: r.member_id, createdAt: r.created_at, lastLoginAt: r.last_login_at })
const signToken = (u) => jwt.sign({ uid: u.id, role: u.role }, JWT_SECRET, { expiresIn: '30d' })
const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#84cc16']

async function createMemberAndUser({ communityId, name, email, password, title = '', bio = '', avatarUrl = null }) {
  const memberId = `m${Date.now()}${Math.floor(Math.random()*1000)}`
  const member = { id: memberId, communityId, name, email, title, bio, avatarUrl, role: 'member', points: 0, badges: ['New Member'],
    color: AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)], joinedAt: new Date().toISOString().split('T')[0] }
  const members = (await getState('members')) || []
  await setState('members', [...members, member])
  const communities = await getState('communities')
  if (communities) await setState('communities', communities.map(c => c.id === communityId ? { ...c, memberCount: (c.memberCount || 0) + 1 } : c))
  const id = `u${Date.now()}${Math.floor(Math.random()*1000)}`
  await pool.query(`INSERT INTO hub_users (id,email,password_hash,name,role,community_id,member_id,last_login_at) VALUES (?,?,?,?,?,?,?,NOW())`,
    [id, email, await bcrypt.hash(password, 10), name, 'member', communityId, memberId])
  const [rows] = await pool.query('SELECT * FROM hub_users WHERE id=?', [id])
  return { user: rows[0], member }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
async function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not signed in' })
  try {
    const { uid } = jwt.verify(token, JWT_SECRET)
    const [rows] = await pool.query('SELECT * FROM hub_users WHERE id=?', [uid])
    if (!rows.length) return res.status(401).json({ error: 'Account not found' })
    req.user = rows[0]; next()
  } catch { return res.status(401).json({ error: 'Session expired' }) }
}
const needDb = (req, res, next) => pool ? next() : res.status(503).json({ error: 'Database not configured' })

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now(), db: !!pool }))

// Stripe webhook needs raw body — must come BEFORE express.json()
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).send('Stripe not configured')
  let event
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET) }
  catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`) }
  console.log('stripe event', event.type)
  res.json({ received: true })
})

app.use(express.json({ limit: '10mb' }))

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', needDb, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase(), password = String(req.body.password || '')
  const [rows] = await pool.query('SELECT * FROM hub_users WHERE email=?', [email])
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return res.status(401).json({ error: 'Incorrect email or password' })
  await pool.query('UPDATE hub_users SET last_login_at=NOW() WHERE id=?', [rows[0].id])
  res.json({ token: signToken(rows[0]), user: publicUser({ ...rows[0], last_login_at: new Date() }) })
})

app.post('/api/auth/register', needDb, async (req, res) => {
  const { communityId, name, email: rawEmail, password, title, bio, avatarUrl } = req.body || {}
  const email = String(rawEmail || '').trim().toLowerCase()
  if (!communityId || !name || !email || !password) return res.status(400).json({ error: 'Missing fields' })
  if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  const [dupe] = await pool.query('SELECT id FROM hub_users WHERE email=?', [email])
  if (dupe.length) return res.status(409).json({ error: 'Email already in use' })
  const gate = ((await getState('communities')) || []).find(c => c.id === communityId)
  if (gate?.joinUrl) return res.status(403).json({ error: `Membership for ${gate.name} is by purchase. Join at ${gate.joinUrl}` })
  const { user, member } = await createMemberAndUser({ communityId, name: String(name).trim(), email, password, title, bio, avatarUrl })
  res.json({ token: signToken(user), user: publicUser(user), member })
})

app.get('/api/auth/me', needDb, auth, (req, res) => res.json({ user: publicUser(req.user) }))

app.post('/api/auth/change-password', needDb, auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {}
  if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!(await bcrypt.compare(String(oldPassword || ''), req.user.password_hash))) return res.status(401).json({ error: 'Current password is incorrect' })
  await pool.query('UPDATE hub_users SET password_hash=? WHERE id=?', [await bcrypt.hash(String(newPassword), 10), req.user.id])
  res.json({ ok: true })
})

// ─── Provisioning (server-to-server, used by creafigenius.com after payment) ──
app.post('/api/members/provision', needDb, async (req, res) => {
  const key = req.headers['x-api-key']
  if (!process.env.MPACT_API_KEY || key !== process.env.MPACT_API_KEY) return res.status(401).json({ error: 'Bad API key' })
  const email = String(req.body.email || '').trim().toLowerCase(), name = String(req.body.name || '').trim() || email
  const communityId = String(req.body.communityId || 'creafi')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Bad email' })
  const password = crypto.randomBytes(9).toString('base64url').replace(/[-_]/g, 'x').slice(0, 12)
  const [rows] = await pool.query('SELECT * FROM hub_users WHERE email=?', [email])
  if (rows.length) {
    if (rows[0].role === 'platform_admin') return res.status(409).json({ error: 'That email belongs to the platform admin; sign in normally.' })
    await pool.query('UPDATE hub_users SET password_hash=? WHERE id=?', [await bcrypt.hash(password, 10), rows[0].id])
    return res.json({ existing: true, email, password, loginUrl: `${PUBLIC_URL}/login` })
  }
  await createMemberAndUser({ communityId, name, email, password })
  res.json({ existing: false, email, password, loginUrl: `${PUBLIC_URL}/login` })
})

// ─── Shared state ─────────────────────────────────────────────────────────────
app.get('/api/state', needDb, auth, async (_req, res) => {
  const [rows] = await pool.query('SELECT k, v FROM hub_state')
  const out = {}
  for (const r of rows) if (SHARED_KEYS.includes(r.k)) out[r.k] = JSON.parse(r.v)
  res.json(out)
})

app.put('/api/state/:key', needDb, auth, async (req, res) => {
  const key = req.params.key
  if (!SHARED_KEYS.includes(key)) return res.status(400).json({ error: 'Unknown key' })
  if (ADMIN_KEYS.has(key) && !isAdmin(req.user)) return res.status(403).json({ error: 'Admin only' })
  let value = req.body?.value
  if (value === undefined) return res.status(400).json({ error: 'Missing value' })
  if (MERGE_KEYS.has(key) && !isAdmin(req.user)) value = mergeById(await getState(key), value)
  await setState(key, value)
  res.json({ ok: true })
})

app.get('/api/users', needDb, auth, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admin only' })
  const [rows] = await pool.query('SELECT * FROM hub_users ORDER BY created_at DESC')
  res.json({ users: rows.map(publicUser) })
})

// ─── Stripe Checkout + Brevo blast (unchanged) ────────────────────────────────
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })
  const { planName, price, interval, communityId, communityName } = req.body
  const origin = req.headers.origin || `https://${req.headers.host}`
  try {
    const isSubscription = interval === 'month' || interval === 'year'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: `${communityName} — ${planName} Plan` }, unit_amount: Math.round(price * 100), ...(isSubscription && { recurring: { interval: interval === 'year' ? 'year' : 'month' } }) }, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${origin}/community/${communityId}/members?payment=success`,
      cancel_url: `${origin}/community/${communityId}/pricing`,
    })
    res.json({ url: session.url })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/send-email-blast', async (req, res) => {
  const { apiKey, senderName, senderEmail, subject, htmlContent, recipients } = req.body
  if (!apiKey) return res.status(400).json({ error: 'Brevo API key required' })
  if (!senderEmail) return res.status(400).json({ error: 'Sender email required' })
  if (!recipients?.length) return res.status(400).json({ error: 'No recipients provided' })
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ sender: { name: senderName || 'Mpact', email: senderEmail }, to: recipients.map(r => ({ email: r.email, name: r.name || r.email })), subject, htmlContent }) })
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err.message || 'Brevo error' }) }
    res.json({ success: true, messageId: (await response.json()).messageId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Early-access waitlist (marketing site) ───────────────────────────────────
app.post('/api/waitlist', needDb, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim().slice(0, 120)
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please add your name and a valid email.' })
  const entry = { id: `wl${Date.now()}`, name, email, community: String(req.body?.community || '').trim().slice(0, 160), about: String(req.body?.about || '').trim().slice(0, 1000), createdAt: new Date().toISOString(), ip: req.headers['x-forwarded-for'] || req.ip }
  const list = (await getState('waitlist')) || []
  if (list.length >= 5000) return res.status(429).json({ error: 'The list is full for now.' })
  const rest = list.filter(x => x.email !== email)
  await setState('waitlist', [...rest, entry])
  res.json({ ok: true })
})
app.get('/api/waitlist', needDb, auth, async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admin only' })
  res.json({ waitlist: ((await getState('waitlist')) || []).slice().reverse() })
})

app.all('/api/*', (_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Static app + subdomain injection ─────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist'), { index: false }))  // '/' falls through to the injecting handler below
const PRIMARY_DOMAINS = ['mpact.net', 'ourmpact.com', 'localhost', 'mpact-production.up.railway.app']
function getCommunityIdentifier(host) {
  const hostname = (host || '').split(':')[0], parts = hostname.split('.')
  if (PRIMARY_DOMAINS.includes(hostname) || parts[0] === 'www' || hostname.endsWith('.up.railway.app')) return null
  if (PRIMARY_DOMAINS.some(d => hostname.endsWith('.' + d))) return parts[0]
  if (parts.length >= 2 && hostname !== 'localhost') return hostname
  return null
}
let brandCache = { at: 0, list: [] }
async function communityBrand(identifier) {
  if (!pool) return null
  if (Date.now() - brandCache.at > 30000) {
    try { brandCache = { at: Date.now(), list: (await getState('communities')) || [] } } catch { brandCache.at = Date.now() }
  }
  const c = brandCache.list.find(c => c.id === identifier || c.slug === identifier || c.customDomain === identifier)
  return c ? { id: c.id, name: c.name, logoUrl: c.logoUrl || null, color: c.color || null, joinUrl: c.joinUrl || null, description: c.description || '' } : null
}

// Marketing site: the front page of ourmpact.com (apex + www). The app lives at /dashboard, /login, ….
const MARKETING_HOSTS = ['ourmpact.com', 'www.ourmpact.com', 'localhost']
app.use('/marketing', express.static(join(__dirname, 'marketing'), { index: false }))
app.get('/', (req, res, next) => {
  const hostname = (req.headers.host || '').split(':')[0]
  if (!MARKETING_HOSTS.includes(hostname)) return next()
  res.sendFile(join(__dirname, 'marketing', 'index.html'))
})

app.get('*', async (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html')
  const communityId = getCommunityIdentifier(req.headers.host)
  if (communityId) {
    try {
      const brand = await communityBrand(communityId)
      const inject = `<script>window.__MPACT_COMMUNITY__=${JSON.stringify(communityId)};window.__MPACT_BRAND__=${JSON.stringify(brand)}</script>`
      let html = readFileSync(indexPath, 'utf8').replace('<head>', `<head>${inject}`)
      if (brand?.name) html = html.replace(/<title>[^<]*<\/title>/, `<title>${brand.name.replace(/[<>&]/g, '')}</title>`)
      res.setHeader('Content-Type', 'text/html'); return res.send(html)
    } catch {}
  }
  res.sendFile(indexPath)
})

const PORT = process.env.PORT || 8080
initDb().catch(e => console.error('DB init failed:', e.message)).finally(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
