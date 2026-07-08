"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"

interface ShareDialogProps {
  html: string
  open: boolean
  onClose: () => void
  projectFileId?: string | null
  snippetId?: string | null
  snippetShortId?: string | null
  onSnippetCreated?: (id: string, shortId: string) => void
  onSaveRequired?: () => void
}

export default function ShareDialog({
  html,
  open,
  onClose,
  projectFileId,
  snippetId,
  snippetShortId,
  onSnippetCreated,
  onSaveRequired,
}: ShareDialogProps) {
  const { data: session } = useSession()
  const [shareUrl, setShareUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState("")
  const [permission, setPermission] = useState<"view" | "edit">("view")
  const [editMode, setEditMode] = useState<"code" | "text">("code")
  const [syncMode, setSyncMode] = useState<"auto" | "manual">("auto")
  const [collaboratorName, setCollaboratorName] = useState("")
  const [lastSharedHtml, setLastSharedHtml] = useState("")
  const [editCount, setEditCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  useEffect(() => {
    if (open && snippetShortId) {
      setShareUrl(`${window.location.origin}/snippets/${snippetShortId}`)
    }
  }, [open, snippetShortId])

  useEffect(() => {
    if (open && html !== lastSharedHtml && lastSharedHtml !== "") {
      setEditCount((c) => c + 1)
    }
  }, [html, open, lastSharedHtml])

  const handleShare = useCallback(async () => {
    if (permission === "edit" && !snippetId) {
      onSaveRequired?.()
      return
    }
    setLoading(true)
    setError("")
    try {
      if (snippetId) {
        const res = await fetch(`/api/snippets/${snippetShortId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html,
            permission,
            editMode,
            syncMode,
          }),
        })
        if (!res.ok) throw new Error("Failed to update snippet")
        setShareUrl(`${window.location.origin}/snippets/${snippetShortId}`)
        setLastSharedHtml(html)
        setEditCount(0)
        setLastSyncTime(new Date().toLocaleTimeString())
      } else {
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html,
            permission,
            editMode,
            syncMode,
            projectFileId,
          }),
        })
        if (!res.ok) throw new Error("Failed to create snippet")
        const data = await res.json()
        setShareUrl(`${window.location.origin}/snippets/${data.shortId}`)
        setLastSharedHtml(html)
        setEditCount(0)
        setLastSyncTime(new Date().toLocaleTimeString())
        onSnippetCreated?.(data.id, data.shortId)
      }
    } catch {
      setError("Failed to create share link")
    } finally {
      setLoading(false)
    }
  }, [
    html,
    permission,
    editMode,
    syncMode,
    projectFileId,
    snippetId,
    snippetShortId,
    onSnippetCreated,
    onSaveRequired,
  ])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  const handleEmailShare = useCallback(async () => {
    if (!email) return
    setEmailLoading(true)
    setError("")
    try {
      const res = await fetch("/api/snippets/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId: shareUrl.split("/").pop(), email }),
      })
      if (!res.ok) throw new Error("Failed to send email")
      setEmailSent(true)
    } catch {
      setError("Failed to send email. Check RESEND_API_KEY is configured.")
    } finally {
      setEmailLoading(false)
    }
  }, [email, shareUrl])

  const handleClose = useCallback(() => {
    setShareUrl("")
    setCopied(false)
    setEmail("")
    setEmailSent(false)
    setError("")
    setPermission("view")
    setEditMode("code")
    setSyncMode("auto")
    setCollaboratorName("")
    setLastSharedHtml("")
    setEditCount(0)
    setLastSyncTime(null)
    onClose()
  }, [onClose])

  if (!open) return null

  const hasChanges = html !== lastSharedHtml && lastSharedHtml !== ""

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title">Share Snippet</h2>
          <button
            onClick={handleClose}
            className="btn-icon text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          {/* Permission — ALWAYS visible */}
          <div className="mb-4">
            <label className="label">Who can access</label>
            <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 p-1">
              <button
                onClick={() => setPermission("view")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  permission === "view"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                View only
              </button>
              <button
                onClick={() => setPermission("edit")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  permission === "edit"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Can edit
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {permission === "view"
                ? "Viewers can only see the rendered output."
                : "Viewers can see and modify the source code in real-time."}
            </p>
          </div>

          {/* Edit mode — ALWAYS visible when edit permission */}
          {permission === "edit" && (
            <>
              <div className="mb-4">
                <label className="label">Edit mode</label>
                <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 p-1">
                  <button
                    onClick={() => setEditMode("code")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      editMode === "code"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setEditMode("text")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      editMode === "text"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Text
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {editMode === "code"
                    ? "Full code editor with syntax highlighting."
                    : "Simplified editing — click text in preview to change it."}
                </p>
              </div>

              <div className="mb-4">
                <label className="label">Sync to original</label>
                <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 p-1">
                  <button
                    onClick={() => setSyncMode("auto")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      syncMode === "auto"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setSyncMode("manual")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      syncMode === "manual"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Manual
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {syncMode === "auto"
                    ? "Changes auto-sync to the original file."
                    : "Changes require your approval to push to the original."}
                </p>
              </div>

              <div className="mb-4">
                <label className="label">Your display name (optional)</label>
                <input
                  type="text"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  placeholder="Anonymous"
                  className="input"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Shown to other editors as your cursor label.
                </p>
              </div>
            </>
          )}

          {/* Share link — shown after first generation */}
          {shareUrl && (
            <div className="mb-4">
              <label className="label">Share Link</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input readOnly value={shareUrl} className="input flex-1" />
                <button onClick={handleCopy} className="btn-secondary whitespace-nowrap">
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Change status */}
          {shareUrl && hasChanges && (
            <div className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {editCount} change{editCount !== 1 ? "s" : ""} since last sync.
                {lastSyncTime && ` Last synced ${lastSyncTime}.`}
              </p>
            </div>
          )}

          {/* Current settings summary */}
          {shareUrl && (
            <div className="mb-4 rounded-lg bg-gray-100 dark:bg-gray-800/30 px-3 py-2 space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permission:{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {permission === "view" ? "View only" : "Can edit"}
                </span>
              </p>
              {permission === "edit" && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Edit mode:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {editMode === "code" ? "Code" : "Text"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sync:{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {syncMode === "auto" ? "Auto-sync" : "Manual push"}
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* Generate / Update button */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleShare}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading
                ? shareUrl
                  ? "Updating..."
                  : "Creating..."
                : permission === "edit" && !snippetId
                ? "Save File First to Enable Editing"
                : shareUrl
                ? hasChanges
                  ? "Push Changes to Shared Link"
                  : "Link is up to date"
                : "Generate Share Link"}
            </button>
          </div>

          {/* Email share */}
          {session && shareUrl && (
            <div className="border-t border-gray-200 dark:border-gray-800/60 pt-4">
              <label className="label">Send via Email</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="input flex-1"
                />
                <button
                  onClick={handleEmailShare}
                  disabled={emailLoading || !email || emailSent}
                  className="btn-primary whitespace-nowrap"
                >
                  {emailSent ? "Sent!" : emailLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 px-3 py-2">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
