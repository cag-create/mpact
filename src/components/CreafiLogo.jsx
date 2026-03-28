import React from 'react'

/**
 * CreafiLogo — uses the actual Crea'fi logo image (public/creafi-logo.png)
 * Displays with object-contain so it never distorts.
 * Black background matches the embroidered patch.
 */
export default function CreafiLogo({ size = 32, className = '' }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-lg bg-black ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <img
        src="/creafi-logo.png"
        alt="Crea'fi"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        draggable={false}
      />
    </div>
  )
}
