"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import StarButton from "@/components/StarButton"

interface ProjectFile {
  id: string
  name: string
  type: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  starred: boolean
  files: ProjectFile[]
  createdAt: string
  updatedAt: string
}

export default function ProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null)
  const [editingName, setEditingName] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth")
    if (status !== "authenticated") return

    fetch(`/api/projects/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then((data) => {
        setProject(data)
        if (data.files.length > 0) setActiveFile(data.files[0])
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [status, params.id, router])

  const handleRename = useCallback(async () => {
    if (!editingName.trim() || !project) return
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    })
    if (res.ok) {
      setProject((prev) =>
        prev ? { ...prev, name: editingName.trim() } : prev
      )
    }
    setRenaming(false)
  }, [editingName, project])

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      if (!project) return
      const res = await fetch(
        `/api/projects/${project.id}/files/${fileId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setProject((prev) =>
          prev
            ? {
                ...prev,
                files: prev.files.filter((f) => f.id !== fileId),
              }
            : prev
        )
        if (activeFile?.id === fileId) {
          setActiveFile(null)
        }
      }
      setDeleting(null)
    },
    [project, activeFile]
  )

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-surface">
        <svg className="h-5 w-5 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-surface">
      <aside className="flex w-64 flex-col border-r border-gray-800/60 bg-surface-light/30">
        <div className="flex items-center gap-2 border-b border-gray-800/60 px-3 py-2.5">
          {renaming ? (
            <div className="flex flex-1 gap-1">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") setRenaming(false)
                }}
                className="input flex-1 text-sm py-1"
                autoFocus
              />
              <button onClick={handleRename} className="btn-icon text-emerald-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <StarButton projectId={project.id} starred={project.starred} />
              <h2 className="flex-1 truncate text-sm font-medium text-white">
                {project.name}
              </h2>
              <button
                onClick={() => {
                  setEditingName(project.name)
                  setRenaming(true)
                }}
                className="btn-icon text-gray-500 hover:text-gray-300"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Files
            </span>
            <Link
              href={`/?project=${project.id}&projectName=${encodeURIComponent(project.name)}`}
              className="btn-ghost text-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </Link>
          </div>

          {project.files.length === 0 ? (
            <p className="px-1 text-xs text-gray-600">No files yet.</p>
          ) : (
            <div className="space-y-0.5">
              {project.files.map((file) => (
                <div key={file.id} className="group">
                  <button
                    onClick={() => setActiveFile(file)}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      activeFile?.id === file.id
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 truncate">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {file.name}
                      </span>
                      {deleting === file.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleting(null)
                            }}
                            className="text-gray-500 hover:text-gray-300"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleting(file.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-800/60 p-2">
          <Link href="/dashboard" className="btn-ghost w-full justify-start text-sm">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        {activeFile ? (
          <>
            <div className="flex items-center justify-between border-b border-gray-800/60 bg-surface-light/50 px-3 py-1.5">
              <span className="text-sm font-medium tracking-wide text-gray-500 uppercase">{activeFile.name}</span>
              <Link
                href={`/?project=${project.id}&projectName=${encodeURIComponent(project.name)}&file=${activeFile.id}`}
                className="btn-ghost text-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                Edit
              </Link>
            </div>
            <div className="flex-1">
              <iframe
                sandbox="allow-scripts"
                srcDoc={activeFile.content}
                title={activeFile.name}
                className="h-full w-full bg-white"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">Select a file to preview</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
