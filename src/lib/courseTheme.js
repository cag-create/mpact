// Per-module thumbnail theming for course lessons. Mirrors the capsule-card
// gradient palette in CoursesTab so a module's lessons share its color.
export const GRADIENTS = [
  'linear-gradient(135deg,#7c3aed 0%,#d946ef 55%,#fb7185 100%)',
  'linear-gradient(135deg,#0ea5e9 0%,#2563eb 55%,#1e3a8a 100%)',
  'linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)',
  'linear-gradient(135deg,#10b981 0%,#14b8a6 55%,#0891b2 100%)',
  'linear-gradient(135deg,#ec4899 0%,#d946ef 55%,#8b5cf6 100%)',
  'linear-gradient(135deg,#6366f1 0%,#3b82f6 55%,#06b6d4 100%)',
]
export const DOTS = 'radial-gradient(rgba(255,255,255,0.22) 1.4px, transparent 1.5px)'

function hashStr(s) {
  let h = 0
  for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Stable gradient for a module: by its order when present (matches the card index),
// else by a hash of its id.
export function moduleGradient(module) {
  if (!module) return GRADIENTS[0]
  const n = Number.isFinite(module.order) ? Math.max(0, Math.round(module.order) - 1) : hashStr(module.id)
  return GRADIENTS[n % GRADIENTS.length]
}
