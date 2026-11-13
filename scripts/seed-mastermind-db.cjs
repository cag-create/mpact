// Idempotently seed the Crea'fi Genius Mastermind community + its two plans into live hub_state.
//   railway run -s MySQL node scripts/seed-mastermind-db.cjs
const mysql = require('mysql2/promise')

const COMMUNITY = {
  id: 'creafi-mastermind', slug: 'creafi-mastermind', name: "Crea'fi Genius Mastermind",
  description: "The top-tier mastermind — direct coaching, live group calls, and hands-on help structuring your real deals.",
  color: '#a16207', emoji: '🏆', memberCount: 0,
  joinUrl: 'https://app.creafigenius.com/join/creafi-mastermind', checkout: 'in-app',
  logoUrl: '/creafi-logo.png', category: 'Finance & Wealth', isLocked: false, lockedScreenLogo: null, createdAt: '2026-11-13',
}
const PLANS = [
  { id: 'pl_creafi_mastermind_full', communityId: 'creafi-mastermind', name: 'Pay in Full', price: 1500, interval: 'once',
    description: 'One payment — save the plan fee and you’re done.',
    features: ['Everything in the Mastermind','Live group coaching calls','Deal structuring help on your real deals','Direct access and member community','One payment of $1,500'],
    isActive: true, stripePriceId: 'price_1UbMJy2ejxCaLu7pR9fJiUsZ' },
  { id: 'pl_creafi_mastermind_5pay', communityId: 'creafi-mastermind', name: '5-Month Plan', price: 300, interval: 'month', installments: 5,
    description: '5 monthly payments of $300 (total $1,500). Billing stops automatically after the 5th.',
    features: ['Everything in the Mastermind','Live group coaching calls','Deal structuring help on your real deals','Direct access and member community','5 payments of $300, then it stops — lifetime access'],
    isActive: true, stripePriceId: 'price_1UbMJy2ejxCaLu7pol66IoNI' },
]

const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v } catch { return null } }

;(async () => {
  const url = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL
  if (!url) { console.error('no MYSQL_PUBLIC_URL / DATABASE_URL'); process.exit(1) }
  const conn = await mysql.createConnection(url)
  const get = async (k) => { const [r] = await conn.query('SELECT v FROM hub_state WHERE k=?', [k]); return r[0] ? parse(r[0].v) : null }
  const set = async (k, val) => { await conn.query('INSERT INTO hub_state (k,v) VALUES (?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)', [k, JSON.stringify(val)]) }

  const communities = (await get('communities')) || []
  if (!communities.some(c => c && c.id === COMMUNITY.id)) {
    await set('communities', [...communities, COMMUNITY]); console.log('added community creafi-mastermind')
  } else console.log('community creafi-mastermind already present — left as-is')

  const plans = (await get('plans')) || []
  const missing = PLANS.filter(p => !plans.some(x => x && x.id === p.id))
  if (missing.length) { await set('plans', [...plans, ...missing]); console.log('added plans:', missing.map(p => p.id).join(', ')) }
  else console.log('both mastermind plans already present — left as-is')

  // Report back
  const c2 = (await get('communities')) || [], p2 = (await get('plans')) || []
  console.log('\nVERIFY:')
  console.log('  community:', JSON.stringify((c2.find(c => c.id === 'creafi-mastermind')) || null))
  p2.filter(p => p.communityId === 'creafi-mastermind').forEach(p => console.log('  plan:', p.id, '$' + p.price, p.interval, p.installments ? `(×${p.installments})` : '', '→', p.stripePriceId))
  await conn.end()
})().catch(e => { console.error(e.message); process.exit(1) })
