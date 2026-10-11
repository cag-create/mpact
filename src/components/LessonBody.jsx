import React from 'react'

// Renders a Crea'fi rich lesson body from a block array.
// Block types: lead | h | p | ul | kv | callout | dialogue | note
// This is the revamped course "look": Space Grotesk headings, Nunito reading text,
// styled callouts, definition rows, and chat-style dialogue.

const READING = { fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }

const CALLOUT_STYLES = {
  Objective:  { wrap: 'bg-indigo-50 border-indigo-200',  label: 'text-indigo-600',  text: 'text-indigo-950' },
  Checkpoint: { wrap: 'bg-amber-50 border-amber-200',    label: 'text-amber-600',   text: 'text-amber-950' },
  _default:   { wrap: 'bg-zinc-50 border-zinc-200',      label: 'text-zinc-500',    text: 'text-zinc-800' },
}

function Dialogue({ turns }) {
  return (
    <div className="my-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:p-5 space-y-3">
      {turns.map((t, i) => {
        const buyerSide = /buyer|provider|salesperson|agent/i.test(t.who)
        return (
          <div key={i} className={`flex gap-3 ${buyerSide ? 'flex-row-reverse text-right' : ''}`}>
            <span className={`flex-shrink-0 mt-0.5 inline-flex items-center justify-center h-6 px-2 rounded-full text-[10px] font-grotesk font-bold uppercase tracking-wide ${buyerSide ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>{t.who}</span>
            <p className={`text-[15px] leading-relaxed ${buyerSide ? 'text-gray-900' : 'text-gray-600'}`} style={READING}>{t.text}</p>
          </div>
        )
      })}
    </div>
  )
}

function Block({ b }) {
  switch (b.t) {
    case 'lead':
      return <p className="text-[18px] leading-relaxed text-gray-800 font-medium mb-4" style={READING}>{b.text}</p>
    case 'h':
      return (
        <h4 className="flex items-center gap-2.5 mt-7 mb-3">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
          <span className="font-grotesk font-bold text-[13px] uppercase tracking-widest text-gray-900">{b.text}</span>
        </h4>
      )
    case 'p':
      return <p className="text-[15.5px] leading-relaxed text-gray-700 mb-3.5" style={READING}>{b.text}</p>
    case 'note':
      return <p className="text-sm italic text-gray-400 mb-3" style={READING}>{b.text}</p>
    case 'ul':
      return (
        <ul className="space-y-2 mb-4">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-[15.5px] leading-relaxed text-gray-700" style={READING}>
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-fuchsia-400 flex-shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'kv':
      return (
        <div className="my-4 grid gap-2">
          {b.items.map((kv, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-3">
              <span className="font-grotesk font-bold text-[11px] uppercase tracking-wider text-fuchsia-600 sm:w-40 flex-shrink-0">{kv.k}</span>
              <span className="text-[15px] leading-relaxed text-gray-700" style={READING}>{kv.v}</span>
            </div>
          ))}
        </div>
      )
    case 'callout': {
      const s = CALLOUT_STYLES[b.title] || CALLOUT_STYLES._default
      return (
        <div className={`my-5 rounded-2xl border ${s.wrap} px-5 py-4`}>
          {b.title && <p className={`font-grotesk font-bold text-[11px] uppercase tracking-widest mb-1.5 ${s.label}`}>{b.title}</p>}
          <p className={`text-[15.5px] leading-relaxed ${s.text}`} style={READING}>{b.text}</p>
        </div>
      )
    }
    case 'dialogue':
      return <Dialogue turns={b.turns} />
    default:
      return null
  }
}

export default function LessonBody({ blocks }) {
  if (!Array.isArray(blocks)) return null
  return (
    <div className="max-w-2xl">
      {blocks.map((b, i) => <Block key={i} b={b} />)}
    </div>
  )
}
