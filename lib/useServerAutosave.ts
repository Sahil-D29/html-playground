"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function useServerAutosave(html: string, enabled: boolean, projectFileId: string | null, projectId: string | null) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const savedRef = useRef(html)
  const fileIdRef = useRef(projectFileId)

  fileIdRef.current = projectFileId

  const doSave = useCallback(async () => {
    const fileId = fileIdRef.current
    if (!projectId || !fileId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      })
      if (res.ok) {
        savedRef.current = html
        setLastSaved(new Date())
      }
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }, [html, projectId])

  useEffect(() => {
    if (!enabled || !projectFileId) return
    if (html === savedRef.current) return

    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(doSave, 2000)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [html, enabled, projectFileId, doSave])

  return { saving, lastSaved }
}
