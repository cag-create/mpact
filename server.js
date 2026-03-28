import express from 'express'
import Stripe from 'stripe'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(express.json())

// Serve the built React app
app.use(express.static(join(__dirname, 'dist')))

// Create Stripe Checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  const { planName, price, interval, communityId, communityName } = req.body

  const origin = req.headers.origin || `https://${req.headers.host}`

  try {
    const isSubscription = interval === 'month' || interval === 'year'

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${communityName} — ${planName} Plan`,
            },
            unit_amount: Math.round(price * 100),
            ...(isSubscription && {
              recurring: { interval: interval === 'year' ? 'year' : 'month' },
            }),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${origin}/community/${communityId}/members?payment=success`,
      cancel_url: `${origin}/community/${communityId}/pricing`,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Send email blast via Brevo
app.post('/api/send-email-blast', async (req, res) => {
  const { apiKey, senderName, senderEmail, subject, htmlContent, recipients } = req.body

  if (!apiKey)              return res.status(400).json({ error: 'Brevo API key required' })
  if (!senderEmail)         return res.status(400).json({ error: 'Sender email required' })
  if (!recipients?.length)  return res.status(400).json({ error: 'No recipients provided' })

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName || 'Mpact', email: senderEmail },
        to: recipients.map(r => ({ email: r.email, name: r.name || r.email })),
        subject,
        htmlContent,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return res.status(response.status).json({ error: err.message || 'Brevo error' })
    }

    const data = await response.json()
    res.json({ success: true, messageId: data.messageId })
  } catch (err) {
    console.error('Brevo error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Extracts the community identifier from the Host header:
// - Subdomain: "creafi.mpact.net" → "creafi"
// - Custom domain: "creaficourse.com" → "creaficourse.com" (full hostname)
// Returns null for the primary domain itself
const PRIMARY_DOMAINS = ['mpact.net', 'ourmpact.com', 'localhost']

function getCommunityIdentifier(host) {
  const hostname = (host || '').split(':')[0]
  const parts = hostname.split('.')

  // Primary domain or www — no injection needed
  if (PRIMARY_DOMAINS.includes(hostname)) return null
  if (parts[0] === 'www') return null

  // Subdomain of a primary domain → return just the subdomain slug
  const isPrimarySubdomain = PRIMARY_DOMAINS.some(d => hostname.endsWith('.' + d))
  if (isPrimarySubdomain) return parts[0]

  // Fully custom domain (e.g. creaficourse.com) — return full hostname
  if (parts.length >= 2 && hostname !== 'localhost') return hostname

  return null
}

// Serve React app — inject community identifier for subdomain/custom domain requests
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html')
  const communityId = getCommunityIdentifier(req.headers.host)
  if (communityId) {
    try {
      let html = readFileSync(indexPath, 'utf8')
      html = html.replace('<head>', `<head><script>window.__MPACT_COMMUNITY__="${communityId}"</script>`)
      res.setHeader('Content-Type', 'text/html')
      return res.send(html)
    } catch {}
  }
  res.sendFile(indexPath)
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
