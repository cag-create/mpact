import React, { useState } from 'react'

// Crea'fi Genius Lite — interactive deal calculator.
// Three tabs that map to the Lite lessons:
//   offer  → Max offer / seller contract ceiling (Lesson 2)
//   note   → Seller-note payment + balloon (seller financing, hybrid, Stack second)
//   rental → Monthly cash flow & cash-on-cash (subject-to, hybrid, Stack underwriting)
// Teaching tool only — not an appraisal, loan quote, or financial advice.

const READING = { fontFamily: "'Nunito', system-ui, -apple-system, sans-serif" }
const usd = (n) => isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }) : '—'
const usd0 = (n) => isFinite(n) ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'
const pct = (n) => isFinite(n) ? n.toFixed(2) + '%' : '—'
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0 }

// Fully-amortizing monthly payment.
function payment(principal, annualRate, months) {
  const r = annualRate / 100 / 12
  if (months <= 0) return 0
  if (r === 0) return principal / months
  return principal * r / (1 - Math.pow(1 + r, -months))
}
// Remaining balance after `m` payments of a loan amortized over `months`.
function balanceAfter(principal, annualRate, months, m, interestOnly) {
  const r = annualRate / 100 / 12
  if (interestOnly) return principal
  if (r === 0) return Math.max(0, principal - (principal / months) * m)
  const pmt = payment(principal, annualRate, months)
  const bal = principal * Math.pow(1 + r, m) - pmt * ((Math.pow(1 + r, m) - 1) / r)
  return Math.max(0, bal)
}

function Field({ label, value, onChange, prefix, suffix, step }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-grotesk font-bold text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      <div className="flex items-center rounded-xl border border-gray-200 bg-white focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-100">
        {prefix && <span className="pl-3 text-gray-400 text-sm">{prefix}</span>}
        <input type="number" inputMode="decimal" step={step || 'any'} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-[15px] tabular-nums text-gray-900 outline-none" />
        {suffix && <span className="pr-3 text-gray-400 text-sm">{suffix}</span>}
      </div>
    </label>
  )
}

function Result({ label, value, strong, hint }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 px-4 py-2.5 ${strong ? 'bg-fuchsia-50 rounded-xl' : ''}`}>
      <div className="min-w-0">
        <p className={`text-[13px] ${strong ? 'font-grotesk font-bold text-fuchsia-900' : 'text-gray-600'}`} style={strong ? null : READING}>{label}</p>
        {hint && <p className="text-[11px] text-gray-400 leading-snug" style={READING}>{hint}</p>}
      </div>
      <span className={`tabular-nums flex-shrink-0 ${strong ? 'text-[19px] font-black text-fuchsia-700' : 'text-[15px] font-semibold text-gray-800'}`}>{value}</span>
    </div>
  )
}

function OfferCalc({ d = {} }) {
  const [exit, setExit] = useState(d.exit ?? 300000)
  const [resale, setResale] = useState(d.resale ?? 7)
  const [repairs, setRepairs] = useState(d.repairs ?? 42000)
  const [contingency, setContingency] = useState(d.contingency ?? 4200)
  const [acq, setAcq] = useState(d.acq ?? 4000)
  const [holding, setHolding] = useState(d.holding ?? 14000)
  const [profit, setProfit] = useState(d.profit ?? 35000)
  const [fee, setFee] = useState(d.fee ?? 12000)
  const resaleCost = num(exit) * num(resale) / 100
  const allowance = num(exit) - resaleCost - num(repairs) - num(contingency) - num(acq) - num(holding) - num(profit)
  const ceiling = allowance - num(fee)
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Exit price" prefix="$" value={exit} onChange={setExit} />
        <Field label="Resale cost" suffix="%" value={resale} onChange={setResale} />
        <Field label="Repairs" prefix="$" value={repairs} onChange={setRepairs} />
        <Field label="Contingency" prefix="$" value={contingency} onChange={setContingency} />
        <Field label="Acquisition" prefix="$" value={acq} onChange={setAcq} />
        <Field label="Holding / carry" prefix="$" value={holding} onChange={setHolding} />
        <Field label="Buyer profit" prefix="$" value={profit} onChange={setProfit} />
        <Field label="Your fee" prefix="$" value={fee} onChange={setFee} />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-2 self-start divide-y divide-gray-100">
        <Result label="Resale costs" value={usd0(resaleCost)} />
        <Result label="Investor allowance (before fee)" value={usd0(allowance)} />
        <Result label="Max seller contract" value={usd0(ceiling)} strong hint="The most the seller's price can be under these assumptions." />
      </div>
    </div>
  )
}

function NoteCalc({ d = {} }) {
  const [amount, setAmount] = useState(d.amount ?? 250000)
  const [rate, setRate] = useState(d.rate ?? 4)
  const [amort, setAmort] = useState(d.amort ?? 360)
  const [balloon, setBalloon] = useState(d.balloon ?? 60)
  const [io, setIo] = useState(d.io ?? false)
  const pmt = io ? num(amount) * num(rate) / 100 / 12 : payment(num(amount), num(rate), num(amort))
  const bal = balanceAfter(num(amount), num(rate), num(amort), num(balloon), io)
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Note amount" prefix="$" value={amount} onChange={setAmount} />
        <Field label="Interest rate" suffix="%" value={rate} onChange={setRate} />
        <Field label="Amortization" suffix="mo" value={amort} onChange={setAmort} />
        <Field label="Balloon at" suffix="mo" value={balloon} onChange={setBalloon} />
        <label className="col-span-2 flex items-center gap-2 mt-1">
          <input type="checkbox" checked={io} onChange={e => setIo(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-400" />
          <span className="text-[13px] text-gray-600" style={READING}>Interest-only (no principal paid down)</span>
        </label>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-2 self-start divide-y divide-gray-100">
        <Result label="Monthly payment (P&I)" value={usd(pmt)} strong />
        <Result label={`Balance at month ${num(balloon)}`} value={usd(bal)} strong hint="What's still owed when the balloon comes due — plan the payoff before you sign." />
      </div>
    </div>
  )
}

function RentalCalc({ d = {} }) {
  const [rent, setRent] = useState(d.rent ?? 2300)
  const [vac, setVac] = useState(d.vac ?? 5)
  const [mgmt, setMgmt] = useState(d.mgmt ?? 8)
  const [maint, setMaint] = useState(d.maint ?? 5)
  const [reserve, setReserve] = useState(d.reserve ?? 5)
  const [taxins, setTaxins] = useState(d.taxins ?? 320)
  const [debt, setDebt] = useState(d.debt ?? 1201.50)
  const [cash, setCash] = useState(d.cash ?? 44000)
  const R = num(rent)
  const opex = R * (num(vac) + num(mgmt) + num(maint) + num(reserve)) / 100
  const monthly = R - opex - num(taxins) - num(debt)
  const annual = monthly * 12
  const coc = num(cash) > 0 ? annual / num(cash) * 100 : NaN
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monthly rent" prefix="$" value={rent} onChange={setRent} />
        <Field label="Vacancy" suffix="%" value={vac} onChange={setVac} />
        <Field label="Management" suffix="%" value={mgmt} onChange={setMgmt} />
        <Field label="Maintenance" suffix="%" value={maint} onChange={setMaint} />
        <Field label="Capital reserve" suffix="%" value={reserve} onChange={setReserve} />
        <Field label="Taxes + insurance" prefix="$" value={taxins} onChange={setTaxins} />
        <Field label="Debt service (P&I)" prefix="$" value={debt} onChange={setDebt} />
        <Field label="Cash invested" prefix="$" value={cash} onChange={setCash} />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-2 self-start divide-y divide-gray-100">
        <Result label="Operating costs (% of rent)" value={usd(opex)} />
        <Result label="Monthly cash flow" value={usd(monthly)} strong />
        <Result label="Annual cash flow" value={usd(annual)} />
        <Result label="Cash-on-cash return" value={pct(coc)} strong hint="Annual cash flow ÷ cash invested." />
      </div>
    </div>
  )
}

const TABS = [
  { key: 'offer', label: 'Max offer', node: OfferCalc },
  { key: 'note', label: 'Seller note', node: NoteCalc },
  { key: 'rental', label: 'Rental cash flow', node: RentalCalc },
]

export default function DealCalc({ initialTab = 'offer', defaults = {} }) {
  const [tab, setTab] = useState(TABS.some(t => t.key === initialTab) ? initialTab : 'offer')
  const Active = (TABS.find(t => t.key === tab) || TABS[0]).node
  return (
    <div className="my-6 rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="font-grotesk font-bold text-[11px] uppercase tracking-widest text-fuchsia-600">Deal calculator</span>
      </div>
      <div className="flex gap-1 px-3 pt-3">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors ${tab === t.key ? 'bg-zinc-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        <Active d={defaults} />
        <p className="mt-4 text-[11px] text-gray-400 leading-snug" style={READING}>
          Teaching tool only — not an appraisal, loan quote, or financial advice. Verify every number against actual statements, comps, and lender terms.
        </p>
      </div>
    </div>
  )
}
