import React from 'react'
import { useNavigate } from 'react-router-dom'

const BRAND = (typeof window !== 'undefined' && window.__MPACT_BRAND__) || null

// SubTo-style welcome landing shown to logged-out visitors on a community's own domain.
export default function WelcomeLanding() {
  const navigate = useNavigate()
  const name    = BRAND?.name || 'the community'
  const logo    = BRAND?.logoUrl
  const joinUrl = BRAND?.joinUrl || null
  const hero    = BRAND?.heroUrl || (BRAND?.id === 'creafi' ? '/creafi-hero.webp' : null)
  const navy    = '#0b2545'
  const year    = new Date().getFullYear()

  const getStarted = () => { if (joinUrl) window.location.href = joinUrl; else navigate('/login') }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: navy }}>
      {/* Top nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4" style={{ background: navy }}>
        <div className="flex items-center gap-2.5">
          {logo
            ? <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center overflow-hidden"><img src={logo} alt={name} className="w-full h-full object-contain" /></div>
            : <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black" style={{ background: BRAND?.color || '#4f46e5' }}>{name[0]}</div>}
          <span className="text-white font-extrabold tracking-tight text-lg">{name}</span>
        </div>
        <button onClick={() => navigate('/login')} className="text-white/90 hover:text-white text-sm font-semibold px-3 py-1.5">Login</button>
      </header>

      {/* Hero — the full banner, shown exactly as-is (never cropped/zoomed), with the CTA below it */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-hidden py-6">
        {hero
          ? <img src={hero} alt={name} className="w-full block" />
          : <div className="w-full h-64" style={{ background: `linear-gradient(135deg, ${BRAND?.color || '#4f46e5'}, ${navy})` }} />}

        <div className="text-center px-6 mt-8 w-full">
          <button
            onClick={getStarted}
            className="inline-flex items-center justify-center px-10 py-3.5 rounded-xl text-white text-base font-bold shadow-lg transition-colors"
            style={{ background: '#2a9df4' }}
            onMouseOver={e => e.currentTarget.style.background = '#1f8ad6'}
            onMouseOut={e => e.currentTarget.style.background = '#2a9df4'}
          >
            Get Started
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-5 sm:px-8 py-5 text-white/60 text-sm" style={{ background: navy }}>
        <span>© {year} {name}</span>
        <div className="flex items-center gap-6">
          <a href={joinUrl ? joinUrl.replace(/\/$/, '') + '/terms' : '#'} className="hover:text-white">Terms</a>
          <a href={joinUrl ? joinUrl.replace(/\/$/, '') + '/privacy' : '#'} className="hover:text-white">Privacy</a>
        </div>
      </footer>
    </div>
  )
}
