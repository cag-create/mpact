import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { api } from '../lib/api'
import { CommunityLogo } from '../components/CreafiLogo'

// Public purchase entry for a storefront tier (e.g. /join/creafi-lite).
//  - Logged-in members are sent to the community (they buy via the locked card there).
//  - Logged-out visitors fetch the tier's public purchase info from /api/join/:id
//    (no auth needed) and see a $/mo join card that starts Stripe Checkout. On payment
//    the webhook creates their account and emails the login.
//  - Any tier that isn't in-app-checkout (404) falls back to the app root.
function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium">Loading…</p>
      </div>
    </div>
  )
}

export default function JoinPage() {
  const { slugOrId } = useParams()
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const [tier, setTier] = useState(null)        // { community, plan }
  const [status, setStatus] = useState('loading') // loading | ready | notfound
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // Logged-in members don't buy here — send them into the community (the storefront's
  // locked-tier "Unlock" card handles their purchase).
  useEffect(() => {
    if (currentUser) { navigate(`/community/${slugOrId}`, { replace: true }); return }
    let alive = true
    api.joinInfo(slugOrId)
      .then(data => { if (alive) { setTier(data); setStatus('ready') } })
      .catch(() => { if (alive) setStatus('notfound') })
    return () => { alive = false }
  }, [slugOrId, currentUser, navigate])

  useEffect(() => { if (status === 'notfound') navigate('/', { replace: true }) }, [status, navigate])

  if (status !== 'ready' || !tier) return <Spinner />

  const { community, plan } = tier
  const per = plan.interval === 'year' ? 'year' : 'month'
  const start = async () => {
    setErr(''); setBusy(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name, price: plan.price, interval: plan.interval,
          communityId: community.id, communityName: community.name,
          successPath: '/login?welcome=1', cancelPath: `/join/${slugOrId}`,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setErr(data.error || 'Could not start checkout. Please try again.'); setBusy(false) }
    } catch { setErr('Could not start checkout. Please try again.'); setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="flex justify-center mb-4"><CommunityLogo community={community} size={56} className="rounded-2xl" /></div>
        <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
        {community.description && <p className="text-gray-500 text-sm mt-2">{community.description}</p>}
        <div className="my-6">
          <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
          <span className="text-gray-500">/{per}</span>
        </div>
        {Array.isArray(plan.features) && plan.features.length > 0 && (
          <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
            {plan.features.map((f, i) => (
              <li key={i} className="flex gap-2"><span className="text-emerald-500 flex-shrink-0">✓</span><span>{f}</span></li>
            ))}
          </ul>
        )}
        <button onClick={start} disabled={busy} className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity" style={{ backgroundColor: community.color || '#0f766e' }}>
          {busy ? 'Starting checkout…' : `Join — $${plan.price}/${per}`}
        </button>
        {err && <p className="text-sm text-red-500 mt-3">{err}</p>}
        <p className="text-xs text-gray-400 mt-4">After payment we'll email your login. Already a member? <a href="/login" className="underline">Sign in</a>.</p>
      </div>
    </div>
  )
}
