import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { CommunityLogo } from '../components/CreafiLogo'

// Public purchase entry for a storefront tier (e.g. /join/creafi-lite).
//  - Logged-in members are sent to the storefront (they buy via the locked card there).
//  - Logged-out visitors on an in-app-checkout tier see a $/mo join card that starts
//    Stripe Checkout. On payment the webhook creates their account and emails the login.
//  - Any other community falls back to its own join funnel (joinUrl) or the app.
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
  const { communities, plans, currentUser } = useApp()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const community = communities.find(c => c.slug === slugOrId || c.id === slugOrId)
  const plan = community ? plans?.find(p => p.communityId === community.id && p.isActive) : null
  const purchasable = !!(community && !currentUser && plan && community.checkout === 'in-app')

  useEffect(() => {
    if (!community) { if (slugOrId) navigate('/', { replace: true }); return }
    if (currentUser) { navigate(`/community/${community.id}`, { replace: true }); return }
    if (!purchasable) {
      if (community.joinUrl && /^https?:\/\//.test(community.joinUrl)) window.location.href = community.joinUrl
      else navigate(`/community/${community.id}`, { replace: true })
    }
  }, [community, currentUser, purchasable, slugOrId, navigate])

  if (!purchasable) return <Spinner />

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
