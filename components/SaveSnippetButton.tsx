"use client"

import { useState, useCallback } from "react"
import { useSession, signIn } from "next-auth/react"
import { useToast } from "@/components/Toast"
import { useRouter } from "next/navigation"

export default function SaveSnippetButton({ html, title }: { html: string; title?: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!session) {
      signIn()
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, title: title || "Saved from shared link" }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const data = await res.json()
      toast("Saved to your snippets!", "success")
      router.refresh()
    } catch {
      toast("Failed to save snippet", "error")
    } finally {
      setSaving(false)
    }
  }, [html, title, session, toast, router])

  return (
    <button onClick={handleSave} disabled={saving} className="btn-secondary text-xs">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {saving ? "Saving..." : "Save Copy"}
    </button>
  )
}
