// Create (idempotently) the Stripe Product + two Prices for the Crea'fi Genius Mastermind tier.
//
//   Run with the Mpact service env so STRIPE_SECRET_KEY is injected:
//     railway run -s "crea'fi course" node scripts/create-mastermind-stripe.cjs
//
// Creates / reuses:
//   • Product "Crea'fi Genius Mastermind" (metadata.tier=creafi-mastermind) with the logo image
//     → shows on the Stripe checkout page and on the invoice/receipt.
//   • Price A  $1,500 one-time            (metadata.plan=pl_creafi_mastermind_full)
//   • Price B  $300/mo, installments = 5  (metadata.plan=pl_creafi_mastermind_5pay,
//                                          metadata.installments=5  ← webhook auto-stops after the 5th)
//
// Prints the two price IDs. Put them into src/data/creafiMastermind.js (stripePriceId) and into
// the live hub_state `plans` rows. Re-running is safe: it reuses anything already created.

const Stripe = require('stripe')
const key = process.env.STRIPE_SECRET_KEY
if (!key || /yourstripekey/i.test(key)) {
  console.error('STRIPE_SECRET_KEY missing or placeholder. Set the real sk_live key on the service first.')
  process.exit(1)
}
const stripe = new Stripe(key)
const LOGO = (process.env.PUBLIC_URL || 'https://ourmpact.com').replace(/\/$/, '') + '/creafi-logo.png'

async function findProduct() {
  // Prefer search (live mode supports it); fall back to listing.
  try {
    const r = await stripe.products.search({ query: `active:'true' AND metadata['tier']:'creafi-mastermind'`, limit: 1 })
    if (r.data[0]) return r.data[0]
  } catch { /* search may be disabled; fall through */ }
  for await (const p of stripe.products.list({ active: true, limit: 100 })) {
    if (p.metadata && p.metadata.tier === 'creafi-mastermind') return p
  }
  return null
}

async function findPrice(productId, planKey) {
  for await (const pr of stripe.prices.list({ product: productId, active: true, limit: 100 })) {
    if (pr.metadata && pr.metadata.plan === planKey) return pr
  }
  return null
}

;(async () => {
  let product = await findProduct()
  if (!product) {
    product = await stripe.products.create({
      name: "Crea'fi Genius Mastermind",
      description: 'The top-tier mastermind — direct coaching, live group calls, and deal structuring help.',
      images: [LOGO],
      metadata: { tier: 'creafi-mastermind', app: 'mpact' },
    })
    console.log('created product', product.id)
  } else {
    // Keep name/description/logo current.
    product = await stripe.products.update(product.id, {
      name: "Crea'fi Genius Mastermind",
      images: [LOGO],
      metadata: { ...product.metadata, tier: 'creafi-mastermind', app: 'mpact' },
    })
    console.log('reusing product', product.id)
  }

  let full = await findPrice(product.id, 'pl_creafi_mastermind_full')
  if (!full) {
    full = await stripe.prices.create({
      product: product.id, currency: 'usd', unit_amount: 150000,
      metadata: { plan: 'pl_creafi_mastermind_full', tier: 'creafi-mastermind' },
      nickname: 'Mastermind — Pay in Full ($1,500 one-time)',
    })
    console.log('created one-time price', full.id)
  } else console.log('reusing one-time price', full.id)

  let five = await findPrice(product.id, 'pl_creafi_mastermind_5pay')
  if (!five) {
    five = await stripe.prices.create({
      product: product.id, currency: 'usd', unit_amount: 30000,
      recurring: { interval: 'month' },
      metadata: { plan: 'pl_creafi_mastermind_5pay', tier: 'creafi-mastermind', installments: '5' },
      nickname: 'Mastermind — 5-Month Plan ($300/mo × 5)',
    })
    console.log('created 5-pay price', five.id)
  } else console.log('reusing 5-pay price', five.id)

  console.log('\n=== PRICE IDS ===')
  console.log('pl_creafi_mastermind_full =', full.id)
  console.log('pl_creafi_mastermind_5pay =', five.id)
})().catch(e => { console.error(e.message); process.exit(1) })
