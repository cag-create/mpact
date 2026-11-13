const Stripe = require('stripe')
const key = process.env.STRIPE_SECRET_KEY || ''
console.log('key prefix:', key.slice(0, 8), '| len:', key.length)
if (/yourstripekey/i.test(key) || !key) { console.error('STILL PLACEHOLDER / EMPTY'); process.exit(1) }
const stripe = new Stripe(key)
;(async () => {
  try {
    const acct = await stripe.accounts.retrieve()
    console.log('ACCOUNT id:', acct.id, '| name:', acct.business_profile?.name || acct.settings?.dashboard?.display_name || '(none)')
  } catch (e) { console.log('account read not permitted (fine):', e.message) }
  try {
    const prods = await stripe.products.list({ limit: 30, active: true })
    console.log('\nEXISTING ACTIVE PRODUCTS (to confirm this is the Crea\'fi account):')
    prods.data.forEach(p => console.log('  •', p.name, '—', p.id))
    console.log('\nproducts.read/write: OK (' + prods.data.length + ' listed)')
  } catch (e) { console.error('products.list FAILED:', e.message) }
})().catch(e => { console.error(e.message); process.exit(1) })
