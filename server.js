import express from 'express'
import Stripe from 'stripe'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
