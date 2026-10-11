import React, { useState } from 'react'
import { Check, X, RotateCcw, Award } from 'lucide-react'

const READING = { fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }

// Member-facing quiz: multiple choice, instant scoring + feedback, retake.
// quiz = { title, passPct, questions: [{ q, choices:[...], answer: <index> }] }
export default function Quiz({ quiz, onComplete }) {
  const questions = quiz?.questions || []
  const passPct = quiz?.passPct ?? 70
  const [picked, setPicked] = useState({})      // qIndex -> choiceIndex
  const [submitted, setSubmitted] = useState(false)

  const answeredCount = Object.keys(picked).length
  const allAnswered = answeredCount === questions.length && questions.length > 0
  const correctCount = questions.reduce((n, q, i) => n + (picked[i] === q.answer ? 1 : 0), 0)
  const pct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0
  const passed = pct >= passPct

  const submit = () => {
    if (!allAnswered) return
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (onComplete) onComplete(passed)
  }
  const retake = () => { setPicked({}); setSubmitted(false) }

  return (
    <div className="max-w-2xl">
      {submitted && (
        <div className={`mb-6 rounded-2xl border px-5 py-5 flex items-center gap-4 ${passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${passed ? 'bg-green-500' : 'bg-amber-500'}`}>
            <Award size={22} className="text-white" />
          </div>
          <div>
            <p className={`font-grotesk font-bold text-lg ${passed ? 'text-green-800' : 'text-amber-800'}`}>
              {passed ? 'Passed!' : 'Not quite yet'} — {correctCount}/{questions.length} ({pct}%)
            </p>
            <p className="text-sm text-gray-600" style={READING}>
              {passed ? 'Nice work. ' : `You need ${passPct}% to pass. `}The correct answers are highlighted in green below.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = picked[qi]
          return (
            <div key={qi} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <p className="font-grotesk font-semibold text-[15px] text-gray-900 mb-3.5">
                <span className="text-fuchsia-500">{qi + 1}.</span> {q.q}
              </p>
              <div className="space-y-2">
                {q.choices.map((c, ci) => {
                  const isChosen = chosen === ci
                  const isAnswer = q.answer === ci
                  let cls = 'border-gray-200 hover:border-gray-300 text-gray-700'
                  let mark = null
                  if (submitted) {
                    if (isAnswer) { cls = 'border-green-400 bg-green-50 text-green-900'; mark = <span className="flex items-center gap-1 text-[11px] font-grotesk font-bold uppercase tracking-wide text-green-600 flex-shrink-0">Correct<Check size={15} /></span> }
                    else if (isChosen) { cls = 'border-red-300 bg-red-50 text-red-900'; mark = <span className="flex items-center gap-1 text-[11px] font-grotesk font-bold uppercase tracking-wide text-red-500 flex-shrink-0">Your pick<X size={15} /></span> }
                    else cls = 'border-gray-200 text-gray-400'
                  } else if (isChosen) {
                    cls = 'border-gray-900 bg-gray-50 text-gray-900'
                  }
                  return (
                    <button
                      key={ci}
                      disabled={submitted}
                      onClick={() => setPicked(p => ({ ...p, [qi]: ci }))}
                      className={`w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border-2 text-[15px] transition-colors ${cls} disabled:cursor-default`}
                      style={READING}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isChosen && !submitted ? 'border-gray-900' : 'border-gray-300'}`}>
                        {isChosen && !submitted && <span className="w-2 h-2 rounded-full bg-gray-900" />}
                      </span>
                      <span className="flex-1">{c}</span>
                      {mark}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {!submitted ? (
          <>
            <span className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</span>
            <button onClick={submit} disabled={!allAnswered}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
              Submit answers
            </button>
          </>
        ) : (
          <button onClick={retake} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50">
            <RotateCcw size={15} /> Retake quiz
          </button>
        )}
      </div>
    </div>
  )
}
