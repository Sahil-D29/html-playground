"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useToast } from "@/components/Toast"
import { useCollaboration, CollabUser } from "@/lib/useCollaboration"
import CollaborativeEditor from "./CollaborativeEditor"
import PresenceBar from "./PresenceBar"
import ChangeHistory from "./ChangeHistory"
import Preview from "./Preview"
import SaveSnippetButton from "./SaveSnippetButton"

export default function CollaborativeSnippetViewer({
  id,
  shortId,
  title,
  initialHtml,
  editMode = "code",
  syncMode = "auto",
}: {
  id: string
  shortId: string
  title: string
  initialHtml: string
  editMode?: "code" | "text"
  syncMode?: "auto" | "manual"
}) {
  const { toast } = useToast()
  const [html, setHtml] = useState(initialHtml)
  const [previewEditable, setPreviewEditable] = useState(editMode === "text")
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState("")

  // Load username from localStorage or use anonymous
  useEffect(() => {
    const stored = localStorage.getItem("collab-username")
    if (stored) {
      setUsername(stored)
    } else {
      const name = `User ${Math.floor(Math.random() * 1000)}`
      setUsername(name)
      localStorage.setItem("collab-username", name)
    }
  }, [])

  // Collaboration setup
  const { connectedUsers, isConnected, getYDoc, getUndoManager } =
    useCollaboration(shortId, username, true)

  // Listen for content changes from the collaborative editor
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setHtml(e.detail)
    }
    window.addEventListener("collab-content-change" as any, handler)
    return () => window.removeEventListener("collab-content-change" as any, handler)
  }, [])

  const handleContentChange = useCallback((content: string) => {
    setHtml(content)
    // Dispatch for preview sync
    window.dispatchEvent(
      new CustomEvent("collab-content-change", { detail: content })
    )
  }, [])

  const handlePreviewEdit = useCallback((val: string) => {
    setHtml(val)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/snippets/${shortId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast("Snippet saved!", "success")
    } catch {
      toast("Failed to save snippet", "error")
    } finally {
      setSaving(false)
    }
  }, [shortId, html, toast])

  const handleRestore = useCallback(
    (restoredHtml: string) => {
      const ydoc = getYDoc()
      const undoManager = getUndoManager()
      if (ydoc) {
        const ytext = ydoc.getText("codemirror")
        ydoc.transact(() => {
          ytext.delete(0, ytext.length)
          ytext.insert(0, restoredHtml)
        })
        setHtml(restoredHtml)
        toast("Version restored!", "success")
      }
    },
    [getYDoc, getUndoManager, toast]
  )

  const handlePushToMain = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/snippets/${shortId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, author: username }),
      })
      if (!res.ok) throw new Error("Failed to push changes")
      toast("Changes pushed to main file!", "success")
    } catch {
      toast("Failed to push changes", "error")
    } finally {
      setSaving(false)
    }
  }, [shortId, html, username, toast])

  const handleNameChange = useCallback((newName: string) => {
    setUsername(newName)
    localStorage.setItem("collab-username", newName)
  }, [])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50 dark:bg-surface">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-surface-light/80 backdrop-blur-sm px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>
          <span>Shared snippet</span>
          {title && (
            <>
              <span className="text-gray-400 dark:text-gray-600">&middot;</span>
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                {title}
              </span>
            </>
          )}
          <span className="rounded bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
            Can edit
          </span>
          {syncMode === "manual" && (
            <span className="rounded bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">
              Manual sync
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PresenceBar users={connectedUsers} isConnected={isConnected} />
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost text-xs"
            title="Change history"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>
          <SaveSnippetButton html={html} title={title} />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary text-xs"
          >
            {saving ? (
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
          </button>
          {syncMode === "manual" && (
            <button
              onClick={handlePushToMain}
              disabled={saving}
              className="btn-primary text-xs"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="hidden sm:inline">Push to Main</span>
            </button>
          )}
          <Link href="/" className="btn-primary text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Create Your Own</span>
          </Link>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Code panel */}
        <div
          className={`flex min-w-0 flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800/60 ${
            editMode === "text" ? "hidden md:flex md:w-0 md:border-0" : "md:w-1/2 h-1/2 md:h-full"
          }`}
        >
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800/60 bg-white/50 dark:bg-surface-light/50 px-3 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase">
              HTML
            </span>
          </div>
          <div className="relative flex-1 min-h-0">
            <CollaborativeEditor
              room={shortId}
              username={username}
              lang="html"
              onContentChange={handleContentChange}
            />
          </div>
        </div>

        {/* Preview panel */}
        <div
          className={`flex min-w-0 flex-col ${
            editMode === "text" ? "flex-1" : "md:w-1/2 h-1/2 md:h-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800/60 bg-white/50 dark:bg-surface-light/50 px-3 py-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase">
                Preview
              </span>
              {editMode === "text" && (
                <button
                  onClick={() => setPreviewEditable((e) => !e)}
                  className={`btn-icon text-xs ${
                    previewEditable
                      ? "text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/40"
                      : "text-gray-500"
                  }`}
                  title="Edit text in preview"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {previewEditable && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800/30 px-3 py-1">
              <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                Editing in preview — changes sync to the editor
              </span>
              <button
                onClick={() => setPreviewEditable(false)}
                className="ml-auto btn-ghost text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-200"
              >
                Done
              </button>
            </div>
          )}
          <div className="relative flex flex-1 min-h-0 flex-col">
            <Preview
              html={html}
              editable={previewEditable}
              onEdit={handlePreviewEdit}
            />
          </div>
        </div>
      </div>

      {/* Change history panel */}
      <ChangeHistory
        snippetId={shortId}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={handleRestore}
      />
    </div>
  )
}
