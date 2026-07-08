"use client"

import { useState, useEffect, useCallback } from "react"

interface Version {
  id: string
  html: string
  author: string | null
  createdAt: string
}

export default function ChangeHistory({
  snippetId,
  isOpen,
  onClose,
  onRestore,
}: {
  snippetId: string
  isOpen: boolean
  onClose: () => void
  onRestore: (html: string) => void
}) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !snippetId) return
    setLoading(true)
    fetch(`/api/snippets/${snippetId}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isOpen, snippetId])

  const handlePreview = useCallback(async (version: Version) => {
    setSelectedVersion(version)
    setPreviewHtml(version.html)
  }, [])

  const handleRestore = useCallback(() => {
    if (selectedVersion) {
      onRestore(selectedVersion.html)
      onClose()
    }
  }, [selectedVersion, onRestore, onClose])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return date.toLocaleDateString()
  }

  const getPreview = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim()
    return text.substring(0, 80) + (text.length > 80 ? "..." : "")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-96 flex-col border-l border-gray-200 dark:border-gray-800/60 bg-white dark:bg-surface shadow-2xl animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Change History
        </h3>
        <button
          onClick={onClose}
          className="btn-icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : versions.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No versions yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Versions are created automatically as you edit
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800/40">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => handlePreview(version)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                  selectedVersion?.id === version.id
                    ? "bg-emerald-50 dark:bg-emerald-900/10"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {version.author || "Anonymous"}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatTime(version.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {getPreview(version.html)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedVersion && (
        <div className="border-t border-gray-200 dark:border-gray-800/60 p-4">
          <div className="mb-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-800/30 p-3">
            <pre className="text-[10px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
              {getPreview(selectedVersion.html)}
            </pre>
          </div>
          <button
            onClick={handleRestore}
            className="btn-primary w-full text-sm"
          >
            Restore This Version
          </button>
        </div>
      )}
    </div>
  )
}
