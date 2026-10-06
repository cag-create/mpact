// Event recurrence helpers.
// An event stores: date ('yyyy-MM-dd' start), optional time/endTime (display strings),
// recur ('none'|'daily'|'weekly'|'biweekly'|'monthly'), and until ('yyyy-MM-dd' | '').
// A one-off event only occurs on its own date. A recurring event repeats from its start
// date, on the matching cadence, through `until` (inclusive) or indefinitely if blank.

const toStr = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function occursOn(event, dateStr) {
  if (!event?.date) return false
  if (event.date === dateStr) return true
  const recur = event.recur && event.recur !== 'none' ? event.recur : null
  if (!recur) return false
  if (dateStr < event.date) return false
  if (event.until && dateStr > event.until) return false
  const start = new Date(event.date + 'T00:00:00')
  const d = new Date(dateStr + 'T00:00:00')
  const days = Math.round((d - start) / 86400000)
  if (recur === 'daily') return days >= 0
  if (recur === 'weekly') return days % 7 === 0
  if (recur === 'biweekly') return days % 14 === 0
  if (recur === 'monthly') return d.getDate() === start.getDate()
  return false
}

// Expand events into concrete dated occurrences from `fromStr` forward.
export function upcomingOccurrences(events, fromStr, { horizonDays = 180, max = 60 } = {}) {
  const out = []
  const from = new Date(fromStr + 'T00:00:00')
  for (let i = 0; i < horizonDays && out.length < max; i++) {
    const d = new Date(from); d.setDate(d.getDate() + i)
    const ds = toStr(d)
    for (const e of events) if (occursOn(e, ds)) out.push({ ...e, date: ds })
  }
  return out
}

export const RECUR_OPTIONS = [
  { value: 'none',     label: 'Does not repeat' },
  { value: 'daily',    label: 'Every day' },
  { value: 'weekly',   label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly',  label: 'Every month' },
]

export const RECUR_LABEL = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 wks', monthly: 'Monthly',
}

export function timeLabel(e) {
  if (e?.time && e?.endTime) return `${e.time} – ${e.endTime}`
  return e?.time || ''
}
