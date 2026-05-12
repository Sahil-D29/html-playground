"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface CreateProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (project: { id: string; name: string }) => void
}

export default function CreateProjectDialog({
  open,
  onClose,
  onCreated,
}: CreateProjectDialogProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) return
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to create project")
        }
        const project = await res.json()
        setName("")
        onClose()
        router.refresh()
        onCreated?.(project)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project")
      } finally {
        setLoading(false)
      }
    },
    [name, onClose, router, onCreated]
  )

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="section-title">New Project</h2>
          <button onClick={onClose} className="btn-icon text-gray-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="label">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="input"
              autoFocus
              required
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()} className="btn-primary">
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
