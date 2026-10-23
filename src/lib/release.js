// Module drip-release gating.
// A module is unlocked for a member when:
//   - it is alwaysOpen (Module 0 & 1 — never gated), OR
//   - it has been released globally (released === true), OR
//   - it has been released to that specific member (member.releasedModules includes its id).
// Admins/builders bypass all of this (canEdit).
export function moduleUnlocked(m, member) {
  if (!m) return false
  if (m.alwaysOpen) return true
  if (m.released) return true
  const rm = member?.releasedModules
  return Array.isArray(rm) && rm.includes(m.id)
}
