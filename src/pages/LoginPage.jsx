import React, { useState } from 'react'
import { useApp } from '../App'
import { MpactMIcon, MpactWordmark } from '../components/Sidebar'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-colors bg-white"

export default function LoginPage() {
  const { login, register, communities } = useApp()
  const [tab, setTab]         = useState('login') // 'login' | 'register'
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm,   setRegForm]   = useState({ name: '', email: '', password: '', communityId: communities[0]?.id || '', title: '', bio: '' })

  const setL = (k, v) => setLoginForm(p => ({ ...p, [k]: v }))
  const setR = (k, v) => setRegForm(p => ({ ...p, [k]: v }))

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = login(loginForm.email.trim(), loginForm.password)
      if (!user) setError('Incorrect email or password')
      setLoading(false)
    }, 400)
  }

  const handleRegister = (e) => {
    e.preventDefault()
    setError('')
    if (!regForm.name.trim())     return setError('Name is required')
    if (!regForm.email.trim())    return setError('Email is required')
    if (regForm.password.length < 6) return setError('Password must be at least 6 characters')
    if (!regForm.communityId)     return setError('Please select a community')
    setLoading(true)
    setTimeout(() => {
      const result = register(regForm.communityId, regForm)
      if (result?.error) setError(result.error)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <MpactMIcon size={44} />
        <MpactWordmark fontSize={28} />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {['login','register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-600'
              }`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" placeholder="you@example.com" value={loginForm.email}
                  onChange={e => setL('email', e.target.value)} className={inputClass} required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={loginForm.password}
                    onChange={e => setL('password', e.target.value)} className={inputClass} required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Platform admin: <span className="font-mono">admin@mpact.com</span> / <span className="font-mono">mpact123</span>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Community</label>
                <select value={regForm.communityId} onChange={e => setR('communityId', e.target.value)} className={inputClass} required>
                  <option value="">Select a community…</option>
                  {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" placeholder="Your name" value={regForm.name}
                  onChange={e => setR('name', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" placeholder="you@example.com" value={regForm.email}
                  onChange={e => setR('email', e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={regForm.password}
                    onChange={e => setR('password', e.target.value)} className={inputClass} required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title / Role <span className="text-gray-300 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Entrepreneur, Coach…" value={regForm.title}
                  onChange={e => setR('title', e.target.value)} className={inputClass} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-gray-700 text-xs mt-6">Powered by Mpact · Community Platform</p>
    </div>
  )
}
