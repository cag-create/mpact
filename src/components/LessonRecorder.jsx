import React, { useRef, useState, useEffect } from 'react'
import { Monitor, Video, Square, Download, X, RotateCcw, Circle } from 'lucide-react'

// In-browser recorder: capture your screen (for demos) or camera (for a talking-head /
// voiceover), with your mic. Records to a .webm you download, then upload to Loom/YouTube/
// Drive and paste the share link into the lesson's video field. (The app doesn't host the
// raw file — hosting lives with Loom/YouTube so playback is fast and reliable.)
function pickMime() {
  const opts = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
  for (const m of opts) { try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m } catch {} }
  return ''
}

export default function LessonRecorder({ onClose }) {
  const [mode, setMode] = useState(null)        // 'screen' | 'camera'
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [blobUrl, setBlobUrl] = useState(null)
  const [error, setError] = useState('')
  const mr = useRef(null), stream = useRef(null), chunks = useRef([]), live = useRef(null), timer = useRef(null)

  useEffect(() => () => { try { stream.current?.getTracks().forEach(t => t.stop()) } catch {}; clearInterval(timer.current) }, [])

  const start = async (which) => {
    setError(''); setBlobUrl(null); setElapsed(0)
    try {
      let s
      if (which === 'screen') {
        s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true })
        try { const mic = await navigator.mediaDevices.getUserMedia({ audio: true }); mic.getAudioTracks().forEach(t => s.addTrack(t)) } catch {}
      } else {
        s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true })
      }
      stream.current = s
      if (live.current) { live.current.srcObject = s; live.current.muted = true; live.current.play().catch(() => {}) }
      chunks.current = []
      const rec = new MediaRecorder(s, pickMime() ? { mimeType: pickMime() } : undefined)
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: chunks.current[0]?.type || 'video/webm' })
        setBlobUrl(URL.createObjectURL(blob))
        try { s.getTracks().forEach(t => t.stop()) } catch {}
        clearInterval(timer.current)
      }
      mr.current = rec
      rec.start()
      setMode(which); setRecording(true)
      timer.current = setInterval(() => setElapsed(e => e + 1), 1000)
      const vt = s.getVideoTracks()[0]; if (vt) vt.onended = () => stop()   // user clicked "Stop sharing"
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Permission denied — allow screen/camera access and try again.' : (e?.message || 'Could not start recording.'))
    }
  }
  const stop = () => { try { mr.current?.state !== 'inactive' && mr.current?.stop() } catch {}; setRecording(false) }
  const reset = () => { setBlobUrl(null); setMode(null); setElapsed(0) }
  const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Circle size={10} className="text-red-500 fill-red-500" /> Record a lesson video</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="px-6 py-5">
          {/* Preview area */}
          <div className="relative w-full aspect-video rounded-xl bg-gray-900 overflow-hidden mb-4 flex items-center justify-center">
            {blobUrl
              ? <video src={blobUrl} controls className="w-full h-full object-contain bg-black" />
              : <video ref={live} className="w-full h-full object-contain bg-black" playsInline muted />}
            {!blobUrl && !recording && <span className="absolute text-gray-500 text-sm">Pick screen or camera to start</span>}
            {recording && <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-600 text-white text-xs font-bold"><Circle size={8} className="fill-white animate-pulse" /> REC {mmss(elapsed)}</span>}
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {!recording && !blobUrl && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => start('screen')} className="flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm font-semibold text-gray-700">
                <Monitor size={22} className="text-indigo-600" /> Record screen <span className="text-[11px] font-normal text-gray-400">for demos</span>
              </button>
              <button onClick={() => start('camera')} className="flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm font-semibold text-gray-700">
                <Video size={22} className="text-indigo-600" /> Record camera <span className="text-[11px] font-normal text-gray-400">talking head / voiceover</span>
              </button>
            </div>
          )}

          {recording && (
            <button onClick={stop} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"><Square size={16} className="fill-white" /> Stop recording</button>
          )}

          {blobUrl && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <a href={blobUrl} download={`creafi-lesson-${Date.now()}.webm`} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"><Download size={15} /> Download clip</a>
                <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"><RotateCcw size={15} /> Record again</button>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-3">
                Next: upload this clip to <span className="font-semibold">Loom, YouTube (unlisted), or Google Drive</span>, copy the share link, and paste it into the lesson's <span className="font-semibold">Video link</span> field. That hosts it so it plays fast for members.
              </p>
            </div>
          )}

          <p className="text-[11px] text-gray-400 mt-4">Tip: For the smoothest record-and-share, use the <span className="font-semibold">Record in Loom</span> button on the lesson — it records your screen + camera and gives you a link in one step.</p>
        </div>
      </div>
    </div>
  )
}
