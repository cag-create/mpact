import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useApp } from '../App'
import { api } from '../lib/api'
import { CommunityLogo } from './CreafiLogo'

// "Ask Chad" — the member-facing strategy-coach chat. Calls the Mpact server proxy
// (POST /api/ask-chad), which forwards to the Crea'fi Ask-Chad backend with the shared
// key server-side. Answers in Chad's teaching voice, grounded in the course knowledge;
// hard questions get flagged so Chad answers them personally.
const STARTERS = [
  'How do I explain taking over the payments to a seller without naming the structure?',
  'The seller owes more than the house is worth — what structures fit?',
  'What do I say to a listing agent on a low-equity on-market deal?',
  'How do I figure ARV on a property?',
]

export default function AskChad({ onBack, community, moduleContext }) {
  useApp() // ensures we're inside the app context (member session)
  const [messages, setMessages] = useState([]) // {role:'user'|'assistant', content, flagged?}
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)
  const accent = community?.color || '#111111'

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  async function ask(q) {
    const question = (q ?? input).trim()
    if (!question || sending) return
    setError(null)
    setInput('')
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setSending(true)
    try {
      const res = await api.askChad({ question, history, moduleContext })
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer || '…', flagged: !!res.flaggedForChad }])
    } catch (e) {
      setError(e?.message || 'Ask Chad is unavailable right now. Try again in a moment.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        {onBack && <button onClick={onBack} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"><ArrowLeft size={18} /></button>}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: accent }}>
            {community ? <CommunityLogo community={community} size={22} /> : <span className="font-bold">C</span>}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-grotesk">Ask Chad</h2>
            <p className="text-xs text-gray-500">Your strategy coach — creative finance, structuring, acquisitions. Trained on everything we teach.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '62vh', minHeight: 420 }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-sm text-gray-600 mb-4 max-w-md">Ask anything about structuring a deal, talking to sellers or agents, or how a strategy works. I answer in plain English, the way we teach it — and the hard ones I flag so Chad answers you personally.</p>
              <div className="grid gap-2 w-full max-w-md">
                {STARTERS.map((s, i) => (
                  <button key={i} onClick={() => ask(s)} className="text-left text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl px-3.5 py-2.5 border border-gray-100">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'text-white' : 'bg-gray-100 text-gray-900'}`}
                style={m.role === 'user' ? { background: accent } : undefined}
              >
                {m.content}
                {m.flagged && <div className="mt-2 pt-2 border-t border-gray-300/60 text-[11px] text-gray-500">📌 Flagged for Chad — he’ll follow up on this one personally.</div>}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start"><div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chad is thinking…</div></div>
          )}
          {error && <div className="text-center text-xs text-red-500">{error}</div>}
          <div ref={endRef} />
        </div>

        <div className="border-t border-gray-100 p-3">
          <form onSubmit={e => { e.preventDefault(); ask() }} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
              rows={1}
              placeholder="Ask Chad a question…"
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 max-h-32"
            />
            <button type="submit" disabled={sending || !input.trim()} className="p-3 rounded-xl text-white disabled:opacity-40" style={{ background: accent }}><Send size={16} /></button>
          </form>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center">Teaching guidance, not legal/tax/financial advice. Numbers are examples, not rules.</p>
        </div>
      </div>
    </div>
  )
}
