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

      {/* Hero */}
      <main className="relative flex-1 flex items-end justify-center overflow-hidden">
        {hero
          ? <img src={hero} alt={name} className="absolute inset-0 w-full h-full object-cover object-center" />
          : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BRAND?.color || '#4f46e5'}, ${navy})` }} />}
        {/* Subtle bottom-only gradient purely for CTA legibility — keeps the photo crisp and true (no wash/blur) */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(11,37,69,0) 52%, rgba(11,37,69,0.72) 100%)' }} />

        <div className="relative z-10 text-center px-6 pb-12 sm:pb-16 pt-24 w-full">
          <p className="text-white font-semibold tracking-wide text-xs sm:text-sm mb-1 uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,.55)' }}>Welcome to</p>
          <h1 className="text-white font-extrabold tracking-tight leading-none text-3xl sm:text-5xl mb-6" style={{ textShadow: '0 2px 14px rgba(0,0,0,.55)' }}>{name}</h1>
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
