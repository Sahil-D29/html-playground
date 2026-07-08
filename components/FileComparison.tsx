"use client"

import { useState, useEffect } from "react"
import { diffHtml } from "@/lib/diff"

type Version = {
  id: string
  html: string
  author: string
  createdAt: string
}

export default function FileComparison({
  snippetId,
  onClose,
}: {
  snippetId: string
  onClose: () => void
}) {
  const [original, setOriginal] = useState("")
  const [current, setCurrent] = useState("")
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>("current")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/snippets/${snippetId}/compare`)
      .then((r) => r.json())
      .then((data) => {
        setOriginal(data.original)
        setCurrent(data.current)
        setVersions(data.versions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [snippetId])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-white">Loading comparison...</div>
      </div>
    )
  }

  const compareHtml =
    selectedVersion === "current"
      ? current
      : versions.find((v) => v.id === selectedVersion)?.html || current

  const diff = diffHtml(original, compareHtml)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col rounded-2xl bg-[#1e1e2e] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Compare Versions
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="current">Current version</option>
              {versions.map((v, i) => (
                <option key={v.id} value={v.id}>
                  Version {i + 1} — {v.author} (
                  {new Date(v.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed">
          <div className="flex items-center gap-4 mb-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
              Added
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
              Removed
            </span>
          </div>

          <div className="rounded-xl bg-black/30 border border-white/5 p-4 whitespace-pre-wrap break-all">
            {diff.map((part, i) => {
              if (part.type === "unchanged") {
                return (
                  <span key={i} className="text-zinc-300">
                    {part.text}
                  </span>
                )
              }
              if (part.type === "added") {
                return (
                  <span
                    key={i}
                    className="bg-green-500/20 text-green-300 border-b border-green-500/40"
                  >
                    {part.text}
                  </span>
                )
              }
              return (
                <span
                  key={i}
                  className="bg-red-500/20 text-red-300 line-through border-b border-red-500/40"
                >
                  {part.text}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
