import React from 'react'
// Turn a pasted video link into something we can embed.
// Supports YouTube (watch / youtu.be / live / shorts), Vimeo, Loom, Google Drive, and direct .mp4/.webm/.m4v files.
export function getYouTubeId(url = '') {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}
export function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}
export function getEmbed(url = '') {
  const u = url.trim()
  if (!u) return null
  const yt = getYouTubeId(u)
  if (yt) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt}?rel=0&modestbranding=1`, provider: 'YouTube' }
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}`, provider: 'Vimeo' }
  const loom = u.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/)
  if (loom) return { kind: 'iframe', src: `https://www.loom.com/embed/${loom[1]}`, provider: 'Loom' }
  const drive = u.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return { kind: 'iframe', src: `https://drive.google.com/file/d/${drive[1]}/preview`, provider: 'Google Drive' }
  if (/\.(mp4|webm|m4v|mov)(\?.*)?$/i.test(u)) return { kind: 'video', src: u, provider: 'Video file' }
  return { kind: 'link', src: u, provider: 'Link' }
}
export function VideoEmbed({ url, title = 'Video', className = '' }) {
  const e = getEmbed(url)
  if (!e) return null
  if (e.kind === 'iframe') return (
    <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
      <iframe src={e.src} title={title} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
    </div>
  )
  if (e.kind === 'video') return <video src={e.src} controls className={`w-full aspect-video bg-black rounded-xl ${className}`} />
  return (
    <a href={e.src} target="_blank" rel="noreferrer" className={`block w-full aspect-video bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm font-medium hover:bg-gray-800 ${className}`}>
      Open video in a new tab →
    </a>
  )
}
