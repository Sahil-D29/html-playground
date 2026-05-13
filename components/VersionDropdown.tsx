"use client"

import { useState, useRef, useEffect } from "react"

interface VersionDropdownProps {
  label: string
  entries: string[]
  currentIndex: number
  onGoTo: (index: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

function truncate(html: string, len = 50) {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  return text.length > len ? text.slice(0, len) + "..." : text || "(empty)"
}

export default function VersionDropdown({
  label,
  entries,
  currentIndex,
  onGoTo,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: VersionDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center gap-0.5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`btn-icon text-sm ${canUndo ? "text-gray-300 hover:text-white" : "text-gray-600"}`}
        title="Undo (Ctrl+Z)"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </button>

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[80px]"
      >
        <span className="truncate">{label}</span>
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`btn-icon text-sm ${canRedo ? "text-gray-300 hover:text-white" : "text-gray-600"}`}
        title="Redo (Ctrl+Y)"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 max-h-64 overflow-y-auto rounded-xl border border-gray-700/50 bg-surface-light shadow-2xl shadow-black/40 backdrop-blur-xl animate-scale-in">
          <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 border-b border-gray-800/40">
            Version History
            <span className="ml-1.5 text-gray-600">({entries.length})</span>
          </div>
          <div className="py-1">
            {entries.map((entry, i) => (
              <button
                key={i}
                onClick={() => {
                  onGoTo(i)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  i === currentIndex
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium shrink-0">
                    {i === 0 ? "Original" : `Edit ${i}`}
                  </span>
                  {i === 0 && (
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 font-mono">
                      org
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-gray-500">
                  {truncate(entry)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
