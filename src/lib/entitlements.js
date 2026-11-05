// Storefront / pay-to-unlock entitlements.
//
// Mpact is a Kajabi-style storefront: every course is VISIBLE to every member,
// but a course only OPENS if the member is entitled to that course's tier.
// A "tier" is a community id — the full course is 'creafi', the $27/mo entry
// track is 'creafi-lite'. Tiers are independent: buying one never unlocks
// another. Admins/owners see everything.
//
// This module is the single source of truth the UI uses to decide locked vs.
// unlocked. The server enforces the same rule when it decides which lesson
// CONTENT to send (so a locked course can't be dug out of app state).

// Tiers that share one storefront — shown together, each gated per purchase.
// Order here is the display order. Add a tier when you launch a new paid track.
export const STOREFRONT_TIERS = ['creafi', 'creafi-lite']

export function isAdminRole(role) {
  return role === 'platform_admin' || role === 'admin' || role === 'owner'
}

export function isStorefrontTier(tierId) {
  return STOREFRONT_TIERS.includes(tierId)
}

// The set of tier ids a member can access right now.
//   - admins/owners: every storefront tier (they build and preview all of it)
//   - everyone else: their HOME tier (the community they belong to) plus any
//     tier they hold an ACTIVE enrollment for.
//
// Including the home tier is the no-lockout guarantee: every current member
// keeps exactly the access they have today, with zero dependence on whether an
// enrollment row happens to exist for them.
export function entitledTierSet({ currentUser, member, enrollments } = {}) {
  if (isAdminRole(currentUser?.role)) return new Set(STOREFRONT_TIERS)
  const set = new Set()
  const home = member?.communityId || currentUser?.communityId
  if (home) set.add(home)
  const memberId = member?.id || currentUser?.memberId || currentUser?.id
  if (memberId) {
    for (const e of enrollments || []) {
      if (e && e.status === 'active' && e.memberId === memberId && e.communityId) set.add(e.communityId)
    }
  }
  return set
}

export function hasTierAccess(tierId, entitled) {
  return entitled instanceof Set && entitled.has(tierId)
}
