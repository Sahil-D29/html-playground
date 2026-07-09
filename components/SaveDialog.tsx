"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import CreateProjectDialog from "./CreateProjectDialog"

interface Project {
  id: string
  name: string
  starred: boolean
  files: { id: string; name: string; type: string }[]
}

interface SaveDialogProps {
  html: string
  open: boolean
  onClose: () => void
  projectFileId?: string | null
  projectId?: string | null
  projectName?: string
  initialFileName?: string
  onSaved?: (data: {
    title?: string
    shortId?: string
    id?: string
    permission?: string
  }) => void
}

export default function SaveDialog({
  html,
  open,
  onClose,
  projectFileId: initialFileId,
  projectId: initialProjectId,
  projectName: initialProjectName,
  initialFileName,
  onSaved,
}: SaveDialogProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<"snippet" | "project">(
    initialFileId ? "project" : "snippet"
  )
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState(
    initialProjectId || ""
  )
  const [fileName, setFileName] = useState(initialFileName || "index.html")
  const [snippetTitle, setSnippetTitle] = useState("")
  const [permission, setPermission] = useState<"view" | "edit">("view")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)

  useEffect(() => {
    if (open && session) {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          setProjects(data)
          if (!initialProjectId && data.length > 0)
            setSelectedProject(data[0].id)
        })
        .catch(() => {})
    }
  }, [open, session, initialProjectId])

  const handleSave = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      if (mode === "snippet") {
        const res = await fetch("/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html,
            title: snippetTitle.trim() || undefined,
            permission,
          }),
        })
        if (!res.ok) throw new Error("Failed to save snippet")
        const data = await res.json()
        onSaved?.({
          title: data.title,
          shortId: data.shortId,
          id: data.id,
          permission,
        })
      } else {
        if (!selectedProject) throw new Error("Select a project")
        const isUpdate = !!initialFileId
        if (isUpdate) {
          const res = await fetch(
            `/api/projects/${selectedProject}/files/${initialFileId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: html,
                name: fileName.trim() || undefined,
              }),
            }
          )
          if (!res.ok) throw new Error("Failed to update file")
          onSaved?.({ title: fileName.trim() || "index.html" })
        } else {
          const res = await fetch(
            `/api/projects/${selectedProject}/files`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: fileName.trim() || "index.html",
                type: "html",
                content: html,
              }),
            }
          )
          if (!res.ok) throw new Error("Failed to save file")
          onSaved?.({ title: fileName.trim() || "index.html" })
        }
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save"
      )
    } finally {
      setLoading(false)
    }
  }, [
    mode,
    html,
    snippetTitle,
    permission,
    selectedProject,
    fileName,
    router,
    initialFileId,
    onSaved,
  ])

  const handleClose = useCallback(() => {
    setMode(initialFileId ? "project" : "snippet")
    setSelectedProject(initialProjectId || "")
    setFileName("index.html")
    setSnippetTitle("")
    setPermission("view")
    setError("")
    setSaved(false)
    onClose()
  }, [onClose, initialFileId, initialProjectId])

  const handleCreated = useCallback(
    (project: { id: string; name: string }) => {
      setSelectedProject(project.id)
      setShowCreateProject(false)
    },
    []
  )

  if (!open) return null

  const authenticated = !!session
  const isEditingFile = !!initialFileId

  return (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div
          className="modal-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">
              {isEditingFile ? "Update File" : "Save"}
            </h2>
            <button
              onClick={handleClose}
              className="btn-icon text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
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

          {saved ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                <svg
                  className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isEditingFile ? "File updated!" : "Saved successfully!"}
              </p>

              <button
                onClick={handleClose}
                className="btn-secondary mt-4 w-full"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {authenticated && !isEditingFile && (
                <div className="mb-5 flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800/50 p-1">
                  <button
                    onClick={() => setMode("snippet")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      mode === "snippet"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Quick Save
                  </button>
                  <button
                    onClick={() => setMode("project")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                      mode === "project"
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    Save to Project
                  </button>
                </div>
              )}

              {isEditingFile ? (
                <div>
                  <p className="text-xs text-gray-500 mb-4">
                    Updating{" "}
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {initialFileName || fileName || "file"}
                    </span>{" "}
                    in{" "}
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      {initialProjectName || "project"}
                    </span>
                    .
                  </p>
                  <div className="mb-4">
                    <label className="label">File Name</label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="index.html"
                      className="input"
                    />
                  </div>
                </div>
              ) : mode === "snippet" ? (
                <div>
                  <div className="mb-4">
                    <label className="label">Title (optional)</label>
                    <input
                      type="text"
                      value={snippetTitle}
                      onChange={(e) => setSnippetTitle(e.target.value)}
                      placeholder="My Snippet"
                      className="input"
                    />
                  </div>

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
                        : "Viewers can modify the source code in real-time."}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500">
                    Creates a shareable snippet
                    {authenticated ? " linked to your account" : ""}.
                  </p>
                </div>
              ) : null}

              {mode === "project" && authenticated && (
                <div>
                  {!isEditingFile && (
                    <div className="mb-4">
                      <label className="label">Project</label>
                      {projects.length > 0 ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={selectedProject}
                            onChange={(e) =>
                              setSelectedProject(e.target.value)
                            }
                            className="input flex-1"
                          >
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowCreateProject(true)}
                            className="btn-secondary whitespace-nowrap"
                          >
                            New
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowCreateProject(true)}
                          className="btn-secondary w-full"
                        >
                          + Create Project
                        </button>
                      )}
                    </div>
                  )}
                  {!isEditingFile && (
                    <div className="mb-4">
                      <label className="label">File Name</label>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="index.html"
                        className="input"
                      />
                    </div>
                  )}
                </div>
              )}

              {mode === "project" && !authenticated && (
                <p className="text-sm text-gray-500">
                  Sign in to save files to projects.
                </p>
              )}

              {error && (
                <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={handleClose} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    loading ||
                    (mode === "project" &&
                      !selectedProject &&
                      !isEditingFile) ||
                    (mode === "project" && !authenticated)
                  }
                  className="btn-primary"
                >
                  {loading
                    ? "Saving..."
                    : isEditingFile
                    ? "Update File"
                    : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <CreateProjectDialog
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
