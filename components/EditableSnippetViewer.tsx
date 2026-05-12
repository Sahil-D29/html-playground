"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useToast } from "@/components/Toast"

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false })

export default function EditableSnippetViewer({
  id,
  shortId,
  title,
  initialHtml,
}: {
  id: string
  shortId: string
  title: string
  initialHtml: string
}) {
  const [html, setHtml] = useState(initialHtml)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/snippets/${id}`, {
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
  }, [id, html, toast])

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/80 backdrop-blur-sm px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>Shared snippet</span>
          {title && (
            <>
              <span className="text-gray-600">&middot;</span>
              <span className="text-gray-200 font-medium">{title}</span>
            </>
          )}
          <span className="rounded bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-800/30">
            Can edit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || html === initialHtml}
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
            {saving ? "Saving..." : "Save"}
          </button>
          <Link href="/" className="btn-primary text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Your Own
          </Link>
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex w-1/2 min-w-0 flex-col border-r border-gray-800/60">
          <div className="flex items-center border-b border-gray-800/60 bg-surface-light/50 px-3 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase">HTML</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor value={html} onChange={setHtml} lang="html" />
          </div>
        </div>
        <div className="flex w-1/2 min-w-0 flex-col">
          <div className="flex items-center border-b border-gray-800/60 bg-surface-light/50 px-3 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase">Preview</span>
          </div>
          <div className="flex-1">
            <iframe
              sandbox="allow-scripts"
              srcDoc={html}
              title={title || "Shared snippet"}
              className="h-full w-full bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
