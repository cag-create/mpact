import React from 'react'

/**
 * CreafiLogo — the Crea'fi bulb (public/creafi-logo.png), object-contain on black.
 */
export default function CreafiLogo({ size = 32, className = '' }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-lg bg-black ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
      <img src="/creafi-logo.png" alt="Crea'fi" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
    </div>
  )
}

/**
 * CommunityLogo — any community's logo: its logoUrl if set, the Crea'fi bulb for creafi, otherwise its emoji.
 */
export function CommunityLogo({ community, size = 32, className = '', emojiClass = '' }) {
  if (!community) return null
  if (community.logoUrl) {
    return (
      <div className={`flex items-center justify-center overflow-hidden rounded-lg bg-black ${className}`} style={{ width: size, height: size, flexShrink: 0 }}>
        <img src={community.logoUrl} alt={community.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
      </div>
    )
  }
  if (community.id === 'creafi') return <CreafiLogo size={size} className={className} />
  return <span className={emojiClass} style={{ fontSize: size * 0.62, lineHeight: 1 }}>{community.emoji}</span>
}
