// Module drip-release gating.
// A module is unlocked for a member when:
//   - it is alwaysOpen (Module 0 & 1 — never gated), OR
//   - the member is on the $47/month plan: a TIME-BASED drip keyed to their start date
//     (see MONTHLY_DRIP below — independent of the global release flag), OR
//   - it has been released globally (released === true), OR
//   - it has been released to that specific member (member.releasedModules includes its id).
// Admins/builders bypass all of this (canEdit).

// $47/month drip schedule — module id -> the number of months after signup when it unlocks.
// 0 = available immediately. Lifetime ($497) members are NOT gated by this; they use the
// global `released` flag and get everything the moment it's released.
//   Months 0-2 : Crea'fi Genius, Mindset            (also alwaysOpen)
//   Month 3    : Creative Finance, Wholesaling, Dispositions, Business Structures, Agent Outreach
//   Month 6    : Sales Training, Bird Dogging
//   Month 9    : Bonus Courses, Ask Chad (everything remaining)
export const MONTHLY_DRIP = {
  'cf-genius-intro': 0,
  'mod-creafi-1': 0,
  'mod-creafi-2': 3,
  'mod-creafi-3': 3,
  'mod-creafi-4': 3,
  'cf-biz-structures': 3,
  'cf-agent-outreach': 3,
  'mod-creafi-7': 6,
  'cf-bonus-birddog': 6,
  'cf-bonus-zooms': 9,
  'mod-ask-chad': 9,
}

// Whole calendar months elapsed since a yyyy-mm-dd start date (0 before the first monthly anniversary).
export function monthsSince(dateStr) {
  if (!dateStr) return 0
  const start = new Date(dateStr)
  if (isNaN(start.getTime())) return 0
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1   // not yet past this month's anniversary day
  return Math.max(0, months)
}

export function moduleUnlocked(m, member) {
  if (!m) return false
  if (m.alwaysOpen) return true
  // $47/month subscribers: time-based drip, independent of the global release flag so that
  // lifetime members can have everything open while monthly members unlock on schedule.
  if (member?.planType === 'monthly') {
    const unlockMonth = MONTHLY_DRIP[m.id]
    if (unlockMonth == null) return !!m.released   // module not in the schedule → fall back to global
    return monthsSince(member.monthlyStartedAt || member.joinedAt) >= unlockMonth
  }
  if (m.released) return true
  const rm = member?.releasedModules
  return Array.isArray(rm) && rm.includes(m.id)
}
