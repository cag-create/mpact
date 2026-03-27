import React from 'react'

/**
 * CreafiLogo — faithful recreation of the embroidered Crea'fi patch.
 * Black background · white brain-bulb outline · center divider
 * Left: Car, Airplane, House, Building
 * Right: Briefcase, Sailboat, Camera, Phone
 */
export default function CreafiLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.22)}
      viewBox="0 0 120 146"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* ─ BLACK BACKGROUND ─────────────────────── */}
      <rect width="120" height="146" fill="#000" />

      {/* ─ BRAIN-BULB OUTLINE ───────────────────── */}
      {/* Bumpy brain-top, smooth sides, tapers to neck */}
      <path
        d="M 60 9
           C 68 4, 78 6, 82 17
           C 88 9, 98 9, 100 23
           C 110 29, 112 49, 106 67
           C 110 81, 106 97, 94 105
           L 92 114 L 28 114
           L 26 105
           C 14 97, 10 81, 14 67
           C 8 49, 10 29, 20 23
           C 22 9, 32 9, 38 17
           C 42 6, 52 4, 60 9 Z"
        stroke="white"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* ─ CENTER VERTICAL DIVIDER ──────────────── */}
      <line x1="60" y1="11" x2="60" y2="114" stroke="white" strokeWidth="4" />

      {/* ─ NECK ─────────────────────────────────── */}
      <rect x="28" y="114" width="64" height="9" rx="1" stroke="white" strokeWidth="4" />

      {/* ─ BASE STRIPES (thread / screw) ────────── */}
      <rect x="25" y="128" width="70" height="5" rx="2" stroke="white" strokeWidth="3.5" />
      <rect x="29" y="136" width="62" height="4.5" rx="2" stroke="white" strokeWidth="3" />
      <rect x="35" y="143" width="50" height="2" rx="1" fill="white" />

      {/* ══════════════════════════════════════════ */}
      {/*  LEFT SIDE ICONS                          */}
      {/* ══════════════════════════════════════════ */}

      {/* CAR — top left */}
      {/* Cabin (white fill with dark windshield) */}
      <path d="M18 40 L22 30 L46 30 L50 40Z" fill="white" />
      <path d="M22 40 L25 32 L43 32 L47 40Z" fill="#000" />
      {/* Body */}
      <rect x="14" y="40" width="40" height="11" rx="2.5" stroke="white" strokeWidth="2.5" />
      {/* Left wheel */}
      <circle cx="23" cy="51" r="6"   stroke="white" strokeWidth="2.5" fill="#000" />
      <circle cx="23" cy="51" r="2.5" fill="white" />
      {/* Right wheel */}
      <circle cx="41" cy="51" r="6"   stroke="white" strokeWidth="2.5" fill="#000" />
      <circle cx="41" cy="51" r="2.5" fill="white" />
      {/* Red accent (like original logo) */}
      <rect x="46" y="41" width="8" height="3.5" rx="0.5" fill="#cc2200" />

      {/* AIRPLANE — mid left */}
      {/* Fuselage */}
      <ellipse cx="34" cy="68" rx="3.5" ry="13" fill="white" />
      {/* Wings */}
      <polygon points="14,65 34,59 54,65 54,69 34,63 14,69" fill="white" />
      {/* Tail */}
      <polygon points="22,78 34,74 46,78 46,81 34,77 22,81" fill="white" />

      {/* HOUSE — lower left */}
      {/* Roof */}
      <polygon points="15,101 33,88 51,101" fill="white" />
      {/* Walls */}
      <rect x="17" y="101" width="32" height="12" stroke="white" strokeWidth="2.5" />
      {/* Door */}
      <rect x="29" y="107" width="6" height="6" fill="#000" stroke="white" strokeWidth="1.5" />
      {/* Window */}
      <rect x="19" y="103" width="6" height="4" fill="white" />

      {/* BUILDING — bottom-left (beside house) */}
      <rect x="50" y="94" width="10" height="20" stroke="white" strokeWidth="2" />
      <rect x="52"   y="96"  width="3" height="2.5" fill="white" />
      <rect x="56.5" y="96"  width="3" height="2.5" fill="white" />
      <rect x="52"   y="101" width="3" height="2.5" fill="white" />
      <rect x="56.5" y="101" width="3" height="2.5" fill="white" />
      <rect x="52"   y="106" width="3" height="2.5" fill="white" />
      <rect x="56.5" y="106" width="3" height="2.5" fill="white" />

      {/* ══════════════════════════════════════════ */}
      {/*  RIGHT SIDE ICONS                         */}
      {/* ══════════════════════════════════════════ */}

      {/* BRIEFCASE — top right */}
      <rect x="68" y="28" width="40" height="26" rx="2.5" stroke="white" strokeWidth="2.5" />
      <path d="M76 28 L76 22 C76 20 100 20 100 22 L100 28"
        stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <line x1="68" y1="40" x2="108" y2="40" stroke="white" strokeWidth="2.5" />
      <rect x="85" y="37" width="6" height="6" rx="1" stroke="white" strokeWidth="2" fill="#000" />

      {/* SAILBOAT — mid right */}
      {/* Mast */}
      <line x1="90" y1="56" x2="90" y2="80" stroke="white" strokeWidth="3" />
      {/* Main sail */}
      <polygon points="90,58 90,79 108,79" fill="white" />
      {/* Jib */}
      <polygon points="90,63 90,79 72,79" fill="white" />
      {/* Hull */}
      <path d="M68 79 L112 79 L108 87 L72 87Z" fill="white" />
      {/* Water */}
      <path d="M66 91 Q74 88 82 91 Q90 94 98 91 Q106 88 114 91"
        stroke="white" strokeWidth="2" fill="none" />

      {/* CAMERA — lower right */}
      <rect x="66" y="92" width="32" height="20" rx="2.5" stroke="white" strokeWidth="2.5" />
      {/* Lens */}
      <circle cx="82" cy="102" r="7" stroke="white" strokeWidth="2.5" />
      <circle cx="82" cy="102" r="3"  fill="white" />
      {/* Flash bump */}
      <rect x="68" y="87" width="11" height="7" rx="1.5" stroke="white" strokeWidth="2.5" />

      {/* PHONE — bottom right (beside camera) */}
      <rect x="96" y="91" width="14" height="22" rx="3" stroke="white" strokeWidth="2.5" />
      <line x1="96"  y1="96"  x2="110" y2="96"  stroke="white" strokeWidth="1.5" />
      <line x1="96"  y1="107" x2="110" y2="107" stroke="white" strokeWidth="1.5" />
      <circle cx="103" cy="110" r="1.5" fill="white" />
    </svg>
  )
}
