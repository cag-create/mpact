// Crea'fi Genius — "Zero to Deal in 90 Days" ($27/mo, communityId 'creafi-genius').
//
// A standalone paid community that carries the SAME two tracks as Crea'fi Genius Lite
// (Creative Finance + Wholesaling), presented under the flagship "Crea'fi Genius" name
// with the "Zero to Deal in 90 Days" hook. The course content is CLONED from CREAFI_LITE
// with ids + communityId remapped to 'creafi-genius', so it stays in sync with the Lite
// source and never bleeds into the Lite or full-course communities.
//
// Seeded additively + idempotently by an admin-only effect in App.jsx (same pattern as
// CREAFI_LITE). $27/mo in-app checkout, same as Lite (inline price, no persisted price id).

import { CREAFI_LITE } from './creafiLiteCourse'

const NEW_CID = 'creafi-genius'
// Remap helpers: course ids are 'creafi-lite-*'; module/lesson ids are 'cl-*'.
const rCourse = (id) => (id ? String(id).replace(/^creafi-lite-/, 'creafi-genius-') : id)
const rNode = (id) => (id ? String(id).replace(/^cl-/, 'cg-') : id)

export const CREAFI_GENIUS = {
  community: {
    id: NEW_CID,
    slug: NEW_CID,
    name: "Crea'fi Genius",
    description: 'Zero to Deal in 90 Days',
    color: '#dc2626', // Crea'fi red — distinct from Lite (teal), full course (black), Mastermind (gold)
    emoji: '🚀',
    memberCount: 0,
    // Truthy joinUrl keeps free self-registration blocked (purchase-only); `checkout: 'in-app'`
    // runs the $27/mo Stripe checkout here instead of redirecting to an external funnel.
    joinUrl: 'https://app.creafigenius.com/join/creafi-genius',
    checkout: 'in-app',
    logoUrl: '/creafi-logo.png', // TODO: swap to the custom "Zero to Deal in 90 Days" thumbnail
    category: 'Finance & Wealth',
    isLocked: false,
    lockedScreenLogo: null,
    createdAt: '2026-11-23',
  },

  plan: {
    id: 'pl_creafi_genius_monthly',
    communityId: NEW_CID,
    name: "Crea'fi Genius",
    price: 27,
    interval: 'month',
    description: 'Zero to Deal in 90 Days — billed monthly',
    features: [
      'Two tracks: Creative Finance and Wholesaling',
      'The five creative structures: subject-to, seller financing, hybrid, novation, the Stack Method',
      'The wholesale pipeline: find deals, build a buyers list, assignment vs double close, get paid',
      'An interactive deal calculator: max offer, seller note & balloon, rental cash flow',
      'Talk-to-the-seller scripts in plain language',
      'A self-check quiz at the end of each track',
    ],
    isActive: true,
  },

  // Content cloned from the Lite tracks, remapped into the 'creafi-genius' community.
  courses: CREAFI_LITE.courses.map((c) => ({ ...c, id: rCourse(c.id), communityId: NEW_CID })),
  modules: CREAFI_LITE.modules.map((m) => ({ ...m, id: rNode(m.id), communityId: NEW_CID, courseId: rCourse(m.courseId) })),
  lessons: CREAFI_LITE.lessons.map((l) => ({ ...l, id: rNode(l.id), communityId: NEW_CID, moduleId: rNode(l.moduleId), courseId: rCourse(l.courseId) })),
}
