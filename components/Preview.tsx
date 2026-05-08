"use client"

import { useRef, useEffect, useState } from "react"

export default function Preview({
  html,
  fullscreen,
  onToggleFullscreen,
}: {
  html: string
  fullscreen?: boolean
  onToggleFullscreen?: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey((k) => k + 1)
  }, [html])

  return (
    <div className={`relative flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-surface" : "flex-1"}`}>
      {fullscreen && (
        <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/80 backdrop-blur-sm px-3 py-1.5">
          <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">Preview</span>
          <button onClick={onToggleFullscreen} className="btn-ghost text-sm">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
            Exit Fullscreen
          </button>
        </div>
      )}
      <div className="flex-1">
        <iframe
          key={key}
          ref={iframeRef}
          sandbox="allow-scripts"
          srcDoc={html}
          title="Preview"
          className="h-full w-full bg-white"
        />
      </div>
    </div>
  )
}
